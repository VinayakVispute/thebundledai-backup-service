// src/restoreFromDrive.ts

import fs from "fs";
import path from "path";
import util from "util";
import { google } from "googleapis";
import { exec } from "child_process";
import unzipper from "unzipper";
import { PrismaClient } from "@prisma/client";
import { addLogEntry } from "./logger";

const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

interface RestoreOptions {
  backupId: string; // the ID of the Backup row in DB
  restoreMongoUri: string; // Mongo connection for `mongorestore`
  collections?: string[]; // optional: if you only want to restore certain
  requestId: string; // optional: unique ID for this restore job
}

export async function restoreBackupFromDrive(options: RestoreOptions) {
  const { backupId, restoreMongoUri, collections, requestId } = options;

  await addLogEntry(
    "restore",
    `Starting restore for backup ID: ${backupId}`,
    requestId
  );

  // Create a new Restore record
  const restoreRecord = await prisma.restore.create({
    data: {
      status: "PENDING",
      backup: { connect: { id: backupId } },
    },
  });

  try {
    const restoredBackup = await prisma.backup.findUnique({
      where: { id: backupId },
      select: {
        driveFileId: true,
        dbName: true,
        localPath: true,
        environment: true,
      },
    });

    if (!restoredBackup) {
      const errorMessage = `Backup with ID ${backupId} not found.`;
      await addLogEntry("restore", errorMessage, requestId);
      throw new Error(errorMessage);
    }

    const { driveFileId, dbName, environment: fileName } = restoredBackup;

    if (!driveFileId) {
      const errorMessage = `Backup with ID ${backupId} does not have a Google Drive ID.`;
      await addLogEntry("restore", errorMessage, requestId);
      throw new Error(errorMessage);
    }

    // 2. Download the .zip from Google Drive
    const localZipPath = path.join(__dirname, "..", "tmp", fileName);
    fs.mkdirSync(path.dirname(localZipPath), { recursive: true });

    await downloadFromGoogleDrive(driveFileId, localZipPath);

    await addLogEntry(
      "restore",
      `Downloaded backup '${fileName}' from Drive to '${localZipPath}'.`,
      requestId
    );

    // 3. Unzip the archive
    const unzippedFolderPath = localZipPath.replace(".zip", "");
    await unzipFile(localZipPath, unzippedFolderPath);
    await addLogEntry(
      "restore",
      `Unzipped backup into: ${unzippedFolderPath}`,
      requestId
    );

    // 4. Build the restore command
    if (!collections || collections.length === 0) {
      const cmd = `mongorestore --uri="${restoreMongoUri}" --nsFrom="${dbName}.*" --nsTo="${dbName}.*" "${unzippedFolderPath}"`;

      await addLogEntry(
        "restore",
        `Running restore command: ${cmd}`,
        requestId
      );

      await execPromise(cmd);
    } else {
      for (const col of collections) {
        const bsonPath = path.join(unzippedFolderPath, dbName, `${col}.bson`);
        if (!fs.existsSync(bsonPath)) {
          await addLogEntry(
            "restore",
            `Warning: collection file not found: ${bsonPath}`,
            requestId
          );
          continue;
        }
        const cmd = `mongorestore --uri="${restoreMongoUri}" --nsFrom="${dbName}.${col}" --nsTo="${dbName}.${col}" --collection=${col} "${bsonPath}"`;
        await addLogEntry(
          "restore",
          `Restoring collection: ${col} via: ${cmd}`,
          requestId
        );
        await execPromise(cmd);
      }
    }

    await addLogEntry(
      "restore",
      `Restore completed for backup ${backupId}.`,
      requestId
    );

    // Update the Restore record status to SUCCESS
    await prisma.restore.update({
      where: { id: restoreRecord.id },
      data: { status: "SUCCESS" },
    });

    // 5. (Optional) Clean up local .zip and extracted folder
    fs.unlinkSync(localZipPath);
    fs.rmSync(unzippedFolderPath, { recursive: true, force: true });

    await addLogEntry("restore", `Cleaned up local files.`, requestId);
  } catch (error: any) {
    console.error(`[Restore Error]`, error);
    await addLogEntry(
      "restore",
      `Restore failed for backup ${backupId}. Error: ${error.message}`,
      requestId
    );

    // Update the Restore record status to FAILED
    await prisma.restore.update({
      where: { id: restoreRecord.id },
      data: { status: "FAILED" },
    });

    throw error;
  }
}

/** Download a file from Google Drive by file ID. */
async function downloadFromGoogleDrive(fileId: string, destPath: string) {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const driveService = google.drive({ version: "v3", auth });

  const dest = fs.createWriteStream(destPath);

  // Streams the file from Drive into dest
  const res = await driveService.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return new Promise<void>((resolve, reject) => {
    res.data
      .on("end", () => resolve())
      .on("error", (err: any) => reject(err))
      .pipe(dest);
  });
}

/** Unzip the downloaded .zip to a target folder. */
async function unzipFile(
  zipPath: string,
  extractToPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractToPath }))
      .on("close", resolve)
      .on("error", reject);
  });
}
