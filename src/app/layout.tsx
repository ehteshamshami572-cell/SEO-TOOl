import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/dashboard/Header";

export const metadata: Metadata = {
  title: "Shopify SEO & Performance Audit SaaS",
  description:
    "Production-grade Shopify SEO, PageSpeed, and Core Web Vitals auditing platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f6f6f7] text-[#202223]">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
          Shopify SEO & Performance Audit Platform &copy; 2026. Built with Next.js, Prisma, Cheerio & Google PageSpeed.
        </footer>
      </body>
    </html>
  );
}
