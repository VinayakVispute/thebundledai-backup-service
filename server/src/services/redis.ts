import Redis, { RedisOptions } from "ioredis";
import { env } from "../env";

const redisOptions: RedisOptions = {
  host: env.REDIS_AIVEN_SERVER_HOST,
  port: env.REDIS_AIVEN_SERVER_PORT,
  username: env.REDIS_AIVEN_SERVER_USERNAME,
  password: env.REDIS_AIVEN_SERVER_PASSWORD,
};

console.log("🛠️ Initializing Redis connection...");

export const redis = new Redis(redisOptions);

redis.on("connect", () => {
  console.log("✅ Redis connected successfully!");
});

redis.on("ready", () => {
  console.log("🚀 Redis is ready to use!");
});

redis.on("reconnecting", () => {
  console.log("♻️ Redis is trying to reconnect...");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

redis.on("end", () => {
  console.log("❌ Redis connection closed.");
});
