import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/modules/audits/audit.service";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const audit = await AuditService.getAudit(params.id);

    if (!audit) {
      return NextResponse.json(
        { success: false, error: "Audit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      audit,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to retrieve audit",
      },
      { status: 500 }
    );
  }
}
