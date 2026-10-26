import { Queue, Worker, Job } from "bullmq";
import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { AuditJobData } from "../modules/audits/audit.types";

export type AuditJobHandler = (jobData: AuditJobData) => Promise<void>;

export interface IAuditQueue {
  addAuditJob(data: AuditJobData): Promise<string>;
  registerWorker(handler: AuditJobHandler): void;
}

/**
 * BullMQ Queue implementation for production distributed worker clusters
 */
class BullMQAuditQueue implements IAuditQueue {
  private queue: Queue;
  private worker?: Worker;

  constructor(redisConnection: NonNullable<ReturnType<typeof getRedisClient>>) {
    this.queue = new Queue("audit-jobs", {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  public async addAuditJob(data: AuditJobData): Promise<string> {
    const job = await this.queue.add("run-audit", data, {
      jobId: data.auditId,
    });
    return job.id || data.auditId;
  }

  public registerWorker(handler: AuditJobHandler): void {
    const redis = getRedisClient();
    if (!redis) return;

    this.worker = new Worker(
      "audit-jobs",
      async (job: Job<AuditJobData>) => {
        logger.info("BullMQ processing audit job", { auditId: job.data.auditId });
        await handler(job.data);
      },
      {
        connection: redis,
        concurrency: 3,
      }
    );

    this.worker.on("failed", (job, err) => {
      logger.error("BullMQ job failed", { auditId: job?.data?.auditId }, err);
    });
  }
}

/**
 * In-process asynchronous queue adapter for local development or environments without external Redis
 */
class LocalAuditQueue implements IAuditQueue {
  private handler?: AuditJobHandler;
  private queue: AuditJobData[] = [];
  private isProcessing = false;

  public async addAuditJob(data: AuditJobData): Promise<string> {
    this.queue.push(data);
    logger.info("Enqueued audit job in local queue", { auditId: data.auditId, pendingCount: this.queue.length });
    
    // Asynchronously dispatch job without blocking the request thread
    setTimeout(() => {
      this.processNext();
    }, 50);

    return data.auditId;
  }

  public registerWorker(handler: AuditJobHandler): void {
    this.handler = handler;
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.handler) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift()!;

    try {
      logger.info("Local worker started executing audit", { auditId: job.auditId });
      await this.handler(job);
      logger.info("Local worker successfully finished audit", { auditId: job.auditId });
    } catch (err) {
      logger.error("Local worker encountered unhandled error", { auditId: job.auditId }, err);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 100);
      }
    }
  }
}

// Singleton Queue Provider
let queueInstance: IAuditQueue | null = null;

export function getAuditQueue(): IAuditQueue {
  if (queueInstance) {
    return queueInstance;
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      queueInstance = new BullMQAuditQueue(redis);
      logger.info("Initialized BullMQ distributed Redis queue adapter.");
      return queueInstance;
    } catch (err) {
      logger.warn("Failed to start BullMQ, using local fallback queue", {}, err);
    }
  }

  queueInstance = new LocalAuditQueue();
  logger.info("Initialized local in-process audit queue adapter.");
  return queueInstance;
}
