import { describe, it, expect } from "vitest";
import { FindingNormalizer } from "../src/modules/findings/finding-normalizer";
import { ReportExporter } from "../src/modules/reports/report-exporter";
import { AuditFinding } from "../src/modules/audits/audit.types";

describe("Scoring and Reporting", () => {
  it("deduplicates identical findings for the same URL", () => {
    const findings: AuditFinding[] = [
      {
        ruleId: "ONPAGE-TITLE-MISSING",
        category: "on_page_seo",
        severity: "critical",
        title: "Missing Title",
        description: "Test",
        impact: "Test",
        remediation: "Test",
        scoreImpact: 15,
        affectedUrl: "https://example.com/page1",
        confidence: "high",
      },
      {
        ruleId: "ONPAGE-TITLE-MISSING",
        category: "on_page_seo",
        severity: "critical",
        title: "Missing Title",
        description: "Test",
        impact: "Test",
        remediation: "Test",
        scoreImpact: 15,
        affectedUrl: "https://example.com/page1",
        confidence: "high",
      },
    ];

    const deduplicated = FindingNormalizer.deduplicate(findings);
    expect(deduplicated.length).toBe(1);
  });

  it("calculates health score dynamically based on severity weights", () => {
    const findings: AuditFinding[] = [
      {
        ruleId: "TECH-CANONICAL-MISSING",
        category: "technical_seo",
        severity: "high",
        title: "Missing Canonical",
        description: "Test",
        impact: "Test",
        remediation: "Test",
        scoreImpact: 10,
        affectedUrl: "https://example.com/page1",
        confidence: "high",
      },
      {
        ruleId: "ONPAGE-DESC-MISSING",
        category: "on_page_seo",
        severity: "medium",
        title: "Missing Meta Description",
        description: "Test",
        impact: "Test",
        remediation: "Test",
        scoreImpact: 8,
        affectedUrl: "https://example.com/page1",
        confidence: "high",
      },
    ];

    const scores = FindingNormalizer.calculateScores(findings, false);
    expect(scores.techSeoScore).toBe(90);
    expect(scores.onPageScore).toBe(92);
    expect(scores.healthScore).toBe(91);
  });

  it("exports valid RFC 4180 CSV with escaped quotes", () => {
    const findings = [
      {
        id: "1",
        ruleId: "ONPAGE-TITLE-LONG",
        category: "on_page_seo",
        severity: "low",
        title: 'Title with "Quotes" inside',
        url: "https://example.com/test",
        template: "product",
        impact: "Snippet truncation",
        remediation: 'Shorten under 65 chars, don\'t use ""',
        scoreImpact: 2,
        status: "open",
      },
    ];

    const csv = ReportExporter.exportAsCsv(findings);
    expect(csv).toContain("ID,Rule ID,Category");
    expect(csv).toContain('""Quotes""'); // Properly escaped double quotes
  });
});
