# Deploying Shopify SEO & Performance Audit SaaS to Netlify

This guide provides step-by-step instructions for deploying the **Shopify SEO & Performance Audit SaaS** platform to [Netlify](https://www.netlify.com/).

---

## ⚠️ Important Serverless Architecture Notice

Netlify runs Next.js server-side Route Handlers as **ephemeral, stateless serverless functions** (AWS Lambda). 
- **Database**: A local file (`file:./dev.db`) cannot persist across serverless function invocations. For live Netlify deployment, you **must use an external hosted PostgreSQL database** (e.g. [Neon](https://neon.tech) or [Supabase](https://supabase.com)).
- **Queues**: For standard audits (up to 10–25 pages), the built-in in-process queue processes the crawl within standard serverless timeouts. For high-volume audits (50+ pages), connect an external Redis instance (such as [Upstash](https://upstash.com/)) and run the worker on a persistent container (e.g. Railway, Render, Fly.io, or Docker).

---

## Step 1: Create a Free Serverless PostgreSQL Database

We recommend **Neon** (serverless Postgres, 100% free tier, instant setup) or **Supabase**:

### Option A: Neon (Recommended)
1. Sign up for free at [neon.tech](https://neon.tech).
2. Click **Create Project**, name it `shopify-seo-saas`, and select your nearest region.
3. In the project dashboard, copy the **Connection string** (it looks like `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).

### Option B: Supabase
1. Sign up for free at [supabase.com](https://supabase.com).
2. Click **New Project** and set a database password.
3. In **Project Settings** > **Database**, copy the **URI** connection string.

---

## Step 2: Push the Database Schema to PostgreSQL

From your local machine or terminal, push the Prisma schema directly to your new hosted database:

```bash
# 1. Switch schema provider to postgresql
npm run db:use-postgres

# 2. Push schema to your remote database
npx prisma db push --schema=./prisma/schema.prisma
```
*(Make sure `DATABASE_URL` in your `.env` contains your Neon or Supabase PostgreSQL connection string when running this command).*

---

## Step 3: Push Your Code to GitHub / GitLab / Bitbucket

Push your project repository to GitHub:

```bash
git add .
git commit -m "chore: configure for Netlify deployment"
git push origin master
```

---

## Step 4: Import and Configure Project in Netlify

1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Connect your Git provider and select `shopify-seo-tool`.
4. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command**: `node scripts/switch-db.js && npx prisma generate && npm run build`
   - **Publish directory**: `.next`
   - **Plugin**: `@netlify/plugin-nextjs`

---

## Step 5: Configure Environment Variables in Netlify

In the Netlify setup screen (or under **Site configuration** > **Environment variables**), add the following environment variables:

| Variable | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | Your Neon or Supabase PostgreSQL connection string | `postgresql://neondb_owner:***@ep-xyz.aws.neon.tech/neondb?sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | Your Netlify site URL (optional, Netlify injects `URL` automatically) | `https://your-site-name.netlify.app` |
| `GOOGLE_PAGESPEED_API_KEY` | Google PageSpeed Insights API Key (optional, required for Core Web Vitals) | `AIzaSy...` (Get free from [Google Cloud Console](https://console.cloud.google.com/)) |
| `MAX_PAGES_PER_AUDIT` | Maximum pages crawled per audit (recommend 10 for serverless) | `15` |
| `REDIS_URL` | Upstash Redis connection string (optional) | `rediss://default:***@upstash.io:6379` |

---

## Step 6: Deploy and Verify

1. Click **Deploy site**.
2. Once the build finishes (usually ~1–2 minutes), your site will be live at `https://<your-site-name>.netlify.app`.
3. Verify system health by visiting:
   ```
   https://<your-site-name>.netlify.app/api/health
   ```
   It should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-10-27T...",
     "database": "connected"
   }
   ```
4. Enter a public Shopify store URL (e.g. `https://kith.com` or `https://shop.allbirds.com`) and start your first live audit!
