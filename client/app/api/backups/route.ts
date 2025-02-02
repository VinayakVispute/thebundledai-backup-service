import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: "desc" },
      take: 10, // Limit to the last 10 backups
      select: {
        id: true,
        createdAt: true,
        dbName: true,
        environment: true,
        triggeredBy: true,
        driveFolderId: true,
        driveFileId: true,
        localPath: true,
      },
    });
    return NextResponse.json(backups);
  } catch (error) {
    console.error("Failed to fetch backups:", error);
    return NextResponse.json(
      { error: "Failed to fetch backups" },
      { status: 500 }
    );
  }
}
