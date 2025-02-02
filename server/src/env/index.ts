import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const redisEnvSchema = z.object({
  REDIS_AIVEN_SERVER_HOST: z
    .string()
    .min(1, "Redis host must be a non-empty string"),
  REDIS_AIVEN_SERVER_PORT: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("Redis port must be a positive number")
  ),
  REDIS_AIVEN_SERVER_USERNAME: z
    .string()
    .min(1, "Redis username must be a non-empty string"),
  REDIS_AIVEN_SERVER_PASSWORD: z.string().min(1, "Redis password is required"),
});

const additionalEnvSchema = z.object({
  BACKUP_SERVICE_PORT: z
    .number()
    .int()
    .positive("Backup service port must be a positive number")
    .optional(),
  MONGO_URI_PRODUCTION: z.string().min(1, "Production URI is required"),
  MONGO_URI_DEVELOPMENT: z.string().min(1, "Development URI is required"),
  GOOGLE_DRIVE_MAIN_FOLDER_ID: z
    .string()
    .min(1, "Google Drive folder ID is required"),
});

const envSchema = redisEnvSchema.merge(additionalEnvSchema);

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
