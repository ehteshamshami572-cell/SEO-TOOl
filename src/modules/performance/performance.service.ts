import { AuditFinding } from "../audits/audit.types";
import { PageSpeedResult } from "./pagespeed.client";

export class PerformanceService {
  /**
   * Generates structured AuditFinding objects from actual PageSpeed results
   */
  public static generateFindings(result: PageSpeedResult): AuditFinding[] {
    const findings: AuditFinding[] = [];

    if (!result.isAvailable || !result.labMetrics) {
      return findings;
    }

    const { performanceScore, labMetrics, fieldMetrics, diagnostics, url, strategy } = result;

    // 1. Poor Performance Score
    if (performanceScore !== undefined && performanceScore < 50) {
      findings.push({
        ruleId: "PERF-SCORE-POOR",
        category: "performance",
        severity: "high",
        title: `Low Lighthouse Performance Score (${performanceScore}/100)`,
        description: `Mobile Lighthouse performance score is ${performanceScore}/100. Google considers scores under 50 poor.`,
        impact: "Slow loading speeds lead to higher abandonment rates, lower conversion, and negative Page Experience signals.",
        remediation: "Audit render-blocking scripts, optimize uncompressed Shopify theme assets, and defer non-critical app tags.",
        scoreImpact: 15,
        affectedUrl: url,
        confidence: "high",
        evidence: { performanceScore, strategy },
      });
    }

    // 2. Slow Largest Contentful Paint (LCP)
    const effectiveLcpMs = fieldMetrics?.lcpMs ?? labMetrics.lcpMs;
    if (effectiveLcpMs > 2500) {
      const lcpSec = (effectiveLcpMs / 1000).toFixed(2);
      findings.push({
        ruleId: "PERF-LCP-SLOW",
        category: "performance",
        severity: "high",
        title: `Slow Largest Contentful Paint (${lcpSec}s)`,
        description: `LCP measurement is ${lcpSec} seconds (threshold is ≤ 2.5s). Measured via ${fieldMetrics?.lcpMs ? "CrUX Field Data" : "Lighthouse Lab"}.`,
        impact: "Core Web Vitals failure: Main content takes too long to render on mobile viewports.",
        remediation: "Preload the primary hero image with `<link rel='preload'>`, avoid lazy-loading above-the-fold banners, and compress hero graphics.",
        scoreImpact: 10,
        affectedUrl: url,
        confidence: "high",
        evidence: { lcpMs: effectiveLcpMs, source: fieldMetrics?.lcpMs ? "CrUX" : "Lab" },
      });
    }

    // 3. High Cumulative Layout Shift (CLS)
    const effectiveCls = fieldMetrics?.cls ?? labMetrics.cls;
    if (effectiveCls > 0.1) {
      findings.push({
        ruleId: "PERF-CLS-HIGH",
        category: "performance",
        severity: "high",
        title: `Excessive Layout Shift (CLS: ${effectiveCls})`,
        description: `Cumulative Layout Shift is ${effectiveCls} (Google good threshold is ≤ 0.1).`,
        impact: "Unexpected page shifts frustrate users and cause accidental mis-clicks during storefront navigation.",
        remediation: "Add explicit width and height attributes to banners and images; reserve fixed CSS aspect-ratio placeholders for promotional bars.",
        scoreImpact: 8,
        affectedUrl: url,
        confidence: "high",
        evidence: { cls: effectiveCls, source: fieldMetrics?.cls ? "CrUX" : "Lab" },
      });
    }

    // 4. High Total Blocking Time (TBT)
    if (labMetrics.tbtMs > 300) {
      findings.push({
        ruleId: "PERF-TBT-HIGH",
        category: "performance",
        severity: "medium",
        title: `High Total Blocking Time (${labMetrics.tbtMs}ms)`,
        description: `Main thread was blocked for ${labMetrics.tbtMs}ms during page load (threshold is ≤ 200ms).`,
        impact: "Blocks user input and scrolling while heavy JavaScript parses and executes.",
        remediation: "Defer non-essential Shopify app scripts using `defer` or `type='module'`; remove redundant tracking scripts.",
        scoreImpact: 6,
        affectedUrl: url,
        confidence: "high",
        evidence: { tbtMs: labMetrics.tbtMs },
      });
    }

    // 5. Heavy Third-Party Scripts
    if (diagnostics && (diagnostics.thirdPartyScriptsCount > 15 || diagnostics.thirdPartyTransferBytes > 500 * 1024)) {
      const kb = Math.round(diagnostics.thirdPartyTransferBytes / 1024);
      findings.push({
        ruleId: "PERF-THIRD-PARTY-HEAVY",
        category: "performance",
        severity: "medium",
        title: `Heavy Third-Party App Overhead (${diagnostics.thirdPartyScriptsCount} scripts, ${kb} KB)`,
        description: `Detected ${diagnostics.thirdPartyScriptsCount} third-party scripts totaling ${kb} KB of network payload.`,
        impact: "App bloat is the #1 reason Shopify storefronts suffer degraded performance and slow mobile responsiveness.",
        remediation: "Audit installed Shopify apps, uninstall unused plugins, and consolidate tracking pixels through Google Tag Manager.",
        scoreImpact: 5,
        affectedUrl: url,
        confidence: "medium",
        evidence: {
          scriptCount: diagnostics.thirdPartyScriptsCount,
          transferKb: kb,
        },
      });
    }

    return findings;
  }
}
