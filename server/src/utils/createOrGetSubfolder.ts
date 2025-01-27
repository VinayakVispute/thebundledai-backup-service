// createSubfolder.ts
import { google, drive_v3 } from "googleapis";

/**
 * Creates (or finds) a subfolder with a given `folderName` under `parentFolderId`.
 * @returns the subfolder's ID
 */
export async function createOrGetSubfolder(
  drive: drive_v3.Drive,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  // 1. Search for existing folder with this name under parentFolderId
  const listResponse = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  const existingFolder = listResponse.data.files && listResponse.data.files[0];
  if (existingFolder) {
    // Found existing folder
    return existingFolder.id!;
  }

  // 2. Otherwise, create a new folder
  const fileMetadata: drive_v3.Params$Resource$Files$Create["requestBody"] = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentFolderId],
  };

  const createResponse = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });

  if (!createResponse.data.id) {
    throw new Error(
      `Failed to create folder '${folderName}' under parent '${parentFolderId}'.`
    );
  }

  return createResponse.data.id;
}
