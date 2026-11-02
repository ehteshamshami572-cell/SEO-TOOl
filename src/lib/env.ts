import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  DATABASE_URL_POOLED: z.string().optional(),
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

  // Neon Services
  NEON_AUTH_BASE_URL: z.string().optional(),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional().default("uploads"),
  NEON_AI_GATEWAY_BASE_URL: z.string().optional(),
  NEON_AI_GATEWAY_TOKEN: z.string().optional(),
  NEON_REALTIME_URL: z.string().optional(),
  NEON_REALTIME_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_POOLED: process.env.DATABASE_URL_POOLED,
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

  // Neon Services
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
  AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET: process.env.S3_BUCKET,
  NEON_AI_GATEWAY_BASE_URL: process.env.NEON_AI_GATEWAY_BASE_URL,
  NEON_AI_GATEWAY_TOKEN: process.env.NEON_AI_GATEWAY_TOKEN,
  NEON_REALTIME_URL: process.env.NEON_REALTIME_URL,
  NEON_REALTIME_SECRET: process.env.NEON_REALTIME_SECRET,
});
