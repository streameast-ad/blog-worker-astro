import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/kv';
import { SITE_CONFIG } from '../lib/config';

export const GET: APIRoute = async () => {
  const posts = await getAllPosts(true);
  const now = new Date().toISOString();

  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily', lastmod: now },
    { url: '/about', priority: '0.7', changefreq: 'monthly', lastmod: now },
    { url: '/contact', priority: '0.6', changefreq: 'monthly', lastmod: now },
    { url: '/privacy-policy', priority: '0.4', changefreq: 'yearly', lastmod: now },
    { url: '/terms', priority: '0.4', changefreq: 'yearly', lastmod: now }
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${SITE_CONFIG.site_url}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
${posts
  .map(
    (post) => `  <url>
    <loc>${SITE_CONFIG.site_url}/post/${post.slug}</loc>
    <lastmod>${post.updated_at || post.published_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
};
