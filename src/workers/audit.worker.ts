import { AuditService } from "@/modules/audits/audit.service";
import { logger } from "@/lib/logger";

logger.info("Initializing dedicated background audit worker process...");

// Start listening on queues
AuditService.initWorker();

logger.info("Audit worker running and listening for jobs.");

// Handle graceful shutdown signals
process.on("SIGINT", () => {
  logger.info("Worker received SIGINT, terminating gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Worker received SIGTERM, terminating gracefully...");
  process.exit(0);
});
