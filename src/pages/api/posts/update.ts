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

    if (!data.slug || !data.title || !data.content) {
      return new Response(
        JSON.stringify({ error: 'Slug, title, and content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existing = await getPostBySlug(data.slug);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const readingTime = calculateReadingTime(data.content);

    const updatedPost: Post = {
      slug: existing.slug,
      title: data.title.trim(),
      excerpt: data.excerpt?.trim() || existing.excerpt,
      content: data.content,
      featured_image: data.featured_image?.trim() ?? existing.featured_image,
      featured_image_alt: data.featured_image_alt?.trim() ?? existing.featured_image_alt,
      category: data.category?.trim() || existing.category,
      tags: Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
        ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : existing.tags,
      author: {
        name: data.author_name?.trim() || existing.author.name,
        avatar: data.author_avatar?.trim() || existing.author.avatar,
        bio: data.author_bio?.trim() || existing.author.bio
      },
      published_at: data.published_at || existing.published_at,
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

    const success = await savePost(updatedPost);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to update post in KV' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, slug: updatedPost.slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
