export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  error?: string;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown): LogPayload {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : (error ? String(error) : undefined),
  };
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(JSON.stringify(formatLog("debug", message, context)));
    }
  },
  info(message: string, context?: Record<string, unknown>) {
    console.log(JSON.stringify(formatLog("info", message, context)));
  },
  warn(message: string, context?: Record<string, unknown>, error?: unknown) {
    console.warn(JSON.stringify(formatLog("warn", message, context, error)));
  },
  error(message: string, context?: Record<string, unknown>, error?: unknown) {
    console.error(JSON.stringify(formatLog("error", message, context, error)));
  },
};
