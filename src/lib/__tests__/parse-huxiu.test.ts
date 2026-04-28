import { describe, it, expect } from "vitest";
import { parseHuxiuMarkdown } from "../parse-huxiu";

const SAMPLE_HUXIU_LEGACY = `# 虎嗅 AI 科技 Top10 · 2026-04-28

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

const SAMPLE_HUXIU_SCRIPT = `# 虎嗅 AI 科技热点 | 2026-04-28

> 更新时间: 2026-04-28 18:21:58
> 来源: 虎嗅 AI News
> 仓库: ai-news-daily

---

## Top 10 虎嗅 AI 热点

---
## [Top 1] 天猫618将于5月21日开启：AI 正在更直接地改变消费和工作流程
> [!abstract] 核心速递
> **分类**: #应用 | **作者**: 虎嗅网 | **热度分**: 219
> **一句话总结**: 天猫官方于4月28日宣布，天猫618大促将于5月21日开启预售
> **关键词**: #应用落地 #真实场景 #商业化
>
> **为何值得关注**: AI 应用能否真正进入高频场景，决定它是否只是概念还是可规模化产品。
>
> **互动指标**: 来源数 2 | 收藏数 0 | 评论数 0
> **原文链接**: [虎嗅原文](https://www.huxiu.com/ainews/11573.html) | **发布时间**: 2026-04-28 17:50

---
## [Top 2] DeepSeekV4Pro优惠延期至5月31日：大模型竞争继续向生态和落地延伸
> [!abstract] 核心速递
> **分类**: #模型 | **作者**: 虎嗅网 | **热度分**: 218
> **一句话总结**: DeepSeek-V4-Pro作为旗舰大模型已开启API限时2.5折优惠
> **关键词**: #DeepSeek #大模型 #训练
>
> **为何值得关注**: 大模型竞争已经不只看单点指标，还要看生态、工具链和场景落地。
>
> **互动指标**: 来源数 2 | 收藏数 0 | 评论数 0
> **原文链接**: [虎嗅原文](https://www.huxiu.com/ainews/11560.html) | **发布时间**: 2026-04-28 14:00

---
## [Top 3] 欧盟要求谷歌向AI竞争对手开放安卓操作系统：AI 监管开始从讨论走向执行
> [!abstract] 核心速递
> **分类**: #政策 | **作者**: 虎嗅网 | **热度分**: 334
> **一句话总结**: 欧盟委员会周一向谷歌发布一系列拟议措施，要求其根据《数字市场法案》向AI竞争对手开放安卓操作系统
> **关键词**: #Gemini #谷歌 #监管
>
> **为何值得关注**: 监管口径一旦收紧，会直接影响模型训练、内容分发和商业化边界。
>
> **互动指标**: 来源数 3 | 收藏数 1 | 评论数 0
> **原文链接**: [虎嗅原文](https://www.huxiu.com/ainews/11542.html) | **发布时间**: 2026-04-28 09:00

*由 huxiu-ai-news Skill 自动生成，生成时间: 2026-04-28 18:21:58*`;

const SAMPLE_HUXIU_SCRIPT_CHINESE_COLON = `# 虎嗅 AI 科技热点 | 2026-04-28

> 更新时间: 2026-04-28 18:21:58
> 来源: 虎嗅 AI News

---

## Top 10 虎嗅 AI 热点

---
## [Top 1] 微软：埃森哲为74.3万员工部署Copilot AI助手：AI 正从问答工具转向执行工具
> [!abstract] 核心速递
> **分类**: #智能体 | **作者**: 虎嗅网 | **热度分**: 573
> **一句话总结**: 埃森哲正大规模为员工部署Microsoft Copilot人工智能助手
> **关键词**: #OpenAI #Copilot #微软
>
> **为何值得关注**: 智能体一旦能稳定执行任务，就会把 AI 从聊天工具推进到生产力工具。
>
> **互动指标**: 来源数 5 | 收藏数 3 | 评论数 0
> **原文链接**: [虎嗅原文](https://www.huxiu.com/ainews/11537.html) | **发布时间**: 2026-04-28 02:30`;

describe("parseHuxiuMarkdown", () => {
  describe("legacy format", () => {
    it("parses legacy sample markdown into NewsItem array", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_LEGACY, "2026-04-28");
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

  describe("script output format", () => {
    it("parses script-produced markdown with [Top N] headings", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result.length).toBe(3);

      const first = result[0];
      expect(first.source).toBe("huxiu");
      expect(first.id).toContain("huxiu");
      expect(first.category).toBe("product"); // #应用 maps to product
      expect(first.sourceUrl).toBe("https://www.huxiu.com/ainews/11573.html");
      expect(first.tags).toBeDefined();
      expect(first.tags!.length).toBeGreaterThan(0);
    });

    it("extracts title correctly, stripping colon-separated suffix", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].title).toContain("天猫618");
      // Title should be stripped of the "core value" suffix after Chinese colon
      expect(result[0].title.length).toBeLessThan(20);
    });

    it("extracts summary from **一句话总结** field", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].summary).toContain("天猫");
      expect(result[1].summary).toContain("DeepSeek");
    });

    it("extracts category from **分类** with hashtag format", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].category).toBe("product"); // #应用
      expect(result[1].category).toBe("model");   // #模型
      expect(result[2].category).toBe("policy");    // #政策
    });

    it("extracts source URL from [虎嗅原文](url) format", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].sourceUrl).toBe("https://www.huxiu.com/ainews/11573.html");
      expect(result[1].sourceUrl).toBe("https://www.huxiu.com/ainews/11560.html");
    });

    it("extracts tags from **关键词** field", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].tags).toContain("应用落地");
      expect(result[0].tags).toContain("真实场景");
      expect(result[1].tags).toContain("DeepSeek");
      expect(result[1].tags).toContain("大模型");
    });

    it("extracts published time from **发布时间** field", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].publishedAt).toContain("2026-04-28T17:50");
      expect(result[1].publishedAt).toContain("2026-04-28T14:00");
    });

    it("extracts metrics from **互动指标** and **热度分**", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].metrics).toBeDefined();
      expect(result[0].metrics!.views).toBe(219); // heat_score
      expect(result[0].metrics!.likes).toBe(0);     // favorites
      expect(result[0].metrics!.shares).toBe(0);    // comments
    });

    it("parses 智能体 category", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT_CHINESE_COLON, "2026-04-28");
      expect(result.length).toBe(1);
      expect(result[0].category).toBe("tools"); // #智能体 → tools
      expect(result[0].tags).toContain("OpenAI");
    });

    it("falls back gracefully if no items match either format", () => {
      const result = parseHuxiuMarkdown("", "2026-04-28");
      expect(result).toEqual([]);
    });

    it("does not truncate Chinese colon in titles that are not core value suffixes", () => {
      const md = `## [Top 1] 小马智行CEO彭军：现有自动驾驶分级体系不合理

> **分类**: #机器人 | **作者**: 虎嗅网 | **热度分**: 437
> **一句话总结**: 小马智行CEO彭军质疑L3自动驾驶的存在必要性。
> **关键词**: #具身智能
>
> **为何值得关注**: 自动驾驶技术分级体系争议。
>
> **互动指标**: 来源数 2 | 收藏数 0 | 评论数 0
> **原文链接**: [虎嗅原文](https://www.huxiu.com/article/123.html) | **发布时间**: 2026-04-28 10:00

---`;
      const result = parseHuxiuMarkdown(md, "2026-04-28");
      expect(result[0].title).toContain("彭军：现有自动驾驶分级体系不合理");
    });

    it("strips only recognized core value suffix after colon", () => {
      const md = `## [Top 1] 天猫618将于5月21日开启：AI 正在更直接地改变消费和工作流程

> **分类**: #应用 | **热度分**: 219
> **一句话总结**: 天猫大促将于5月21日开启预售。

---`;
      const result = parseHuxiuMarkdown(md, "2026-04-28");
      expect(result[0].title).toBe("天猫618将于5月21日开启");
    });

    it("extracts whyItMatters field", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].whyItMatters).toContain("AI 应用能否真正进入高频场景");
    });

    it("extracts heatScore and sourceCount from metrics", () => {
      const result = parseHuxiuMarkdown(SAMPLE_HUXIU_SCRIPT, "2026-04-28");
      expect(result[0].metrics).toBeDefined();
      expect(result[0].metrics!.heatScore).toBe(219);
      expect(result[0].metrics!.sourceCount).toBe(2);
    });
  });
});