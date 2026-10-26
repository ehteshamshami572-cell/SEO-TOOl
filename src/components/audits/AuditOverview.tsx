"use client";

import React from "react";
import { ExternalLink, Download, FileSpreadsheet, Printer } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface AuditOverviewProps {
  audit: {
    id: string;
    storeUrl: string;
    hostname: string;
    healthScore: number | null;
    techSeoScore: number | null;
    onPageScore: number | null;
    perfScore: number | null;
    deviceStrategy: string;
    createdAt: string;
    findingsSummary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
  };
}

export function AuditOverview({ audit }: AuditOverviewProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-600";
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return "bg-gray-50 border-gray-200";
    if (score >= 80) return "bg-emerald-50/50 border-emerald-200/80";
    if (score >= 50) return "bg-amber-50/50 border-amber-200/80";
    return "bg-red-50/50 border-red-200/80";
  };

  const downloadExport = (format: "json" | "csv" | "html") => {
    if (format === "html") {
      window.open(`/api/audits/${audit.id}/export?format=html`, "_blank");
    } else {
      window.location.href = `/api/audits/${audit.id}/export?format=${format}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8 mb-8">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {audit.hostname}
            </h1>
            <a
              href={audit.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#008060] transition-colors"
              title="Open storefront"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Audited on {new Date(audit.createdAt).toLocaleString()} | Device:{" "}
            <span className="capitalize font-medium text-gray-700">{audit.deviceStrategy}</span>
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadExport("csv")}
            className="text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadExport("json")}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-blue-700" />
            Export JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadExport("html")}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-gray-700" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className={`p-5 rounded-xl border ${getScoreBg(audit.healthScore)} flex flex-col justify-between`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Overall Health Score
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-4xl font-extrabold ${getScoreColor(audit.healthScore)}`}>
              {audit.healthScore ?? "—"}
            </span>
            <span className="text-sm font-medium text-gray-400">/ 100</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Weighted aggregate of technical, on-page, and Core Web Vitals health.
          </p>
        </div>

        <div className={`p-5 rounded-xl border ${getScoreBg(audit.techSeoScore)} flex flex-col justify-between`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Technical SEO
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-4xl font-extrabold ${getScoreColor(audit.techSeoScore)}`}>
              {audit.techSeoScore ?? "—"}
            </span>
            <span className="text-sm font-medium text-gray-400">/ 100</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Evaluates sitemaps, robots.txt, canonical signals, and HTTP status codes.
          </p>
        </div>

        <div className={`p-5 rounded-xl border ${getScoreBg(audit.onPageScore)} flex flex-col justify-between`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            On-Page & Schema
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-4xl font-extrabold ${getScoreColor(audit.onPageScore)}`}>
              {audit.onPageScore ?? "—"}
            </span>
            <span className="text-sm font-medium text-gray-400">/ 100</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Checks metadata length, heading hierarchy, image alts, and JSON-LD schema.
          </p>
        </div>

        <div className={`p-5 rounded-xl border ${getScoreBg(audit.perfScore)} flex flex-col justify-between`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            PageSpeed & CWV
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-4xl font-extrabold ${getScoreColor(audit.perfScore)}`}>
              {audit.perfScore ?? "—"}
            </span>
            <span className="text-sm font-medium text-gray-400">/ 100</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Google Lighthouse lab metrics and Chrome UX Report field signals.
          </p>
        </div>
      </div>

      {/* Severity Breakdown Bar */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider mr-2">
          Severity Breakdown:
        </span>
        <Badge variant="critical">{audit.findingsSummary.critical} Critical</Badge>
        <Badge variant="high">{audit.findingsSummary.high} High</Badge>
        <Badge variant="medium">{audit.findingsSummary.medium} Medium</Badge>
        <Badge variant="low">{audit.findingsSummary.low} Low</Badge>
        <Badge variant="info">{audit.findingsSummary.info} Info</Badge>
      </div>
    </div>
  );
}
