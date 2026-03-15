import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/*", "/api/*", "/cart", "/account", "/orders", "/wishlist"],
      },
    ],
    sitemap: "https://wholesale.luckybeepress.com/sitemap.xml",
  };
}
