/**
 * Helper to get the Cloudflare R2 bucket binding
 */
export async function getR2Bucket(): Promise<any | null> {
  try {
    // Dynamic import to work within workerd runtime
    // @ts-ignore
    const cf = await import('cloudflare:workers');
    if (cf && cf.env && cf.env.IMAGES_BUCKET) {
      return cf.env.IMAGES_BUCKET;
    }
  } catch {}
  return null;
}

/**
 * Uploads an image file to R2 bucket
 */
export async function uploadToR2(file: File | Blob, originalFilename?: string): Promise<{ key: string; url: string } | null> {
  const bucket = await getR2Bucket();
  if (!bucket) {
    console.warn('R2 bucket binding IMAGES_BUCKET not available');
    return null;
  }

  // Generate unique filename
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ext = originalFilename ? originalFilename.split('.').pop()?.toLowerCase() || 'webp' : 'webp';
  const cleanName = (originalFilename || 'upload')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const key = `uploads/${year}/${month}/${cleanName}-${uniqueId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  await bucket.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable'
    }
  });

  return {
    key,
    url: `/api/images/${key}`
  };
}
