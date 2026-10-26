"use client";

import React, { useState } from "react";
import { FileText, ExternalLink, Search, Check, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "../ui/badge";

interface PageItem {
  id: string;
  url: string;
  path: string;
  template: string;
  statusCode: number | null;
  title: string | null;
  canonicalUrl: string | null;
  isIndexable: boolean;
  wordCount: number;
}

interface DiscoveredPagesTableProps {
  pages: PageItem[];
  onSelectPage?: (url: string) => void;
}

export function DiscoveredPagesTable({ pages, onSelectPage }: DiscoveredPagesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPages = pages.filter((p) =>
    p.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (code: number | null) => {
    if (code === null) return <span className="text-gray-400">—</span>;
    if (code >= 200 && code < 300) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
          {code} OK
        </span>
      );
    }
    if (code >= 300 && code < 400) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
          {code} REDIR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
        {code} ERR
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#008060]" />
          <div>
            <h3 className="font-bold text-gray-900 text-base">Discovered Storefront Pages ({pages.length})</h3>
            <p className="text-xs text-gray-500">
              Coverage map across Shopify products, collections, blog posts, and pages
            </p>
          </div>
        </div>

        {/* Filter input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#008060]"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2.5">Page URL & Title</th>
              <th className="px-4 py-2.5">Template</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-center">Words</th>
              <th className="px-4 py-2.5 text-center">Indexable</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3 max-w-sm">
                  <div className="font-medium text-gray-900 truncate" title={page.title || page.path}>
                    {page.title || page.path}
                  </div>
                  <div className="text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                    <span>{page.path}</span>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-600"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="neutral" className="capitalize text-[10px]">
                    {page.template}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">{getStatusBadge(page.statusCode)}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-600">{page.wordCount}</td>
                <td className="px-4 py-3 text-center">
                  {page.isIndexable ? (
                    <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                      <Check className="w-3.5 h-3.5 mr-0.5" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-amber-600 font-medium">
                      <XCircle className="w-3.5 h-3.5 mr-0.5" /> Noindex
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {onSelectPage && (
                    <button
                      type="button"
                      onClick={() => onSelectPage(page.url)}
                      className="text-xs font-semibold text-[#008060] hover:text-[#004c3f]"
                    >
                      Filter Issues
                    </button>
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
