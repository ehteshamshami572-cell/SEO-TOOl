import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auditFilterSchema } from "@/modules/audits/audit.schema";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(req.url);
    const parsedFilter = auditFilterSchema.safeParse({
      category: searchParams.get("category") || undefined,
      severity: searchParams.get("severity") || undefined,
      template: searchParams.get("template") || undefined,
      url: searchParams.get("url") || undefined,
      search: searchParams.get("search") || undefined,
    });

    if (!parsedFilter.success) {
      return NextResponse.json(
        { success: false, error: "Invalid filter parameters", details: parsedFilter.error.flatten() },
        { status: 400 }
      );
    }

    const { category, severity, template, url, search } = parsedFilter.data;

    const where: Record<string, unknown> = {
      auditId: params.id,
    };

    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (template) where.template = template;
    if (url) where.url = { contains: url };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { ruleId: { contains: search } },
      ];
    }

    const findings = await prisma.finding.findMany({
      where,
      orderBy: [
        { severity: "asc" }, // In UI we sort critical -> info
        { scoreImpact: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      count: findings.length,
      findings,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to retrieve findings",
      },
      { status: 500 }
    );
  }
}
