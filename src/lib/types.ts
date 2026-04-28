export type NewsSource = "huxiu" | "x";

export type NewsCategory =
  | "model"
  | "product"
  | "funding"
  | "research"
  | "policy"
  | "opinion"
  | "tools";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: NewsSource;
  sourceUrl: string;
  publishedAt: string;
  category: NewsCategory;
  metrics?: {
    views?: number;
    likes?: number;
    shares?: number;
  };
  tags?: string[];
}

export interface DailyData {
  date: string;
  huxiu: NewsItem[];
  xTopics: NewsItem[];
}

export type SourceFilter = "all" | "huxiu" | "x";