# Shopify SEO & Performance Audit SaaS: Security & Compliance Specification

## 1. Threat Model & Objectives

The auditing system makes outbound network requests to user-supplied URLs representing Shopify storefronts. Without rigorous controls, such engines can be abused as:
- Server-Side Request Forgery (SSRF) proxies to probe cloud metadata APIs (`169.254.169.254`), internal Docker networks (`172.17.0.0/16`), Kubernetes cluster IPs (`10.96.0.0/12`), or local loopbacks (`127.0.0.1`).
- Distributed Denial of Service (DDoS) reflection or amplification tools against target merchants.
- Port scanners probing internal or non-HTTP enterprise services.
- Cross-Site Scripting (XSS) vectors via unsanitized page metadata and structured data in report dashboards.

## 2. Multi-Layer SSRF Defense

### 2.1 URL Validation & Policy Rules (`UrlPolicyService`)
Before dispatching any outbound request:
1. **Scheme Restrictions**: Only `http:` and `https:` are permitted. `file:`, `gopher:`, `ftp:`, `data:`, `blob:`, and custom schemes are strictly rejected.
2. **Port Restrictions**: Only default web ports (`80`, `443`) are accepted unless explicitly approved for staging environments.
3. **Credential Stripping**: Reject any URL containing username/password components (e.g. `https://admin:pass@store.com`).
4. **Hostname Canonicalization**: Hostnames are lowercased and punycode-normalized to prevent homograph / IDN attacks.

### 2.2 DNS & IP Range Validation
DNS resolution is performed using strict IP parsing (`ipaddr.js`):
- **Prohibited IPv4 Ranges**:
  - Loopback: `127.0.0.0/8`
  - Private RFC 1918: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
  - Link-Local & Cloud Metadata: `169.254.0.0/16`
  - Carrier-Grade NAT: `100.64.0.0/10`
  - Multicast: `224.0.0.0/4`
  - Broadcast: `255.255.255.255/32`
  - Current Network / Unspecified: `0.0.0.0/8`
  - Benchmarking: `198.18.0.0/15`
  - Test-Net: `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`
- **Prohibited IPv6 Ranges**:
  - Loopback: `::1/128`
  - Unspecified: `::/128`
  - Unique Local (ULA): `fc00::/7`
  - Link-Local: `fe80::/10`
  - IPv4-Mapped IPv6: `::ffff:0:0/96` (unwrapped and validated against all IPv4 rules!)
  - Multicast: `ff00::/8`
  - Documentation: `2001:db8::/32`

### 2.3 DNS Rebinding Protection
To prevent DNS rebinding where a domain resolves to a public IP during pre-check but shifts to an internal IP during connection:
- Resolved IPs are validated immediately prior to request socket creation.
- Every redirect target (`301`, `302`, `307`, `308`) must pass through the identical `UrlPolicyService` validation loop before the redirect is followed.
- Redirect hops are strictly limited to a maximum of 5. Redirect loops are automatically terminated.

## 3. Crawl Politeness & Resource Budgeting

1. **User Agent**:
   `Mozilla/5.0 (compatible; ShopifySeoAuditorBot/1.0; +https://example.com/bot)`
2. **Robots.txt Adherence**:
   - Fetches and parses `/robots.txt` before crawling deep URLs.
   - Respects disallow directives for the user agent or `*`.
   - Caches robots rules in-memory/Redis for 1 hour.
3. **Per-Host Rate Limiting**:
   - Maximum 2 concurrent requests per target storefront hostname.
   - Built-in inter-request delay (minimum 250ms between page hits).
   - Honors HTTP `429 Too Many Requests` and `Retry-After` headers.
4. **Audit Scope Quotas**:
   - Default page crawl budget: 25 pages per MVP audit.
   - Maximum document download size: 5 MB per page (aborts stream if exceeded).
   - Maximum total crawl duration: 10 minutes per audit timeout.

## 4. Application & Dashboard Security

- **Authentication & Workspace Isolation**: Multi-tenant authorization boundary verifying ownership before accessing audit runs or reports.
- **XSS Sanitization**: Extracted storefront HTML strings (meta titles, schema, headings) are treated as untrusted text and safely encoded in React JSX rendering.
- **API Secret Management**: External API keys (`GOOGLE_PAGESPEED_API_KEY`) are exclusively accessed in server-side Route Handlers and worker processes, never bundled in client code.
