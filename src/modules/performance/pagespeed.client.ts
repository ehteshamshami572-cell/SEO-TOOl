import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { DeviceStrategy } from "../audits/audit.types";

export interface PageSpeedResult {
  isAvailable: boolean;
  strategy: DeviceStrategy;
  url: string;
  performanceScore?: number;
  labMetrics?: {
    fcpMs: number;
    lcpMs: number;
    cls: number;
    tbtMs: number;
    speedIndexMs: number;
  };
  fieldMetrics?: {
    lcpMs?: number;
    cls?: number;
    inpMs?: number;
  };
  diagnostics?: {
    thirdPartyScriptsCount: number;
    thirdPartyTransferBytes: number;
    renderBlockingResourcesCount: number;
    unusedCssOpportunitiesCount: number;
  };
  errorReason?: string;
  rawJson?: Record<string, unknown>;
  fetchedAt: string;
}

export class PageSpeedClient {
  private static cache = new Map<string, { data: PageSpeedResult; expiresAt: number }>();
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Fetches Google PageSpeed Insights data with caching and exponential backoff
   */
  public static async analyze(
    url: string,
    strategy: DeviceStrategy = "mobile"
  ): Promise<PageSpeedResult> {
    const cacheKey = `${strategy}:${url}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const apiKey = env.GOOGLE_PAGESPEED_API_KEY;
    if (!apiKey) {
      const unavailableResult: PageSpeedResult = {
        isAvailable: false,
        strategy,
        url,
        errorReason:
          "Google PageSpeed Insights API key is not configured. Set GOOGLE_PAGESPEED_API_KEY in environment variables.",
        fetchedAt: new Date().toISOString(),
      };
      return unavailableResult;
    }

    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", strategy);
    endpoint.searchParams.set("category", "PERFORMANCE");
    endpoint.searchParams.set("key", apiKey);

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(endpoint.toString(), {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.status === 429) {
          retries++;
          if (retries <= maxRetries) {
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 500;
            logger.warn("PageSpeed API quota hit (429), retrying with backoff", { delay, url });
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          return {
            isAvailable: false,
            strategy,
            url,
            errorReason: "Google PageSpeed Insights quota exceeded (HTTP 429).",
            fetchedAt: new Date().toISOString(),
          };
        }

        if (!response.ok) {
          const errText = await response.text();
          logger.warn("PageSpeed API error response", { status: response.status, body: errText });
          return {
            isAvailable: false,
            strategy,
            url,
            errorReason: `Google PageSpeed API returned HTTP ${response.status}.`,
            fetchedAt: new Date().toISOString(),
          };
        }

        const data = await response.json();
        const lighthouse = data.lighthouseResult;
        if (!lighthouse) {
          return {
            isAvailable: false,
            strategy,
            url,
            errorReason: "Incomplete Lighthouse result returned by Google API.",
            fetchedAt: new Date().toISOString(),
          };
        }

        // Performance Score (0-100)
        const perfScore = lighthouse.categories?.performance?.score
          ? Math.round(lighthouse.categories.performance.score * 100)
          : undefined;

        // Lab Metrics
        const audits = lighthouse.audits || {};
        const fcpMs = audits["first-contentful-paint"]?.numericValue;
        const lcpMs = audits["largest-contentful-paint"]?.numericValue;
        const cls = audits["cumulative-layout-shift"]?.numericValue;
        const tbtMs = audits["total-blocking-time"]?.numericValue;
        const speedIndexMs = audits["speed-index"]?.numericValue;

        // Field Metrics (Chrome UX Report)
        const loadingExp = data.loadingExperience?.metrics || {};
        const fieldLcpMs = loadingExp.LARGEST_CONTENTFUL_PAINT_MS?.percentile;
        const fieldCls = loadingExp.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile
          ? loadingExp.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
          : undefined;
        const fieldInpMs = loadingExp.INTERACTION_TO_NEXT_PAINT?.percentile;

        // Diagnostics
        const thirdPartySummary = audits["third-party-summary"]?.details?.items || [];
        const thirdPartyScriptsCount = thirdPartySummary.length;
        const thirdPartyTransferBytes = thirdPartySummary.reduce(
          (acc: number, item: { transferSize?: number }) => acc + (item.transferSize || 0),
          0
        );

        const renderBlockingItems = audits["render-blocking-resources"]?.details?.items || [];
        const unusedCssItems = audits["unused-css-rules"]?.details?.items || [];

        const result: PageSpeedResult = {
          isAvailable: true,
          strategy,
          url,
          performanceScore: perfScore,
          labMetrics: {
            fcpMs: fcpMs !== undefined ? Math.round(fcpMs) : 0,
            lcpMs: lcpMs !== undefined ? Math.round(lcpMs) : 0,
            cls: cls !== undefined ? Math.round(cls * 1000) / 1000 : 0,
            tbtMs: tbtMs !== undefined ? Math.round(tbtMs) : 0,
            speedIndexMs: speedIndexMs !== undefined ? Math.round(speedIndexMs) : 0,
          },
          fieldMetrics: {
            lcpMs: fieldLcpMs,
            cls: fieldCls,
            inpMs: fieldInpMs,
          },
          diagnostics: {
            thirdPartyScriptsCount,
            thirdPartyTransferBytes,
            renderBlockingResourcesCount: renderBlockingItems.length,
            unusedCssOpportunitiesCount: unusedCssItems.length,
          },
          fetchedAt: new Date().toISOString(),
        };

        this.cache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });

        return result;
      } catch (err) {
        return {
          isAvailable: false,
          strategy,
          url,
          errorReason: `Network error calling PageSpeed API: ${err instanceof Error ? err.message : String(err)}`,
          fetchedAt: new Date().toISOString(),
        };
      }
    }

    return {
      isAvailable: false,
      strategy,
      url,
      errorReason: "Failed to fetch PageSpeed insights after retries.",
      fetchedAt: new Date().toISOString(),
    };
  }
}
