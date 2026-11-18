import type { Post } from './types';
import { SITE_CONFIG } from './config';

/**
 * Generates Schema.org JSON-LD for WebSite with Sitelinks Searchbox
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.title,
    url: SITE_CONFIG.site_url,
    description: SITE_CONFIG.description,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.title,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.site_url}/favicon.svg`
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.site_url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Generates Schema.org JSON-LD for BlogPosting / Article (Google 2026 Recommended)
 */
export function generateArticleSchema(post: Post) {
  const postUrl = `${SITE_CONFIG.site_url}/post/${post.slug}`;
  const imageUrl = post.featured_image || SITE_CONFIG.og_default_image;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    },
    headline: post.seo?.meta_title || post.title,
    description: post.seo?.meta_description || post.excerpt,
    image: [imageUrl],
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      '@type': 'Person',
      name: post.author?.name || SITE_CONFIG.author.name,
      url: `${SITE_CONFIG.site_url}/about`
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.title,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.site_url}/favicon.svg`
      }
    },
    keywords: post.seo?.keywords || post.tags?.join(', '),
    articleSection: post.category,
    inLanguage: 'en-US'
  };
}

/**
 * Generates Schema.org JSON-LD for BreadcrumbList
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.site_url}${item.url}`
    }))
  };
}

/**
 * Generates Schema.org JSON-LD for standard WebPage (About, Privacy, Terms)
 */
export function generateWebPageSchema(title: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: `${SITE_CONFIG.site_url}${path}`,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.title,
      url: SITE_CONFIG.site_url
    }
  };
}
