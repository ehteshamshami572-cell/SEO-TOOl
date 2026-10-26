"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CompareAuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [baseId, setBaseId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAudits() {
      try {
        const res = await fetch("/api/audits?limit=50");
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setAudits(data.items.filter((a: any) => ["COMPLETED", "PARTIAL"].includes(a.status)));
        }
      } catch (err) {
        console.error("Failed to load completed audits", err);
      }
    }
    loadAudits();
  }, []);

  const handleCompare = async () => {
    if (!baseId || !targetId || baseId === targetId) return;

    setLoading(true);
    try {
      const [baseRes, targetRes] = await Promise.all([
        fetch(`/api/audits/${baseId}`).then((r) => r.json()),
        fetch(`/api/audits/${targetId}`).then((r) => r.json()),
      ]);

      const base = baseRes.audit;
      const target = targetRes.audit;

      const scoreDiff = {
        health: (target.healthScore ?? 0) - (base.healthScore ?? 0),
        tech: (target.techSeoScore ?? 0) - (base.techSeoScore ?? 0),
        onPage: (target.onPageScore ?? 0) - (base.onPageScore ?? 0),
        perf: (target.perfScore ?? 0) - (base.perfScore ?? 0),
      };

      const baseKeys = new Set(base.findings.map((f: any) => `${f.ruleId}:${f.url}`));
      const targetKeys = new Set(target.findings.map((f: any) => `${f.ruleId}:${f.url}`));

      const resolved = base.findings.filter((f: any) => !targetKeys.has(`${f.ruleId}:${f.url}`));
      const newlyIntroduced = target.findings.filter((f: any) => !baseKeys.has(`${f.ruleId}:${f.url}`));

      setComparison({
        base,
        target,
        scoreDiff,
        resolved,
        newlyIntroduced,
      });
    } catch (err) {
      console.error("Comparison failed", err);
    } finally {
      setLoading(false);
    }
  };

  const renderDelta = (delta: number) => {
    if (delta > 0) {
      return (
        <span className="text-emerald-600 font-bold flex items-center gap-0.5 text-xs">
          <TrendingUp className="w-3.5 h-3.5" /> +{delta}
        </span>
      );
    }
    if (delta < 0) {
      return (
        <span className="text-red-600 font-bold flex items-center gap-0.5 text-xs">
          <TrendingDown className="w-3.5 h-3.5" /> {delta}
        </span>
      );
    }
    return (
      <span className="text-gray-400 font-bold flex items-center gap-0.5 text-xs">
        <Minus className="w-3.5 h-3.5" /> 0
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
        <div className="max-w-2xl mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Compare Audits Over Time
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track remediation progress, score fluctuations, and newly emerged SEO issues between two audit runs.
          </p>
        </div>

        {/* Audit Selection Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Base Audit (Earlier Run)
            </label>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-[#008060]"
            >
              <option value="">Select an audit...</option>
              {audits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.hostname} — Score: {a.healthScore ?? "N/A"} ({new Date(a.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Target Audit (Recent Run)
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-[#008060]"
            >
              <option value="">Select an audit...</option>
              {audits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.hostname} — Score: {a.healthScore ?? "N/A"} ({new Date(a.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            size="md"
            onClick={handleCompare}
            disabled={!baseId || !targetId || baseId === targetId}
            isLoading={loading}
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Compare Runs
          </Button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Score Delta Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Health Score Delta
              </span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {comparison.target.healthScore}
                </span>
                {renderDelta(comparison.scoreDiff.health)}
              </div>
              <span className="text-[11px] text-gray-400 mt-2">
                Base: {comparison.base.healthScore}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Technical SEO Delta
              </span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {comparison.target.techSeoScore}
                </span>
                {renderDelta(comparison.scoreDiff.tech)}
              </div>
              <span className="text-[11px] text-gray-400 mt-2">
                Base: {comparison.base.techSeoScore}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                On-Page SEO Delta
              </span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {comparison.target.onPageScore}
                </span>
                {renderDelta(comparison.scoreDiff.onPage)}
              </div>
              <span className="text-[11px] text-gray-400 mt-2">
                Base: {comparison.base.onPageScore}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                PageSpeed Delta
              </span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {comparison.target.perfScore ?? "—"}
                </span>
                {renderDelta(comparison.scoreDiff.perf)}
              </div>
              <span className="text-[11px] text-gray-400 mt-2">
                Base: {comparison.base.perfScore ?? "—"}
              </span>
            </div>
          </div>

          {/* Resolved vs New Issues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resolved Issues */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Resolved Findings ({comparison.resolved.length})
                </h3>
              </div>

              {comparison.resolved.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No resolved issues identified.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comparison.resolved.map((f: any) => (
                    <div key={f.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={f.severity}>{f.severity}</Badge>
                        <span className="font-semibold text-gray-900">{f.title}</span>
                      </div>
                      <p className="text-gray-500 text-[11px] truncate">{f.url}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newly Introduced Issues */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Newly Introduced Issues ({comparison.newlyIntroduced.length})
                </h3>
              </div>

              {comparison.newlyIntroduced.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No new regressions detected.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comparison.newlyIntroduced.map((f: any) => (
                    <div key={f.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={f.severity}>{f.severity}</Badge>
                        <span className="font-semibold text-gray-900">{f.title}</span>
                      </div>
                      <p className="text-gray-500 text-[11px] truncate">{f.url}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
