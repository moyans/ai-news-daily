# AI News Daily — 前端修复清单

> 基于 2026-04-28 本地 `http://localhost:3000/daily/2026-04-28` 的实际界面审查
> 按严重程度排序，每个问题给出精确的修复位置和方案

---

## 🔴 P0 — Bug（必须修复）

### P0-1: X 热点摘要泄漏 HTML 注释

**现象**：X 热点卡片的摘要文本开头显示 `<!-- SEED_DATA: 此文件为示例种子数据，非真实抓取结果。由 x-hot-topics-daily skill 生成后将替换为真实数据。 -->`，用户直接可见。

**根因**：`src/lib/parse-x-topics.ts` 的 summary 提取逻辑遍历 section 的每一行，把非标题、非列表项的行全部拼进摘要。HTML 注释行 `<!-- SEED_DATA: ... -->` 不以 `##`、`# `、`- ` 开头，也不等于 `---`，所以被当作摘要文本。

**修复方案**：

1. **数据文件** — `data/2026-04-28/x-hot-topics/content.md`：把 HTML 注释从第二个 `---` 分隔符之前移到文件顶部（`# X 热点追踪` 标题之前），确保它不被 `\n---\n` split 包进任何 section：
   ```markdown
   <!-- SEED_DATA: 此文件为示例种子数据 -->
   # X 热点追踪 (2026-04-28)

   ## 1. Sam Altman：...
   ```

2. **解析器** — `src/lib/parse-x-topics.ts`：在 summary 提取循环中增加 HTML 注释过滤：
   ```ts
   // 在 trimmed.startsWith("##") 那个 if 之前加：
   if (trimmed.startsWith("<!--")) continue;
   ```

3. **防御性**：同时修复 `src/lib/parse-huxiu.ts` 的 summary 提取中也要加同样的过滤（两个文件都有类似逻辑）。

**涉及文件**：
- `src/lib/parse-x-topics.ts`（第 77-85 行区域）
- `src/lib/parse-huxiu.ts`（summary 提取循环）
- `data/2026-04-28/x-hot-topics/content.md`（迁移注释位置）

---

### P0-2: 虎嗅标题在冒号处被错误截断，丢失核心信息

**现象**：

| 页面显示（截断后） | 原始完整标题 |
|---|---|
| "小马智行CEO彭军" | "小马智行CEO彭军：现有自动驾驶分级体系不合理，L3都是L2" |
| "前苹果CEO斯卡利" | "前苹果CEO斯卡利：OpenAI是苹果自15年前库克接任以来最大威胁" |

同时另一个极端问题：标题 "微软：埃森哲为74.3万员工部署Copilot AI助手: AI 正从问答工具转向执行工具" 中的英文冒号核心价值后缀没有被截断，完整显示在卡片上。

**根因**：Python 脚本输出格式为：

```markdown
## [Top 3] 小马智行CEO彭军：现有自动驾驶分级体系不合理，L3都是L2: 具身智能正在加速进入真实场景
## [Top 7] 微软：埃森哲为74.3万员工部署Copilot AI助手: AI 正从问答工具转向执行工具
```

解析器当前逻辑（`parse-huxiu.ts` 约 97-112 行）用中文冒号 `：` 做截断，只在 `：` 前面长度在 4-60 范围内才截断。问题在于：
- 很多新闻标题**本身就包含中文冒号**（如 "小马智行CEO彭军：..."），不应截断
- 英文冒号 `: ` 的核心价值后缀（"AI 正从问答工具转向执行工具"）没有被去除

**修复方案**：重写标题提取逻辑。脚本格式为 `## [Top N] FullTitle: CoreValueSuffix`，其中 `CoreValueSuffix` 是脚本从 `CORE_VALUE` 映射表中生成的（固定 8 种），特征是 `": "` 后面紧跟已知的核心价值短语。

```ts
// parse-huxiu.ts 中 replaceTitleExtraction 逻辑

const CORE_VALUE_SUFFIXES = [
  "AI 监管开始从讨论走向执行",
  "算力和芯片供给仍是行业上限",
  "具身智能正在加速进入真实场景",
  "AI 正从问答工具转向执行工具",
  "大模型竞争继续向生态和落地延伸",
  "AI 产品正努力改变默认入口",
  "资本正在重新定价 AI 赛道",
  "AI 正在更直接地改变消费和工作流程",
];

function stripCoreValueSuffix(title: string): string {
  // 只移除英文冒号+空格 后紧跟已知核心价值后缀的情况
  for (const suffix of CORE_VALUE_SUFFIXES) {
    if (title.endsWith(suffix)) {
      const idx = title.lastIndexOf(": " + suffix);
      if (idx > 0) {
        return title.substring(0, idx).trim();
      }
      // 也检查中文冒号
      const cnIdx = title.lastIndexOf("：" + suffix);
      if (cnIdx > 0) {
        return title.substring(0, cnIdx).trim();
      }
    }
  }
  return title;
}
```

**涉及文件**：
- `src/lib/parse-huxiu.ts`（标题提取逻辑，约第 94-112 行）

**一定要加测试**：在 `parse-huxiu.test.ts` 中增加用例覆盖以下场景：
- 标题含中文冒号但不是核心价值后缀（如 "小马智行CEO彭军：现有体系不合理..."）→ 不截断
- 标题含英文冒号+核心价值后缀（如 "微软：埃森哲部署Copilot: AI 正从问答工具转向执行工具"）→ 只移除核心价值后缀
- 标题不含冒号 → 保持原样

---

### P0-3: 指标显示混乱——heat_score 被当作浏览量，0 值显示异常

**现象**：
- 虎嗅 heat_score=219 显示为 "0.0万浏览"（无意义的小数值）
- likes=0 显示为裸 "0"，shares=0 也显示为裸 "0"
- X 数据 views=12000000 显示为 "1200.0万浏览"（多余的 .0）

**根因**：
1. `parse-huxiu.ts` 将 `heatScore` 映射到 `metrics.views`、`favorites` 映射到 `metrics.likes`、`comments` 映射到 `metrics.shares`，但这三组数据的语义完全不同（热度分 vs 点赞数 vs 浏览量）
2. `NewsCard.tsx` 的格式化逻辑不适配小数值和零值：
   - `(views / 10000).toFixed(1)` 对 219 变成 "0.0"
   - `likes.toLocaleString()` 对 0 变成 "0"

**修复方案**：

**方案 A（推荐）**：区分数据源，虎嗅用独立格式：

`src/lib/types.ts` 扩展 metrics 结构：
```ts
metrics?: {
  views?: number;
  likes?: number;
  shares?: number;
  heatScore?: number;      // 新增：虎嗅热度分
  sourceCount?: number;    // 新增：虎嗅来源数
};
```

`src/components/NewsCard.tsx` 按来源分别格式化：
```tsx
// 虎嗅：显示 "热度 219 · 来源 3 · 评论 0"
// X：显示 "1200万浏览 · 28万赞 · 6万转发"
// 零值统一处理：不显示该指标而非显示 "0" 或 "0.0万"
```

**方案 B（快速）**：在 NewsCard 中统一优化格式化逻辑：
```tsx
const formatCount = (n: number | undefined, unit: string) => {
  if (n === undefined || n === 0) return null;
  if (n >= 10000) {
    const wan = n / 10000;
    return `${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}万${unit}`;
  }
  return `${n.toLocaleString()}${unit}`;
};
```
所有指标返回 null 时跳过渲染。

**涉及文件**：
- `src/components/NewsCard.tsx`（格式化逻辑）
- `src/lib/types.ts`（如果用方案 A，扩展 metrics 类型）
- `src/lib/parse-huxiu.ts`（如果用方案 A，改映射方式）

---

### P0-4: "万浏览" 格式带多余 ".0"

**现象**：X 数据 "1200.0万浏览"、"560.0万浏览"、"890.0万浏览"。

**根因**：`NewsCard.tsx` 第 52 行 `(item.metrics.views / 10000).toFixed(1)` 强制保留一位小数。

**修复**：与 P0-3 一起修复，在格式化函数中判断是否为整数：

```tsx
const wan = views / 10000;
const viewsStr = wan === Math.floor(wan) ? `${wan}` : `${wan.toFixed(1)}`;
// 输出: "1200万浏览" 而非 "1200.0万浏览"
```

**涉及文件**：`src/components/NewsCard.tsx`

---

## 🟡 P1 — 体验优化

### P1-1: 卡片不显示发布时间

**现象**：新闻卡片没有显示发布时间。虎嗅数据有 `publishedAt`（从 `**发布时间**` 字段提取），X 热点也有完整的 UTC 时间戳。

**修复方案**：在 NewsCard 底部栏显示时间：

```tsx
// 在"原文链接"旁边加：
<span className="text-xs text-muted">
  {formatRelativeTime(item.publishedAt)}
</span>
```

需要一个格式化函数：今天显示 "HH:MM"，昨天显示 "昨天 HH:MM"，更早显示 "MM-DD HH:MM"。

**涉及文件**：
- `src/components/NewsCard.tsx`

---

### P1-2: "为何值得关注" 字段丢失

**现象**：虎嗅脚本的 `**为何值得关注**:` 字段包含最高的信息密度（如 "监管口径一旦收紧，会直接影响模型训练、内容分发和商业化边界。 这条消息来自 3 个来源交叉佐证"），但解析器完全丢弃了。

**修复方案**：

1. `src/lib/types.ts`：NewsItem 添加 `whyItMatters?: string` 字段
2. `src/lib/parse-huxiu.ts`：提取 `**为何值得关注**[：:]\s*(.+)` 内容
3. `src/components/NewsCard.tsx`：在 summary 下方或作为 tooltip 显示

**涉及文件**：
- `src/lib/types.ts`
- `src/lib/parse-huxiu.ts`
- `src/components/NewsCard.tsx`

---

### P1-3: 来源/分类/标签三个信息层次视觉扁平

**现象**：来源标签（"虎嗅"/"X"）、分类标签（"产品"/"模型"）、关键词标签（"应用落地·真实场景·商业化"）挤在同一行 `flex items-center gap-2`，视觉上没有层次区分。

**修复方案**：
- 来源标签：带背景色的圆角徽章（`bg-huxiu/10 text-huxiu` 或 `bg-x/10 text-x`），字号稍大、加粗
- 分类标签：当前样式不变，但加小圆角边框（`border border-border rounded px-1`）
- 关键词标签：独立一行，用更浅的 `text-muted/60` 颜色，用 `·` 分隔

示例布局：
```
[虎嗅]  产品
应用落地 · 真实场景 · 商业化
### 天猫618将于5月21日开启
```

**涉及文件**：
- `src/components/NewsCard.tsx`

---

### P1-4: 摘要过长缺少截断

**现象**：部分摘要超过 80 字，如 "欧盟委员会周一向谷歌发布一系列拟议措施，要求其根据《数字市场法案》向AI竞争对手开放安卓操作系统的核心功能访问权限..." 在卡片中占 3-4 行。

**修复方案**：在 `NewsCard` 中将 `line-clamp-3` 改为 `line-clamp-2`，或在 parser 层对 summary 做 120 字硬截断（优先选 `line-clamp` 方案，更通用）。

**涉及文件**：
- `src/components/NewsCard.tsx`（第 36 行 `line-clamp-3` → `line-clamp-2`）

---

## 🟢 P2 — 小优化

### P2-1: 来源标签按钮激活态视觉加强

**现象**：SourceTabs 的 active 按钮用 `bg-accent text-white`，在深色背景下蓝色背景的白色文字对比可以接受，但建议增加 `ring-1 ring-accent` 或 `shadow-sm` 增强可点击感。

**涉及文件**：`src/components/SourceTabs.tsx`

---

### P2-2: Archive 页面新闻条数偏大

**现象**：Archive 显示 "13 条新闻"（10 虎嗅 + 3 X），但这对于"all"筛选是正确的。可以考虑显示 "虎嗅 10 · X 3" 的分来源计数。

**涉及文件**：`src/app/archive/page.tsx`

---

## 修复顺序建议

1. **P0-2 + P0-3 + P0-4** — 一起修，涉及同一组文件（parse-huxiu + NewsCard），改动互相关联
2. **P0-1** — 独立修复，简单
3. **P1-2** — 涉及类型变更，建议和 P0 一起做
4. **P1-1 + P1-3 + P1-4** — 纯 UI 调整，可以一起做
5. **P2** — 收尾