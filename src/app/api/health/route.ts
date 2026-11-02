import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Database checks require runtime credentials and must never become build artifacts.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database health check failed",
      },
      { status: 503 }
    );
  }
}
