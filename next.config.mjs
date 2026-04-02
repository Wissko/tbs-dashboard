/** @type {import('next').NextConfig} */

// SECURITY: unsafe-eval uniquement en dev (HMR Next.js) — jamais en production
const isDev = process.env.NODE_ENV !== 'production';

// SECURITY: HTTP security headers applied to all routes
const securityHeaders = [
  // Prevent DNS prefetching leakage
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // SECURITY: Force HTTPS for 2 years, including subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // SECURITY: Prevent clickjacking by disallowing iframes from other origins
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // SECURITY: Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // SECURITY: Control referrer information sent with requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // SECURITY: Restrict browser features not needed by this app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // SECURITY: Content Security Policy — restrict resource origins
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-inline' required for Tailwind inline styles
      // SECURITY: 'unsafe-eval' restreint au dev (HMR Next.js) — supprimé en production
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Allow connections to Supabase (loaded at runtime via env var)
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'}`,
      "img-src 'self' data: blob:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  // SECURITY: Apply security headers to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
