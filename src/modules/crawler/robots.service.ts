import robotsParser from "robots-parser";
import { FetchService } from "./fetch.service";
import { logger } from "@/lib/logger";

export interface RobotsAnalysisResult {
  isAvailable: boolean;
  statusCode: number;
  rawText: string;
  sitemaps: string[];
  disallowAll: boolean;
  isCrawlerAllowed: (url: string) => boolean;
  warnings: string[];
}

export class RobotsService {
  private fetchService: FetchService;
  private cache = new Map<string, RobotsAnalysisResult>();

  constructor(fetchService?: FetchService) {
    this.fetchService = fetchService ?? new FetchService();
  }

  /**
   * Fetches and analyzes /robots.txt for a given store origin
   */
  public async analyzeRobots(
    storeOrigin: string,
    userAgent: string
  ): Promise<RobotsAnalysisResult> {
    const origin = storeOrigin.replace(/\/+$/, "");
    if (this.cache.has(origin)) {
      return this.cache.get(origin)!;
    }

    const robotsUrl = `${origin}/robots.txt`;
    const fetchRes = await this.fetchService.fetchUrl(robotsUrl, {
      timeoutMs: 8000,
      userAgent,
    });

    const warnings: string[] = [];

    if (!fetchRes.ok) {
      warnings.push(
        `robots.txt could not be retrieved: HTTP ${fetchRes.status} (${fetchRes.statusText})`
      );
      const fallbackResult: RobotsAnalysisResult = {
        isAvailable: false,
        statusCode: fetchRes.status,
        rawText: "",
        sitemaps: [],
        disallowAll: false,
        isCrawlerAllowed: () => true, // If robots.txt returns 404, crawling is permitted
        warnings,
      };
      this.cache.set(origin, fallbackResult);
      return fallbackResult;
    }

    const rawText = fetchRes.bodyText;
    let parser: ReturnType<typeof robotsParser>;

    try {
      parser = robotsParser(robotsUrl, rawText);
    } catch (err) {
      warnings.push(`Failed to parse robots.txt format: ${err instanceof Error ? err.message : String(err)}`);
      parser = robotsParser(robotsUrl, "");
    }

    // Check if crawling root is disallowed
    const rootAllowed = parser.isAllowed(`${origin}/`, userAgent);
    const disallowAll = rootAllowed === false;

    // Extract sitemaps declared in robots.txt
    const declaredSitemaps = parser.getSitemaps();

    const result: RobotsAnalysisResult = {
      isAvailable: true,
      statusCode: fetchRes.status,
      rawText,
      sitemaps: declaredSitemaps,
      disallowAll,
      isCrawlerAllowed: (url: string) => {
        const allowed = parser.isAllowed(url, userAgent);
        // robotsParser returns undefined if no matching directive
        return allowed !== false;
      },
      warnings,
    };

    this.cache.set(origin, result);
    return result;
  }
}
