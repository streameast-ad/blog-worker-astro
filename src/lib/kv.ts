import type { Post, PostSummary } from './types';
import { INITIAL_POSTS } from './default-posts';

// In-memory fallback cache for development or when KV is not connected yet
const memoryStore = new Map<string, string>();

// Initialize memory store with default posts
function initMemoryStore() {
  if (!memoryStore.has('posts:index')) {
    const summaries: PostSummary[] = INITIAL_POSTS.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      featured_image: p.featured_image,
      featured_image_alt: p.featured_image_alt,
      category: p.category,
      tags: p.tags,
      author_name: p.author.name,
      published_at: p.published_at,
      updated_at: p.updated_at,
      status: p.status,
      reading_time_minutes: p.reading_time_minutes
    }));
    memoryStore.set('posts:index', JSON.stringify(summaries));
    for (const post of INITIAL_POSTS) {
      memoryStore.set(`post:${post.slug}`, JSON.stringify(post));
    }
  }
}

initMemoryStore();

/**
 * Safely retrieves the Cloudflare KV binding from the worker runtime
 */
async function getKVBinding(): Promise<any | null> {
  try {
    // Dynamic import to avoid build errors outside workerd
    // @ts-ignore
    const cf = await import('cloudflare:workers');
    if (cf && cf.env && cf.env.BLOG_KV) {
      return cf.env.BLOG_KV;
    }
  } catch {
    // Not running in Cloudflare workerd environment
  }
  return null;
}

/**
 * Get all posts summaries for listing pages
 */
export async function getAllPosts(publishedOnly: boolean = true): Promise<PostSummary[]> {
  const kv = await getKVBinding();
  let raw: string | null = null;

  if (kv) {
    try {
      raw = await kv.get('posts:index');
      if (!raw) {
        // If KV is completely fresh and empty, seed it
        await seedKVIfEmpty(kv);
        raw = await kv.get('posts:index');
      }
    } catch (e) {
      console.warn('Failed to read from Cloudflare KV, falling back to memory store:', e);
    }
  }

  if (!raw) {
    raw = memoryStore.get('posts:index') || '[]';
  }

  try {
    const list: PostSummary[] = JSON.parse(raw);
    if (publishedOnly) {
      return list.filter((p) => p.status === 'published');
    }
    return list;
  } catch {
    return [];
  }
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const kv = await getKVBinding();
  let raw: string | null = null;

  if (kv) {
    try {
      raw = await kv.get(`post:${slug}`);
      if (!raw) {
        // Check if it's in initial posts and seed
        const defaultPost = INITIAL_POSTS.find((p) => p.slug === slug);
        if (defaultPost) {
          await savePost(defaultPost);
          return defaultPost;
        }
      }
    } catch (e) {
      console.warn('Failed to read post from KV, falling back to memory store:', e);
    }
  }

  if (!raw) {
    raw = memoryStore.get(`post:${slug}`) || null;
  }

  if (!raw) {
    const defaultPost = INITIAL_POSTS.find((p) => p.slug === slug);
    return defaultPost || null;
  }

  try {
    return JSON.parse(raw) as Post;
  } catch {
    return null;
  }
}

/**
 * Save or update a post (updates both post:slug and posts:index)
 */
export async function savePost(post: Post): Promise<boolean> {
  const kv = await getKVBinding();

  // Update in-memory store
  memoryStore.set(`post:${post.slug}`, JSON.stringify(post));

  // Update summaries in memory
  let currentList: PostSummary[] = [];
  try {
    const rawList = memoryStore.get('posts:index') || '[]';
    currentList = JSON.parse(rawList);
  } catch {}

  const summaryIndex = currentList.findIndex((item) => item.slug === post.slug);
  const newSummary: PostSummary = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    featured_image: post.featured_image,
    featured_image_alt: post.featured_image_alt,
    category: post.category,
    tags: post.tags,
    author_name: post.author.name,
    published_at: post.published_at,
    updated_at: post.updated_at,
    status: post.status,
    reading_time_minutes: post.reading_time_minutes
  };

  if (summaryIndex >= 0) {
    currentList[summaryIndex] = newSummary;
  } else {
    // Add to beginning of array
    currentList.unshift(newSummary);
  }
  memoryStore.set('posts:index', JSON.stringify(currentList));

  // Write to Cloudflare KV if available
  if (kv) {
    try {
      await kv.put(`post:${post.slug}`, JSON.stringify(post));
      await kv.put('posts:index', JSON.stringify(currentList));
      return true;
    } catch (e) {
      console.error('Error writing to Cloudflare KV:', e);
      return false;
    }
  }

  return true;
}

/**
 * Delete a post by slug
 */
export async function deletePost(slug: string): Promise<boolean> {
  const kv = await getKVBinding();

  memoryStore.delete(`post:${slug}`);
  let currentList: PostSummary[] = [];
  try {
    const rawList = memoryStore.get('posts:index') || '[]';
    currentList = JSON.parse(rawList);
  } catch {}

  currentList = currentList.filter((item) => item.slug !== slug);
  memoryStore.set('posts:index', JSON.stringify(currentList));

  if (kv) {
    try {
      await kv.delete(`post:${slug}`);
      await kv.put('posts:index', JSON.stringify(currentList));
      return true;
    } catch (e) {
      console.error('Error deleting from Cloudflare KV:', e);
      return false;
    }
  }

  return true;
}

/**
 * Seed initial sample posts into KV if it is empty
 */
export async function seedKVIfEmpty(kv: any): Promise<void> {
  try {
    const existing = await kv.get('posts:index');
    if (!existing) {
      const summaries: PostSummary[] = INITIAL_POSTS.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        featured_image: p.featured_image,
        featured_image_alt: p.featured_image_alt,
        category: p.category,
        tags: p.tags,
        author_name: p.author.name,
        published_at: p.published_at,
        updated_at: p.updated_at,
        status: p.status,
        reading_time_minutes: p.reading_time_minutes
      }));
      await kv.put('posts:index', JSON.stringify(summaries));
      for (const post of INITIAL_POSTS) {
        await kv.put(`post:${post.slug}`, JSON.stringify(post));
      }
    }
  } catch (e) {
    console.warn('Could not auto-seed KV:', e);
  }
}

/**
 * Session management in KV
 */
export async function saveSession(token: string, data: any, ttlSeconds: number = 86400 * 7): Promise<void> {
  const kv = await getKVBinding();
  memoryStore.set(`session:${token}`, JSON.stringify(data));
  if (kv) {
    try {
      await kv.put(`session:${token}`, JSON.stringify(data), { expirationTtl: ttlSeconds });
    } catch (e) {
      console.error('Error storing session in KV:', e);
    }
  }
}

export async function getSession(token: string): Promise<any | null> {
  const kv = await getKVBinding();
  let raw: string | null = null;
  if (kv) {
    try {
      raw = await kv.get(`session:${token}`);
    } catch {}
  }
  if (!raw) {
    raw = memoryStore.get(`session:${token}`) || null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  const kv = await getKVBinding();
  memoryStore.delete(`session:${token}`);
  if (kv) {
    try {
      await kv.delete(`session:${token}`);
    } catch {}
  }
}
