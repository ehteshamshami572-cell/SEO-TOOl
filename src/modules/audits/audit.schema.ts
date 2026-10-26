import { z } from "zod";

export const createAuditSchema = z.object({
  storeUrl: z
    .string()
    .min(1, "Store URL is required")
    .transform((val) => val.trim()),
  maxPages: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25),
  deviceStrategy: z.enum(["mobile", "desktop"]).default("mobile"),
  runPageSpeed: z.boolean().default(true),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;

export const auditFilterSchema = z.object({
  category: z
    .enum([
      "technical_seo",
      "on_page_seo",
      "structured_data",
      "performance",
      "accessibility",
    ])
    .optional(),
  severity: z
    .enum(["critical", "high", "medium", "low", "info"])
    .optional(),
  template: z
    .enum([
      "homepage",
      "product",
      "collection",
      "page",
      "blog",
      "article",
      "unknown",
    ])
    .optional(),
  url: z.string().optional(),
  search: z.string().optional(),
});

export type AuditFilterInput = z.infer<typeof auditFilterSchema>;

export const updateRemediationSchema = z.object({
  status: z.enum(["open", "in_progress", "fixed", "ignored"]),
  notes: z.string().max(1000).optional(),
});

export type UpdateRemediationInput = z.infer<typeof updateRemediationSchema>;
