// apps/backup-service/src/backupManager.ts
import path from "path";
import { backupDatabase } from "./backup";

const MAIN_FOLDER_ID = process.env.GOOGLE_DRIVE_MAIN_FOLDER_ID || ""; // ID of "data-backup"

export async function performDailyBackups(
  baseBackupDir: string,
  productionUri: string,
  developmentUri: string
) {
  const today = new Date().toISOString().split("T")[0]; // e.g. "2025-01-27"

  // Production
  const productionBackupPath = path.join(baseBackupDir, today, "production");
  await backupDatabase({
    dbName: "AIAPP",
    backupPath: productionBackupPath,
    mongoUri: productionUri,
    saveToDrive: true, // <--- enable if you want to upload
    driveMainFolderId: MAIN_FOLDER_ID, // <--- specify folder ID if needed
    dateFolderName: today, // subfolder = "2025-01-26"
  });

  // Development
  const developmentBackupPath = path.join(baseBackupDir, today, "development");
  await backupDatabase({
    dbName: "PAYMENT",
    backupPath: developmentBackupPath,
    mongoUri: developmentUri,
    saveToDrive: true,
    driveMainFolderId: MAIN_FOLDER_ID,
    dateFolderName: today,
  });

  console.log(`Daily backups completed for date: ${today}`);
}
