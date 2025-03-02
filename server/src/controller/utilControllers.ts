import { Request, Response } from "express";
import { performDailyBackups } from "../utils/backupManager";
import path from "path";
import fs from "fs";
import { restoreBackupFromDrive } from "../utils/restore";
import { env } from "../env";
import { logInfo, logError, logWarning, addLogEntry } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

const MONGO_URI_PRODUCTION = env.MONGO_URI_PRODUCTION;
const MONGO_URI_DEVELOPMENT = env.MONGO_URI_DEVELOPMENT;

const BASE_BACKUP_DIR = path.join(__dirname, "..", "temp", "backups");

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
  // Use the request ID from middleware or generate a new one
  const requestId = req.requestId || uuidv4();
  const source = "utilControllers.manualBackup";

  try {
    if (!MONGO_URI_PRODUCTION || !MONGO_URI_DEVELOPMENT) {
      const errorMessage =
        "Missing MONGO_URI_PRODUCTION or MONGO_URI_DEVELOPMENT in environment variables.";

      logError({
        message: errorMessage,
        requestId,
        source,
        streamName: "backup",
      });

      // For backward compatibility
      await addLogEntry("backup", errorMessage, requestId, "error", source);

      throw new Error(errorMessage);
    }

    logInfo({
      message: "Manual backup triggered.",
      requestId,
      source,
      streamName: "backup",
    });

    // For backward compatibility
    await addLogEntry(
      "backup",
      "Manual backup triggered.",
      requestId,
      "info",
      source
    );

    await performDailyBackups(
      BASE_BACKUP_DIR,
      MONGO_URI_PRODUCTION,
      MONGO_URI_DEVELOPMENT,
      true,
      requestId
    );

    logInfo({
      message: "Manual backup completed successfully.",
      requestId,
      source,
      streamName: "backup",
    });

    // For backward compatibility
    await addLogEntry(
      "backup",
      "Manual backup completed successfully.",
      requestId,
      "info",
      source
    );

    res.status(200).json({ message: "Backup completed successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError({
      message: `Manual backup failed: ${errorMessage}`,
      requestId,
      source,
      streamName: "backup",
    });

    // For backward compatibility
    await addLogEntry(
      "backup",
      `Manual backup failed: ${errorMessage}`,
      requestId,
      "error",
      source
    );

    res.status(500).json({ error: errorMessage });
  }
};

const restoreBackup = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.requestId || uuidv4();
  const source = "utilControllers.restoreBackup";

  try {
    const { fileId } = req.body;

    if (!fileId) {
      const errorMessage = "Missing fileId in request body";

      logError({
        message: errorMessage,
        requestId,
        source,
        streamName: "restore",
      });

      // For backward compatibility
      await addLogEntry("restore", errorMessage, requestId, "error", source);

      res.status(400).json({ error: errorMessage });
      return;
    }

    logInfo({
      message: `Restore initiated for file ID: ${fileId}`,
      requestId,
      source,
      streamName: "restore",
    });

    // For backward compatibility
    await addLogEntry(
      "restore",
      `Restore initiated for file ID: ${fileId}`,
      requestId,
      "info",
      source
    );

    const { backupId, dbName, collections } = req.body;
    const date = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

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

    // For backward compatibility
    await addLogEntry(
      "restore",
      `Restore completed for file ID: ${fileId}`,
      requestId,
      "info",
      source
    );

    logInfo({
      message: `Restore completed for file ID: ${fileId}`,
      requestId,
      source,
      streamName: "restore",
    });

    res.status(200).json({ message: "Restore completed successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError({
      message: `Restore failed: ${errorMessage}`,
      requestId,
      source,
      streamName: "restore",
    });

    // For backward compatibility
    await addLogEntry(
      "restore",
      `Restore failed: ${errorMessage}`,
      requestId,
      "error",
      source
    );

    res.status(500).json({ error: errorMessage });
  }
};

export { manualBackup, restoreBackup };
