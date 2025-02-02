import { Request, Response } from "express";
import { performDailyBackups } from "../utils/backupManager";
import path from "path";
import fs from "fs";
import { restoreBackupFromDrive } from "../utils/restore";
import { env } from "../env";

const MONGO_URI_PRODUCTION = env.MONGO_URI_PRODUCTION;
const MONGO_URI_DEVELOPMENT = env.MONGO_URI_DEVELOPMENT;

const BASE_BACKUP_DIR = path.join(__dirname, "backups");

// Define interface for the success response
interface BackupSuccessResponse {
  message: string;
}

// Define interface for the error response
interface BackupErrorResponse {
  error: string;
}

const manualBackup = async (
  req: Request,
  res: Response<BackupSuccessResponse | BackupErrorResponse>
): Promise<void> => {
  try {
    if (!MONGO_URI_PRODUCTION || !MONGO_URI_DEVELOPMENT) {
      throw new Error(
        "Missing MONGO_URI_PRODUCTION or MONGO_URI_DEVELOPMENT in environment variables."
      );
    }

    await performDailyBackups(
      BASE_BACKUP_DIR,
      MONGO_URI_PRODUCTION,
      MONGO_URI_DEVELOPMENT,
      true
    );
    res.json({ message: "Manual backup triggered successfully." });
  } catch (error) {
    console.error("Error in manual backup:", error);
    res.status(500).json({ error: "Manual backup failed." });
  }
};

const restoreBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, backupId, dbName, collections } = req.body;

    if (!MONGO_URI_PRODUCTION || !MONGO_URI_DEVELOPMENT) {
      throw new Error(
        "Missing MONGO_URI_PRODUCTION or MONGO_URI_DEVELOPMENT in environment variables."
      );
    }

    if (!date || !dbName) {
      res.status(400).json({ error: "Missing date or dbName." });
    }

    const backupPath = path.join(BASE_BACKUP_DIR, date, dbName);
    if (!fs.existsSync(backupPath)) {
      res.status(404).json({ error: "Backup path not found." });
    }

    let mongoUri = "";
    if (dbName === "production") {
      mongoUri = MONGO_URI_PRODUCTION;
    } else if (dbName === "development") {
      mongoUri = MONGO_URI_DEVELOPMENT;
    } else {
      res
        .status(400)
        .json({ error: 'dbName must be "production" or "development".' });
    }

    await restoreBackupFromDrive({
      backupId,
      restoreMongoUri: mongoUri,
      collections,
    });

    res.json({ message: "Restore triggered successfully." });
  } catch (error) {
    console.error("Error restoring backup:", error);
    res.status(500).json({ error: "Restore failed." });
  }
};

export { manualBackup, restoreBackup };
