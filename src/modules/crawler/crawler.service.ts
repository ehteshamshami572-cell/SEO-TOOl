import { FetchService } from "./fetch.service";
import { RobotsService, RobotsAnalysisResult } from "./robots.service";
import { SitemapService, SitemapDiscoveryResult } from "./sitemap.service";
import { HtmlExtractionService } from "./html-extraction.service";
import { UrlPolicyService } from "./url-policy";
import { SeoOrchestrator } from "../seo/seo.orchestrator";
import {
  AuditFinding,
  ExtractedPageData,
  PageTemplateType,
} from "../audits/audit.types";
import { logger } from "@/lib/logger";

export interface CrawlEngineOptions {
  storeUrl: string;
  maxPages: number;
  userAgent?: string;
  onPageCrawled?: (page: ExtractedPageData, findings: AuditFinding[], totalDiscovered: number) => Promise<void>;
  isCancelled?: () => boolean;
}

export interface CrawlEngineResult {
  storeOrigin: string;
  baseHostname: string;
  robotsResult?: RobotsAnalysisResult;
  sitemapResult?: SitemapDiscoveryResult;
  pages: ExtractedPageData[];
  findings: AuditFinding[];
  totalDiscovered: number;
}

export class CrawlerService {
  private fetchService: FetchService;
  private robotsService: RobotsService;
  private sitemapService: SitemapService;

  constructor() {
    this.fetchService = new FetchService();
    this.robotsService = new RobotsService(this.fetchService);
    this.sitemapService = new SitemapService(this.fetchService);
  }

  /**
   * Executes the complete discovery and crawling process for a storefront
   */
  public async crawlStore(options: CrawlEngineOptions): Promise<CrawlEngineResult> {
    const norm = UrlPolicyService.normalizeUrl(options.storeUrl);
    if (!norm.isValid || !norm.normalizedUrl || !norm.hostname) {
      throw new Error(`Invalid target storefront URL: ${norm.error || options.storeUrl}`);
    }

    const storeOrigin = new URL(norm.normalizedUrl).origin;
    const baseHostname = norm.hostname;
    const userAgent = options.userAgent || "Mozilla/5.0 (compatible; ShopifySeoAuditorBot/1.0; +https://example.com/bot)";
    const maxPages = options.maxPages;

    const allFindings: AuditFinding[] = [];
    const crawledPages: ExtractedPageData[] = [];
    const discoveredUrls = new Set<string>();
    const queuedUrls: string[] = [];

    // Helper to queue URLs safely
    const enqueueUrl = (candidateUrl: string) => {
      const candidateNorm = UrlPolicyService.normalizeUrl(candidateUrl, storeOrigin);
      if (
        candidateNorm.isValid &&
        candidateNorm.normalizedUrl &&
        UrlPolicyService.isSameHost(candidateNorm.normalizedUrl, baseHostname)
      ) {
        if (!discoveredUrls.has(candidateNorm.normalizedUrl)) {
          discoveredUrls.add(candidateNorm.normalizedUrl);
          queuedUrls.push(candidateNorm.normalizedUrl);
        }
      }
    };

    // Always start with the homepage / root URL
    enqueueUrl(storeOrigin);

    // 1. Fetch & analyze robots.txt
    logger.info("Evaluating robots.txt", { storeOrigin });
    const robotsResult = await this.robotsService.analyzeRobots(storeOrigin, userAgent);

    // 2. Discover XML Sitemaps
    logger.info("Discovering XML sitemaps", { storeOrigin });
    const sitemapResult = await this.sitemapService.discoverSitemapUrls(
      storeOrigin,
      robotsResult.sitemaps,
      maxPages
    );

    // Queue discovered sitemap URLs
    for (const url of sitemapResult.discoveredUrls) {
      enqueueUrl(url);
    }

    // 3. Site-level SEO Audits (Robots & Sitemaps)
    const siteFindings = SeoOrchestrator.auditSite(storeOrigin, robotsResult, sitemapResult);
    allFindings.push(...siteFindings);

    // 4. Crawl discovered pages up to maxPages budget
    const visited = new Set<string>();

    while (queuedUrls.length > 0 && crawledPages.length < maxPages) {
      if (options.isCancelled && options.isCancelled()) {
        logger.info("Crawl aborted by cancellation signal", { storeOrigin });
        break;
      }

      const currentUrl = queuedUrls.shift()!;
      if (visited.has(currentUrl)) {
        continue;
      }
      visited.add(currentUrl);

      // Check robots.txt permissions
      if (!robotsResult.isCrawlerAllowed(currentUrl)) {
        logger.info("Skipping URL disallowed by robots.txt", { currentUrl });
        continue;
      }

      logger.info(`Crawling page [${crawledPages.length + 1}/${maxPages}]`, { currentUrl });

      const fetchResult = await this.fetchService.fetchUrl(currentUrl, {
        userAgent,
        timeoutMs: 10000,
      });

      // Parse HTML signals
      const pageData = HtmlExtractionService.extract(
        currentUrl,
        fetchResult.finalUrl,
        fetchResult.status,
        fetchResult.headers,
        fetchResult.bodyText,
        fetchResult.contentLengthBytes
      );

      if (!fetchResult.ok && fetchResult.errorMessage) {
        pageData.crawlError = fetchResult.errorMessage;
      }

      // Execute on-page and technical SEO checks
      const pageFindings = SeoOrchestrator.auditPage(pageData);
      allFindings.push(...pageFindings);
      crawledPages.push(pageData);

      // Queue internal links discovered on this page for deeper crawl
      for (const link of pageData.links) {
        if (link.isInternal && discoveredUrls.size < maxPages * 3) {
          enqueueUrl(link.href);
        }
      }

      // Notify progress callback if provided
      if (options.onPageCrawled) {
        await options.onPageCrawled(pageData, pageFindings, discoveredUrls.size);
      }
    }

    return {
      storeOrigin,
      baseHostname,
      robotsResult,
      sitemapResult,
      pages: crawledPages,
      findings: allFindings,
      totalDiscovered: discoveredUrls.size,
    };
  }
}
