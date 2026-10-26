import Redis from "ioredis";
import { logger } from "./logger";

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | null | undefined;
}

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  if (global.__redisClient) {
    return global.__redisClient;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn("Redis retry limit exceeded, falling back to in-memory queue mode.");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    client.on("error", (err) => {
      logger.warn("Redis client warning/error:", { error: err.message });
    });

    if (process.env.NODE_ENV !== "production") {
      global.__redisClient = client;
    }
    return client;
  } catch (err) {
    logger.warn("Failed to initialize Redis connection, using in-process queue adapter", {}, err);
    return null;
  }
}
