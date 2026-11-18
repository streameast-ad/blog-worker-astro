import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../lib/auth';
import { uploadToR2 } from '../../lib/r2';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif'
]);

export const POST: APIRoute = async ({ request }) => {
  // Check Admin Authentication
  const authed = await isAuthenticated(request);
  if (!authed) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof Blob)) {
      return new Response(JSON.stringify({ error: 'No image file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return new Response(
        JSON.stringify({ error: `File type ${file.type} not allowed. Please upload JPG, PNG, WEBP, GIF, or SVG.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image size exceeds maximum limit of 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploaded = await uploadToR2(file, file.name);
    if (!uploaded) {
      return new Response(JSON.stringify({ error: 'Cloudflare R2 storage error. Bucket not reachable.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        key: uploaded.key,
        url: uploaded.url
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Upload processing error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
