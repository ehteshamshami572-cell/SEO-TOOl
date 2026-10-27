# Shopify SEO & Performance Audit SaaS

A production-grade, all-in-one auditing platform for publicly accessible Shopify storefronts. Audit technical SEO, heading hierarchies, metadata, XML sitemaps, robots.txt, schema.org JSON-LD structured data, and Google PageSpeed Insights (Core Web Vitals) without requiring Shopify Admin API credentials or private access.

---

## 🌟 Key Features

1. **Public Storefront Discovery & Crawling Engine**
   - Recursively parses Shopify sitemap indexes (`/sitemap.xml`, `/sitemap_products_1.xml`, etc.) and internal link graphs.
   - Extracts structured signals via Cheerio: titles, descriptions, canonicals, robots directives, H1–H6, image alts, Open Graph, and JSON-LD scripts.
   - Automatic Shopify page template classification: `homepage`, `product`, `collection`, `page`, `blog`, `article`.

2. **Enterprise SSRF & Security Defense**
   - Pre-request DNS resolution checking all IPv4/IPv6 addresses against RFC 1918, RFC 4193, loopbacks, link-local, carrier-grade NAT, and cloud metadata (`169.254.169.254`).
   - Unwraps and validates IPv4-mapped IPv6 destinations (`::ffff:127.0.0.1`).
   - Every redirect hop is independently validated against SSRF rules before connection.
   - Bounded redirect depth (5 hops) with redirect loop detection.

3. **Technical & On-Page SEO Rule Catalog**
   - **Technical SEO**: Robots.txt disallow rules, missing or malformed sitemaps, missing/multiple/mismatched canonicals, 4xx/5xx HTTP errors, redirect chains, noindex tags.
   - **On-Page SEO**: Title and meta description lengths with heuristic bounds, missing primary H1 or multiple H1s, skipped heading hierarchy (H1 to H3), images missing alt attributes, thin content, internal link ratios.
   - **Structured Data**: JSON-LD schema syntax validation, Product schema validation (`name`, `offers` with price/currency, `image`), and BreadcrumbList checks.

4. **Google PageSpeed Insights & Core Web Vitals**
   - Server-side API key handling for Google PageSpeed Insights.
   - Core Web Vitals: Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Total Blocking Time (TBT).
   - Distinguishes Chrome UX Report (CrUX) field data from Lighthouse lab measurements.
   - Analyzes third-party Shopify app scripts, transfer payloads, and render-blocking assets.
   - In-memory result caching and exponential backoff with jitter on HTTP 429 quota limits.

5. **Evidence-Backed Findings & Prioritization Engine**
   - Normalized `AuditFinding` contract with rule IDs, categories, severities (`critical`, `high`, `medium`, `low`, `info`), and evidence snippets.
   - Health Score calculation (0–100) with subscores for Technical SEO, On-Page SEO, and Performance.
   - Template-level aggregation grouping common issues by theme layout.

6. **Remediation Tracking & Audit Comparison**
   - Track fix progress directly in the dashboard (`open`, `in_progress`, `fixed`, `ignored`).
   - Compare two audits over time to measure health score changes and identify resolved vs newly introduced issues.

7. **Multi-Format Exporting**
   - Machine-readable structured JSON.
   - RFC 4180 compliant CSV export for spreadsheet analysis.
   - Standalone printable executive HTML audit report with CSS gauges and tables.

8. **Dual-Mode Background Job Architecture**
   - **BullMQ + Redis**: Distributed worker queue for production Docker clusters and autoscaling workers.
   - **Local Queue**: Resilient, zero-dependency in-process asynchronous engine for local development.

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone <repo-url>
cd shopify-seo-tool
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configuration variables:
```ini
DATABASE_URL="file:./dev.db" # Or PostgreSQL URL for production
REDIS_URL="redis://localhost:6379" # Optional; falls back to in-process queue if omitted
GOOGLE_PAGESPEED_API_KEY="" # Optional; get a free key from Google Cloud Console
```

### 3. Initialize Database

Push Prisma schema to your local SQLite database:

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## 🧪 Running Tests

Execute the comprehensive test suite with Vitest:

```bash
npm test
```

Tests cover:
- URL normalization, protocol validation, and SSRF prevention.
- HTML signal extraction via Cheerio.
- Technical SEO, on-page SEO, and JSON-LD structured data rules.
- Finding deduplication, severity scoring, and RFC 4180 CSV export escaping.

---

## 🐳 Docker Deployment

A complete multi-container setup is included in `docker-compose.yml`:

```bash
docker compose up -d
```

Services:
- `db`: PostgreSQL 16 Alpine
- `redis`: Redis 7 Alpine
- `web`: Next.js production web server
- `worker`: Standalone persistent BullMQ audit worker

---

## 📚 Documentation

- [Architecture Guide](docs/architecture.md)
- [Security & SSRF Guard](docs/security.md)
- [Audit Rules Catalog](docs/audit-rules.md)
- [Deployment Guide](docs/deployment.md)
- [Netlify Deployment Guide](docs/netlify-deployment.md)
- [API Reference](docs/api.md)
