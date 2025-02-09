import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const count = await prisma.backup.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch backup count:", error);
    return NextResponse.json(
      { error: "Failed to fetch backup count" },
      { status: 500 }
    );
  }
}
