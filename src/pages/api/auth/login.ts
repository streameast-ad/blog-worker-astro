import type { APIRoute } from 'astro';
import { checkPassword, createAdminSession, SESSION_COOKIE_NAME } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValid = await checkPassword(password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Incorrect admin password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create session token and store in KV
    const token = await createAdminSession();

    // Set secure cookie for 7 days
    const cookieValue = `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieValue
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
