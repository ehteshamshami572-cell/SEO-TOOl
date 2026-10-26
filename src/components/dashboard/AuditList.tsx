"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle, Clock, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { Badge } from "../ui/badge";

interface AuditSummaryItem {
  id: string;
  storeUrl: string;
  hostname: string;
  status: string;
  healthScore: number | null;
  techSeoScore: number | null;
  onPageScore: number | null;
  perfScore: number | null;
  pagesCrawled: number;
  findingsCount: number;
  deviceStrategy: string;
  createdAt: string;
}

export function AuditList() {
  const [audits, setAudits] = useState<AuditSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudits() {
      try {
        const res = await fetch("/api/audits?limit=15");
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setAudits(data.items);
        }
      } catch (err) {
        console.error("Failed to load audit history", err);
      } finally {
        setLoading(false);
      }
    }

    loadAudits();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "PARTIAL":
        return <Badge variant="medium">Partial</Badge>;
      case "FAILED":
        return <Badge variant="critical">Failed</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        Loading audit history...
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <h3 className="text-base font-semibold text-gray-900">No Audits Run Yet</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          Enter any public Shopify storefront URL above to generate your first technical SEO and Core Web Vitals audit.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">Store Audit History</h3>
          <p className="text-xs text-gray-500 mt-0.5">Historical crawls and performance tracking over time</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50/75 text-gray-600 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3">Storefront</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Health Score</th>
              <th className="px-6 py-3">Pages Crawled</th>
              <th className="px-6 py-3">Issues Found</th>
              <th className="px-6 py-3">Audited</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {audits.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[220px]" title={item.storeUrl}>
                      {item.hostname}
                    </span>
                    <a
                      href={item.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">
                    {item.deviceStrategy}
                  </span>
                </td>
                <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                <td className="px-6 py-4">
                  {item.healthScore !== null ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-base font-bold ${
                          item.healthScore >= 80
                            ? "text-emerald-600"
                            : item.healthScore >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.healthScore}
                      </span>
                      <span className="text-xs text-gray-400">/ 100</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">{item.pagesCrawled}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.findingsCount} findings
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/audits/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#008060] hover:text-[#004c3f] transition-colors"
                  >
                    View Report
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
