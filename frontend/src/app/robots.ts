import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/login"],
        disallow: ["/dashboard", "/rankings", "/leagues", "/profile"],
      },
    ],
    sitemap: "https://stocko.pt/sitemap.xml",
  };
}
