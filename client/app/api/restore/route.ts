import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { restoreBackupFromDrive } from "@/utils/restore"; // Adjust the import path as necessary

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { backupId } = await request.json();

  try {
    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Determine the correct MongoDB URI based on the backup environment
    const mongoUri =
      backup.environment === "PRODUCTION"
        ? process.env.MONGO_URI_PRODUCTION
        : process.env.MONGO_URI_DEVELOPMENT;

    if (!mongoUri) {
      return NextResponse.json(
        { error: "MongoDB URI not configured" },
        { status: 500 }
      );
    }

    // Initiate the restore process
    await restoreBackupFromDrive({
      backupId,
      restoreMongoUri: mongoUri,
    });

    return NextResponse.json({ message: "Restore process initiated" });
  } catch (error) {
    console.error("Failed to initiate restore:", error);
    return NextResponse.json(
      { error: "Failed to initiate restore" },
      { status: 500 }
    );
  }
}
