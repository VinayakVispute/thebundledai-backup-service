// apps/backup-service/src/backupManager.ts
import path from "path";
import { backupDatabase } from "./backup";
import { env } from "../env";
import { addLogEntry, logInfo, logError } from "./logger";

const MAIN_FOLDER_ID = env.GOOGLE_DRIVE_MAIN_FOLDER_ID;
const SOURCE = "utils.backupManager";

export async function performDailyBackups(
  baseBackupDir: string,
  productionUri: string,
  developmentUri: string,
  isManual: boolean,
  requestId: string
) {
  const today = new Date().toISOString().split("T")[0]; // e.g. "2025-01-27"
  const backupType = isManual ? "manual" : "scheduled";

  logInfo({
    message: `Starting ${backupType} backups for date: ${today}`,
    requestId,
    source: SOURCE,
    streamName: "backup",
  });

  // For backward compatibility
  await addLogEntry(
    "backup",
    `Starting ${backupType} backups for date: ${today}`,
    requestId,
    "info",
    SOURCE
  );

  const baseDateFolder = isManual ? path.join(today, "manual") : today;

  try {
    // Production
    const productionBackupPath = path.join(
      baseBackupDir,
      baseDateFolder,
      "production"
    );

    logInfo({
      message: `Starting production database backup to ${productionBackupPath}`,
      requestId,
      source: SOURCE,
      streamName: "backup",
    });

    await backupDatabase({
      isProduction: true,
      dbName: "AIAPP",
      backupPath: productionBackupPath,
      mongoUri: productionUri,
      saveToDrive: true,
      driveMainFolderId: MAIN_FOLDER_ID,
      dateFolderName: today, // subfolder = "2025-01-26"
      isManual,
      requestId,
    });

    // Development
    const developmentBackupPath = path.join(
      baseBackupDir,
      baseDateFolder,
      "development"
    );

    logInfo({
      message: `Starting development database backup to ${developmentBackupPath}`,
      requestId,
      source: SOURCE,
      streamName: "backup",
    });

    await backupDatabase({
      isProduction: false,
      dbName: "AIAPP",
      backupPath: developmentBackupPath,
      mongoUri: developmentUri,
      saveToDrive: true,
      driveMainFolderId: MAIN_FOLDER_ID,
      dateFolderName: today,
      isManual,
      requestId,
    });

    logInfo({
      message: `${backupType} backups completed successfully for date: ${today}`,
      requestId,
      source: SOURCE,
      streamName: "backup",
    });

    // For backward compatibility
    await addLogEntry(
      "backup",
      `${backupType} backups completed successfully for date: ${today}`,
      requestId,
      "info",
      SOURCE
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError({
      message: `Error during ${backupType} backups: ${errorMessage}`,
      requestId,
      source: SOURCE,
      streamName: "backup",
    });

    // For backward compatibility
    await addLogEntry(
      "backup",
      `Error during ${backupType} backups: ${errorMessage}`,
      requestId,
      "error",
      SOURCE
    );

    throw error; // Re-throw to be handled by the caller
  }
}
