import type { MetadataRoute } from "next";

// Beta: the site is open to testers by link but stays out of search engines until launch.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
