import type { MetadataRoute } from "next";

// Closed development mode: disallow all crawlers.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
