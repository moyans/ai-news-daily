import { describe, it, expect } from "vitest";
import { parseXTopicsMarkdown } from "../parse-x-topics";

const SAMPLE_X_TOPICS = `# X 热点追踪 (2026-04-28)

## 1. Sam Altman：GPT-5 是通向 AGI 的关键一步

- 发布时间：2026-04-28 08:30:00 UTC
- 链接：https://x.com/sama/status/199999999
- 热度：1200万 浏览 / 28万 点赞 / 6万 转发

Sam Altman 在 X 上发布长文，称 GPT-5 的发布标志着向 AGI 迈进的关键一步。

---

## 2. Andrej Karpathy 发布 AI 教育新项目

- 发布时间：2026-04-28 05:20:00 UTC
- 链接：https://x.com/karpathy/status/188888888
- 热度：560万 浏览 / 15万 点赞 / 4万 转发

Karpathy 发布开源 AI 教育项目 Teacher，能自动生成交互式课程。

---

## 3. GoogleDeepMind 发布 Gemini 3 Pro

- 发布时间：2026-04-28 03:45:00 UTC
- 链接：https://x.com/GoogleDeepMind/status/177777777
- 热度：890万 浏览 / 22万 点赞 / 5万 转发

Gemini 3 Pro 在多模态推理基准上大幅领先。`;

describe("parseXTopicsMarkdown", () => {
  it("parses sample X topics markdown into NewsItem array", () => {
    const result = parseXTopicsMarkdown(SAMPLE_X_TOPICS, "2026-04-28");
    expect(result.length).toBeGreaterThan(0);

    const first = result[0];
    expect(first.source).toBe("x");
    expect(first.title).toBeTruthy();
    expect(first.summary).toBeTruthy();
    expect(first.sourceUrl).toMatch(/^https?:\/\//);
    expect(first.id).toContain("x");
  });

  it("extracts metrics with 万 multiplier", () => {
    const result = parseXTopicsMarkdown(SAMPLE_X_TOPICS, "2026-04-28");
    const itemWithMetrics = result.find((i) => i.metrics);
    expect(itemWithMetrics).toBeDefined();
    expect(itemWithMetrics!.metrics!.views).toBe(12000000);
    expect(itemWithMetrics!.metrics!.likes).toBe(280000);
  });

  it("extracts publishedAt datetime", () => {
    const result = parseXTopicsMarkdown(SAMPLE_X_TOPICS, "2026-04-28");
    expect(result[0].publishedAt).toContain("2026-04-28");
  });

  it("handles malformed content gracefully", () => {
    const result = parseXTopicsMarkdown("random garbage text", "2026-04-28");
    expect(result).toEqual([]);
  });
});