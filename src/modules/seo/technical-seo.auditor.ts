import { AuditFinding, ExtractedPageData } from "../audits/audit.types";
import { RobotsAnalysisResult } from "../crawler/robots.service";
import { SitemapDiscoveryResult } from "../crawler/sitemap.service";

export class TechnicalSeoAuditor {
  /**
   * Audits site-wide technical configurations (robots.txt, sitemaps)
   */
  public static auditSiteLevel(
    targetUrl: string,
    robotsResult?: RobotsAnalysisResult,
    sitemapResult?: SitemapDiscoveryResult
  ): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // 1. Robots.txt check
    if (robotsResult) {
      if (!robotsResult.isAvailable) {
        findings.push({
          ruleId: "TECH-ROBOTS-MISSING",
          category: "technical_seo",
          severity: "medium",
          title: "Missing or Unreachable robots.txt",
          description: `The storefront returned HTTP ${robotsResult.statusCode} when requesting /robots.txt.`,
          impact: "Search engine crawlers lack clear crawling boundaries and sitemap pointers.",
          remediation: "Ensure Shopify robots.txt is accessible and not blocked by custom app proxies or CDN rules.",
          scoreImpact: 5,
          affectedUrl: `${new URL(targetUrl).origin}/robots.txt`,
          confidence: "high",
          evidence: { statusCode: robotsResult.statusCode },
        });
      } else if (robotsResult.disallowAll) {
        findings.push({
          ruleId: "TECH-ROBOTS-DISALLOW-ALL",
          category: "technical_seo",
          severity: "critical",
          title: "robots.txt Disallows Crawling the Entire Storefront",
          description: "robots.txt contains 'Disallow: /' directive that blocks search engines from crawling all pages.",
          impact: "Google and other search engines are instructed not to crawl your store, severely impacting organic indexing.",
          remediation: "Review Shopify theme or app robots.txt customizations and remove the global disallow directive.",
          scoreImpact: 25,
          affectedUrl: `${new URL(targetUrl).origin}/robots.txt`,
          confidence: "high",
          evidence: { snippet: robotsResult.rawText.slice(0, 300) },
        });
      }
    }

    // 2. Sitemap checks
    if (sitemapResult) {
      if (sitemapResult.sitemapsFound.length === 0 && sitemapResult.discoveredUrls.length === 0) {
        findings.push({
          ruleId: "TECH-SITEMAP-MISSING",
          category: "technical_seo",
          severity: "high",
          title: "No XML Sitemap Discovered",
          description: "No XML sitemaps were declared in robots.txt or found at standard location /sitemap.xml.",
          impact: "Search engines may take longer to discover new products and updated collection URLs.",
          remediation: "Verify that Shopify's default /sitemap.xml endpoint is reachable and submitted in Google Search Console.",
          scoreImpact: 10,
          affectedUrl: `${new URL(targetUrl).origin}/sitemap.xml`,
          confidence: "medium",
        });
      } else if (sitemapResult.isMalformed) {
        findings.push({
          ruleId: "TECH-SITEMAP-MALFORMED",
          category: "technical_seo",
          severity: "high",
          title: "Malformed XML Sitemap Detected",
          description: "XML parsing errors occurred while evaluating discovered sitemap documents.",
          impact: "Search engine parsers may fail to process product lists and discard URL entries.",
          remediation: "Inspect sitemap XML output for unescaped ampersands or malformed XML tags.",
          scoreImpact: 8,
          affectedUrl: sitemapResult.sitemapsFound[0] || `${new URL(targetUrl).origin}/sitemap.xml`,
          confidence: "high",
          evidence: { errors: sitemapResult.errors },
        });
      }
    }

    return findings;
  }

  /**
   * Audits individual page technical signals (status codes, canonicals, redirects, noindex)
   */
  public static auditPage(page: ExtractedPageData): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // 1. Status Code Errors
    if (page.statusCode >= 500) {
      findings.push({
        ruleId: "TECH-HTTP-5XX",
        category: "technical_seo",
        severity: "critical",
        title: `Internal Server Error (HTTP ${page.statusCode})`,
        description: `Page returned server error status code ${page.statusCode}.`,
        impact: "Users and search crawlers encounter broken error pages, hurting rankings and bounce rates.",
        remediation: "Check Shopify Liquid logs or third-party app scripts for server-side exceptions.",
        scoreImpact: 20,
        affectedUrl: page.requestedUrl,
        pageType: page.template,
        confidence: "high",
        evidence: { statusCode: page.statusCode },
      });
      return findings; // Skip further on-page checks for crashed pages
    }

    if (page.statusCode >= 400) {
      findings.push({
        ruleId: "TECH-HTTP-4XX",
        category: "technical_seo",
        severity: "high",
        title: `Page Not Found or Client Error (HTTP ${page.statusCode})`,
        description: `Page returned client error HTTP ${page.statusCode}.`,
        impact: "Search engines cannot index 4xx pages and internal broken links waste crawl equity.",
        remediation: "Update internal links pointing to this URL or configure a 301 redirect in Shopify Admin > Navigation > URL Redirects.",
        scoreImpact: 12,
        affectedUrl: page.requestedUrl,
        pageType: page.template,
        confidence: "high",
        evidence: { statusCode: page.statusCode },
      });
      return findings;
    }

    // 2. Canonical Tag Validation
    if (!page.canonicalUrl) {
      findings.push({
        ruleId: "TECH-CANONICAL-MISSING",
        category: "technical_seo",
        severity: "high",
        title: "Missing Canonical Tag",
        description: "The page does not declare a <link rel='canonical'> URL in its HTML <head>.",
        impact: "Without a canonical tag, URL parameters, tracking codes, and pagination can cause duplicate content issues.",
        remediation: "Add `<link rel=\"canonical\" href=\"{{ canonical_url }}\">` inside `<head>` in your Shopify theme.liquid.",
        scoreImpact: 8,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: "head",
        confidence: "high",
      });
    } else {
      // Normalize both to compare
      const pageNorm = page.finalUrl.replace(/\/+$/, "").toLowerCase();
      const canonicalNorm = page.canonicalUrl.replace(/\/+$/, "").toLowerCase();

      // Check if canonical targets a completely different domain or path
      if (pageNorm !== canonicalNorm) {
        // Informational or medium severity depending on template
        findings.push({
          ruleId: "TECH-CANONICAL-MISMATCH",
          category: "technical_seo",
          severity: "medium",
          title: "Canonical URL Differs from Page URL",
          description: `The page declares a canonical URL pointing to '${page.canonicalUrl}'.`,
          impact: "Search engines will index the canonical target instead of this URL. Common for variant and collection-filtered URLs.",
          remediation: "Ensure canonical destination is intended and not canonicalizing main products to collections or vice-versa.",
          scoreImpact: 4,
          affectedUrl: page.finalUrl,
          pageType: page.template,
          elementSelector: 'link[rel="canonical"]',
          confidence: "medium",
          evidence: {
            pageUrl: page.finalUrl,
            canonicalUrl: page.canonicalUrl,
          },
        });
      }
    }

    // 3. Noindex Directive Check
    if (page.robotsDirectives && page.robotsDirectives.includes("noindex")) {
      findings.push({
        ruleId: "TECH-NOINDEX-DETECTED",
        category: "technical_seo",
        severity: "info",
        title: "Page Excluded from Search Index (noindex)",
        description: "Meta robots or X-Robots-Tag contains the 'noindex' directive.",
        impact: "Search engines will not index this page or show it in search results.",
        remediation: "Verify that this page was intentionally excluded (e.g. cart, checkout, draft page).",
        scoreImpact: 0,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: 'meta[name="robots"]',
        confidence: "high",
        evidence: { directives: page.robotsDirectives },
      });
    }

    return findings;
  }
}
