import { AuditFinding } from "../audits/audit.types";

export class ReportExporter {
  /**
   * Generates formatted JSON export
   */
  public static exportAsJson(auditData: Record<string, unknown>): string {
    return JSON.stringify(auditData, null, 2);
  }

  /**
   * Generates RFC 4180 compliant CSV string of findings
   */
  public static exportAsCsv(findings: Array<Record<string, unknown>>): string {
    const headers = [
      "ID",
      "Rule ID",
      "Category",
      "Severity",
      "Title",
      "Affected URL",
      "Template",
      "Impact",
      "Remediation",
      "Score Impact",
      "Status",
    ];

    const escapeCsvField = (field: unknown): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = findings.map((f) => [
      escapeCsvField(f.id),
      escapeCsvField(f.ruleId),
      escapeCsvField(f.category),
      escapeCsvField(f.severity),
      escapeCsvField(f.title),
      escapeCsvField(f.url || f.affectedUrl),
      escapeCsvField(f.template || f.pageType),
      escapeCsvField(f.impact),
      escapeCsvField(f.remediation),
      escapeCsvField(f.scoreImpact),
      escapeCsvField(f.status || "open"),
    ]);

    const lines = [headers.join(","), ...rows.map((r) => r.join(","))];
    return lines.join("\r\n");
  }

  /**
   * Generates printable executive HTML report
   */
  public static exportAsHtml(audit: Record<string, any>): string {
    const findings: any[] = audit.findings || [];
    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;

    const pageSpeed = audit.pageSpeed || {};

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEO & Performance Audit Report - ${audit.hostname}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #1f2937; margin: 40px; background: #fff; }
    h1, h2, h3 { color: #111827; }
    .header { border-bottom: 2px solid #008060; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #e0e7ff; color: #3730a3; }
    .score-card { display: inline-block; padding: 16px 24px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; margin-right: 16px; text-align: center; }
    .score-val { font-size: 32px; font-weight: bold; color: #008060; }
    .score-label { font-size: 13px; color: #6b7280; text-transform: uppercase; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    .cwv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 12px; }
    .cwv-box { padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin: 0;">Shopify SEO & Performance Audit</h1>
      <p style="margin: 4px 0 0; color: #4b5563;">Store: <strong>${audit.storeUrl}</strong> | Date: ${new Date(audit.createdAt).toLocaleDateString()}</p>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 13px; color: #6b7280;">Audit ID: ${audit.id}</span>
    </div>
  </div>

  <h2>Audit Score Overview</h2>
  <div style="margin-bottom: 24px;">
    <div class="score-card">
      <div class="score-val">${audit.healthScore ?? "N/A"}</div>
      <div class="score-label">Overall Health</div>
    </div>
    <div class="score-card">
      <div class="score-val">${audit.techSeoScore ?? "N/A"}</div>
      <div class="score-label">Technical SEO</div>
    </div>
    <div class="score-card">
      <div class="score-val">${audit.onPageScore ?? "N/A"}</div>
      <div class="score-label">On-Page SEO</div>
    </div>
    <div class="score-card">
      <div class="score-val">${audit.perfScore ?? "N/A"}</div>
      <div class="score-label">Performance</div>
    </div>
  </div>

  <h2>Summary of Issues</h2>
  <p>Total Findings: <strong>${findings.length}</strong> | 
    <span class="badge badge-critical">${criticalCount} Critical</span>
    <span class="badge badge-high">${highCount} High</span>
    <span class="badge badge-medium">${mediumCount} Medium</span>
    <span class="badge badge-low">${lowCount} Low</span>
  </p>

  ${
    pageSpeed.performanceScore !== undefined
      ? `<h2>Core Web Vitals & Performance (${pageSpeed.strategy})</h2>
  <div class="cwv-grid">
    <div class="cwv-box">
      <strong>Largest Contentful Paint (LCP)</strong>
      <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${pageSpeed.lcpMs ? (pageSpeed.lcpMs / 1000).toFixed(2) + "s" : "N/A"}</div>
      <small style="color: #6b7280;">Good threshold: ≤ 2.5s</small>
    </div>
    <div class="cwv-box">
      <strong>Cumulative Layout Shift (CLS)</strong>
      <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${pageSpeed.cls ?? "N/A"}</div>
      <small style="color: #6b7280;">Good threshold: ≤ 0.1</small>
    </div>
    <div class="cwv-box">
      <strong>Total Blocking Time (TBT)</strong>
      <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${pageSpeed.tbtMs ? pageSpeed.tbtMs + "ms" : "N/A"}</div>
      <small style="color: #6b7280;">Good threshold: ≤ 200ms</small>
    </div>
  </div>`
      : ""
  }

  <h2>Actionable Findings & Remediation</h2>
  <table>
    <thead>
      <tr>
        <th>Severity</th>
        <th>Issue</th>
        <th>Category</th>
        <th>Affected URL</th>
        <th>Remediation Plan</th>
      </tr>
    </thead>
    <tbody>
      ${findings
        .map(
          (f) => `
        <tr>
          <td><span class="badge badge-${f.severity}">${f.severity}</span></td>
          <td><strong>${f.title}</strong><br><small style="color: #6b7280;">${f.description}</small></td>
          <td>${f.category}</td>
          <td><code style="font-size: 12px;">${f.url}</code></td>
          <td>${f.remediation}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
  }
}
