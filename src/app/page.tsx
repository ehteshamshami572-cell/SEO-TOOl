import { AuditForm } from "@/components/dashboard/AuditForm";
import { AuditList } from "@/components/dashboard/AuditList";
import { Sparkles, ShieldCheck, Zap, Activity } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Intro */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004c3f] to-[#008060] text-white p-8 sm:p-10 shadow-lg">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Public Storefront Auditing Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Shopify SEO & Core Web Vitals Audit Platform
          </h1>
          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Audit any publicly accessible Shopify store without Admin credentials.
            Discover pages, validate robots.txt and sitemaps, inspect JSON-LD structured data, detect heading flaws, and diagnose PageSpeed performance.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-700/50 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>SSRF-Guarded Fetch</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-300" />
              <span>Lighthouse Lab + Field</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-300" />
              <span>Evidence-Backed Rules</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Audit Creation Form */}
      <AuditForm />

      {/* Audit History & Recent Storefronts */}
      <AuditList />
    </div>
  );
}
