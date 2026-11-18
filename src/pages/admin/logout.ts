import type { APIRoute } from 'astro';
import { logoutSession, SESSION_COOKIE_NAME } from '../../lib/auth';

export const GET: APIRoute = async ({ request, redirect }) => {
  await logoutSession(request);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin/login',
      'Set-Cookie': `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    }
  });
};
