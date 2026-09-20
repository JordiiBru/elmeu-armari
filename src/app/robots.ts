import type { MetadataRoute } from "next";

/** A private wardrobe behind a login: no crawler has any business here. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
