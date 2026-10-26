import { describe, it, expect } from "vitest";
import { UrlPolicyService } from "../src/modules/crawler/url-policy";

describe("UrlPolicyService", () => {
  it("normalizes standard URLs correctly", () => {
    const res = UrlPolicyService.normalizeUrl("HTTPS://Example-Store.com/products/test/?utm_source=fb#review");
    expect(res.isValid).toBe(true);
    expect(res.hostname).toBe("example-store.com");
    expect(res.normalizedUrl).toBe("https://example-store.com/products/test");
  });

  it("rejects non-http/https protocols", () => {
    const res = UrlPolicyService.normalizeUrl("gopher://example.com");
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("Unsupported protocol");
  });

  it("rejects URLs with embedded credentials", () => {
    const res = UrlPolicyService.normalizeUrl("https://admin:pass@example.com/admin");
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("credentials are prohibited");
  });

  it("blocks private and loopback IP ranges for SSRF prevention", () => {
    expect(UrlPolicyService.isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(UrlPolicyService.isPrivateOrReservedIp("10.0.0.1")).toBe(true);
    expect(UrlPolicyService.isPrivateOrReservedIp("172.16.5.1")).toBe(true);
    expect(UrlPolicyService.isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(UrlPolicyService.isPrivateOrReservedIp("169.254.169.254")).toBe(true); // AWS/GCP metadata
    expect(UrlPolicyService.isPrivateOrReservedIp("::1")).toBe(true); // IPv6 loopback
    expect(UrlPolicyService.isPrivateOrReservedIp("::ffff:127.0.0.1")).toBe(true); // IPv4-mapped IPv6 loopback
  });

  it("permits public Internet IP addresses", () => {
    expect(UrlPolicyService.isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(UrlPolicyService.isPrivateOrReservedIp("1.1.1.1")).toBe(false);
    expect(UrlPolicyService.isPrivateOrReservedIp("142.250.190.46")).toBe(false);
  });
});
