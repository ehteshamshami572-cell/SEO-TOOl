import Link from "next/link";
import { Sparkles, Activity, FileText, ArrowLeftRight } from "lucide-react";

export function Header() {
  return (
    <header className="bg-[#004c3f] text-white border-b border-[#00382e] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#008060] p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">ShopifySEO</span>
            <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 font-medium">
              Audit SaaS
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Audits</span>
          </Link>
          <Link
            href="/audits/compare"
            className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span>Compare</span>
          </Link>
          <a
            href="https://shopify.dev/docs/storefronts/themes/seo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors text-xs border border-emerald-700 px-3 py-1 rounded-md"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Shopify Docs</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
