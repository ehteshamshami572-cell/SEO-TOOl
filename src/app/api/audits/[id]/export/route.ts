import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/modules/audits/audit.service";
import { ReportExporter } from "@/modules/reports/report-exporter";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();

    const audit = await AuditService.getAudit(params.id);
    if (!audit) {
      return NextResponse.json(
        { success: false, error: "Audit not found" },
        { status: 404 }
      );
    }

    if (format === "csv") {
      const csvContent = ReportExporter.exportAsCsv(audit.findings);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-${audit.hostname}-${audit.id}.csv"`,
        },
      });
    }

    if (format === "html") {
      const htmlContent = ReportExporter.exportAsHtml(audit);
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Default: JSON export
    const jsonContent = ReportExporter.exportAsJson(audit);
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-${audit.hostname}-${audit.id}.json"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to export report",
      },
      { status: 500 }
    );
  }
}
