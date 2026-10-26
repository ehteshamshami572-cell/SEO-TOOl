import { describe, it, expect } from "vitest";
import { TechnicalSeoAuditor } from "../src/modules/seo/technical-seo.auditor";
import { OnPageSeoAuditor } from "../src/modules/seo/on-page-seo.auditor";
import { StructuredDataAuditor } from "../src/modules/seo/structured-data.auditor";
import { ExtractedPageData } from "../src/modules/audits/audit.types";

const mockBasePage: ExtractedPageData = {
  requestedUrl: "https://store.myshopify.com/products/hat",
  finalUrl: "https://store.myshopify.com/products/hat",
  statusCode: 200,
  headers: {},
  title: "Cool Wool Hat - Best Winter Apparel In Store",
  metaDescription: "Check out our premium cool wool hat designed for freezing winter conditions and casual wear.",
  canonicalUrl: "https://store.myshopify.com/products/hat",
  headings: {
    h1: ["Cool Wool Hat"],
    h2: ["Specifications"],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
  },
  images: [{ src: "/hat.png", alt: "Cool wool hat front view" }],
  links: [
    { href: "https://store.myshopify.com/collections/winter", text: "Winter", isInternal: true },
    { href: "https://store.myshopify.com/collections/apparel", text: "Apparel", isInternal: true },
    { href: "https://store.myshopify.com/pages/contact", text: "Contact", isInternal: true },
  ],
  openGraph: {},
  jsonLd: [
    {
      "@type": "Product",
      name: "Cool Wool Hat",
      image: "https://store.myshopify.com/hat.jpg",
      offers: { price: "29.99", priceCurrency: "USD" },
    },
  ],
  contentLengthBytes: 4000,
  textContent: "A complete description of our warm winter wool hat with more than one hundred words describing premium sheep wool fibers.",
  wordCount: 150,
  crawlTimestamp: new Date().toISOString(),
  template: "product",
  isAccessDeniedOrChallenge: false,
};

describe("SEO Audit Rules Engine", () => {
  it("detects missing canonical tag", () => {
    const page = { ...mockBasePage, canonicalUrl: undefined };
    const findings = TechnicalSeoAuditor.auditPage(page);
    expect(findings.some((f) => f.ruleId === "TECH-CANONICAL-MISSING")).toBe(true);
  });

  it("detects canonical mismatch when canonical points to alternate URL", () => {
    const page = { ...mockBasePage, canonicalUrl: "https://store.myshopify.com/products/other-hat" };
    const findings = TechnicalSeoAuditor.auditPage(page);
    expect(findings.some((f) => f.ruleId === "TECH-CANONICAL-MISMATCH")).toBe(true);
  });

  it("detects missing title tag and missing H1", () => {
    const page = {
      ...mockBasePage,
      title: undefined,
      headings: { ...mockBasePage.headings, h1: [] },
    };
    const findings = OnPageSeoAuditor.auditPage(page);
    expect(findings.some((f) => f.ruleId === "ONPAGE-TITLE-MISSING")).toBe(true);
    expect(findings.some((f) => f.ruleId === "ONPAGE-H1-MISSING")).toBe(true);
  });

  it("flags images missing alt attributes", () => {
    const page = {
      ...mockBasePage,
      images: [
        { src: "/hat.png", alt: undefined },
        { src: "/logo.png", alt: "Store Logo" },
      ],
    };
    const findings = OnPageSeoAuditor.auditPage(page);
    expect(findings.some((f) => f.ruleId === "ONPAGE-IMG-NO-ALT")).toBe(true);
  });

  it("validates product structured data required properties", () => {
    const page = {
      ...mockBasePage,
      jsonLd: [
        {
          "@type": "Product",
          // missing name and offers!
        },
      ],
    };
    const findings = StructuredDataAuditor.auditPage(page);
    expect(findings.some((f) => f.ruleId === "SCHEMA-PRODUCT-NAME")).toBe(true);
    expect(findings.some((f) => f.ruleId === "SCHEMA-PRODUCT-OFFERS")).toBe(true);
  });
});
