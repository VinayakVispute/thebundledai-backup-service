// apps/backup-service/src/backupManager.ts
import path from "path";
import { backupDatabase } from "./backup";
import { env } from "../env";
import { addLogEntry } from "./logger";

const MAIN_FOLDER_ID = env.GOOGLE_DRIVE_MAIN_FOLDER_ID;

export async function performDailyBackups(
  baseBackupDir: string,
  productionUri: string,
  developmentUri: string,
  isManual: boolean,
  requestId: string
) {
  const today = new Date().toISOString().split("T")[0]; // e.g. "2025-01-27"

  await addLogEntry(
    "backup",
    `Starting daily backups for date: ${today}`,
    requestId
  );

  const baseDateFolder = isManual ? path.join(today, "manual") : today;

  // Production
  const productionBackupPath = path.join(
    baseBackupDir,
    baseDateFolder,
    "production"
  );
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

  await addLogEntry(
    "backup",
    `Daily backups completed for date: ${today}`,
    requestId
  );
}
