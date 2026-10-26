"use client";

import React from "react";
import { Layers, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";

interface TemplateBreakdownProps {
  breakdown: Record<
    string,
    {
      template: string;
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
  >;
  onSelectTemplate?: (template: string) => void;
}

export function TemplateBreakdown({ breakdown, onSelectTemplate }: TemplateBreakdownProps) {
  const templates = Object.values(breakdown || {});

  if (templates.length === 0) {
    return null;
  }

  const formatTemplateName = (name: string) => {
    switch (name) {
      case "homepage":
        return "Homepage";
      case "product":
        return "Product Pages";
      case "collection":
        return "Collection Pages";
      case "page":
        return "Standard Pages";
      case "blog":
        return "Blog Listing";
      case "article":
        return "Blog Articles";
      default:
        return name;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-[#008060]" />
        <div>
          <h3 className="font-bold text-gray-900 text-base">Shopify Template Breakdown</h3>
          <p className="text-xs text-gray-500">
            SEO and performance issues grouped by Shopify theme template architecture
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3 text-center">Audited Pages</th>
              <th className="px-4 py-3 text-center">Total Issues</th>
              <th className="px-4 py-3">Severity Breakdown</th>
              <th className="px-4 py-3">Most Common Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {templates.map((tmpl) => (
              <tr
                key={tmpl.template}
                className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                onClick={() => onSelectTemplate && onSelectTemplate(tmpl.template)}
              >
                <td className="px-4 py-3 font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{formatTemplateName(tmpl.template)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-700 font-medium">
                  {tmpl.pageCount}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      tmpl.totalFindings > 5
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tmpl.totalFindings}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tmpl.findingsBySeverity.critical > 0 && (
                      <Badge variant="critical">
                        {tmpl.findingsBySeverity.critical} crit
                      </Badge>
                    )}
                    {tmpl.findingsBySeverity.high > 0 && (
                      <Badge variant="high">
                        {tmpl.findingsBySeverity.high} high
                      </Badge>
                    )}
                    {tmpl.findingsBySeverity.medium > 0 && (
                      <Badge variant="medium">
                        {tmpl.findingsBySeverity.medium} med
                      </Badge>
                    )}
                    {tmpl.findingsBySeverity.low > 0 && (
                      <Badge variant="low">
                        {tmpl.findingsBySeverity.low} low
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {tmpl.commonIssues && tmpl.commonIssues.length > 0 ? (
                    <div className="space-y-1">
                      {tmpl.commonIssues.slice(0, 2).map((issue) => (
                        <div key={issue.ruleId} className="text-xs text-gray-600 truncate max-w-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{issue.title}</span>
                          <span className="text-gray-400 font-medium">({issue.count})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">No major issues</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
