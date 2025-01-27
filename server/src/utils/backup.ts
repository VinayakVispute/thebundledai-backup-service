// apps/backup-service/src/backup.ts

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { google } from "googleapis";
import archiver from "archiver";
import { createOrGetSubfolder } from "./createOrGetSubfolder";

const execPromise = util.promisify(exec);

interface BackupOptions {
  dbName: string;
  backupPath: string; // local folder path
  mongoUri: string;
  saveToDrive?: boolean;
  driveMainFolderId?: string; // e.g. the ID for "data-backup"
  dateFolderName?: string; // e.g. "2025-01-26"
}

const GOOGLE_SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
  path.resolve(__dirname, "../../config.json");
const DEFAULT_MAIN_FOLDER_ID =
  process.env.GOOGLE_DRIVE_MAIN_FOLDER_ID ||
  "1kVJCwczYnjDNFCWzhpZIDtQtkatrTPOm";

export async function backupDatabase(options: BackupOptions): Promise<void> {
  const {
    dbName,
    backupPath,
    mongoUri,
    saveToDrive,
    driveMainFolderId,
    dateFolderName,
  } = options;

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

  // 4. (Optional) Upload to Google Drive
  if (saveToDrive) {
    const mainFolderId = driveMainFolderId || DEFAULT_MAIN_FOLDER_ID;
    if (!mainFolderId) {
      throw new Error("No main Drive folder ID specified.");
    }
    if (!dateFolderName) {
      throw new Error("No date folder name specified for subfolder.");
    }

    // We'll create (or find) the date subfolder under data-backup
    const dateFolderId = await getDriveSubfolderId(
      mainFolderId,
      dateFolderName
    );

    // Then upload production.zip or development.zip to that date subfolder
    await uploadToGoogleDrive(zipFilePath, dateFolderId);
    console.log(`Uploaded ${dbName}.zip to Drive folder ${dateFolderName}.`);
  }

  // 5. Optional: Remove local ZIP or keep it
  fs.unlinkSync(zipFilePath);
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
  dateFolderName: string
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
    dateFolderName
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

  await driveService.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
  });
}
