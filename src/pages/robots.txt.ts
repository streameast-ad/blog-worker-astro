import type { APIRoute } from 'astro';
import { SITE_CONFIG } from '../lib/config';

export const GET: APIRoute = async () => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

# Host & Sitemap
Sitemap: ${SITE_CONFIG.site_url}/sitemap.xml
Host: ${SITE_CONFIG.site_url}
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
};
