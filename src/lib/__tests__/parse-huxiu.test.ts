import { describe, it, expect } from "vitest";
import { parseHuxiuMarkdown } from "../parse-huxiu";

const SAMPLE_HUXIU = `# 虎嗅 AI 科技 Top10 · 2026-04-28

## 1. OpenAI 发布 GPT-5 性能全面超越人类专家

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900001
- 分类：模型动态

OpenAI 今日正式发布 GPT-5，在数学推理、代码生成、多模态理解等多项基准测试中超越人类专家水平。

---

## 2. DeepSeek 开源 V4 模型

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900002
- 分类：模型动态

DeepSeek 团队发布 V4 开源模型，在 HumanEval 基准上达到 92% 准确率。

---

## 3. 阿里云百炼平台接入 30+ 大模型

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900003
- 分类：产品

阿里云宣布百炼平台已接入 30+ 个大模型。`;

describe("parseHuxiuMarkdown", () => {
  it("parses sample markdown into NewsItem array", () => {
    const result = parseHuxiuMarkdown(SAMPLE_HUXIU, "2026-04-28");
    expect(result.length).toBeGreaterThan(0);

    const first = result[0];
    expect(first.source).toBe("huxiu");
    expect(first.title).toBeTruthy();
    expect(first.summary).toBeTruthy();
    expect(first.sourceUrl).toMatch(/^https?:\/\//);
    expect(first.category).toBe("model");
    expect(first.id).toContain("huxiu");
  });

  it("handles malformed content gracefully", () => {
    const result = parseHuxiuMarkdown("random garbage text", "2026-04-28");
    expect(result).toEqual([]);
  });

  it("maps Chinese category names to English enums", () => {
    const md = `## 1. Test Title\n\n- 分类：投融资\n- 链接：https://example.com\n\nSummary text.\n\n---`;
    const result = parseHuxiuMarkdown(md, "2026-04-28");
    expect(result[0].category).toBe("funding");
  });
});