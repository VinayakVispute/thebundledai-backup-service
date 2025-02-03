import { Request, Response } from "express";
import { performDailyBackups } from "../utils/backupManager";
import path from "path";
import fs from "fs";
import { restoreBackupFromDrive } from "../utils/restore";
import { env } from "../env";
import { addLogEntry } from "../utils/logger";

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
  const requestId = crypto.randomUUID();
  try {
    if (!MONGO_URI_PRODUCTION || !MONGO_URI_DEVELOPMENT) {
      const errorMessage =
        "Missing MONGO_URI_PRODUCTION or MONGO_URI_DEVELOPMENT in environment variables.";
      await addLogEntry("backup", errorMessage, requestId);
      throw new Error(errorMessage);
    }

    await addLogEntry("backup", "Manual backup triggered.", requestId);

    await performDailyBackups(
      BASE_BACKUP_DIR,
      MONGO_URI_PRODUCTION,
      MONGO_URI_DEVELOPMENT,
      true,
      requestId
    );

    await addLogEntry(
      "backup",
      "Manual backup completed successfully.",
      requestId
    );

    res.json({ message: "Manual backup triggered successfully." });
  } catch (error: any) {
    console.error("Error in manual backup:", error);
    await addLogEntry(
      "backup",
      `Manual backup failed. Error: ${error.message}`,
      requestId
    );
    res.status(500).json({ error: "Manual backup failed." });
  }
};

const restoreBackup = async (req: Request, res: Response): Promise<void> => {
  const requestId = crypto.randomUUID();
  try {
    const { date, backupId, dbName, collections } = req.body;

    if (!MONGO_URI_PRODUCTION || !MONGO_URI_DEVELOPMENT) {
      const errorMessage =
        "Missing MONGO_URI_PRODUCTION or MONGO_URI_DEVELOPMENT in environment variables.";
      await addLogEntry("restore", errorMessage, requestId);
      throw new Error(errorMessage);
    }

    if (!date || !dbName) {
      const errorMessage = "Missing date or dbName.";
      await addLogEntry("restore", errorMessage, requestId);
      res.status(400).json({ error: errorMessage });
      return;
    }

    const backupPath = path.join(BASE_BACKUP_DIR, date, dbName);

    if (!fs.existsSync(backupPath)) {
      const errorMessage = "Backup path not found.";
      await addLogEntry("restore", errorMessage, requestId);
      res.status(404).json({ error: errorMessage });
      return;
    }

    let mongoUri = "";
    if (dbName === "production") {
      mongoUri = MONGO_URI_PRODUCTION;
    } else if (dbName === "development") {
      mongoUri = MONGO_URI_DEVELOPMENT;
    } else {
      const errorMessage = 'dbName must be "production" or "development".';
      await addLogEntry("restore", errorMessage, requestId);
      res.status(400).json({ error: errorMessage });
      return;
    }

    await addLogEntry(
      "restore",
      `Restore triggered for backup ID: ${backupId}`,
      requestId
    );
    await restoreBackupFromDrive({
      backupId,
      restoreMongoUri: mongoUri,
      collections,
      requestId,
    });
    await addLogEntry(
      "restore",
      `Restore completed for backup ID: ${backupId}`,
      requestId
    );

    res.json({ message: "Restore triggered successfully." });
  } catch (error) {
    console.error("Error restoring backup:", error);
    res.status(500).json({ error: "Restore failed." });
  }
};

export { manualBackup, restoreBackup };
