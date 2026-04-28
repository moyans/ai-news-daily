import fs from "fs";
import path from "path";
import { DailyData, NewsItem } from "./types";
import { parseHuxiuMarkdown } from "./parse-huxiu";
import { parseXTopicsMarkdown } from "./parse-x-topics";

const DATA_DIR = path.join(process.cwd(), "data");

export function getAvailableDates(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort()
    .reverse();
}

export function getLatestDate(): string | null {
  const dates = getAvailableDates();
  return dates.length > 0 ? dates[0] : null;
}

export function getDailyData(date: string): DailyData | null {
  const huxiuPath = path.join(DATA_DIR, date, "huxiu", "content.md");
  const xPath = path.join(DATA_DIR, date, "x-hot-topics", "content.md");

  const huxiuExists = fs.existsSync(huxiuPath);
  const xExists = fs.existsSync(xPath);

  if (!huxiuExists && !xExists) return null;

  let huxiu: NewsItem[] = [];
  let xTopics: NewsItem[] = [];

  if (huxiuExists) {
    const content = fs.readFileSync(huxiuPath, "utf-8");
    huxiu = parseHuxiuMarkdown(content, date);
  }

  if (xExists) {
    const content = fs.readFileSync(xPath, "utf-8");
    xTopics = parseXTopicsMarkdown(content, date);
  }

  return { date, huxiu, xTopics };
}

export function getAllDailyData(): DailyData[] {
  return getAvailableDates()
    .map((date) => getDailyData(date))
    .filter((d): d is DailyData => d !== null);
}