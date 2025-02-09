import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        triggeredBy: true,
      },
    });

    const restores = await prisma.restore.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const events = [
      ...backups.map((backup) => ({
        id: backup.id,
        timestamp: backup.createdAt.getTime(),
        event: backup.triggeredBy === "MANUAL" ? "Manual Backup" : "Backup",
      })),
      ...restores.map((restore) => ({
        id: restore.id,
        timestamp: restore.createdAt.getTime(),
        event: "Restore",
      })),
    ]
      .filter(
        (event) => event.timestamp && !isNaN(event.timestamp) && event.event
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch backup analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch backup analytics" },
      { status: 500 }
    );
  }
}
