import type { NextConfig } from "next";

// What a page may load and where it may send data: only this site. Inline
// scripts and styles stay allowed, because Next.js writes them into the page;
// scripts from other sites, frames, plugins and forms posting elsewhere do not.
// Development needs eval and a websocket for hot reload.
const dev = process.env.NODE_ENV !== "production";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  // Closed development mode: keep every response out of search engines.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // Cross-site navigations send the origin only, not the closed page path.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          // Browsers that have opened the site once use only HTTPS for a year.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // The site uses no camera, microphone or location.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
