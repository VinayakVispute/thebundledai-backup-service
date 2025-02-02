import Redis, { RedisOptions } from "ioredis";
import { env } from "../env";

const redisOptions: RedisOptions = {
  host: env.REDIS_AIVEN_SERVER_HOST,
  port: env.REDIS_AIVEN_SERVER_PORT,
  username: env.REDIS_AIVEN_SERVER_USERNAME,
  password: env.REDIS_AIVEN_SERVER_PASSWORD,
};

export const redis = new Redis(redisOptions);
