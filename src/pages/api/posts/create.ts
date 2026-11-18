import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';
import { getPostBySlug, savePost } from '../../../lib/kv';
import { calculateReadingTime } from '../../../lib/markdown';
import type { Post } from '../../../lib/types';

export const POST: APIRoute = async ({ request }) => {
  const authed = await isAuthenticated(request);
  if (!authed) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();

    if (!data.title || !data.slug || !data.content) {
      return new Response(
        JSON.stringify({ error: 'Title, slug, and content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format clean slug
    const cleanSlug = data.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existing = await getPostBySlug(cleanSlug);
    if (existing) {
      return new Response(
        JSON.stringify({ error: `A post with slug "${cleanSlug}" already exists.` }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();
    const readingTime = calculateReadingTime(data.content);

    const newPost: Post = {
      slug: cleanSlug,
      title: data.title.trim(),
      excerpt: data.excerpt?.trim() || data.title.trim(),
      content: data.content,
      featured_image: data.featured_image?.trim() || '',
      featured_image_alt: data.featured_image_alt?.trim() || data.title.trim(),
      category: data.category?.trim() || 'General',
      tags: Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
        ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
      author: {
        name: data.author_name?.trim() || 'Admin Team',
        avatar: data.author_avatar?.trim() || '',
        bio: data.author_bio?.trim() || ''
      },
      published_at: data.published_at || now,
      updated_at: now,
      status: data.status === 'draft' ? 'draft' : 'published',
      reading_time_minutes: readingTime,
      seo: {
        meta_title: data.seo?.meta_title?.trim() || data.title.trim(),
        meta_description: data.seo?.meta_description?.trim() || data.excerpt?.trim() || '',
        canonical_url: data.seo?.canonical_url?.trim() || '',
        og_image: data.seo?.og_image?.trim() || data.featured_image?.trim() || '',
        no_index: !!data.seo?.no_index,
        keywords: data.seo?.keywords?.trim() || ''
      }
    };

    const success = await savePost(newPost);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to write to KV store' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, slug: newPost.slug }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
