export type AuditStatus =
  | "PENDING"
  | "DISCOVERING"
  | "CRAWLING"
  | "ANALYZING"
  | "FINALIZING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type FindingCategory =
  | "technical_seo"
  | "on_page_seo"
  | "structured_data"
  | "performance"
  | "accessibility";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type FindingConfidence = "high" | "medium" | "low";

export type RemediationStatus = "open" | "in_progress" | "fixed" | "ignored";

export type PageTemplateType =
  | "homepage"
  | "product"
  | "collection"
  | "page"
  | "blog"
  | "article"
  | "unknown";

export type DeviceStrategy = "mobile" | "desktop";

export interface AuditFinding {
  id?: string;
  ruleId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  impact: string;
  remediation: string;
  scoreImpact: number;
  affectedUrl: string;
  pageType?: PageTemplateType;
  elementSelector?: string | null;
  evidence?: Record<string, unknown>;
  confidence: FindingConfidence;
  status?: RemediationStatus;
  createdAt?: string | Date;
}

export interface ExtractedPageData {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robotsDirectives?: string[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  images: Array<{
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    loading?: string;
  }>;
  links: Array<{
    href: string;
    text: string;
    isInternal: boolean;
    rel?: string;
  }>;
  openGraph: Record<string, string>;
  jsonLd: Array<Record<string, unknown>>;
  htmlLang?: string;
  viewport?: string;
  contentLengthBytes: number;
  textContent: string;
  wordCount: number;
  crawlTimestamp: string;
  template: PageTemplateType;
  isAccessDeniedOrChallenge: boolean;
  crawlError?: string;
}

export interface AuditJobData {
  auditId: string;
  storeUrl: string;
  maxPages: number;
  deviceStrategy: DeviceStrategy;
  runPageSpeed: boolean;
}

export interface AuditProgressStats {
  pagesDiscovered: number;
  pagesCrawled: number;
  pagesFailed: number;
  findingsCount: number;
  status: AuditStatus;
}
