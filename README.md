# ⚡ EdgeBlog — Cloudflare Workers + KV + R2 + Astro SSR

High-Performance Modern Edge Blog with Full Visual Admin Dashboard, Cloudflare R2 Image Hosting, and Google 2026 SEO Optimization.

---

## 🌟 1-Click Automated Deployment (Beginner Friendly)

No manual Cloudflare configuration required! A beginner only needs to run **one command**:

```bash
npm run deploy
```

### What this command automatically does:
1. ✅ Checks Cloudflare authentication (`wrangler whoami`).
2. ✅ Automatically checks/provisions the **Cloudflare R2 Bucket** (`blog-worker-astro-images`).
3. ✅ Automatically checks/provisions the **Cloudflare KV Namespace** (`blog-worker-astro-kv`) and injects its ID into `wrangler.jsonc`.
4. ✅ Builds the Astro SSR production bundle (`astro build`).
5. ✅ Deploys the entire blog, R2 image serving engine, and Admin Panel to Cloudflare Workers in seconds!

---

## 🚀 Local Development

```bash
# Start background dev server
astro dev --background

# Check status
astro dev status

# View logs
astro dev logs

# Stop dev server
astro dev stop
```

Access locally at `http://localhost:4321`.

---

## 🔐 Admin Panel Access

* **Live Admin URL:** `https://blog-worker-astro.vipinkumarkatiyar.workers.dev/admin/login`
* **Default Password:** `admin_change_this_secret_password` (configurable in `wrangler.jsonc`)

---

## 🖼️ Cloudflare R2 Image Hosting

- Images uploaded via the visual editor or cover photo upload are stored directly in the `blog-worker-astro-images` R2 bucket.
- Delivered at the edge via `/api/images/[...key]` with 1-year immutable caching (`max-age=31536000`).

---

## 🔍 Google 2026 SEO Optimization

- Every post uses clean permalinks: `/post/[slug]`
- Dynamic Schema.org JSON-LD (`BlogPosting`, `BreadcrumbList`, `WebSite`, `WebPage`)
- Dynamic XML Sitemap (`/sitemap.xml`)
- Dynamic Robots.txt (`/robots.txt`) with admin protection
- RSS 2.0 Feed (`/rss.xml`)
- Trust Pages: `/privacy-policy`, `/terms`, `/about`, `/contact`
