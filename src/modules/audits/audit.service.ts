import { prisma } from "@/lib/db";
import { UrlPolicyService } from "../crawler/url-policy";
import { getAuditQueue } from "@/workers/job-queue";
import { AuditOrchestrator } from "./audit.orchestrator";
import { TemplateGrouper } from "../templates/template-grouper";
import { CreateAuditInput, UpdateRemediationInput } from "./audit.schema";
import { AuditFinding, PageTemplateType, RemediationStatus } from "./audit.types";

export class AuditService {
  /**
   * Initializes queue worker listener once per application lifecycle
   */
  public static initWorker(): void {
    const queue = getAuditQueue();
    queue.registerWorker(async (jobData) => {
      await AuditOrchestrator.executeAudit(jobData);
    });
  }

  /**
   * Validates target storefront URL, persists new audit, and enqueues job
   */
  public static async createAudit(input: CreateAuditInput) {
    const norm = UrlPolicyService.normalizeUrl(input.storeUrl);
    if (!norm.isValid || !norm.normalizedUrl || !norm.hostname) {
      throw new Error(norm.error || "Invalid storefront URL format.");
    }

    // SSRF Pre-validation
    const ssrfCheck = await UrlPolicyService.validateOutboundUrl(norm.normalizedUrl);
    if (!ssrfCheck.isSafe) {
      throw new Error(`SSRF Guard Violation: ${ssrfCheck.reason}`);
    }

    const audit = await prisma.audit.create({
      data: {
        storeUrl: norm.normalizedUrl,
        hostname: norm.hostname,
        maxPages: input.maxPages,
        deviceStrategy: input.deviceStrategy,
        runPageSpeed: input.runPageSpeed,
        status: "PENDING",
      },
    });

    // Enqueue background processing
    const queue = getAuditQueue();
    await queue.addAuditJob({
      auditId: audit.id,
      storeUrl: audit.storeUrl,
      maxPages: audit.maxPages,
      deviceStrategy: audit.deviceStrategy as "mobile" | "desktop",
      runPageSpeed: audit.runPageSpeed,
    });

    return audit;
  }

  /**
   * Retrieves full audit details including findings, page coverage, and PageSpeed
   */
  public static async getAudit(id: string) {
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        pages: {
          select: {
            id: true,
            url: true,
            path: true,
            template: true,
            statusCode: true,
            title: true,
            canonicalUrl: true,
            isIndexable: true,
            wordCount: true,
            crawledAt: true,
          },
        },
        findings: true,
        pageSpeedResults: true,
        remediations: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!audit) {
      return null;
    }

    // Count findings by severity
    const findingsSummary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const typedFindings: AuditFinding[] = audit.findings.map((f) => ({
      ...f,
      pageType: f.template as PageTemplateType,
      category: f.category as AuditFinding["category"],
      severity: f.severity as AuditFinding["severity"],
      confidence: f.confidence as AuditFinding["confidence"],
      status: f.status as RemediationStatus,
      affectedUrl: f.url,
      elementSelector: f.elementSelector ?? undefined,
      evidence: f.evidence ? JSON.parse(f.evidence) : undefined,
    }));

    for (const f of typedFindings) {
      if (f.severity in findingsSummary) {
        findingsSummary[f.severity]++;
      }
    }

    // Template breakdown aggregation
    const templateBreakdown = TemplateGrouper.group(
      audit.pages.map((p) => ({ url: p.url, template: p.template })),
      typedFindings
    );

    return {
      ...audit,
      findingsSummary,
      templateBreakdown,
      pageSpeed: audit.pageSpeedResults[0] || null,
    };
  }

  /**
   * Lists audits with summary statistics
   */
  public static async listAudits(limit = 20, offset = 0, hostname?: string) {
    const where = hostname ? { hostname: { contains: hostname } } : {};

    const [total, items] = await Promise.all([
      prisma.audit.count({ where }),
      prisma.audit.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          storeUrl: true,
          hostname: true,
          status: true,
          healthScore: true,
          techSeoScore: true,
          onPageScore: true,
          perfScore: true,
          pagesCrawled: true,
          findingsCount: true,
          deviceStrategy: true,
          createdAt: true,
          completedAt: true,
        },
      }),
    ]);

    return { total, items };
  }

  /**
   * Cancels an active audit
   */
  public static async cancelAudit(id: string) {
    const existing = await prisma.audit.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Audit not found");
    }

    if (["COMPLETED", "FAILED", "CANCELLED"].includes(existing.status)) {
      return existing;
    }

    return prisma.audit.update({
      where: { id },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });
  }

  /**
   * Updates finding remediation progress
   */
  public static async updateFindingRemediation(
    auditId: string,
    findingId: string,
    input: UpdateRemediationInput
  ) {
    const finding = await prisma.finding.findFirst({
      where: { id: findingId, auditId },
    });

    if (!finding) {
      throw new Error("Finding not found for this audit");
    }

    await prisma.finding.update({
      where: { id: findingId },
      data: { status: input.status },
    });

    const remediation = await prisma.remediation.create({
      data: {
        auditId,
        findingId,
        status: input.status,
        notes: input.notes,
      },
    });

    return remediation;
  }

  /**
   * Compares two audits to track progress over time
   */
  public static async compareAudits(baseAuditId: string, targetAuditId: string) {
    const [base, target] = await Promise.all([
      this.getAudit(baseAuditId),
      this.getAudit(targetAuditId),
    ]);

    if (!base || !target) {
      throw new Error("One or both audits could not be found");
    }

    // Score differences
    const scoreDiff = {
      health: (target.healthScore ?? 0) - (base.healthScore ?? 0),
      tech: (target.techSeoScore ?? 0) - (base.techSeoScore ?? 0),
      onPage: (target.onPageScore ?? 0) - (base.onPageScore ?? 0),
      perf: (target.perfScore ?? 0) - (base.perfScore ?? 0),
    };

    // Finding comparison (resolved vs newly introduced)
    const baseRuleKeys = new Set(base.findings.map((f) => `${f.ruleId}:${f.url}`));
    const targetRuleKeys = new Set(target.findings.map((f) => `${f.ruleId}:${f.url}`));

    const resolved = base.findings.filter((f) => !targetRuleKeys.has(`${f.ruleId}:${f.url}`));
    const newlyIntroduced = target.findings.filter((f) => !baseRuleKeys.has(`${f.ruleId}:${f.url}`));

    return {
      base: {
        id: base.id,
        createdAt: base.createdAt,
        healthScore: base.healthScore,
        findingsCount: base.findings.length,
      },
      target: {
        id: target.id,
        createdAt: target.createdAt,
        healthScore: target.healthScore,
        findingsCount: target.findings.length,
      },
      scoreDiff,
      resolvedCount: resolved.length,
      newCount: newlyIntroduced.length,
      resolvedSample: resolved.slice(0, 10),
      newSample: newlyIntroduced.slice(0, 10),
    };
  }
}

// Automatically ensure worker is bound on module load
AuditService.initWorker();
