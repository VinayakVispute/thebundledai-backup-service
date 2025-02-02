// apps/backup-service/src/backup.ts

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { google } from "googleapis";
import archiver from "archiver";
import { createOrGetSubfolder } from "./createOrGetSubfolder";
import { PrismaClient } from "@prisma/client";
import { env } from "../env";
import { addLogEntry } from "./logger";

const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

interface BackupOptions {
  isProduction: boolean;
  dbName: string;
  backupPath: string; // local folder path
  mongoUri: string;
  saveToDrive?: boolean;
  driveMainFolderId?: string; // e.g. the ID for "data-backup"
  dateFolderName?: string; // e.g. "2025-01-26"
  isManual: boolean; // if this is a manual backup
}

const GOOGLE_SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  "../../config.json"
);

const DEFAULT_MAIN_FOLDER_ID = env.GOOGLE_DRIVE_MAIN_FOLDER_ID;

export async function backupDatabase(options: BackupOptions): Promise<void> {
  const {
    isProduction,
    dbName,
    backupPath,
    mongoUri,
    saveToDrive,
    driveMainFolderId,
    dateFolderName,
    isManual,
  } = options;

  const environment = isProduction ? "PRODUCTION" : "DEVELOPMENT";
  const triggeredBy = isManual ? "MANUAL" : "CRON";

  await addLogEntry(
    "backup-process",
    `Starting backup for ${environment} database: ${dbName}`
  );

  if (!DEFAULT_MAIN_FOLDER_ID) {
    const errorMessage = "No main Drive folder ID specified.";
    await addLogEntry("backup-process", errorMessage);
    throw new Error(errorMessage);
  }

  // Create a new Backup record
  const backupRecord = await prisma.backup.create({
    data: {
      environment,
      triggeredBy,
      localPath: saveToDrive ? null : backupPath,
      dbName: dbName,
    },
  });

  // 1. Ensure local backup directory
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  // 2. Run mongodump
  const backupCommand = `mongodump --uri="${mongoUri}" --db=${dbName} --out="${backupPath}"`;
  await execPromise(backupCommand);

  // 3. Zip the folder
  const zipFilePath = backupPath + ".zip"; // e.g. E:\...\2025-01-26\production.zip
  await zipDirectory(backupPath, zipFilePath);
  await addLogEntry("backup-process", `Backup zipped at: ${zipFilePath}`);

  // 4. (Optional) Upload to Google Drive
  if (saveToDrive) {
    const mainFolderId = driveMainFolderId || DEFAULT_MAIN_FOLDER_ID;

    if (!mainFolderId) {
      const errorMessage = "No main Drive folder ID specified.";
      await addLogEntry("backup-process", errorMessage);
      throw new Error(errorMessage);
    }
    if (!dateFolderName) {
      const errorMessage = "No date folder name specified for subfolder.";
      await addLogEntry("backup-process", errorMessage);
      throw new Error(errorMessage);
    }

    const dateFolderId = await getDriveSubfolderId(
      mainFolderId,
      dateFolderName,
      isManual
    );
    const driveFileId = await uploadToGoogleDrive(zipFilePath, dateFolderId);

    // Update the Backup record with Google Drive metadata
    await prisma.backup.update({
      where: { id: backupRecord.id },
      data: {
        driveFolderId: dateFolderId,
        driveFileId: driveFileId,
      },
    });

    await addLogEntry(
      "backup-process",
      `Uploaded ${dbName}.zip to Drive folder ${dateFolderName}.`
    );
  }

  // 5. Optional: Remove local ZIP or keep it
  fs.unlinkSync(zipFilePath);
  await addLogEntry(
    "backup-process",
    `Backup process completed for ${environment} database: ${dbName}`
  );
}

/** Zip a directory using archiver */
async function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/** Create or retrieve the date subfolder inside the main folder. */
async function getDriveSubfolderId(
  mainFolderId: string,
  dateFolderName: string,
  isManual: boolean
): Promise<string> {
  // 1. Auth
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_SERVICE_ACCOUNT_PATH,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const driveService = google.drive({ version: "v3", auth });

  // 2. Create (or find) subfolder for the date
  const subfolderId = await createOrGetSubfolder(
    driveService,
    mainFolderId,
    dateFolderName,
    isManual
  );
  return subfolderId;
}

/** Upload a zip file to a specific Drive folder. */
async function uploadToGoogleDrive(filePath: string, folderId: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_SERVICE_ACCOUNT_PATH,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const driveService = google.drive({ version: "v3", auth });

  const fileName = path.basename(filePath); // e.g. production.zip
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: "application/zip",
    body: fs.createReadStream(filePath),
  };

  const file = await driveService.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
  });

  return file.data.id;
}
