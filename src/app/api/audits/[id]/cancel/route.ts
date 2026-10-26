import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/modules/audits/audit.service";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const updated = await AuditService.cancelAudit(params.id);
    return NextResponse.json({
      success: true,
      audit: updated,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to cancel audit",
      },
      { status: 400 }
    );
  }
}
