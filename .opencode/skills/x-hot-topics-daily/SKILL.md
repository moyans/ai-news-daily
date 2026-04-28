---
name: x-hot-topics-daily
description: 每日追踪并推送 X（x.com）热点话题新闻简报。用于用户要求“每天定时看 X 热点”“按指定话题抓取热门帖”“用 browser 方式监控 X 趋势”时。默认覆盖 AI、LLM两个主题。输出逐条编号格式（# X 热点追踪 / ## N. 标题 / 摘要≤100字 / --- 分隔），对齐 huxiu-ai-news 结构。
---

# X Hot Topics Daily

## 核心目标

每天按固定话题抓取 X 热帖，产出“可快速决策”的中文简报：
- 只保留信息密度高、互动高、可行动的信息
- 去掉重复话题和低质量灌水
- 强制过滤常见营销诈骗与谣言型内容（送币抽奖、评论 done、无来源爆料等）
- 默认给出“最低成本 know-what”结论，减少 FOMO

## 固定工作流

### 1) 使用 browser 打开 X

优先使用 `browser` + `profile=chrome`：
- `browser action=open profile=chrome target=host targetUrl=https://x.com/explore/tabs/for_you`

若无法连接浏览器控制服务，直接说明失败原因并提示重试，不改用无关工具链。

### 2) 按主题抓取（默认 5 个）

默认主题：`AI`、`LLM`、`中国社会热点`、`新加坡社会热点`、`美国社会热点`

建议查询页（Top）：
- AI：`https://x.com/search?q=AI%20(lang%3Aen%20OR%20lang%3Azh)&src=typed_query&f=top`
- LLM：`https://x.com/search?q=LLM%20(lang%3Aen%20OR%20lang%3Azh)&src=typed_query&f=top`

然后：
- `browser action=snapshot profile=chrome refs=aria`
- 从快照提取前排 `article` 的：作者、发布时间、正文核心句、互动量（至少 likes/views）
- 每个主题先抓 8-10 条候选，再筛到 4-6 条入选

### 3) 过滤与去重（强制）

先过滤再总结：

1. 营销诈骗与低质过滤
   - 丢弃包含以下模式的帖子：
     - `giving away` / `random winner` / `like + repost + comment done`
     - 夸张收益承诺、领奖导流、异常短链落地页
     - 无可靠来源却宣称“突发/独家”的截图搬运
     - 明显广告帖伪装成新闻或分析

2. 去重
   - 相同新闻事件跨多个主题重复出现时，只保留一次主条目
   - 其余主题写“同一事件延伸讨论”一句话即可

3. 新鲜度
   - 优先过去 24 小时内容
   - 若不足，再补充 48 小时内高价值帖并标注

### 4) 内容提炼（强制，不可只列标题）

每条入选热点必须补齐以下信息：
- 发生了什么（1 句）
- 为什么值得现在关注（1 句，强调时效/影响）
- 谁最该关心（开发者/普通公众/投资者/出行者）
- 是否可执行（给“可做/可观望/可忽略”）

写法要求：
- 不复读标题，不堆链接
- 用“结论先行”写法，最多 3 句讲透
- 面向“最低成本 know-what”

### 5) 输出格式（默认：逐条编号体，对齐 huxiu-ai-news）

**强制输出此结构，不可变形：**

```markdown
# X 热点追踪 (YYYY-MM-DD)

## 1. 中文标题（英文原标题必须翻译为中文）
- 发布时间：YYYY-MM-DD HH:MM:SS UTC
- 链接：https://x.com/username/status/xxxx 或原文链接
- 热度：浏览量 / 点赞数 / 转发数（有则写，无则省略）

摘要内容直接写在这里。用 1-3 句讲清：发生了什么 + 为什么现在重要。
必须纯文本，不加「摘要：」「总结：」等任何前置标签。

---

## 2. 下一条标题
- 发布时间：YYYY-MM-DD HH:MM:SS UTC
- 链接：https://...

摘要内容

---
```

**强制元素清单：**

| 元素 | 必须 | 格式 |
|------|------|------|
| 主标题 | ✅ | `# X 热点追踪 (YYYY-MM-DD)`，日期格式 `YYYY-MM-DD` |
| 条目标题 | ✅ | `## N. 中文标题`，英文标题必须翻译为中文 |
| 发布时间 | ✅ | `- 发布时间：YYYY-MM-DD HH:MM:SS UTC`，必须有秒和 UTC |
| 链接 | ✅ | `- 链接：https://...`，每条独立 |
| 热度 | 推荐 | `- 热度：xxx 浏览 / xxx 点赞 / xxx 转发`，有数据则显示 |
| 摘要 | ✅ | 纯文本，无前置标签，用 1-3 句讲清发生了什么和为什么重要 |
| 分隔符 | ✅ | 每条后用 `---` 单独一行 |

**禁止格式（绝对禁止）：**
- ❌ `时间：4小时前` → 必须标准化为 `YYYY-MM-DD HH:MM:SS UTC`
- ❌ `摘要：内容` / `总结：内容` → 摘要前不能有任何标签
- ❌ `> 摘要内容` → 不能用引用格式
- ❌ `- 摘要：内容` → 摘要不是列表项
- ❌ 任意数字序号改用中文（不要用「一、二、三」，始终用 `## N.`）

**热点排序规则：**
- 按重要性从高到低排列（综合浏览量、互动量、时效性判断）
- 每个主题至少保留 1-2 条，不足时可以标注「今日该主题有效热点较少，已合并至其他主题」
- 默认输出 10 条，质量不足时可以少于 10 条但不可勉强凑数

## 质量标准

- 全文中文，摘要简洁但信息完整
- 默认输出 10 条（质量不足时可少于 10 条，但不能凑数）
- 不能输出“我无法保证准确”这类空话；要给明确结论
- 信息不足时明确写“今天该主题有效热点较少”
- 重点是“可读、可判断、可行动”
- 若热点质量明显偏低，必须直说“今天噪音占比高，建议降低信息摄入”

## 快速触发语句

可用以下指令触发：
- `执行 x-hot-topics-daily，抓取今天 X 上 AI/LLM热点并推送`
- `给我今天 X 五个主题的热点新闻速览（browser方式）`

## 输出保存与推送（默认执行）

抓取并格式化完成后，自动执行以下步骤：

### 1) 保存到 AI_NEWS_DAILY_DATA_DIR

按日期目录结构保存文件：

```bash
mkdir -p ~/Documents/sunchao251/code/ai-news-daily/data/YYYY-MM-DD/x-hot-topics/
```

文件名为 `content.md`，完整路径：
```
~/Documents/sunchao251/code/ai-news-daily/data/YYYY-MM-DD/x-hot-topics/content.md
```

与 huxiu-ai-news 共用同一仓库，按 `data/日期/x-hot-topics/content.md` 组织。

### 2) Git 提交并推送

```bash
cd ~/Documents/sunchao251/code/ai-news-daily
git pull
git add data/YYYY-MM-DD/x-hot-topics/
git commit -m "content(x-hot-topics): add daily X AI/LLM hotspots for YYYY-MM-DD"
git push
```

提交信息格式：
```
content(x-hot-topics): add daily X AI/LLM hotspots for YYYY-MM-DD

- 热点1简述
- 热点2简述
...
```

如果远端已有更新，先 `git pull` 再提交，冲突时保留双方内容。
