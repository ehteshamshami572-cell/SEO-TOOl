# Shopify SEO & Performance Audit SaaS: Architecture

## 1. System Overview

This platform is a production-oriented SaaS application designed to audit publicly accessible Shopify storefronts without requiring Shopify Admin API credentials or private access. It analyzes technical SEO, on-page SEO, heading hierarchies, canonical links, sitemaps, robots.txt, structured data (JSON-LD), internal link graphs, and Core Web Vitals / performance via Google PageSpeed Insights.

## 2. Logical Architecture

```
                      +-----------------------------+
                      |     Next.js Web UI /        |
                      |   Dashboard (App Router)    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Route Handlers (API)     |
                      |  /api/audits, /api/reports  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      Audit Orchestrator     |
                      |  - Lifecycle Management     |
                      |  - Budget & Scope Limits    |
                      +--------------+--------------+
                                     |
                  +------------------+------------------+
                  |                                     |
                  v                                     v
     +--------------------------+          +--------------------------+
     |     PostgreSQL / DB      |          |    Redis + Job Queues    |
     |   - Audits               |          |  - Discovery Queue       |
     |   - Discovered Pages     |          |  - Crawl & Parse Queue   |
     |   - Normalized Findings  |          |  - SEO Audit Queue       |
     |   - PageSpeed Metrics    |          |  - PageSpeed Queue       |
     |   - Remediation Log      |          |  - Report Queue          |
     +--------------------------+          +------------+-------------+
                                                        |
                                                        v
                                           +--------------------------+
                                           |  Worker Execution Pool   |
                                           |  - Crawler Service       |
                                           |  - SSRF-Guarded Fetch    |
                                           |  - Cheerio HTML Parser   |
                                           |  - SEO Rule Engine       |
                                           |  - Google PSI Client     |
                                           +--------------------------+
```

## 3. Core Service Boundaries

Each service encapsulates a single responsibility with clean interfaces:

1. **`UrlPolicyService`**: Validates URLs, resolves hostnames, checks DNS, and enforces SSRF blocking against private, loopback, link-local, and cloud metadata IPs.
2. **`RobotsService`**: Fetches, parses, and caches `/robots.txt` using RFC-compliant logic. Evaluates crawl permissions for target user agents.
3. **`SitemapService`**: Recursively discovers and parses sitemaps and sitemap indexes (`/sitemap.xml`, `/sitemap_products_1.xml`, etc.) up to bounded depth and URL limits.
4. **`CrawlerService`**: Orchestrates discovery and fetching using a hardened, concurrency-controlled HTTP client. Normalizes URLs and respects politeness budgets.
5. **`HtmlExtractionService`**: Extracts structured page signals using Cheerio: titles, meta descriptions, canonicals, robots directives, Open Graph, headings (H1-H6), images with alt attributes, internal/external links, and JSON-LD structured data scripts.
6. **`TemplateClassifier`**: Classifies Shopify pages into templates (`homepage`, `product`, `collection`, `page`, `blog`, `article`) based on URL paths, meta signals, breadcrumbs, and schema types.
7. **`TechnicalSeoAuditor` & `OnPageSeoAuditor`**: Executes deterministic, evidence-backed SEO rules across canonicals, status codes, broken links, metadata, heading hierarchies, images, link ratios, and duplicate content indicators.
8. **`StructuredDataAuditor`**: Validates JSON-LD schema objects (Product, Organization, WebSite, BreadcrumbList, Offer, Article, etc.), identifying missing critical properties and syntax errors.
9. **`PageSpeedService`**: Interfaces with the Google PageSpeed Insights REST API for mobile/desktop runs, extracting Core Web Vitals (LCP, CLS, INP field data), lab metrics (FCP, TBT, Speed Index), and actionable diagnostics.
10. **`FindingEngine` & `FindingNormalizer`**: Normalizes all audit findings into a standard contract, applies severity weights, calculates site/template health scores, and associates evidence context.
11. **`ReportService`**: Compiles comprehensive audit summaries and provides export formats (JSON, CSV, Printable HTML).

## 4. Audit Lifecycle State Machine

Audit state transitions strictly follow:
`PENDING` -> `DISCOVERING` -> `CRAWLING` -> `ANALYZING` -> `FINALIZING` -> `COMPLETED`

Terminal and alternate states:
- `PARTIAL`: Completed with some crawl errors or inaccessible pages.
- `FAILED`: Fatal error preventing audit execution (e.g., target domain non-resolvable).
- `CANCELLED`: User or system aborted audit.

## 5. Job Queue & Concurrency Management

- **Dual-Mode Queue Architecture**:
  - **BullMQ + Redis**: High-throughput distributed background processing for production container clusters.
  - **Resilient In-Process Queue**: Asynchronous job engine for local zero-dependency development and constrained environments.
- **Concurrency & Rate Limits**:
  - Global concurrent audits cap.
  - Per-hostname request rate limiting (token bucket / delay) to respect target storefront servers.
  - PageSpeed API rate limiting with exponential backoff and jitter.
  - Hard page crawl limits (default: 25 pages for MVP, configurable up to enterprise limits).
