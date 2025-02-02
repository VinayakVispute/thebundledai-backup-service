import { redis } from "../services/redis";

export async function addLogEntry(streamName: string, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`$${timestamp} : ${streamName}: ${message}`);
  // XADD backup-logs * message "Backup started..." timestamp "2023-10-10T10:00:00.000Z"
  // Typically store a few fields; here we store message and timestamp
  await redis.xadd(
    streamName,
    "MAXLEN",
    "~",
    1000,
    "*",
    "message",
    message,
    "timestamp",
    timestamp
  );
}
