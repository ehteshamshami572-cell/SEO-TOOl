import { describe, it, expect } from "vitest";
import { prisma } from "../src/lib/db";
import { FindingNormalizer } from "../src/modules/findings/finding-normalizer";
import { TemplateClassifier } from "../src/modules/templates/template-classifier";
import { TemplateGrouper } from "../src/modules/templates/template-grouper";
import { AuditFinding } from "../src/modules/audits/audit.types";

describe("Audit Orchestrator & Template Engine Integration", () => {
  it("classifies diverse Shopify storefront URLs accurately", () => {
    expect(TemplateClassifier.classify("https://store.myshopify.com/")).toBe("homepage");
    expect(TemplateClassifier.classify("https://store.myshopify.com/products/leather-jacket")).toBe("product");
    expect(TemplateClassifier.classify("https://store.myshopify.com/collections/winter-sale")).toBe("collection");
    expect(TemplateClassifier.classify("https://store.myshopify.com/pages/shipping-policy")).toBe("page");
    expect(TemplateClassifier.classify("https://store.myshopify.com/blogs/news")).toBe("blog");
    expect(TemplateClassifier.classify("https://store.myshopify.com/blogs/news/first-announcement")).toBe("article");
  });

  it("correctly groups findings and computes template breakdowns", () => {
    const pages = [
      { url: "https://store.com/", template: "homepage" },
      { url: "https://store.com/products/p1", template: "product" },
      { url: "https://store.com/products/p2", template: "product" },
    ];

    const findings: AuditFinding[] = [
      {
        ruleId: "ONPAGE-IMG-NO-ALT",
        category: "on_page_seo",
        severity: "medium",
        title: "Missing Alt Text",
        description: "Test",
        impact: "Test",
        remediation: "Test",
        scoreImpact: 4,
        affectedUrl: "https://store.com/products/p1",
        pageType: "product",
        confidence: "high",
      },
      {
        ruleId: "ONPAGE-IMG-NO-ALT",
        category: "on_page_seo",
        severity: "medium",
        title: "Missing Alt Text",
        description: "Test",
        impact: "Test",
        remediation: "Test",
        scoreImpact: 4,
        affectedUrl: "https://store.com/products/p2",
        pageType: "product",
        confidence: "high",
      },
      {
        ruleId: "ONPAGE-H1-MISSING",
        category: "on_page_seo",
        severity: "high",
        title: "Missing H1",
        description: "Test",
        impact: "Test",
        remediation: "Test",
        scoreImpact: 7,
        affectedUrl: "https://store.com/",
        pageType: "homepage",
        confidence: "high",
      },
    ];

    const breakdown = TemplateGrouper.group(pages, findings);

    expect(breakdown["product"]).toBeDefined();
    expect(breakdown["product"].pageCount).toBe(2);
    expect(breakdown["product"].totalFindings).toBe(2);
    expect(breakdown["product"].commonIssues[0].ruleId).toBe("ONPAGE-IMG-NO-ALT");
    expect(breakdown["product"].commonIssues[0].count).toBe(2);

    expect(breakdown["homepage"]).toBeDefined();
    expect(breakdown["homepage"].pageCount).toBe(1);
    expect(breakdown["homepage"].findingsBySeverity.high).toBe(1);
  });

  it("can persist and retrieve audits in SQLite via Prisma", async () => {
    const audit = await prisma.audit.create({
      data: {
        storeUrl: "https://test-store.myshopify.com",
        hostname: "test-store.myshopify.com",
        status: "COMPLETED",
        healthScore: 85,
        techSeoScore: 90,
        onPageScore: 80,
      },
    });

    expect(audit.id).toBeDefined();

    const retrieved = await prisma.audit.findUnique({
      where: { id: audit.id },
    });

    expect(retrieved?.hostname).toBe("test-store.myshopify.com");
    expect(retrieved?.healthScore).toBe(85);

    // Clean up
    await prisma.audit.delete({ where: { id: audit.id } });
  });
});
