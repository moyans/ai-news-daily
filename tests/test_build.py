import unittest

from scripts.build import parse_markdown


class ParseMarkdownTest(unittest.TestCase):
    def test_huxiu_plain_paragraph_becomes_summary(self):
        content = """# 虎嗅AI热点 2026-04-16

## [Top 1] 谷歌关联公司拟发57亿美元垃圾债，助力数据中心建设

**时间**: 2026-04-15T23:11:15.299507+00:00

根据提供的搜索结果，未找到关于谷歌关联公司拟发57亿美元垃圾债的具体报道。然而，搜索结果显示，科技公司为支撑AI数据中心建设，正通过发行大规模垃圾债券从债务市场筹资，这已成为整个行业的显著趋势。

---
"""

        news = parse_markdown(content, "huxiu", "2026-04-16")[0]

        self.assertEqual(news["date"], "2026-04-16")
        self.assertEqual(news["published_at"], "2026-04-15T23:11:15.299507+00:00")
        self.assertTrue(news["summary"].startswith("根据提供的搜索结果"))

    def test_x_core_speed_summary_is_extracted(self):
        content = """# X AI 热点 | 2026-03-31

---
## [Top 1] Elon Musk谈AI未来：视频理解与生成是AGI关键
**核心速递**：Elon Musk强调AI未来以视频理解和生成为主，因为光子是最高带宽通信形式，xAI的Imagine工具已实现正毛利。
**作者**：@elonmusk
**原文链接**：[跳转](https://x.com/elonmusk/status/2038756516048916578)
---
"""

        news = parse_markdown(content, "x", "2026-03-31")[0]

        self.assertEqual(news["date"], "2026-03-31")
        self.assertTrue(news["summary"].startswith("Elon Musk强调AI未来"))


if __name__ == "__main__":
    unittest.main()
