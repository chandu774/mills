/**
 * Dynamic Authentication Redirect URL Resolution
 * 
 * Automatically resolves the application origin at runtime so that OAuth redirects
 * and auth confirmation flows return to the exact environment where the user started:
 * - Localhost development on laptop (e.g. http://localhost:5173/)
 * - Forwarded development URLs on mobile (e.g. https://*.devtunnels.ms/, https://*.ngrok-free.app/)
 * - Custom production domain (e.g. https://mills.app/)
 * 
 * Never hardcodes localhost as the target origin.
 */

export function getAuthRedirectUrl(path: string = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, '');
    return `${origin}${normalizedPath}`;
  }

  // Fallback for non-browser/test environments
  return `http://localhost:3000${normalizedPath}`;
}

export function getCleanUrlWithoutAuthParams(currentUrl: string): string {
  try {
    const url = new URL(currentUrl);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    url.searchParams.delete('error_code');
    return url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '');
  } catch {
    return '/';
  }
}
