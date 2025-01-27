// apps/backup-service/src/index.ts

import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import router from "./routes/utilRoutes";
import { performDailyBackups } from "./utils/backupManager";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api", router);

// Env config
const PORT = process.env.BACKUP_SERVICE_PORT || 4000;
const BASE_BACKUP_DIR = path.join(__dirname, "backups");

const MONGO_URI_PRODUCTION =
  process.env.MONGO_URI_PRODUCTION ||
  "mongodb+srv://officialfounderfeed:officialfounderfeed@cluster0.tupwyg6.mongodb.net";
const MONGO_URI_DEVELOPMENT =
  process.env.MONGO_URI_DEVELOPMENT ||
  "mongodb+srv://officialfounderfeed:officialfounderfeed@cluster0.tupwyg6.mongodb.net";

app.listen(PORT, () => {
  console.log(`Backup service running on port ${PORT}`);
});

// ==============================
// CRON JOB for daily backups
// e.g. run at 1:00 AM server time
// ==============================
cron.schedule("* * * * *", async () => {
  console.log("Daily backup job started...");
  try {
    await performDailyBackups(
      BASE_BACKUP_DIR,
      MONGO_URI_PRODUCTION,
      MONGO_URI_DEVELOPMENT
    );
    console.log("Daily backup job completed successfully.");
  } catch (error) {
    console.error("Error in daily backup job:", error);
  }
});
