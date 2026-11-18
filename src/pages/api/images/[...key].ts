import type { APIRoute } from 'astro';
import { getR2Bucket } from '../../../lib/r2';

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const bucket = await getR2Bucket();
  if (!bucket) {
    return new Response('R2 Bucket not configured', { status: 503 });
  }

  try {
    const object = await bucket.get(key);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (object.httpEtag) {
      headers.set('ETag', object.httpEtag);
    }

    return new Response(object.body, {
      status: 200,
      headers
    });
  } catch (err: any) {
    return new Response('Failed to retrieve image from R2', { status: 500 });
  }
};
