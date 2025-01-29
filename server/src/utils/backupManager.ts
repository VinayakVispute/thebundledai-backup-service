// apps/backup-service/src/backupManager.ts
import path from "path";
import { backupDatabase } from "./backup";

const MAIN_FOLDER_ID = process.env.GOOGLE_DRIVE_MAIN_FOLDER_ID;

export async function performDailyBackups(
  baseBackupDir: string,
  productionUri: string,
  developmentUri: string,
  isManual: boolean
) {
  const today = new Date().toISOString().split("T")[0]; // e.g. "2025-01-27"

  const baseDateFolder = isManual ? path.join(today, "manual") : today;

  // Production
  const productionBackupPath = path.join(
    baseBackupDir,
    baseDateFolder,
    "production"
  );
  console.log(productionBackupPath);
  await backupDatabase({
    isProduction: true,
    dbName: "AIAPP",
    backupPath: productionBackupPath,
    mongoUri: productionUri,
    saveToDrive: true,
    driveMainFolderId: MAIN_FOLDER_ID,
    dateFolderName: today, // subfolder = "2025-01-26"
    isManual,
  });

  // Development
  const developmentBackupPath = path.join(
    baseBackupDir,
    baseDateFolder,
    "development"
  );
  console.log(developmentBackupPath);

  await backupDatabase({
    isProduction: false,
    dbName: "PAYMENT",
    backupPath: developmentBackupPath,
    mongoUri: developmentUri,
    saveToDrive: true,
    driveMainFolderId: MAIN_FOLDER_ID,
    dateFolderName: today,
    isManual,
  });

  console.log(`Daily backups completed for date: ${today}`);
}
