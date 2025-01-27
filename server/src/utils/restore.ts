// apps/backup-service/src/restore.ts

import { exec } from "child_process";
import util from "util";
import path from "path";

const execPromise = util.promisify(exec);

interface RestoreOptions {
  backupPath: string; // e.g. /home/backups/YYYY-MM-DD/production
  mongoUri: string;
  dbName: string;
  collections?: string[]; // optional: if you only want to restore certain collections
}

/**
 * If `collections` is specified, restore only those. Otherwise, restore entire DB.
 */
export async function restoreDatabase(options: RestoreOptions): Promise<void> {
  const { backupPath, mongoUri, dbName, collections } = options;

  // If no specific collections, restore entire directory at once.
  if (!collections || collections.length === 0) {
    // Example:
    // mongorestore --uri="mongodb://localhost:27017" --nsFrom="production.*" --nsTo="production.*" /home/backups/2025-01-01/production
    const restoreCmd = `mongorestore --uri="${mongoUri}" --nsFrom="${dbName}.*" --nsTo="${dbName}.*" ${backupPath}`;
    try {
      const { stdout, stderr } = await execPromise(restoreCmd);
      console.log(
        `[${dbName} Restore] success. stdout: ${stdout}, stderr: ${stderr}`
      );
    } catch (error) {
      console.error(`[${dbName} Restore Error]`, error);
      throw error;
    }
    return;
  }

  // Otherwise, restore each collection individually
  // e.g., for each collection "users", do:
  // mongorestore --uri="..." --nsFrom="dbName.users" --nsTo="dbName.users" --collection=users /path/to/users.bson
  for (const col of collections) {
    const bsonFilePath = path.join(backupPath, dbName, `${col}.bson`);
    const restoreCmd = `mongorestore --uri="${mongoUri}" --nsFrom="${dbName}.${col}" --nsTo="${dbName}.${col}" --collection=${col} ${bsonFilePath}`;

    try {
      const { stdout, stderr } = await execPromise(restoreCmd);
      console.log(
        `[${dbName} Collection Restore] success. stdout: ${stdout}, stderr: ${stderr}`
      );
    } catch (error) {
      console.error(`[${dbName} Collection Restore Error]`, error);
      throw error;
    }
  }
}
