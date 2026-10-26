# Shopify SEO & Performance Audit SaaS: Deployment Guide

## 1. Architecture & Deployment Targets

The platform is designed to be deployed cleanly across:
1. **Frontend & API**: Hosted on **Vercel** or any standard Next.js Node.js container (AWS ECS, Google Cloud Run, Railway, Render).
2. **Workers**: Dedicated persistent Node.js worker process running BullMQ queue consumers.
3. **Database**: Managed PostgreSQL instance (e.g. Supabase, Neon, AWS RDS).
4. **Queue & Cache**: Managed Redis cluster (e.g. Upstash, AWS ElastiCache, Redis Cloud).

## 2. Local Development with Docker Compose

For local development or single-server hosting, a `docker-compose.yml` file is provided that launches:
- `db`: PostgreSQL 16
- `redis`: Redis 7 (Alpine)
- `web`: Next.js web application and API handlers
- `worker`: Background audit worker

Run locally:
```bash
docker compose up -d
npm run db:push
npm run dev
```

## 3. Environment Variables

Create `.env` based on `.env.example`:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shopify_seo?schema=public"
# Or for zero-dependency local SQLite development:
# DATABASE_URL="file:./dev.db"

# Redis & Queue Configuration
REDIS_URL="redis://localhost:6379"

# External API Integrations
GOOGLE_PAGESPEED_API_KEY="your-google-pagespeed-api-key"

# Crawler & Security Policies
CRAWLER_USER_AGENT="Mozilla/5.0 (compatible; ShopifySeoAuditorBot/1.0; +https://my-saas.com/bot)"
MAX_PAGES_PER_AUDIT=25
MAX_REDIRECT_HOPS=5
REQUEST_TIMEOUT_MS=10000
MAX_RESPONSE_SIZE_BYTES=5242880
RATE_LIMIT_DELAY_MS=250

# Application Host
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 4. Production Checklist

- [ ] Configure outbound firewall to prevent container access to private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
- [ ] Set `GOOGLE_PAGESPEED_API_KEY` in deployment environment secrets.
- [ ] Ensure Redis connection is protected with TLS and password auth.
- [ ] Set persistent worker memory allocation to minimum 512 MB to handle concurrent Cheerio parsing and PageSpeed evaluations.
- [ ] Verify `UrlPolicyService` SSRF protections in staging before opening public registration.
