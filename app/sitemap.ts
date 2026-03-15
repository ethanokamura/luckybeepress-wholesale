import type { MetadataRoute } from "next";

const BASE_URL = "https://wholesale.luckybeepress.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date() },
    { url: `${BASE_URL}/apply`, lastModified: new Date() },
    { url: `${BASE_URL}/login`, lastModified: new Date() },
    { url: `${BASE_URL}/wholesale`, lastModified: new Date() },
    { url: `${BASE_URL}/contact`, lastModified: new Date() },
    { url: `${BASE_URL}/privacy`, lastModified: new Date() },
    { url: `${BASE_URL}/terms`, lastModified: new Date() },
  ];
}
