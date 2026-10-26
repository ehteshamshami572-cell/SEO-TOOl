import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/modules/audits/audit.service";
import { createAuditSchema } from "@/modules/audits/audit.schema";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createAuditSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const audit = await AuditService.createAudit(parsed.data);

    return NextResponse.json(
      {
        success: true,
        audit,
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("Failed to create audit", {}, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create audit",
      },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const hostname = searchParams.get("hostname") || undefined;

    const data = await AuditService.listAudits(limit, offset, hostname);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err) {
    logger.error("Failed to list audits", {}, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to list audits",
      },
      { status: 500 }
    );
  }
}
