// src/streamReader.ts
import { Server } from "socket.io";
import { redis } from "../services/redis";

export function streamReader(io: Server, streamName: string) {
  let lastId = "$";
  // '$' means "start reading from new messages only".
  // If you want older messages, set it to '0-0'.

  // We’ll poll the stream in a loop
  async function readStream() {
    try {
      // XREAD BLOCK 0 STREAMS streamName lastId
      const reply = await redis.xread(
        // block => blocking read
        // we can block for some time or 0=indefinite
        "BLOCK",
        1000, // 1 second block
        "STREAMS",
        streamName,
        lastId
      );

      if (reply) {
        // reply format => [[streamKey, [[id, [field, val, field, val...]]...]]]
        const [streamKey, entries] = reply[0];
        for (const [id, fields] of entries) {
          // fields is something like ['message', 'Backup started...']
          const messageObj = parseFields(fields);
          // broadcast to clients
          io.emit(streamName, { id, ...messageObj });

          // update lastId so we don't re-read
          lastId = id;
        }
      }
    } catch (error) {
      console.error(`Error reading stream ${streamName}:`, error);
    } finally {
      // Wait a bit, then poll again
      setImmediate(readStream);
    }
  }

  // Start the loop
  readStream();
}

/** Convert [ 'key1', 'val1', 'key2', 'val2', ... ] to an object { key1: val1, key2: val2 } */
function parseFields(fields: (string | Buffer)[]) {
  const obj: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i]?.toString() || "";
    const val = fields[i + 1]?.toString() || "";
    obj[key] = val;
  }
  return obj;
}
