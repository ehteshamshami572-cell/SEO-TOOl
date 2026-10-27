import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  REDIS_URL: z.string().optional(),
  GOOGLE_PAGESPEED_API_KEY: z.string().optional().default(""),
  CRAWLER_USER_AGENT: z
    .string()
    .default(
      "Mozilla/5.0 (compatible; ShopifySeoAuditorBot/1.0; +https://example.com/bot)"
    ),
  MAX_PAGES_PER_AUDIT: z.coerce.number().default(25),
  MAX_REDIRECT_HOPS: z.coerce.number().default(5),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(10000),
  MAX_RESPONSE_SIZE_BYTES: z.coerce.number().default(5242880), // 5MB
  RATE_LIMIT_DELAY_MS: z.coerce.number().default(250),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  GOOGLE_PAGESPEED_API_KEY: process.env.GOOGLE_PAGESPEED_API_KEY,
  CRAWLER_USER_AGENT: process.env.CRAWLER_USER_AGENT,
  MAX_PAGES_PER_AUDIT: process.env.MAX_PAGES_PER_AUDIT,
  MAX_REDIRECT_HOPS: process.env.MAX_REDIRECT_HOPS,
  REQUEST_TIMEOUT_MS: process.env.REQUEST_TIMEOUT_MS,
  MAX_RESPONSE_SIZE_BYTES: process.env.MAX_RESPONSE_SIZE_BYTES,
  RATE_LIMIT_DELAY_MS: process.env.RATE_LIMIT_DELAY_MS,
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    "http://localhost:3000",
});
