import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/modules/audits/audit.service";
import { updateRemediationSchema } from "@/modules/audits/audit.schema";

interface RouteParams {
  params: { id: string; findingId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const json = await req.json();
    const parsed = updateRemediationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const remediation = await AuditService.updateFindingRemediation(
      params.id,
      params.findingId,
      parsed.data
    );

    return NextResponse.json({
      success: true,
      remediation,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update remediation",
      },
      { status: 400 }
    );
  }
}
