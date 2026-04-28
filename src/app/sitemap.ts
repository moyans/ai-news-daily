import { MetadataRoute } from "next";
import { getAvailableDates } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = getAvailableDates();
  const dailyUrls = dates.map((date) => ({
    url: `https://ai-news-daily.vercel.app/daily/${date}`,
    lastModified: new Date(date),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://ai-news-daily.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://ai-news-daily.vercel.app/archive",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...dailyUrls,
  ];
}