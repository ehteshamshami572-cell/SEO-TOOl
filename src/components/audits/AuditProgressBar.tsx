"use client";

import React from "react";
import { CheckCircle2, Circle, Loader2, XCircle, StopCircle } from "lucide-react";
import { Button } from "../ui/button";

interface AuditProgressBarProps {
  status: string;
  pagesCrawled: number;
  pagesDiscovered: number;
  findingsCount: number;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export function AuditProgressBar({
  status,
  pagesCrawled,
  pagesDiscovered,
  findingsCount,
  onCancel,
  isCancelling,
}: AuditProgressBarProps) {
  const stages = [
    { key: "PENDING", label: "Queued" },
    { key: "DISCOVERING", label: "Discovering Sitemaps & robots.txt" },
    { key: "CRAWLING", label: "Crawling Storefront HTML" },
    { key: "ANALYZING", label: "PageSpeed & Core Web Vitals" },
    { key: "FINALIZING", label: "Deduplicating & Scoring" },
    { key: "COMPLETED", label: "Audit Complete" },
  ];

  const getStageIndex = (current: string) => {
    switch (current) {
      case "PENDING":
        return 0;
      case "DISCOVERING":
        return 1;
      case "CRAWLING":
        return 2;
      case "ANALYZING":
        return 3;
      case "FINALIZING":
        return 4;
      case "COMPLETED":
      case "PARTIAL":
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(status);
  const isTerminated = ["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"].includes(status);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Live Crawl Engine Progress
          </span>
          <div className="flex items-center gap-2 mt-1">
            {!isTerminated && <Loader2 className="w-4 h-4 text-[#008060] animate-spin" />}
            {status === "COMPLETED" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {status === "FAILED" && <XCircle className="w-5 h-5 text-red-600" />}
            {status === "CANCELLED" && <XCircle className="w-5 h-5 text-gray-500" />}
            <h3 className="font-bold text-gray-900 text-lg">
              {status === "COMPLETED"
                ? "Storefront Audit Completed"
                : status === "PARTIAL"
                ? "Audit Completed (with some crawl warnings)"
                : status === "FAILED"
                ? "Audit Failed"
                : status === "CANCELLED"
                ? "Audit Cancelled"
                : `Auditing in progress: ${stages[currentIndex]?.label || status}`}
            </h3>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500">Pages: </span>
            <strong className="text-gray-900 font-semibold">
              {pagesCrawled} / {pagesDiscovered || pagesCrawled}
            </strong>
          </div>
          <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500">Findings: </span>
            <strong className="text-gray-900 font-semibold">{findingsCount}</strong>
          </div>
          {!isTerminated && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              isLoading={isCancelling}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-6">
        {stages.map((stage, idx) => {
          const isDone = currentIndex > idx || status === "COMPLETED" || status === "PARTIAL";
          const isCurrent = currentIndex === idx && !isTerminated;

          return (
            <div key={stage.key} className="flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isDone
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                    ? "bg-[#008060] text-white ring-4 ring-emerald-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[11px] mt-2 font-medium leading-tight line-clamp-2 ${
                  isCurrent ? "text-gray-900 font-bold" : isDone ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
