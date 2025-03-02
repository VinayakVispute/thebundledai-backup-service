import winston from "winston";
import path from "path";
import fs from "fs";
import { redis } from "../services/redis";

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.printf(({ level, message, timestamp, requestId, source }) => {
    return `${timestamp} [${level.toUpperCase()}] [${source || "unknown"}] [${
      requestId || "no-request-id"
    }]: ${message}`;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  // the level ab
  format: logFormat,
  defaultMeta: { service: "backup-service" },
  transports: [
    // Console transport
    new winston.transports.Console(),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),

    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Log to Redis stream for real-time monitoring
async function logToRedisStream(
  streamName: string,
  level: string,
  message: string,
  requestId: string,
  source: string
) {
  const timestamp = new Date().toISOString();
  await redis.xadd(
    streamName,
    "MAXLEN",
    "~",
    1000,
    "*",
    "level",
    level,
    "message",
    message,
    "timestamp",
    timestamp,
    "requestId",
    requestId,
    "source",
    source
  );
}

// Logger interface
export interface LogParams {
  message: string;
  requestId?: string;
  source?: string;
  streamName?: string;
}

// Logger functions
export function logInfo({
  message,
  requestId = "no-id",
  source = "system",
  streamName,
}: LogParams) {
  logger.info(message, { requestId, source });
  if (streamName) {
    logToRedisStream(streamName, "info", message, requestId, source).catch(
      (err) => {
        logger.error(`Failed to log to Redis stream: ${err.message}`, {
          requestId,
          source,
        });
      }
    );
  }
}

export function logWarning({
  message,
  requestId = "no-id",
  source = "system",
  streamName,
}: LogParams) {
  logger.warn(message, { requestId, source });
  if (streamName) {
    logToRedisStream(streamName, "warn", message, requestId, source).catch(
      (err) => {
        logger.error(`Failed to log to Redis stream: ${err.message}`, {
          requestId,
          source,
        });
      }
    );
  }
}

export function logError({
  message,
  requestId = "no-id",
  source = "system",
  streamName,
}: LogParams) {
  logger.error(message, { requestId, source });
  if (streamName) {
    logToRedisStream(streamName, "error", message, requestId, source).catch(
      (err) => {
        logger.error(`Failed to log to Redis stream: ${err.message}`, {
          requestId,
          source,
        });
      }
    );
  }
}

export function logDebug({
  message,
  requestId = "no-id",
  source = "system",
  streamName,
}: LogParams) {
  logger.debug(message, { requestId, source });
  if (streamName) {
    logToRedisStream(streamName, "debug", message, requestId, source).catch(
      (err) => {
        logger.error(`Failed to log to Redis stream: ${err.message}`, {
          requestId,
          source,
        });
      }
    );
  }
}

// For backward compatibility
export async function addLogEntry(
  streamName: string,
  message: string,
  requestId: string,
  level: string = "info",
  source: string = "legacy"
) {
  // Log with Winston
  logger.log(level, message, { requestId, source });

  // Also log to Redis stream
  const timestamp = new Date().toISOString();
  await redis.xadd(
    streamName,
    "MAXLEN",
    "~",
    1000,
    "*",
    "level",
    level,
    "message",
    message,
    "timestamp",
    timestamp,
    "requestId",
    requestId,
    "source",
    source
  );
}
