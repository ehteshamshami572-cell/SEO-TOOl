import * as cheerio from "cheerio";
import { ExtractedPageData, PageTemplateType } from "../audits/audit.types";
import { UrlPolicyService } from "./url-policy";
import { TemplateClassifier } from "../templates/template-classifier";

export class HtmlExtractionService {
  /**
   * Parses raw HTML into normalized structured page audit signals
   */
  public static extract(
    requestedUrl: string,
    finalUrl: string,
    statusCode: number,
    headers: Record<string, string>,
    htmlBody: string,
    contentLengthBytes: number
  ): ExtractedPageData {
    const $ = cheerio.load(htmlBody || "");
    const baseHostname = new URL(finalUrl).hostname;

    // Detect challenges or access denied
    const bodyTextLower = (htmlBody || "").toLowerCase();
    const isAccessDeniedOrChallenge =
      statusCode === 403 ||
      bodyTextLower.includes("cloudflare") && bodyTextLower.includes("ray id") ||
      bodyTextLower.includes("access denied") ||
      bodyTextLower.includes("please verify you are a human");

    // Title
    const title = $("title").first().text().trim() || undefined;

    // Meta Description
    const metaDescription =
      $('meta[name="description" i]').attr("content")?.trim() || undefined;

    // Canonical URL
    const canonicalRaw = $('link[rel="canonical" i]').attr("href")?.trim();
    let canonicalUrl: string | undefined;
    if (canonicalRaw) {
      const normCanonical = UrlPolicyService.normalizeUrl(canonicalRaw, finalUrl);
      if (normCanonical.isValid) {
        canonicalUrl = normCanonical.normalizedUrl;
      }
    }

    // Meta Robots Directives
    const robotsDirectives: string[] = [];
    $('meta[name="robots" i]').each((_, el) => {
      const content = $(el).attr("content");
      if (content) {
        content
          .split(",")
          .map((d) => d.trim().toLowerCase())
          .forEach((d) => robotsDirectives.push(d));
      }
    });
    // Check X-Robots-Tag in HTTP headers
    if (headers["x-robots-tag"]) {
      headers["x-robots-tag"]
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .forEach((d) => robotsDirectives.push(d));
    }

    // Headings H1-H6
    const headings = {
      h1: $("h1")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
      h2: $("h2")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
      h3: $("h3")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
      h4: $("h4")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
      h5: $("h5")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
      h6: $("h6")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
    };

    // Images
    const images: ExtractedPageData["images"] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src) {
        const alt = $(el).attr("alt");
        const width = parseInt($(el).attr("width") || "", 10);
        const height = parseInt($(el).attr("height") || "", 10);
        const loading = $(el).attr("loading");
        images.push({
          src,
          alt: alt !== undefined ? alt.trim() : undefined,
          width: isNaN(width) ? undefined : width,
          height: isNaN(height) ? undefined : height,
          loading,
        });
      }
    });

    // Links (internal vs external)
    const links: ExtractedPageData["links"] = [];
    $("a[href]").each((_, el) => {
      const hrefRaw = $(el).attr("href")?.trim();
      if (!hrefRaw || hrefRaw.startsWith("#") || hrefRaw.startsWith("javascript:") || hrefRaw.startsWith("mailto:") || hrefRaw.startsWith("tel:")) {
        return;
      }
      const norm = UrlPolicyService.normalizeUrl(hrefRaw, finalUrl);
      if (norm.isValid && norm.normalizedUrl) {
        const isInternal = UrlPolicyService.isSameHost(norm.normalizedUrl, baseHostname);
        links.push({
          href: norm.normalizedUrl,
          text: $(el).text().trim().replace(/\s+/g, " "),
          isInternal,
          rel: $(el).attr("rel"),
        });
      }
    });

    // Open Graph Metadata
    const openGraph: Record<string, string> = {};
    $('meta[property^="og:" i]').each((_, el) => {
      const prop = $(el).attr("property")?.toLowerCase();
      const content = $(el).attr("content");
      if (prop && content) {
        openGraph[prop] = content.trim();
      }
    });

    // JSON-LD Scripts
    const jsonLd: Array<Record<string, unknown>> = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html() || "{}");
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item === "object") jsonLd.push(item);
          });
        } else if (parsed && typeof parsed === "object") {
          jsonLd.push(parsed);
        }
      } catch {
        jsonLd.push({ __parseError: true, rawSnippet: $(el).html()?.slice(0, 200) });
      }
    });

    // Language & Viewport
    const htmlLang = $("html").attr("lang")?.trim();
    const viewport = $('meta[name="viewport" i]').attr("content")?.trim();

    // Clean text content for word count (excluding scripts, styles, noscript)
    const clonedDom = cheerio.load(htmlBody || "");
    clonedDom("script, style, noscript, svg").remove();
    const cleanText = clonedDom("body").text().replace(/\s+/g, " ").trim();
    const words = cleanText ? cleanText.split(" ").filter((w) => w.length > 0) : [];

    // Template classification
    const template: PageTemplateType = TemplateClassifier.classify(finalUrl, htmlBody);

    return {
      requestedUrl,
      finalUrl,
      statusCode,
      headers,
      title,
      metaDescription,
      canonicalUrl,
      robotsDirectives,
      headings,
      images,
      links,
      openGraph,
      jsonLd,
      htmlLang,
      viewport,
      contentLengthBytes,
      textContent: cleanText.slice(0, 1000), // bounded preview
      wordCount: words.length,
      crawlTimestamp: new Date().toISOString(),
      template,
      isAccessDeniedOrChallenge,
    };
  }
}
