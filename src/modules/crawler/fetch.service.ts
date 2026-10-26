import { UrlPolicyService } from "./url-policy";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

export interface FetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  finalUrl: string;
  headers: Record<string, string>;
  bodyText: string;
  contentLengthBytes: number;
  redirectChain: string[];
  errorMessage?: string;
}

export class FetchService {
  private lastRequestTime: number = 0;

  /**
   * Enforces inter-request delay to respect target storefront rate limits
   */
  private async applyPolitenessDelay(): Promise<void> {
    const delay = env.RATE_LIMIT_DELAY_MS;
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < delay) {
      await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Executes a hardened HTTP GET request with SSRF validation, redirect handling, and size caps
   */
  public async fetchUrl(
    targetUrl: string,
    options: {
      maxRedirects?: number;
      timeoutMs?: number;
      maxSizeBytes?: number;
      userAgent?: string;
    } = {}
  ): Promise<FetchResult> {
    await this.applyPolitenessDelay();

    const maxRedirects = options.maxRedirects ?? env.MAX_REDIRECT_HOPS;
    const timeoutMs = options.timeoutMs ?? env.REQUEST_TIMEOUT_MS;
    const maxSizeBytes = options.maxSizeBytes ?? env.MAX_RESPONSE_SIZE_BYTES;
    const userAgent = options.userAgent ?? env.CRAWLER_USER_AGENT;

    let currentUrl = targetUrl;
    const redirectChain: string[] = [];
    const visitedUrls = new Set<string>();

    for (let hop = 0; hop <= maxRedirects; hop++) {
      // 1. Validate SSRF on current destination
      const ssrfCheck = await UrlPolicyService.validateOutboundUrl(currentUrl);
      if (!ssrfCheck.isSafe) {
        return {
          ok: false,
          status: 403,
          statusText: "SSRF Forbidden",
          finalUrl: currentUrl,
          headers: {},
          bodyText: "",
          contentLengthBytes: 0,
          redirectChain,
          errorMessage: `Blocked by SSRF policy: ${ssrfCheck.reason}`,
        };
      }

      visitedUrls.add(currentUrl);

      // 2. Perform fetch with timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(currentUrl, {
          method: "GET",
          headers: {
            "User-Agent": userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
          },
          signal: controller.signal,
          redirect: "manual", // Handle redirects manually for SSRF verification
        });

        clearTimeout(timer);

        // Check for redirect status codes
        const status = response.status;
        const isRedirect = [301, 302, 303, 307, 308].includes(status);

        if (isRedirect) {
          redirectChain.push(currentUrl);
          const location = response.headers.get("location");
          if (!location) {
            return {
              ok: false,
              status,
              statusText: "Redirect missing Location header",
              finalUrl: currentUrl,
              headers: Object.fromEntries(response.headers.entries()),
              bodyText: "",
              contentLengthBytes: 0,
              redirectChain,
              errorMessage: "Redirect response omitted Location header",
            };
          }

          const nextUrlResult = UrlPolicyService.normalizeUrl(location, currentUrl);
          if (!nextUrlResult.isValid || !nextUrlResult.normalizedUrl) {
            return {
              ok: false,
              status,
              statusText: "Invalid redirect destination",
              finalUrl: currentUrl,
              headers: Object.fromEntries(response.headers.entries()),
              bodyText: "",
              contentLengthBytes: 0,
              redirectChain,
              errorMessage: `Invalid redirect location: ${location}`,
            };
          }

          const nextUrl = nextUrlResult.normalizedUrl;

          // Detect redirect loops
          if (visitedUrls.has(nextUrl)) {
            return {
              ok: false,
              status: 310,
              statusText: "Redirect Loop Detected",
              finalUrl: nextUrl,
              headers: Object.fromEntries(response.headers.entries()),
              bodyText: "",
              contentLengthBytes: 0,
              redirectChain,
              errorMessage: `Redirect loop detected at ${nextUrl}`,
            };
          }

          if (hop === maxRedirects) {
            return {
              ok: false,
              status: 310,
              statusText: "Too Many Redirects",
              finalUrl: nextUrl,
              headers: Object.fromEntries(response.headers.entries()),
              bodyText: "",
              contentLengthBytes: 0,
              redirectChain,
              errorMessage: `Exceeded maximum redirect depth of ${maxRedirects}`,
            };
          }

          currentUrl = nextUrl;
          continue; // Loop to next hop with SSRF validation
        }

        // 3. Process final response body with size limit
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });

        const contentType = headers["content-type"] || "";
        // If content is not HTML or XML, we still read headers
        const isTextHtml =
          contentType.includes("text/html") ||
          contentType.includes("application/xhtml+xml") ||
          contentType.includes("text/xml") ||
          contentType.includes("application/xml");

        let bodyText = "";
        let bytesRead = 0;

        if (response.body) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              bytesRead += value.length;
              if (bytesRead > maxSizeBytes) {
                reader.cancel();
                logger.warn("Response body exceeded size limit, truncated stream", {
                  url: currentUrl,
                  bytesRead,
                  maxSizeBytes,
                });
                break;
              }
              chunks.push(value);
            }
          }

          const concatenated = new Uint8Array(bytesRead);
          let offset = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
          }

          const decoder = new TextDecoder("utf-8", { fatal: false });
          bodyText = decoder.decode(concatenated);
        }

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          finalUrl: currentUrl,
          headers,
          bodyText,
          contentLengthBytes: bytesRead,
          redirectChain,
        };
      } catch (err) {
        clearTimeout(timer);
        const isAbort = err instanceof Error && err.name === "AbortError";
        return {
          ok: false,
          status: isAbort ? 408 : 500,
          statusText: isAbort ? "Request Timeout" : "Network Error",
          finalUrl: currentUrl,
          headers: {},
          bodyText: "",
          contentLengthBytes: 0,
          redirectChain,
          errorMessage: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return {
      ok: false,
      status: 500,
      statusText: "Unexpected Crawler Failure",
      finalUrl: currentUrl,
      headers: {},
      bodyText: "",
      contentLengthBytes: 0,
      redirectChain,
      errorMessage: "Unexpected end of redirect loop execution",
    };
  }
}
