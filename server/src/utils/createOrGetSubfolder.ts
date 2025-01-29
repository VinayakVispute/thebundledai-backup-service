// createSubfolder.ts
import { drive_v3 } from "googleapis";

export async function createOrGetSubfolder(
  drive: drive_v3.Drive,
  parentFolderId: string,
  folderName: string,
  isManual: boolean
): Promise<string> {
  // 1. Search for existing folder with this name under parentFolderId
  const mainFolderResponse = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  let mainFolderId: string;

  if (
    mainFolderResponse.data.files &&
    mainFolderResponse.data.files.length > 0
  ) {
    // Use the existing main folder
    mainFolderId = mainFolderResponse.data.files[0].id!;
  } else {
    // Create the main folder if it doesn't exist
    const mainFolderMetadata: drive_v3.Params$Resource$Files$Create["requestBody"] =
      {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      };

    const mainCreateResponse = await drive.files.create({
      requestBody: mainFolderMetadata,
      fields: "id",
    });

    if (!mainCreateResponse.data.id) {
      throw new Error(`Failed to create folder '${folderName}'.`);
    }

    mainFolderId = mainCreateResponse.data.id;
  }

  if (isManual) {
    const manualFolderResponse = await drive.files.list({
      q: `'${mainFolderId}' in parents and name = 'manual' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
    });

    if (
      manualFolderResponse.data.files &&
      manualFolderResponse.data.files.length > 0
    ) {
      // Use the existing "manual" folder
      return manualFolderResponse.data.files[0].id!;
    } else {
      // Create the "manual" folder if it doesn't exist
      const manualFolderMetadata: drive_v3.Params$Resource$Files$Create["requestBody"] =
        {
          name: "manual",
          mimeType: "application/vnd.google-apps.folder",
          parents: [mainFolderId],
        };

      const manualCreateResponse = await drive.files.create({
        requestBody: manualFolderMetadata,
        fields: "id",
      });

      if (!manualCreateResponse.data.id) {
        throw new Error("Failed to create 'manual' folder.");
      }

      return manualCreateResponse.data.id;
    }
  }

  // Return the main folder ID if not manual
  return mainFolderId;
}
