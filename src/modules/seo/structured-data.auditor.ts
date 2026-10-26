import { AuditFinding, ExtractedPageData } from "../audits/audit.types";

export class StructuredDataAuditor {
  public static auditPage(page: ExtractedPageData): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Skip for error pages
    if (page.statusCode >= 400) {
      return findings;
    }

    const jsonLdBlocks = page.jsonLd || [];

    // 1. Check for Syntax Errors in JSON-LD
    const parseErrors = jsonLdBlocks.filter((b) => b.__parseError === true);
    if (parseErrors.length > 0) {
      findings.push({
        ruleId: "SCHEMA-SYNTAX-ERROR",
        category: "structured_data",
        severity: "high",
        title: "Malformed JSON-LD Script Block",
        description: "A <script type='application/ld+json'> element contains invalid JSON syntax and cannot be parsed.",
        impact: "Search engines discard malformed JSON-LD scripts entirely, preventing rich snippet qualification.",
        remediation: "Validate theme Liquid templates with a JSON linter to escape quotes and remove trailing commas.",
        scoreImpact: 10,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: 'script[type="application/ld+json"]',
        confidence: "high",
        evidence: { errorCount: parseErrors.length },
      });
    }

    // 2. Check if Any Structured Data Exists
    const validBlocks = jsonLdBlocks.filter((b) => !b.__parseError);
    if (validBlocks.length === 0) {
      findings.push({
        ruleId: "SCHEMA-NONE",
        category: "structured_data",
        severity: "medium",
        title: "No Structured Data (JSON-LD) Detected",
        description: "The page does not declare any JSON-LD schema markup.",
        impact: "Missing structured data prevents the store from qualifying for Google Rich Results (pricing, ratings, stock).",
        remediation: "Add appropriate schema.org markup (Product, BreadcrumbList, WebSite, Organization) in Liquid.",
        scoreImpact: 6,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        confidence: "high",
      });
      return findings;
    }

    // Flatten nested schemas or graph structures
    const allSchemas: Array<Record<string, unknown>> = [];
    for (const block of validBlocks) {
      if (Array.isArray(block["@graph"])) {
        for (const item of block["@graph"]) {
          if (item && typeof item === "object") allSchemas.push(item as Record<string, unknown>);
        }
      } else {
        allSchemas.push(block);
      }
    }

    // 3. Product Template Specific Audits
    if (page.template === "product") {
      const productSchemas = allSchemas.filter(
        (s) => s["@type"] === "Product" || (Array.isArray(s["@type"]) && s["@type"].includes("Product"))
      );

      if (productSchemas.length === 0) {
        findings.push({
          ruleId: "SCHEMA-NONE",
          category: "structured_data",
          severity: "high",
          title: "Missing Product Schema on Product Page",
          description: "This product page lacks a schema.org/Product structured data declaration.",
          impact: "Google Merchant Center and Google Search Rich Snippets require Product schema to show rich price tags.",
          remediation: "Output a valid schema.org Product object containing name, image, offers, and sku.",
          scoreImpact: 8,
          affectedUrl: page.finalUrl,
          pageType: page.template,
          confidence: "high",
        });
      } else {
        for (const p of productSchemas) {
          // Check Product Name
          if (!p.name) {
            findings.push({
              ruleId: "SCHEMA-PRODUCT-NAME",
              category: "structured_data",
              severity: "high",
              title: "Product Schema Missing Name",
              description: "The schema.org/Product object is missing the required 'name' property.",
              impact: "Product rich results will be rejected by Google without a valid product name.",
              remediation: "Ensure the 'name' field in your Product schema outputs the product title.",
              scoreImpact: 6,
              affectedUrl: page.finalUrl,
              pageType: page.template,
              confidence: "high",
            });
          }

          // Check Offers (Price & Currency)
          const offers = p.offers;
          const hasOffers =
            offers &&
            typeof offers === "object" &&
            ((Array.isArray(offers) && offers.length > 0) || (!Array.isArray(offers) && (offers as Record<string, unknown>).price !== undefined));

          if (!hasOffers) {
            findings.push({
              ruleId: "SCHEMA-PRODUCT-OFFERS",
              category: "structured_data",
              severity: "high",
              title: "Product Schema Missing Offers / Price",
              description: "Product structured data does not declare an Offer with price and priceCurrency.",
              impact: "Without pricing data, Google cannot display rich price badges in search snippets.",
              remediation: "Add an 'offers' block with '@type': 'Offer', 'price', and 'priceCurrency' in ISO 4217 format.",
              scoreImpact: 8,
              affectedUrl: page.finalUrl,
              pageType: page.template,
              confidence: "high",
            });
          }

          // Check Product Image
          if (!p.image) {
            findings.push({
              ruleId: "SCHEMA-PRODUCT-IMAGE",
              category: "structured_data",
              severity: "medium",
              title: "Product Schema Missing Image",
              description: "Product structured data omits an 'image' URL.",
              impact: "Rich snippets in Google mobile search and Google Discover require a high-resolution image URL.",
              remediation: "Include the primary product image URL in the schema 'image' property.",
              scoreImpact: 4,
              affectedUrl: page.finalUrl,
              pageType: page.template,
              confidence: "high",
            });
          }
        }
      }
    }

    return findings;
  }
}
