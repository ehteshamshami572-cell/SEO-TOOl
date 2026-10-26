import { AuditFinding, ExtractedPageData } from "../audits/audit.types";

export class OnPageSeoAuditor {
  public static auditPage(page: ExtractedPageData): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Skip on-page analysis if page returned an error status code
    if (page.statusCode >= 400) {
      return findings;
    }

    // 1. Title Tag Audits
    if (!page.title) {
      findings.push({
        ruleId: "ONPAGE-TITLE-MISSING",
        category: "on_page_seo",
        severity: "critical",
        title: "Missing HTML Title Tag",
        description: "The page has no <title> tag or contains only empty whitespace.",
        impact: "Title tags are a primary relevance signal for search rankings and clickable headlines in Google results.",
        remediation: "Add a distinct, keyword-focused title tag between 30 and 60 characters in your Shopify template.",
        scoreImpact: 15,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: "title",
        confidence: "high",
      });
    } else {
      const len = page.title.length;
      if (len < 30) {
        findings.push({
          ruleId: "ONPAGE-TITLE-SHORT",
          category: "on_page_seo",
          severity: "low",
          title: `Title Tag is Short (${len} chars)`,
          description: `Current title is '${page.title}' (${len} characters). Recommended range is 30–65 characters.`,
          impact: "Short titles miss opportunities to target secondary search terms and brand phrases.",
          remediation: "Expand the title tag to include relevant keywords or store branding.",
          scoreImpact: 2,
          affectedUrl: page.finalUrl,
          pageType: page.template,
          elementSelector: "title",
          confidence: "high",
          evidence: { title: page.title, length: len },
        });
      } else if (len > 65) {
        findings.push({
          ruleId: "ONPAGE-TITLE-LONG",
          category: "on_page_seo",
          severity: "low",
          title: `Title Tag May Be Truncated (${len} chars)`,
          description: `Current title is ${len} characters. Google typically truncates titles over 65 characters (~600px).`,
          impact: "Truncated titles may cut off critical brand or product context in search snippets.",
          remediation: "Keep the most important keywords at the beginning and reduce title length under 65 characters.",
          scoreImpact: 2,
          affectedUrl: page.finalUrl,
          pageType: page.template,
          elementSelector: "title",
          confidence: "high",
          evidence: { title: page.title, length: len },
        });
      }
    }

    // 2. Meta Description Audits
    if (!page.metaDescription) {
      findings.push({
        ruleId: "ONPAGE-DESC-MISSING",
        category: "on_page_seo",
        severity: "high",
        title: "Missing Meta Description",
        description: "No <meta name='description'> tag was found on the page.",
        impact: "Search engines will auto-generate snippets from body text, leading to lower click-through rates.",
        remediation: "Add an engaging 120–160 character meta description highlighting key benefits or offers.",
        scoreImpact: 8,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: 'meta[name="description"]',
        confidence: "high",
      });
    } else {
      const descLen = page.metaDescription.length;
      if (descLen < 70) {
        findings.push({
          ruleId: "ONPAGE-DESC-SHORT",
          category: "on_page_seo",
          severity: "low",
          title: `Meta Description is Short (${descLen} chars)`,
          description: `Meta description is only ${descLen} characters. Optimal length is 120–160 characters.`,
          impact: "Does not fully capitalize on search snippet real estate to drive organic clicks.",
          remediation: "Provide richer product details, value propositions, and call to action.",
          scoreImpact: 2,
          affectedUrl: page.finalUrl,
          pageType: page.template,
          elementSelector: 'meta[name="description"]',
          confidence: "high",
          evidence: { description: page.metaDescription, length: descLen },
        });
      } else if (descLen > 160) {
        findings.push({
          ruleId: "ONPAGE-DESC-LONG",
          category: "on_page_seo",
          severity: "low",
          title: `Meta Description Exceeds Length Limit (${descLen} chars)`,
          description: `Meta description is ${descLen} characters and will likely be truncated on mobile SERP displays.`,
          impact: "Searchers will see truncated sentences ending in ellipsis (...).",
          remediation: "Edit the meta description to under 160 characters while retaining primary value proposition.",
          scoreImpact: 2,
          affectedUrl: page.finalUrl,
          pageType: page.template,
          elementSelector: 'meta[name="description"]',
          confidence: "high",
          evidence: { description: page.metaDescription, length: descLen },
        });
      }
    }

    // 3. Heading Structure Audits (H1)
    const h1Count = page.headings.h1.length;
    if (h1Count === 0) {
      findings.push({
        ruleId: "ONPAGE-H1-MISSING",
        category: "on_page_seo",
        severity: "high",
        title: "Missing Primary H1 Heading",
        description: "The page does not contain any <h1> heading element.",
        impact: "The H1 heading is a core structural topic signal for both search engines and assistive technologies.",
        remediation: "Add an H1 heading reflecting the main product, collection, or page title.",
        scoreImpact: 7,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: "h1",
        confidence: "high",
      });
    } else if (h1Count > 1) {
      findings.push({
        ruleId: "ONPAGE-H1-MULTIPLE",
        category: "on_page_seo",
        severity: "low",
        title: `Multiple H1 Headings Found (${h1Count})`,
        description: `Page declares ${h1Count} separate <h1> tags: ${page.headings.h1.map((h) => `'${h}'`).join(", ")}.`,
        impact: "While not a direct penalty, multiple H1s can dilute document outline clarity for accessibility and SEO.",
        remediation: "Retain one primary H1 for the main topic and convert secondary headings to H2 or H3.",
        scoreImpact: 2,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: "h1",
        confidence: "medium",
        evidence: { h1Headings: page.headings.h1 },
      });
    }

    // Check for skipped heading levels (e.g. H1 present, H2 absent, but H3 present)
    if (page.headings.h1.length > 0 && page.headings.h2.length === 0 && page.headings.h3.length > 0) {
      findings.push({
        ruleId: "ONPAGE-HEADING-SKIPPED",
        category: "on_page_seo",
        severity: "low",
        title: "Skipped Heading Level Hierarchy (H1 to H3)",
        description: "The document outline jumps directly from H1 to H3, skipping H2.",
        impact: "Disrupts logical document flow for screen readers and semantic content parsers.",
        remediation: "Ensure heading tags follow a sequential hierarchy: H1 followed by H2, then H3.",
        scoreImpact: 1,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        confidence: "medium",
      });
    }

    // 4. Image Alt Attributes
    const totalImages = page.images.length;
    const missingAltImages = page.images.filter((img) => img.alt === undefined);

    if (missingAltImages.length > 0) {
      findings.push({
        ruleId: "ONPAGE-IMG-NO-ALT",
        category: "on_page_seo",
        severity: "medium",
        title: `${missingAltImages.length} Image(s) Missing Alt Attribute`,
        description: `${missingAltImages.length} out of ${totalImages} image elements lack an alt attribute completely.`,
        impact: "Missing alt text harms image search visibility (Google Images) and violates WCAG 2.1 accessibility criteria.",
        remediation: "Add descriptive alt text to informative product/lifestyle images, or alt='' for purely decorative assets.",
        scoreImpact: Math.min(missingAltImages.length * 2, 8),
        affectedUrl: page.finalUrl,
        pageType: page.template,
        elementSelector: "img",
        confidence: "high",
        evidence: {
          totalImages,
          missingAltCount: missingAltImages.length,
          sampleUrls: missingAltImages.slice(0, 3).map((img) => img.src),
        },
      });
    }

    // 5. Internal Links
    const internalLinks = page.links.filter((l) => l.isInternal);
    if (page.template !== "homepage" && internalLinks.length < 3) {
      findings.push({
        ruleId: "ONPAGE-INTERNAL-LINKS-LOW",
        category: "on_page_seo",
        severity: "medium",
        title: `Low Internal Linking (${internalLinks.length} internal links)`,
        description: `This page has only ${internalLinks.length} internal links, indicating potential isolation in the site architecture.`,
        impact: "Orphaned or weakly linked pages receive less PageRank and are crawled less frequently by Googlebot.",
        remediation: "Link to this page from related collections, blog posts, footer, or navigation menus.",
        scoreImpact: 4,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        confidence: "medium",
        evidence: { internalLinksCount: internalLinks.length },
      });
    }

    // 6. Thin Content Check
    if (
      ["product", "article", "page"].includes(page.template) &&
      page.wordCount < 100
    ) {
      findings.push({
        ruleId: "ONPAGE-THIN-CONTENT",
        category: "on_page_seo",
        severity: "medium",
        title: `Thin Text Content (${page.wordCount} words)`,
        description: `Extracted body text contains approximately ${page.wordCount} words (excluding menus and boilerplate).`,
        impact: "Low-text pages struggle to rank for competitive long-tail search queries and may be viewed as low quality.",
        remediation: "Add thorough product descriptions, specifications, FAQs, sizing guides, or editorial content.",
        scoreImpact: 5,
        affectedUrl: page.finalUrl,
        pageType: page.template,
        confidence: "medium",
        evidence: { wordCount: page.wordCount },
      });
    }

    return findings;
  }
}
