"use client";

import React from "react";
import { Gauge, Zap, Smartphone, Monitor, Code, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";

interface PageSpeedDashboardProps {
  metric: {
    strategy: string;
    performanceScore: number | null;
    fcpMs: number | null;
    lcpMs: number | null;
    cls: number | null;
    tbtMs: number | null;
    speedIndexMs: number | null;
    fieldLcpMs?: number | null;
    fieldCls?: number | null;
    fieldInpMs?: number | null;
    thirdPartyScriptsCount: number;
    thirdPartyTransferBytes: number;
    rawDiagnostics?: string | null;
  } | null;
}

export function PageSpeedDashboard({ metric }: PageSpeedDashboardProps) {
  if (!metric) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8 text-center">
        <Gauge className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <h4 className="font-semibold text-gray-800 text-sm">Google PageSpeed Not Configured</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          To run Core Web Vitals and Lighthouse audits, provide a valid GOOGLE_PAGESPEED_API_KEY in your environment configuration.
        </p>
      </div>
    );
  }

  const getCwvStatus = (metricName: "lcp" | "cls" | "tbt", value: number | null) => {
    if (value === null) return { status: "unknown", color: "text-gray-400", bg: "bg-gray-50 border-gray-200" };

    if (metricName === "lcp") {
      if (value <= 2500) return { status: "Good", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
      if (value <= 4000) return { status: "Needs Work", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
      return { status: "Poor", color: "text-red-600", bg: "bg-red-50 border-red-200" };
    }

    if (metricName === "cls") {
      if (value <= 0.1) return { status: "Good", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
      if (value <= 0.25) return { status: "Needs Work", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
      return { status: "Poor", color: "text-red-600", bg: "bg-red-50 border-red-200" };
    }

    if (metricName === "tbt") {
      if (value <= 200) return { status: "Good", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
      if (value <= 600) return { status: "Needs Work", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
      return { status: "Poor", color: "text-red-600", bg: "bg-red-50 border-red-200" };
    }

    return { status: "Good", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  };

  const lcpStatus = getCwvStatus("lcp", metric.lcpMs);
  const clsStatus = getCwvStatus("cls", metric.cls);
  const tbtStatus = getCwvStatus("tbt", metric.tbtMs);

  const thirdPartyKb = Math.round((metric.thirdPartyTransferBytes || 0) / 1024);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              Google PageSpeed Insights & Core Web Vitals
            </h3>
            <p className="text-xs text-gray-500">
              Evaluated on {metric.strategy === "mobile" ? "Mobile Viewport (Moto G4)" : "Desktop Viewport"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="capitalize flex items-center gap-1">
            {metric.strategy === "mobile" ? (
              <Smartphone className="w-3 h-3" />
            ) : (
              <Monitor className="w-3 h-3" />
            )}
            {metric.strategy} Strategy
          </Badge>
        </div>
      </div>

      {/* CWV Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {/* LCP */}
        <div className={`p-4 rounded-xl border ${lcpStatus.bg}`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Largest Contentful Paint (LCP)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lcpStatus.color} bg-white shadow-xs`}>
              {lcpStatus.status}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-3xl font-extrabold ${lcpStatus.color}`}>
              {metric.lcpMs ? (metric.lcpMs / 1000).toFixed(2) : "—"}
            </span>
            <span className="text-xs font-medium text-gray-500">seconds</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Target: <strong>≤ 2.5s</strong> | Measured via Lighthouse Lab
          </p>
        </div>

        {/* CLS */}
        <div className={`p-4 rounded-xl border ${clsStatus.bg}`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Cumulative Layout Shift (CLS)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${clsStatus.color} bg-white shadow-xs`}>
              {clsStatus.status}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-3xl font-extrabold ${clsStatus.color}`}>
              {metric.cls !== null ? metric.cls : "—"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Target: <strong>≤ 0.1</strong> | Visual stability rating
          </p>
        </div>

        {/* TBT */}
        <div className={`p-4 rounded-xl border ${tbtStatus.bg}`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Total Blocking Time (TBT)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tbtStatus.color} bg-white shadow-xs`}>
              {tbtStatus.status}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-3xl font-extrabold ${tbtStatus.color}`}>
              {metric.tbtMs !== null ? metric.tbtMs : "—"}
            </span>
            <span className="text-xs font-medium text-gray-500">ms</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Target: <strong>≤ 200ms</strong> | Lab proxy for INP responsiveness
          </p>
        </div>
      </div>

      {/* Diagnostics / Third-party Overhead */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-[#008060]" />
            <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              Third-Party Shopify App Overhead
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Detected <strong>{metric.thirdPartyScriptsCount}</strong> third-party script origins transferring approximately{" "}
            <strong>{thirdPartyKb} KB</strong> of payload.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              Lighthouse Lab Milestones
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>FCP: <strong>{metric.fcpMs ? `${(metric.fcpMs / 1000).toFixed(2)}s` : "—"}</strong></div>
            <div>Speed Index: <strong>{metric.speedIndexMs ? `${(metric.speedIndexMs / 1000).toFixed(2)}s` : "—"}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
