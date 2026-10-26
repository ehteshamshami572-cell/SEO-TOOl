import { AuditFinding, ExtractedPageData } from "../audits/audit.types";
import { TechnicalSeoAuditor } from "./technical-seo.auditor";
import { OnPageSeoAuditor } from "./on-page-seo.auditor";
import { StructuredDataAuditor } from "./structured-data.auditor";
import { RobotsAnalysisResult } from "../crawler/robots.service";
import { SitemapDiscoveryResult } from "../crawler/sitemap.service";

export class SeoOrchestrator {
  /**
   * Evaluates all SEO rules for a crawled page and site-level results
   */
  public static auditPage(page: ExtractedPageData): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // 1. Technical SEO checks
    const techFindings = TechnicalSeoAuditor.auditPage(page);
    findings.push(...techFindings);

    // 2. On-Page SEO checks
    const onPageFindings = OnPageSeoAuditor.auditPage(page);
    findings.push(...onPageFindings);

    // 3. Structured Data checks
    const schemaFindings = StructuredDataAuditor.auditPage(page);
    findings.push(...schemaFindings);

    return findings;
  }

  /**
   * Evaluates site-level rules (robots.txt, sitemaps)
   */
  public static auditSite(
    targetUrl: string,
    robotsResult?: RobotsAnalysisResult,
    sitemapResult?: SitemapDiscoveryResult
  ): AuditFinding[] {
    return TechnicalSeoAuditor.auditSiteLevel(targetUrl, robotsResult, sitemapResult);
  }
}
