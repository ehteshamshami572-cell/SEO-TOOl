"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Globe, Smartphone, Monitor, Gauge, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";

export function AuditForm() {
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState("");
  const [maxPages, setMaxPages] = useState(25);
  const [deviceStrategy, setDeviceStrategy] = useState<"mobile" | "desktop">("mobile");
  const [runPageSpeed, setRunPageSpeed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeUrl.trim()) {
      setErrorMessage("Please enter a valid Shopify storefront URL.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeUrl: storeUrl.trim(),
          maxPages,
          deviceStrategy,
          runPageSpeed,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate storefront audit.");
      }

      router.push(`/audits/${data.audit.id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred starting the audit.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
      <div className="max-w-3xl">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Audit Public Shopify Storefront
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Crawls public storefront HTML, inspects sitemaps, robots.txt, heading structures, canonicals, JSON-LD, and runs Google PageSpeed Core Web Vitals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Storefront Domain or URL
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Globe className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={storeUrl}
              onChange={(e) => {
                setStoreUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. https://kith.com or gymshark.myshopify.com"
              className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#008060] focus:border-[#008060] outline-none transition-shadow"
              required
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Audit Blocked: </strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Crawl Page Budget
            </label>
            <select
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-[#008060] focus:border-[#008060] outline-none"
            >
              <option value={10}>10 Pages (Quick Pulse)</option>
              <option value={25}>25 Pages (Standard MVP)</option>
              <option value={50}>50 Pages (Deep Audit)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Device Strategy
            </label>
            <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setDeviceStrategy("mobile")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  deviceStrategy === "mobile"
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setDeviceStrategy("desktop")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  deviceStrategy === "desktop"
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="block text-xs font-medium text-gray-600 mb-1.5">
              Performance Check
            </span>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={runPageSpeed}
                onChange={(e) => setRunPageSpeed(e.target.checked)}
                className="w-4 h-4 text-[#008060] border-gray-300 rounded focus:ring-[#008060]"
              />
              <span className="text-xs text-gray-700 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-gray-500" />
                Include Google PageSpeed
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full sm:w-auto px-8"
          >
            <Search className="w-4 h-4 mr-2" />
            Start Store Audit
          </Button>
        </div>
      </form>
    </div>
  );
}
