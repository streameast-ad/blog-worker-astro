import type { SiteConfig } from './types';

export const SITE_CONFIG: SiteConfig = {
  title: 'EdgeBlog — Ultra Fast Cloudflare Blog',
  description: 'A high-performance modern edge blog powered by Cloudflare Workers KV and Astro SSR, fully optimized for latest Google SEO standards.',
  site_url: 'https://myedgeblog.workers.dev',
  author: {
    name: 'Admin Team',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    bio: 'Tech enthusiast, edge computing architect, and content creator specializing in modern web performance.',
    url: '/about'
  },
  og_default_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&h=630&q=80',
  twitter_handle: '@edgeblog'
};
