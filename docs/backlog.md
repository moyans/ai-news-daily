# AI News Daily — 改进需求待办清单

> 评估日期: 2026-04-28
> 修复日期: 2026-04-28
> 评估范围: 端到端数据管道 + Next.js 前端 + CI/CD + 测试

## 评估结果总览

| 维度 | 状态 | 说明 |
|------|------|------|
| 数据流水线 | 🟢 已修复 | Python 脚本输出格式 → TS 解析器已适配，新旧格式均支持 |
| 前端渲染 | 🟢 正常 | 新格式数据可正确渲染 |
| CI/CD | 🟡 半成品 | huxiu 可自动化，X 热点已标记 continue-on-error |
| 测试 | 🟢 通过 | 17/17 通过，覆盖新旧格式 |
| 构建 | 🟢 通过 | `next build` + `vitest run` 均无错误 |

---

## P0 — 致命问题（流水线断裂）

### P0-1: parse-huxiu.ts 与 Python 脚本输出格式完全不兼容

**问题**: Python 脚本 (`fetch_huxiu_ai_news.py`) 输出的是一种复杂的 Markdown 格式：

```markdown
## [Top 1] 标题: 核心价值
> [!abstract] 核心速递
> **分类**: #模型 | **作者**: 虎嗅网 | **热度分**: 219
> **一句话总结**: xxxxx
> **关键词**: #keyword1 #keyword2 #keyword3
>
> **为何值得关注**: xxxx
>
> **互动指标**: 来源数 2 | 收藏数 0 | 评论数 0
> **原文链接**: [虎嗅原文](https://www.huxiu.com/ainews/11573.html) | **发布时间**: 2026-04-28 17:50
```

但 `parse-huxiu.ts` 期望的是完全不同的格式：

```markdown
## 1. 标题
- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900001
- 分类：模型动态

摘要文本

---
```

**不兼容细节**:
1. 标题正则 `##\s+\d+\.\s+(.+)` 不匹配 `## [Top 1] ...`
2. 链接正则 `[\-\u2022]\s*链接[\uff1a:]\s*(https?://[^\s]+)` 不匹配 `**原文链接**: [虎嗅原文](url)`
3. 分类正则 `[\-\u2022]\s*分类[\uff1a:]\s*(.+)` 不匹配 `**分类**: #model | ...`
4. 摘要提取逻辑会错误地收集 `> [!abstract]` 等引用块内容
5. `---` 分隔符位置不同（脚本在每个块前放 `---`，解析器期望在块后 `---` 后跟下一个块）

**建议方案**（二选一）:
- **方案 A**: 修改 `parse-huxiu.ts` 适配脚本真实输出格式（推荐，因为脚本输出信息更丰富）
- **方案 B**: 增加脚本的 `--format simple-markdown` 模式，输出与解析器兼容的简单格式

**影响范围**: `src/lib/parse-huxiu.ts`, `src/lib/__tests__/parse-huxiu.test.ts`

---

### P0-2: X 热点数据源在 CI 中不可用

**问题**: `.github/workflows/daily-news.yml` 第 35 行：
```yaml
run: echo "X topics fetching - to be configured with X API or Playwright headless"
```

X 热点抓取目前依赖浏览器自动化（Playwright），无法在 headless CI 环境中运行。

**当前数据**: `data/2026-04-28/x-hot-topics/content.md` 是手工伪造的测试数据（URL 皆为虚构如 `https://x.com/sama/status/199999999`）。

**建议方案**:
1. 短期：在 CI 中添加 Playwright headless 安装步骤 + 预登录 cookie 方案
2. 长期：使用 X API v2 获取 trending topics，不再依赖浏览器
3. 备选：接受 X 热点仅手动更新，CI 中保留占位但添加 `continue-on-error: true`

**影响范围**: `.github/workflows/daily-news.yml`, `.opencode/skills/x-hot-topics-daily/`

---

## P1 — 重要改进

### P1-1: SourceTabs 使用 window.location.href 导致全页刷新

**问题**: `src/components/SourceTabs.tsx` 中：
```tsx
window.location.href = `/daily/${date}${params}`;
```
这会导致整页刷新，完全绕过了 Next.js App Router 的客户端导航优势。

**建议方案**: 改用 Next.js `router.push()` 或 `<Link>` + `useSearchParams`：
```tsx
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();
router.push(`/daily/${date}${params}`);
```

**影响范围**: `src/components/SourceTabs.tsx`

---

### P1-2: Archive 页面循环读文件无缓存

**问题**: `src/app/archive/page.tsx` 中：
```tsx
monthDates.map((date) => {
  const data = getDailyData(date); // 每个日期读 2 个 md 文件
```
当数据积累到 30+ 天时，这意味着读 60+ 文件，完全没有缓存。

**建议方案**:
1. 在 `data.ts` 中添加简单的模块级缓存（Map 缓存，定期清除）
2. 或为 Archive 页面创建专用的轻量查询函数，只返回日期+条数
3. 或使用 Next.js `revalidate` + ISR 缓存

**影响范围**: `src/lib/data.ts`, `src/app/archive/page.tsx`

---

## P2 — 改进项

### P2-1: NewsItem.tags 字段未被填充

**问题**: `types.ts` 中定义了 `tags?: string[]`，但两个 parser 都没有填充此字段。而 huxiu Python 脚本输出的关键词数据（`#模型`, `#芯片` 等）很适合映射到 tags。

**建议方案**: 
1. 在 `parse-huxiu.ts` 中解析 `> **分类**: #model | ...` 行，提取 hashtag 作为 tags
2. 在 `parse-x-topics.ts` 中从标题和摘要推断 tags
3. 在 `NewsCard.tsx` 中渲染 tags（可选）

**影响范围**: `src/lib/parse-huxiu.ts`, `src/lib/parse-x-topics.ts`, `src/components/NewsCard.tsx`

---

### P2-2: 页面缺少 Error Boundary 和 Suspense/Loading

**问题**: 
- 没有 React Error Boundary，任何组件崩溃会导致白屏
- 没有 loading.tsx，页面切换时无加载反馈
- 没有 skeleton/screen placeholder

**建议方案**:
1. 在 `src/app/daily/[date]/` 和 `src/app/archive/` 下添加 `error.tsx`
2. 在同目录添加 `loading.tsx`（skeleton 卡片）
3. 在根 layout 添加全局 Error Boundary

**影响范围**: 新增 `error.tsx`, `loading.tsx` 文件

---

### P2-3: Huxiu 脚本默认输出路径硬编码

**问题**: `fetch_huxiu_ai_news.py` 第 405 行：
```python
return Path.home() / "Documents" / "sunchao251" / "code" / "ai-news-daily" / "data"
```
这个路径是个人路径，不可移植。

**建议方案**:
1. 默认使用当前工作目录下的 `data/`（通过 `get_execution_dir()` 判断），仅在没有 `ai-news-daily` 目录时才用 home 路径
2. 或改为优先使用 `os.path.dirname(os.path.dirname(__file__))` + `/data`

**影响范围**: `fetch_huxiu_ai_news.py` 的 `get_default_output_dir()` 函数

---

## P3 — 优化项

### P3-1: 测试数据与真实数据混杂

**问题**: `data/2026-04-28/x-hot-topics/content.md` 的 URL 是虚构的（`status/199999999`），与真实数据混在一起，难以区分。

**建议方案**:
1. 添加 seed 数据机制：`data/seed/` 目录存放开发用测试数据
2. `.gitignore` 中可选择性排除 seed 数据
3. 或添加 `_test` 后缀标识测试数据

---

### P3-2: data.ts 无缓存层

**问题**: 每次调用 `getDailyData()` 都从磁盘读取文件。当前 SSG 模式下可接受（build 时读取一次），但未来如果改为 SSR/ISR 模式，会频繁读磁盘。

**建议方案**: 添加模块级 LRU 缓存，键为 `date+source`，值为解析结果，TTL 5 分钟。

---

### P3-3: huxiu 脚本分类体系与前端不一致

**问题**: Python 脚本用 8 类，前端 `CATEGORY_MAP` 只映射了 7 种。脚本输出的 `#xxx` 格式需要 strip `#` 后再映射。

**状态**: ✅ 已修复。新版 `parse-huxiu.ts` 完全支持 `#xxx` 格式的分类映射，包含额外类别如 `#芯片→tools`, `#智能体→tools`, `#机器人→product`。

---

## 已修复项目

### ✅ P0-1: parse-huxiu.ts 与 Python 脚本输出格式兼容
- 重写 `parse-huxiu.ts`，新增 `parseHuxiuMarkdown()` 支持脚本真实输出格式（`## [Top N]`, `> [!abstract]`, `**分类**:`, `[虎嗅原文](url)` 等）
- 保留 `parseHuxiuLegacyMarkdown()` 作为旧格式回退
- 测试覆盖：新增 10 个测试用例（新旧格式各 5+ 个）
- 提取 tags（`**关键词**`）、metrics（`**互动指标**`、`**热度分**`）、发布时间（`**发布时间**`）

### ✅ P0-2: X 热点 CI 占位处理
- CI workflow 中 `fetch-x-topics` 添加 `continue-on-error: true`
- 添加详细 TODO 注释说明阻塞原因和实施方案
- 移除不必要的 Python setup 步骤

### ✅ P1-1: SourceTabs 客户端导航
- `SourceTabs.tsx` 改为 `"use client"` 组件
- 使用 `useRouter()` + `useSearchParams()` 实现客户端导航
- 外层包裹 `<Suspense>` 避免 hydration 错误
- 移除 `window.location.href` 全页刷新

### ✅ P1-2: Archive 缓存 + 轻量查询
- `data.ts` 添加模块级 `Map` 缓存（5 分钟 TTL）
- 新增 `getDailyItemCount(date)` 轻量函数，Archive 页面使用

### ✅ P2-1: NewsItem tags 字段
- 新版 parse-huxiu.ts 已提取 `**关键词**` 字段并填充 `tags`
- NewsCard 组件渲染 tags（最多 3 个，`·` 分隔）

### ✅ P2-2: Error Boundary + Loading
- `daily/[date]/error.tsx` + `daily/[date]/loading.tsx`
- `archive/error.tsx` + `archive/loading.tsx`

### ✅ P2-3: huxiu 脚本默认输出路径
- `get_default_output_dir()` 增加 fallback：检测脚本所在项目根目录（3 层 parent）
- 如果项目根有 `data/` 目录和 `package.json`，优先使用

---

## 建议优先处理顺序

1. **P0-1** → 修复 huxiu 解析器/脚本格式不兼容（否则整个数据管道是断的）
2. **P0-2** → 决定 X 热点 CI 方案（否则自动化是半成品）
3. **P1-1** → SourceTabs 客户端导航（用户体验提升明显）
4. **P1-2** → Archive 缓存（数据量增长后必须解决）
5. **P2-1~P2-3** → 渐进改进
6. **P3-1~P3-3** → 优化打磨