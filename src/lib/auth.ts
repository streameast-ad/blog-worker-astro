import { getSession, saveSession, deleteSession } from './kv';

export const SESSION_COOKIE_NAME = 'admin_session';

/**
 * Gets admin password from environment or fallback default
 */
export async function getAdminPassword(): Promise<string> {
  try {
    // @ts-ignore
    const cf = await import('cloudflare:workers');
    if (cf && cf.env && cf.env.ADMIN_PASSWORD) {
      return cf.env.ADMIN_PASSWORD;
    }
  } catch {}
  return process.env.ADMIN_PASSWORD || 'admin12345';
}

/**
 * Validates admin password
 */
export async function checkPassword(password: string): Promise<boolean> {
  const expectedPassword = await getAdminPassword();
  return password === expectedPassword;
}

/**
 * Creates an admin session and returns token
 */
export async function createAdminSession(): Promise<string> {
  const token = crypto.randomUUID();
  await saveSession(token, {
    role: 'admin',
    created_at: new Date().toISOString()
  }, 86400 * 7); // 7 days
  return token;
}

/**
 * Checks if the request is from an authenticated admin
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return false;

  const session = await getSession(token);
  return !!session && session.role === 'admin';
}

/**
 * Destroys session
 */
export async function logoutSession(request: Request): Promise<void> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (token) {
    await deleteSession(token);
  }
}

/**
 * Helper to parse cookies from header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURI(parts.join('='));
    }
  });
  return list;
}
