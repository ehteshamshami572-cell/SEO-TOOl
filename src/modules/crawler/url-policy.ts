import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { logger } from "@/lib/logger";

export interface NormalizedUrlResult {
  isValid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  error?: string;
}

export interface SecurityCheckResult {
  isSafe: boolean;
  reason?: string;
  resolvedIp?: string;
}

export class UrlPolicyService {
  private static readonly ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
  private static readonly ALLOWED_PORTS = new Set(["80", "443", ""]);
  private static readonly STRIP_PARAMS = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "msclkid",
    "_ga",
    "_gl",
    "mc_cid",
    "mc_eid",
  ]);

  /**
   * Normalizes a raw URL string:
   * - Validates scheme and format
   * - Strips fragments
   * - Lowercases hostname
   * - Removes non-content tracking query parameters
   * - Deduplicates trailing slash where appropriate
   */
  public static normalizeUrl(rawUrl: string, baseUrl?: string): NormalizedUrlResult {
    try {
      let parsed: URL;
      if (baseUrl) {
        parsed = new URL(rawUrl, baseUrl);
      } else {
        // Check if rawUrl already has any scheme (e.g., http:, gopher:, ftp:, etc.)
        const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawUrl);
        const toParse = hasScheme ? rawUrl : `https://${rawUrl}`;
        parsed = new URL(toParse);
      }

      if (!this.ALLOWED_PROTOCOLS.has(parsed.protocol)) {
        return {
          isValid: false,
          error: `Unsupported protocol: ${parsed.protocol}. Only http and https are allowed.`,
        };
      }

      if (parsed.username || parsed.password) {
        return {
          isValid: false,
          error: "URLs with embedded user authentication credentials are prohibited.",
        };
      }

      if (!this.ALLOWED_PORTS.has(parsed.port)) {
        return {
          isValid: false,
          error: `Non-standard port prohibited: ${parsed.port}.`,
        };
      }

      // Lowercase hostname
      parsed.hostname = parsed.hostname.toLowerCase();

      // Remove URL fragment
      parsed.hash = "";

      // Filter tracking parameters while preserving functional store parameters (e.g. ?page=2, ?variant=...)
      const cleanedParams = new URLSearchParams();
      parsed.searchParams.forEach((value, key) => {
        if (!this.STRIP_PARAMS.has(key.toLowerCase())) {
          cleanedParams.append(key, value);
        }
      });
      parsed.search = cleanedParams.toString() ? `?${cleanedParams.toString()}` : "";

      // Normalize pathname
      let pathname = parsed.pathname.replace(/\/+/g, "/");
      if (pathname.length > 1 && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }
      parsed.pathname = pathname;

      return {
        isValid: true,
        normalizedUrl: parsed.toString(),
        hostname: parsed.hostname,
      };
    } catch {
      return {
        isValid: false,
        error: "Malformed or unparseable URL.",
      };
    }
  }

  /**
   * Checks if an IP address belongs to private, loopback, link-local, carrier-grade NAT, or metadata ranges
   */
  public static isPrivateOrReservedIp(ipString: string): boolean {
    try {
      let addr = ipaddr.parse(ipString);

      // Unwrap IPv4-mapped IPv6 address (e.g., ::ffff:127.0.0.1)
      if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
        addr = (addr as ipaddr.IPv6).toIPv4Address();
      }

      const range = addr.range();

      // Explicitly prohibited ranges across IPv4 and IPv6
      const prohibitedRanges = new Set([
        "unspecified",
        "broadcast",
        "linkLocal",
        "loopback",
        "private",
        "reserved",
        "carrierGradeNat",
        "uniqueLocal",
        "rfc6598",
      ]);

      if (prohibitedRanges.has(range)) {
        return true;
      }

      // Check explicit Cloud Metadata IPs (AWS/GCP/Azure: 169.254.169.254)
      if (addr.kind() === "ipv4") {
        const octets = (addr as ipaddr.IPv4).octets;
        // 169.254.x.x is link-local, but verify explicitly
        if (octets[0] === 169 && octets[1] === 254) return true;
        // 127.x.x.x
        if (octets[0] === 127) return true;
        // 10.x.x.x
        if (octets[0] === 10) return true;
        // 172.16-31.x.x
        if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
        // 192.168.x.x
        if (octets[0] === 192 && octets[1] === 168) return true;
        // 0.0.0.0
        if (octets[0] === 0) return true;
      }

      return false;
    } catch {
      // If parsing fails, treat as unsafe
      return true;
    }
  }

  /**
   * Performs pre-request SSRF validation on a given URL by resolving its DNS records
   * and verifying every returned IPv4 and IPv6 address.
   */
  public static async validateOutboundUrl(url: string): Promise<SecurityCheckResult> {
    const norm = this.normalizeUrl(url);
    if (!norm.isValid || !norm.normalizedUrl || !norm.hostname) {
      return { isSafe: false, reason: norm.error ?? "Invalid URL" };
    }

    const hostname = norm.hostname;

    // Check for explicit localhost strings or IP literals
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return {
        isSafe: false,
        reason: `SSRF Guard: Prohibited local hostname '${hostname}'`,
      };
    }

    try {
      // Resolve IPv4 addresses
      const ipv4s = await dns.resolve4(hostname).catch(() => [] as string[]);
      // Resolve IPv6 addresses
      const ipv6s = await dns.resolve6(hostname).catch(() => [] as string[]);

      const allIps = [...ipv4s, ...ipv6s];

      if (allIps.length === 0) {
        // Fallback: check if hostname is already a valid IP literal
        if (ipaddr.isValid(hostname)) {
          allIps.push(hostname);
        } else {
          return {
            isSafe: false,
            reason: `DNS resolution failed for hostname '${hostname}'`,
          };
        }
      }

      for (const ip of allIps) {
        if (this.isPrivateOrReservedIp(ip)) {
          logger.warn("SSRF blocked attempt to access private/reserved IP", {
            hostname,
            ip,
          });
          return {
            isSafe: false,
            reason: `SSRF Guard: Host resolves to prohibited non-public IP address (${ip})`,
            resolvedIp: ip,
          };
        }
      }

      return {
        isSafe: true,
        resolvedIp: allIps[0],
      };
    } catch (err) {
      return {
        isSafe: false,
        reason: `SSRF Guard: DNS lookup error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Verifies if target URL belongs to the allowed store hostname
   */
  public static isSameHost(targetUrl: string, baseHostname: string): boolean {
    try {
      const parsed = new URL(targetUrl);
      const targetHost = parsed.hostname.toLowerCase();
      const baseHost = baseHostname.toLowerCase();
      return targetHost === baseHost;
    } catch {
      return false;
    }
  }
}
