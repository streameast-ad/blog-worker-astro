export interface SEOMetadata {
  meta_title: string;
  meta_description: string;
  canonical_url?: string;
  og_image?: string;
  no_index?: boolean;
  keywords?: string;
}

export interface Author {
  name: string;
  avatar?: string;
  bio?: string;
  url?: string;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown or rich HTML
  featured_image?: string;
  featured_image_alt?: string;
  category: string;
  tags: string[];
  author: Author;
  published_at: string; // ISO date string (YYYY-MM-DDTHH:mm:ssZ)
  updated_at: string;   // ISO date string
  status: 'published' | 'draft';
  reading_time_minutes: number;
  seo: SEOMetadata;
}

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  featured_image?: string;
  featured_image_alt?: string;
  category: string;
  tags: string[];
  author_name: string;
  published_at: string;
  updated_at: string;
  status: 'published' | 'draft';
  reading_time_minutes: number;
}

export interface SiteConfig {
  title: string;
  description: string;
  site_url: string;
  author: Author;
  og_default_image: string;
  twitter_handle?: string;
}
