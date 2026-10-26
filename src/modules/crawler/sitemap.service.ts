import { XMLParser } from "fast-xml-parser";
import { FetchService } from "./fetch.service";
import { UrlPolicyService } from "./url-policy";
import { logger } from "@/lib/logger";

export interface SitemapDiscoveryResult {
  sitemapsFound: string[];
  discoveredUrls: string[];
  isMalformed: boolean;
  errors: string[];
}

export class SitemapService {
  private fetchService: FetchService;
  private parser: XMLParser;

  constructor(fetchService?: FetchService) {
    this.fetchService = fetchService ?? new FetchService();
    this.parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      trimValues: true,
    });
  }

  /**
   * Discovers and parses sitemaps up to maxPages limit
   */
  public async discoverSitemapUrls(
    storeOrigin: string,
    candidateSitemaps: string[],
    maxUrls: number
  ): Promise<SitemapDiscoveryResult> {
    const origin = storeOrigin.replace(/\/+$/, "");
    const baseHostname = new URL(origin).hostname;

    // Prioritize candidates, add standard /sitemap.xml if not present
    const sitemapsToVisit: string[] = [...candidateSitemaps];
    const defaultSitemap = `${origin}/sitemap.xml`;
    if (!sitemapsToVisit.includes(defaultSitemap)) {
      sitemapsToVisit.push(defaultSitemap);
    }

    const processedSitemaps = new Set<string>();
    const discoveredUrls = new Set<string>();
    const errors: string[] = [];
    let isMalformed = false;

    for (let depth = 0; depth < 5; depth++) {
      if (sitemapsToVisit.length === 0 || discoveredUrls.size >= maxUrls) {
        break;
      }

      const sitemapUrl = sitemapsToVisit.shift()!;
      if (processedSitemaps.has(sitemapUrl)) {
        continue;
      }
      processedSitemaps.add(sitemapUrl);

      const fetchRes = await this.fetchService.fetchUrl(sitemapUrl, {
        timeoutMs: 8000,
      });

      if (!fetchRes.ok || !fetchRes.bodyText) {
        errors.push(`Failed to fetch sitemap ${sitemapUrl}: HTTP ${fetchRes.status}`);
        continue;
      }

      try {
        const parsed = this.parser.parse(fetchRes.bodyText);

        // Case 1: Sitemap Index (<sitemapindex><sitemap><loc>...</loc></sitemap></sitemapindex>)
        if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
          const sitemapNodes = Array.isArray(parsed.sitemapindex.sitemap)
            ? parsed.sitemapindex.sitemap
            : [parsed.sitemapindex.sitemap];

          for (const node of sitemapNodes) {
            const childLoc = node.loc ? String(node.loc).trim() : null;
            if (childLoc && !processedSitemaps.has(childLoc)) {
              // Ensure child sitemap belongs to same store host
              if (UrlPolicyService.isSameHost(childLoc, baseHostname)) {
                sitemapsToVisit.push(childLoc);
              }
            }
          }
        }

        // Case 2: URL Set (<urlset><url><loc>...</loc></url></urlset>)
        if (parsed.urlset && parsed.urlset.url) {
          const urlNodes = Array.isArray(parsed.urlset.url)
            ? parsed.urlset.url
            : [parsed.urlset.url];

          for (const node of urlNodes) {
            if (discoveredUrls.size >= maxUrls) break;
            const loc = node.loc ? String(node.loc).trim() : null;
            if (loc) {
              const norm = UrlPolicyService.normalizeUrl(loc, origin);
              if (norm.isValid && norm.normalizedUrl && UrlPolicyService.isSameHost(norm.normalizedUrl, baseHostname)) {
                discoveredUrls.add(norm.normalizedUrl);
              }
            }
          }
        }
      } catch (err) {
        isMalformed = true;
        errors.push(
          `XML parsing error for sitemap ${sitemapUrl}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return {
      sitemapsFound: Array.from(processedSitemaps),
      discoveredUrls: Array.from(discoveredUrls),
      isMalformed,
      errors,
    };
  }
}
