# Shopify SEO & Performance Audit SaaS: API Reference

All API routes adhere to standard JSON response conventions and enforce strict Zod validation.

## 1. Audit Management

### `POST /api/audits`
Create and schedule a new storefront audit.

**Request Body:**
```json
{
  "storeUrl": "https://example-store.myshopify.com",
  "maxPages": 25,
  "deviceStrategy": "mobile",
  "runPageSpeed": true
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "audit": {
    "id": "clt9a4e8d000108l0h79c941z",
    "storeUrl": "https://example-store.myshopify.com",
    "hostname": "example-store.myshopify.com",
    "status": "PENDING",
    "maxPages": 25,
    "deviceStrategy": "mobile",
    "createdAt": "2026-10-27T02:40:00.000Z"
  }
}
```

### `GET /api/audits`
List recent audits with overall scores and issue summaries.

**Query Parameters:**
- `limit`: (optional, default: 20)
- `offset`: (optional, default: 0)
- `hostname`: (optional, filter by store domain)

### `GET /api/audits/:id`
Fetch audit details, status progress counters, discovered pages, findings summary, and PageSpeed metrics.

**Response (`200 OK`):**
```json
{
  "success": true,
  "audit": {
    "id": "clt9a4e8d000108l0h79c941z",
    "storeUrl": "https://example-store.myshopify.com",
    "hostname": "example-store.myshopify.com",
    "status": "COMPLETED",
    "pagesDiscovered": 18,
    "pagesCrawled": 18,
    "healthScore": 84,
    "findingsSummary": {
      "critical": 1,
      "high": 3,
      "medium": 7,
      "low": 4,
      "info": 2
    },
    "pageSpeedSummary": {
      "performanceScore": 72,
      "lcpMs": 2400,
      "cls": 0.04,
      "tbtMs": 180
    },
    "templateBreakdown": {
      "homepage": { "pages": 1, "issues": 2 },
      "product": { "pages": 12, "issues": 8 },
      "collection": { "pages": 3, "issues": 4 },
      "page": { "pages": 2, "issues": 1 }
    }
  }
}
```

### `POST /api/audits/:id/cancel`
Cancel an in-progress audit.

---

## 2. Findings Explorer

### `GET /api/audits/:id/findings`
Retrieve findings for an audit with flexible filtering.

**Query Parameters:**
- `category`: `technical_seo` | `on_page_seo` | `structured_data` | `performance`
- `severity`: `critical` | `high` | `medium` | `low` | `info`
- `template`: `homepage` | `product` | `collection` | `page` | `blog` | `article`
- `url`: Filter findings for a specific page URL
- `search`: Search query matching finding title or rule ID

---

## 3. Reports & Exports

### `GET /api/audits/:id/export?format=json`
Download complete audit results as structured JSON.

### `GET /api/audits/:id/export?format=csv`
Download findings formatted as CSV for spreadsheet analysis.

### `GET /api/audits/:id/export?format=html`
Render standalone printable executive audit report.

---

## 4. Remediation Progress

### `PATCH /api/audits/:id/findings/:findingId`
Update the remediation status of a specific finding.

**Request Body:**
```json
{
  "status": "fixed" // "open" | "in_progress" | "fixed" | "ignored",
  "notes": "Added meta description via Shopify Admin > Online Store > Preferences"
}
```
