import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { CrawlerService } from "../crawler/crawler.service";
import { PageSpeedClient } from "../performance/pagespeed.client";
import { PerformanceService } from "../performance/performance.service";
import { FindingNormalizer } from "../findings/finding-normalizer";
import { AuditFinding, AuditJobData, ExtractedPageData } from "./audit.types";

export class AuditOrchestrator {
  /**
   * Main audit execution lifecycle
   */
  public static async executeAudit(data: AuditJobData): Promise<void> {
    const { auditId, storeUrl, maxPages, deviceStrategy, runPageSpeed } = data;

    logger.info("Audit execution initiated", { auditId, storeUrl });

    // Step 1: Update status to DISCOVERING
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "DISCOVERING",
        startedAt: new Date(),
      },
    });

    const crawler = new CrawlerService();
    let isCancelled = false;

    // Check cancellation status helper
    const checkCancelled = async () => {
      const current = await prisma.audit.findUnique({
        where: { id: auditId },
        select: { status: true },
      });
      if (current?.status === "CANCELLED") {
        isCancelled = true;
        return true;
      }
      return false;
    };

    try {
      // Step 2: CRAWLING phase
      await prisma.audit.update({
        where: { id: auditId },
        data: { status: "CRAWLING" },
      });

      const crawlResult = await crawler.crawlStore({
        storeUrl,
        maxPages,
        isCancelled: () => isCancelled,
        onPageCrawled: async (pageData, pageFindings, totalDiscovered) => {
          await checkCancelled();
          if (isCancelled) return;

          // Save page to database
          try {
            await prisma.discoveredPage.create({
              data: {
                auditId,
                url: pageData.finalUrl,
                path: new URL(pageData.finalUrl).pathname,
                template: pageData.template,
                statusCode: pageData.statusCode,
                title: pageData.title,
                metaDescription: pageData.metaDescription,
                canonicalUrl: pageData.canonicalUrl,
                wordCount: pageData.wordCount,
                h1Count: pageData.headings.h1.length,
                imageCount: pageData.images.length,
                imagesWithoutAlt: pageData.images.filter((img) => img.alt === undefined).length,
                internalLinksCount: pageData.links.filter((l) => l.isInternal).length,
                externalLinksCount: pageData.links.filter((l) => !l.isInternal).length,
                isIndexable: !pageData.robotsDirectives?.includes("noindex"),
                crawlError: pageData.crawlError,
                crawledAt: new Date(),
              },
            });

            // Update live audit counters
            await prisma.audit.update({
              where: { id: auditId },
              data: {
                pagesDiscovered: totalDiscovered,
                pagesCrawled: { increment: 1 },
                findingsCount: { increment: pageFindings.length },
                pagesFailed: pageData.statusCode >= 400 ? { increment: 1 } : undefined,
              },
            });
          } catch (dbErr) {
            logger.warn("Error recording crawled page to database", { url: pageData.finalUrl }, dbErr);
          }
        },
      });

      if (isCancelled) {
        logger.info("Audit was cancelled, skipping analysis", { auditId });
        return;
      }

      // Step 3: ANALYZING phase (PageSpeed + Diagnostics)
      await prisma.audit.update({
        where: { id: auditId },
        data: { status: "ANALYZING" },
      });

      const allFindings: AuditFinding[] = [...crawlResult.findings];
      let pageSpeedScore: number | undefined;

      if (runPageSpeed) {
        logger.info("Executing Google PageSpeed evaluation on storefront homepage", { storeUrl });
        const psiResult = await PageSpeedClient.analyze(storeUrl, deviceStrategy);

        if (psiResult.isAvailable && psiResult.labMetrics) {
          pageSpeedScore = psiResult.performanceScore;

          // Record PageSpeed metric to DB
          await prisma.pageSpeedMetric.create({
            data: {
              auditId,
              url: storeUrl,
              strategy: deviceStrategy,
              performanceScore: psiResult.performanceScore,
              fcpMs: psiResult.labMetrics.fcpMs,
              lcpMs: psiResult.labMetrics.lcpMs,
              cls: psiResult.labMetrics.cls,
              tbtMs: psiResult.labMetrics.tbtMs,
              speedIndexMs: psiResult.labMetrics.speedIndexMs,
              fieldLcpMs: psiResult.fieldMetrics?.lcpMs,
              fieldCls: psiResult.fieldMetrics?.cls,
              fieldInpMs: psiResult.fieldMetrics?.inpMs,
              thirdPartyScriptsCount: psiResult.diagnostics?.thirdPartyScriptsCount || 0,
              thirdPartyTransferBytes: psiResult.diagnostics?.thirdPartyTransferBytes || 0,
              rawDiagnostics: JSON.stringify(psiResult.diagnostics || {}),
            },
          });

          // Generate performance findings
          const perfFindings = PerformanceService.generateFindings(psiResult);
          allFindings.push(...perfFindings);
        } else if (psiResult.errorReason) {
          logger.warn("PageSpeed Insights skipped or unavailable", { reason: psiResult.errorReason });
        }
      }

      // Step 4: FINALIZING phase (Deduplication, Scoring, Bulk Persistence)
      await prisma.audit.update({
        where: { id: auditId },
        data: { status: "FINALIZING" },
      });

      // Deduplicate findings
      const deduplicatedFindings = FindingNormalizer.deduplicate(allFindings);

      // Compute scores
      const scores = FindingNormalizer.calculateScores(deduplicatedFindings, !!pageSpeedScore);

      // Fetch saved pages to link findings to page IDs
      const savedPages = await prisma.discoveredPage.findMany({
        where: { auditId },
        select: { id: true, url: true },
      });
      const pageMap = new Map<string, string>();
      savedPages.forEach((p) => pageMap.set(p.url, p.id));

      // Persist findings in chunks
      for (const f of deduplicatedFindings) {
        await prisma.finding.create({
          data: {
            auditId,
            pageId: pageMap.get(f.affectedUrl),
            url: f.affectedUrl,
            template: f.pageType || "unknown",
            ruleId: f.ruleId,
            category: f.category,
            severity: f.severity,
            title: f.title,
            description: f.description,
            impact: f.impact,
            remediation: f.remediation,
            scoreImpact: f.scoreImpact,
            elementSelector: f.elementSelector,
            evidence: f.evidence ? JSON.stringify(f.evidence) : null,
            confidence: f.confidence,
            status: "open",
          },
        });
      }

      // Final status check
      const failedCount = crawlResult.pages.filter((p) => p.statusCode >= 400).length;
      const finalStatus = failedCount > 0 && failedCount === crawlResult.pages.length ? "FAILED" : failedCount > 0 ? "PARTIAL" : "COMPLETED";

      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: finalStatus,
          healthScore: scores.healthScore,
          techSeoScore: scores.techSeoScore,
          onPageScore: scores.onPageScore,
          perfScore: scores.perfScore ?? pageSpeedScore,
          findingsCount: deduplicatedFindings.length,
          completedAt: new Date(),
        },
      });

      logger.info("Audit execution completed successfully", {
        auditId,
        status: finalStatus,
        findingsCount: deduplicatedFindings.length,
        healthScore: scores.healthScore,
      });
    } catch (err) {
      logger.error("Audit execution encountered fatal error", { auditId }, err);
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : String(err),
          completedAt: new Date(),
        },
      });
    }
  }
}
