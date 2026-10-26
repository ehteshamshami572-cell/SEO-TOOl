"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Clock,
  EyeOff,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code,
  Sparkles,
} from "lucide-react";
import { Badge } from "../ui/badge";

interface FindingItem {
  id: string;
  ruleId: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  impact: string;
  remediation: string;
  scoreImpact: number;
  url: string;
  template: string;
  elementSelector: string | null;
  evidence: Record<string, unknown> | null;
  confidence: string;
  status: string;
}

interface FindingsExplorerProps {
  auditId: string;
  findings: FindingItem[];
  selectedTemplate?: string | null;
  selectedUrl?: string | null;
  onClearFilter?: () => void;
}

export function FindingsExplorer({
  auditId,
  findings: initialFindings,
  selectedTemplate,
  selectedUrl,
  onClearFilter,
}: FindingsExplorerProps) {
  const [findings, setFindings] = useState<FindingItem[]>(initialFindings);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Update remediation status
  const handleStatusChange = async (findingId: string, newStatus: string) => {
    setUpdatingId(findingId);
    try {
      const res = await fetch(`/api/audits/${auditId}/findings/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFindings((prev) =>
          prev.map((f) => (f.id === findingId ? { ...f, status: newStatus } : f))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const categories = [
    { key: "all", label: "All Categories" },
    { key: "technical_seo", label: "Technical SEO" },
    { key: "on_page_seo", label: "On-Page SEO" },
    { key: "structured_data", label: "Structured Data" },
    { key: "performance", label: "Performance" },
  ];

  // Filter findings
  const filtered = findings.filter((f) => {
    if (selectedCategory !== "all" && f.category !== selectedCategory) return false;
    if (selectedSeverity !== "all" && f.severity !== selectedSeverity) return false;
    if (selectedTemplate && f.template !== selectedTemplate) return false;
    if (selectedUrl && f.url !== selectedUrl) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchRule = f.ruleId.toLowerCase().includes(q);
      const matchUrl = f.url.toLowerCase().includes(q);
      if (!matchTitle && !matchRule && !matchUrl) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8">
      {/* Header with Title and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">
            Evidence-Backed Findings ({filtered.length})
          </h3>
          <p className="text-xs text-gray-500">
            Actionable, verifiable recommendations prioritized by search ranking and conversion impact
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active filter pill if filtered by template or URL */}
          {(selectedTemplate || selectedUrl) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span>Filter: {selectedTemplate || selectedUrl}</span>
              {onClearFilter && (
                <button
                  type="button"
                  onClick={onClearFilter}
                  className="font-bold hover:text-emerald-950 ml-1"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search issues, rules, URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#008060]"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs and Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-gray-100">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.key
                  ? "bg-[#008060] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Severity Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-[#008060]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
            <option value="info">Info Only</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="divide-y divide-gray-100 mt-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No findings match the current filter selection.
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="py-4 hover:bg-gray-50/50 transition-colors rounded-xl px-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={item.severity}>{item.severity}</Badge>
                      <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.ruleId}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {item.template} template
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>

                    <div className="text-xs text-gray-400 truncate flex items-center gap-1 mt-1">
                      <span>Affected URL:</span>
                      <code className="text-[11px] text-gray-700 font-mono truncate max-w-md">
                        {item.url}
                      </code>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Remediation Status Selector & Expand Toggle */}
                  <div className="flex sm:flex-col items-end gap-2 shrink-0">
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none ${
                        item.status === "fixed"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : item.status === "ignored"
                          ? "bg-gray-100 text-gray-600 border-gray-300"
                          : item.status === "in_progress"
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="fixed">Fixed</option>
                      <option value="ignored">Ignored</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs font-medium text-[#008060] hover:text-[#004c3f] flex items-center gap-0.5"
                    >
                      {isExpanded ? (
                        <>
                          Less Details <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Remediation <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/80 rounded-xl p-4 text-xs space-y-3">
                    <div>
                      <strong className="text-gray-900 block font-semibold mb-0.5">
                        Impact on Search & UX:
                      </strong>
                      <p className="text-gray-700">{item.impact}</p>
                    </div>

                    <div>
                      <strong className="text-gray-900 block font-semibold mb-0.5 text-[#008060]">
                        Recommended Remediation:
                      </strong>
                      <p className="text-gray-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 font-medium">
                        {item.remediation}
                      </p>
                    </div>

                    {item.elementSelector && (
                      <div>
                        <strong className="text-gray-900 block font-semibold mb-0.5">
                          Target DOM Selector:
                        </strong>
                        <code className="text-[11px] bg-white px-2 py-1 rounded border border-gray-200 font-mono text-gray-800">
                          {item.elementSelector}
                        </code>
                      </div>
                    )}

                    {item.evidence && Object.keys(item.evidence).length > 0 && (
                      <div>
                        <strong className="text-gray-900 block font-semibold mb-0.5 flex items-center gap-1">
                          <Code className="w-3.5 h-3.5 text-gray-500" />
                          Technical Evidence Context:
                        </strong>
                        <pre className="text-[11px] bg-gray-900 text-emerald-300 p-3 rounded-lg overflow-x-auto font-mono">
                          {JSON.stringify(item.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
