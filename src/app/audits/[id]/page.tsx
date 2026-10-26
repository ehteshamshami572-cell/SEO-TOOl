"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { AuditProgressBar } from "@/components/audits/AuditProgressBar";
import { AuditOverview } from "@/components/audits/AuditOverview";
import { TemplateBreakdown } from "@/components/audits/TemplateBreakdown";
import { DiscoveredPagesTable } from "@/components/audits/DiscoveredPagesTable";
import { PageSpeedDashboard } from "@/components/performance/PageSpeedDashboard";
import { FindingsExplorer } from "@/components/findings/FindingsExplorer";

interface PageProps {
  params: { id: string };
}

export default function AuditDetailPage({ params }: PageProps) {
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fetchAuditData = async () => {
    try {
      const res = await fetch(`/api/audits/${params.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load audit");
      }
      setAudit(data.audit);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();

    // Auto-poll every 2 seconds if audit is active
    const interval = setInterval(() => {
      if (
        audit &&
        ["PENDING", "DISCOVERING", "CRAWLING", "ANALYZING", "FINALIZING"].includes(
          audit.status
        )
      ) {
        fetchAuditData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [params.id, audit?.status]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/audits/${params.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchAuditData();
      }
    } catch (err) {
      console.error("Failed to cancel audit", err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading && !audit) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-[#008060] animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading storefront audit details...</p>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Audit Not Found</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">{error || "Could not retrieve audit records."}</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#008060] rounded-lg hover:bg-[#006e52]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Audits List
        </Link>
      </div>

      {/* Progress Stepper & Live Crawl Status */}
      <AuditProgressBar
        status={audit.status}
        pagesCrawled={audit.pagesCrawled}
        pagesDiscovered={audit.pagesDiscovered}
        findingsCount={audit.findingsCount}
        onCancel={handleCancel}
        isCancelling={isCancelling}
      />

      {/* Overview Score Cards */}
      <AuditOverview audit={audit} />

      {/* PageSpeed & Core Web Vitals */}
      {audit.runPageSpeed && <PageSpeedDashboard metric={audit.pageSpeed} />}

      {/* Shopify Template Breakdown */}
      {audit.templateBreakdown && (
        <TemplateBreakdown
          breakdown={audit.templateBreakdown}
          onSelectTemplate={(tmpl) => {
            setSelectedTemplate(tmpl);
            setSelectedUrl(null);
          }}
        />
      )}

      {/* Discovered Pages Coverage Table */}
      {audit.pages && audit.pages.length > 0 && (
        <DiscoveredPagesTable
          pages={audit.pages}
          onSelectPage={(url) => {
            setSelectedUrl(url);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Interactive Findings Explorer */}
      <FindingsExplorer
        auditId={audit.id}
        findings={audit.findings || []}
        selectedTemplate={selectedTemplate}
        selectedUrl={selectedUrl}
        onClearFilter={() => {
          setSelectedTemplate(null);
          setSelectedUrl(null);
        }}
      />
    </div>
  );
}
