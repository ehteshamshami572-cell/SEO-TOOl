# Shopify SEO & Performance Audit SaaS: Audit Rules Catalog

This document defines the deterministic rules executed across the crawl and analysis phases.

## 1. Technical SEO Rules

| Rule ID | Name | Category | Severity | Detection Logic | Recommendation |
|---|---|---|---|---|---|
| `TECH-ROBOTS-MISSING` | Missing or Unreachable robots.txt | `technical_seo` | `medium` | HTTP status code for `/robots.txt` is 404 or request fails. | Ensure Shopify root serves robots.txt to guide search crawlers. |
| `TECH-ROBOTS-DISALLOW-ALL` | robots.txt Disallows Search Crawling | `technical_seo` | `critical` | `Disallow: /` matches root without overriding `Allow`. | Remove global disallow directive to enable Google indexing. |
| `TECH-SITEMAP-MISSING` | No XML Sitemap Discovered | `technical_seo` | `high` | Neither declared in robots.txt nor found at `/sitemap.xml`. | Provide an XML sitemap index containing product and collection feeds. |
| `TECH-SITEMAP-MALFORMED` | Malformed XML Sitemap | `technical_seo` | `high` | XML parsing error when reading sitemap index or child feeds. | Ensure XML is valid RFC 3023 schema without unescaped special chars. |
| `TECH-CANONICAL-MISSING` | Missing Canonical Tag | `technical_seo` | `high` | No `<link rel="canonical">` element discovered in `<head>`. | Add canonical URL pointing to preferred master page version. |
| `TECH-CANONICAL-MULTIPLE` | Multiple Canonical Tags Found | `technical_seo` | `high` | More than 1 `<link rel="canonical">` tag declared in `<head>`. | Ensure theme template outputs exactly one canonical tag per page. |
| `TECH-CANONICAL-MISMATCH` | Canonical Points to Different URL | `technical_seo` | `medium` | Canonical href differs from normalized page URL (excluding pagination). | Verify canonical URL is intended; prevents indexing of variant/filter URLs. |
| `TECH-HTTP-4XX` | Internal Link Returns 4xx Error | `technical_seo` | `high` | Discovered internal link returns HTTP 400-499 status. | Update or remove broken internal links to preserve link equity and UX. |
| `TECH-HTTP-5XX` | Internal Server Error | `technical_seo` | `critical` | Target page or link returns HTTP 500-599. | Investigate Shopify Liquid template rendering errors or server crash. |
| `TECH-REDIRECT-CHAIN` | Redirect Chain (> 2 hops) | `technical_seo` | `medium` | Destination follows 3 or more redirects before final 200 OK. | Point links directly to final destination to conserve crawl budget. |
| `TECH-NOINDEX-DETECTED` | Noindex Directive Present | `technical_seo` | `info` | Robots meta or `X-Robots-Tag` contains `noindex`. | Verify if page intentionally excluded from search engines. |

## 2. On-Page SEO Rules

| Rule ID | Name | Category | Severity | Detection Logic | Recommendation |
|---|---|---|---|---|---|
| `ONPAGE-TITLE-MISSING` | Missing Title Tag | `on_page_seo` | `critical` | `<title>` tag missing or whitespace-only. | Add descriptive title tag between 30 and 65 characters. |
| `ONPAGE-TITLE-SHORT` | Title Tag Too Short | `on_page_seo` | `low` | Clean title length < 30 characters. | Expand title to include high-intent keywords and brand name. |
| `ONPAGE-TITLE-LONG` | Title Tag Too Long | `on_page_seo` | `low` | Clean title length > 65 characters. | Shorten title to avoid truncation in Google SERP snippets. |
| `ONPAGE-DESC-MISSING` | Missing Meta Description | `on_page_seo` | `high` | `<meta name="description">` missing or empty. | Add persuasive meta description summarizing page content. |
| `ONPAGE-DESC-SHORT` | Meta Description Too Short | `on_page_seo` | `low` | Description length < 70 characters. | Provide more context (recommended: 120-160 characters). |
| `ONPAGE-DESC-LONG` | Meta Description Too Long | `on_page_seo` | `low` | Description length > 160 characters. | Shorten description to prevent truncation on mobile devices. |
| `ONPAGE-H1-MISSING` | Missing H1 Heading | `on_page_seo` | `high` | Page contains 0 `<h1>` elements. | Add exactly one primary `<h1>` heading matching page topic. |
| `ONPAGE-H1-MULTIPLE` | Multiple H1 Headings | `on_page_seo` | `low` | Page contains 2 or more `<h1>` elements. | Consolidate page heading structure to a single primary H1. |
| `ONPAGE-HEADING-SKIPPED` | Skipped Heading Level | `on_page_seo` | `low` | Heading level jumps (e.g. H2 directly to H4). | Maintain progressive document hierarchy (H1 -> H2 -> H3). |
| `ONPAGE-IMG-NO-ALT` | Image Missing Alt Attribute | `on_page_seo` | `medium` | `<img>` tag lacks `alt` attribute. | Add descriptive alt text or `alt=""` for decorative images. |
| `ONPAGE-INTERNAL-LINKS-LOW` | Low Internal Link Ratio | `on_page_seo` | `medium` | Total internal links < 3 on non-homepage template. | Connect page into navigation, related products, or contextual links. |
| `ONPAGE-THIN-CONTENT` | Potential Thin Content | `on_page_seo` | `medium` | Extracted non-navigational word count < 100 words. | Provide valuable product descriptions, guides, or specifications. |

## 3. Structured Data (JSON-LD) Rules

| Rule ID | Name | Category | Severity | Detection Logic | Recommendation |
|---|---|---|---|---|---|
| `SCHEMA-NONE` | No Structured Data Found | `structured_data` | `medium` | Page contains zero valid JSON-LD or Microdata blocks. | Add JSON-LD schema (e.g. Product, Organization, BreadcrumbList). |
| `SCHEMA-PRODUCT-NAME` | Product Schema Missing Name | `structured_data` | `high` | Type `Product` missing valid `name` property. | Add product title to JSON-LD Product schema. |
| `SCHEMA-PRODUCT-OFFERS` | Product Schema Missing Offers | `structured_data` | `high` | Type `Product` missing `offers` or `price` / `priceCurrency`. | Add Offer schema with valid price and ISO 4217 currency code. |
| `SCHEMA-PRODUCT-IMAGE` | Product Schema Missing Image | `structured_data` | `medium` | Type `Product` missing `image` array or URL. | Include canonical product image URL in schema. |
| `SCHEMA-BREADCRUMB-INVALID` | Incomplete BreadcrumbList | `structured_data` | `low` | `BreadcrumbList` has itemListElement with missing position or item. | Ensure breadcrumbs contain sequential position, name, and URL. |
| `SCHEMA-SYNTAX-ERROR` | Malformed JSON-LD Block | `structured_data` | `high` | `JSON.parse` fails on `<script type="application/ld+json">`. | Fix syntax errors, unescaped quotes, or invalid trailing commas. |

## 4. Performance & Core Web Vitals Rules

| Rule ID | Name | Category | Severity | Detection Logic | Recommendation |
|---|---|---|---|---|---|
| `PERF-SCORE-POOR` | Low Mobile Lighthouse Score | `performance` | `high` | Performance score < 50. | Optimize render-blocking resources, images, and heavy apps. |
| `PERF-LCP-SLOW` | Slow Largest Contentful Paint (LCP) | `performance` | `high` | LCP > 2.5 seconds (Lab or CrUX field data). | Preload hero image, inline critical CSS, optimize server response. |
| `PERF-CLS-HIGH` | High Cumulative Layout Shift (CLS) | `performance` | `high` | CLS > 0.1. | Specify explicit width and height on images, reserve ad/banner space. |
| `PERF-TBT-HIGH` | High Total Blocking Time (TBT) | `performance` | `medium` | TBT > 300 ms. | Minimize main-thread JavaScript execution; defer Shopify apps. |
| `PERF-THIRD-PARTY-HEAVY` | Excessive Third-Party Scripts | `performance` | `medium` | > 15 third-party scripts or > 500 KB third-party JS transfer. | Audit Shopify app store plugins; remove inactive tracking pixels. |
| `PERF-IMG-OVERSIZED` | Unoptimized Image Transfer | `performance` | `medium` | Images lack WebP/AVIF formats or responsive `srcset`. | Use Shopify's automatic CDN image resizing filters and WebP. |
