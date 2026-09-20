import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://yesspos.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/shop", changeFrequency: "daily", priority: 0.9 },
    { path: "/homedelivery", changeFrequency: "weekly", priority: 0.8 },
    { path: "/track", changeFrequency: "monthly", priority: 0.5 },
    { path: "/corporate", changeFrequency: "monthly", priority: 0.6 },
    { path: "/signin", changeFrequency: "monthly", priority: 0.4 },
    { path: "/auth", changeFrequency: "monthly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
