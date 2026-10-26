import { AuditFinding, PageTemplateType } from "../audits/audit.types";

export interface TemplateAuditSummary {
  template: PageTemplateType;
  pageCount: number;
  totalFindings: number;
  findingsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  commonIssues: Array<{
    ruleId: string;
    title: string;
    count: number;
  }>;
}

export class TemplateGrouper {
  public static group(
    pages: Array<{ url: string; template: string }>,
    findings: AuditFinding[]
  ): Record<string, TemplateAuditSummary> {
    const summaryMap: Record<string, TemplateAuditSummary> = {};

    // Initialize templates
    for (const page of pages) {
      const tmpl = page.template || "unknown";
      if (!summaryMap[tmpl]) {
        summaryMap[tmpl] = {
          template: tmpl as PageTemplateType,
          pageCount: 0,
          totalFindings: 0,
          findingsBySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
          },
          commonIssues: [],
        };
      }
      summaryMap[tmpl].pageCount++;
    }

    // Accumulate findings
    const ruleOccurrences: Record<string, Record<string, { title: string; count: number }>> = {};

    for (const finding of findings) {
      const tmpl = finding.pageType || "unknown";
      if (!summaryMap[tmpl]) {
        summaryMap[tmpl] = {
          template: tmpl as PageTemplateType,
          pageCount: 1,
          totalFindings: 0,
          findingsBySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
          },
          commonIssues: [],
        };
      }

      summaryMap[tmpl].totalFindings++;
      if (finding.severity in summaryMap[tmpl].findingsBySeverity) {
        summaryMap[tmpl].findingsBySeverity[finding.severity]++;
      }

      if (!ruleOccurrences[tmpl]) {
        ruleOccurrences[tmpl] = {};
      }
      if (!ruleOccurrences[tmpl][finding.ruleId]) {
        ruleOccurrences[tmpl][finding.ruleId] = { title: finding.title, count: 0 };
      }
      ruleOccurrences[tmpl][finding.ruleId].count++;
    }

    // Sort common issues
    for (const tmpl of Object.keys(summaryMap)) {
      if (ruleOccurrences[tmpl]) {
        summaryMap[tmpl].commonIssues = Object.entries(ruleOccurrences[tmpl])
          .map(([ruleId, data]) => ({
            ruleId,
            title: data.title,
            count: data.count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }
    }

    return summaryMap;
  }
}
