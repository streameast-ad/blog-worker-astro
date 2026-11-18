import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Protect all /admin routes except login and logout
  const isAdminRoute = pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/');
  const isPublicAdminRoute = pathname === '/admin/login' || pathname === '/admin/logout';

  if (isAdminRoute && !isPublicAdminRoute) {
    const authed = await isAuthenticated(context.request);
    if (!authed) {
      return context.redirect('/admin/login');
    }
  }

  return next();
});
