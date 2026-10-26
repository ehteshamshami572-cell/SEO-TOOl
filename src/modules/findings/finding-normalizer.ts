import { AuditFinding, FindingSeverity } from "../audits/audit.types";

export class FindingNormalizer {
  /**
   * Deduplicates identical findings for the same URL and rule ID
   */
  public static deduplicate(findings: AuditFinding[]): AuditFinding[] {
    const seen = new Set<string>();
    const unique: AuditFinding[] = [];

    for (const f of findings) {
      const key = `${f.ruleId}:${f.affectedUrl}:${f.elementSelector || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(f);
      }
    }

    return unique;
  }

  /**
   * Calculates overall health score (0-100) and category subscores
   */
  public static calculateScores(findings: AuditFinding[], hasPageSpeed: boolean): {
    healthScore: number;
    techSeoScore: number;
    onPageScore: number;
    perfScore?: number;
  } {
    let techPenalties = 0;
    let onPagePenalties = 0;
    let perfPenalties = 0;

    for (const f of findings) {
      const penalty = f.scoreImpact || this.defaultPenaltyForSeverity(f.severity);

      if (f.category === "technical_seo" || f.category === "structured_data") {
        techPenalties += penalty;
      } else if (f.category === "on_page_seo" || f.category === "accessibility") {
        onPagePenalties += penalty;
      } else if (f.category === "performance") {
        perfPenalties += penalty;
      }
    }

    const techSeoScore = Math.max(0, 100 - techPenalties);
    const onPageScore = Math.max(0, 100 - onPagePenalties);

    if (hasPageSpeed) {
      const perfScore = Math.max(0, 100 - perfPenalties);
      // Weighted aggregate: 35% Tech, 35% On-Page, 30% Perf
      const healthScore = Math.round(
        techSeoScore * 0.35 + onPageScore * 0.35 + perfScore * 0.3
      );
      return { healthScore, techSeoScore, onPageScore, perfScore };
    } else {
      // 50% Tech, 50% On-Page
      const healthScore = Math.round(techSeoScore * 0.5 + onPageScore * 0.5);
      return { healthScore, techSeoScore, onPageScore };
    }
  }

  private static defaultPenaltyForSeverity(severity: FindingSeverity): number {
    switch (severity) {
      case "critical":
        return 15;
      case "high":
        return 8;
      case "medium":
        return 4;
      case "low":
        return 2;
      case "info":
        return 0;
    }
  }
}
