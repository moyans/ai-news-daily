#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


LIST_URL = "https://www.huxiu.com/ainews/"
DETAIL_URL = "https://www.huxiu.com/ainews/{id}.html"
TZ = dt.timezone(dt.timedelta(hours=8))


@dataclass
class NewsItem:
    rank: int
    news_id: int
    title: str
    desc: str
    author_handle: str
    source_list: list[dict[str, Any]]
    count_info: dict[str, Any]
    publish_time: int
    url: str

    @property
    def source_count(self) -> int:
        return len(self.source_list or [])

    @property
    def heat_score(self) -> int:
        fav = int(self.count_info.get("favorite_num") or 0)
        comment = int(self.count_info.get("comment_num") or 0)
        return self.source_count * 100 + fav * 20 + comment * 30 + max(0, 20 - self.rank)

    def to_dict(self) -> dict[str, Any]:
        return {
            "rank": self.rank,
            "news_id": self.news_id,
            "title": self.title,
            "desc": self.desc,
            "author_handle": self.author_handle,
            "source_list": self.source_list,
            "count_info": self.count_info,
            "publish_time": self.publish_time,
            "url": self.url,
            "source_count": self.source_count,
            "heat_score": self.heat_score,
            "posted_at": format_time(self.publish_time),
        }


def fetch_html(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", "ignore")


def extract_nuxt_data(html: str) -> list[Any]:
    match = re.search(
        r'<script type="application/json" data-nuxt-data="nuxt-app" data-ssr="true" id="__NUXT_DATA__">(.*?)</script>',
        html,
        re.S,
    )
    if not match:
        raise ValueError("无法找到 __NUXT_DATA__ 脚本")
    return json.loads(unescape(match.group(1)))


def build_resolver(payload: list[Any]):
    def resolve_value(value: Any, stack: tuple[int, ...] = ()) -> Any:
        if isinstance(value, bool):
            return value
        if isinstance(value, int) and 0 <= value < len(payload):
            target = payload[value]
            if isinstance(target, (str, int, float, bool)) or target is None:
                return target
            if value in stack:
                return target
            return resolve_value(target, stack + (value,))
        if isinstance(value, list):
            if len(value) == 2 and isinstance(value[0], str) and isinstance(value[1], int):
                return resolve_value(value[1], stack)
            return [resolve_value(v, stack) for v in value]
        if isinstance(value, dict):
            return {k: resolve_value(v, stack) for k, v in value.items()}
        return value

    return resolve_value


def iter_dicts(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from iter_dicts(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_dicts(child)


def find_first_dict(value: Any, predicate) -> dict[str, Any] | None:
    for item in iter_dicts(value):
        if predicate(item):
            return item
    return None


def get_meta_author(html: str) -> str:
    patterns = [
        r'<meta\s+name="author"\s+content="([^"]+)"',
        r'<meta\s+property="article:author"\s+content="([^"]+)"',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.I)
        if match:
            return match.group(1).strip()
    return "虎嗅网"


def first_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return ""
    for separator in ("。", "；", ";", "\n"):
        if separator in text:
            text = text.split(separator, 1)[0].strip()
            break
    return text


def lead_clause(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return ""
    for separator in ("，", ",", "。", "；", ";", "\n"):
        if separator in text:
            return text.split(separator, 1)[0].strip()
    return text


SUMMARY_BOUNDARIES = ("。", "；", ";", "！", "!", "？", "?", "，", ",", "、")


def trim_summary(text: str, *, min_len: int, max_len: int, overflow: int = 30) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text or len(text) <= max_len:
        return text

    boundary_positions = [index + 1 for index, char in enumerate(text) if char in SUMMARY_BOUNDARIES and index + 1 >= min_len]
    within_limit = [pos for pos in boundary_positions if pos <= max_len]
    if within_limit:
        return text[: max(within_limit)].rstrip("，,；;！!?？、 ")

    near_overflow = [pos for pos in boundary_positions if pos <= max_len + overflow]
    if near_overflow:
        return text[: min(near_overflow)].rstrip("，,；;！!?？、 ")

    return text[: max_len - 1].rstrip("，,；;！!?？、 ") + "…"


CATEGORY_RULES: list[tuple[str, list[str]]] = [
    ("#政策", ["监管", "政策", "合规", "法官", "欧盟", "起诉", "审查", "处罚", "治理"]),
    ("#芯片", ["芯片", "算力", "GPU", "台积电", "英伟达", "半导体", "数据中心", "N3"]),
    ("#机器人", ["机器人", "具身", "四足", "机械臂", "人形", "自动驾驶", "无人机"]),
    ("#智能体", ["Agent", "智能体", "Copilot", "助手", "导航代理", "工作流"]),
    ("#模型", ["模型", "大模型", "LLM", "推理", "训练", "OpenAI", "Claude", "Gemini", "DeepSeek", "Grok", "Codex", "Qwen", "Kimi", "Minimax", "GLM", "GLM"]),
    ("#产品", ["发布", "上线", "内测", "功能", "产品", "应用", "Demo", "客户端", "体验"]),
    ("#融资", ["融资", "估值", "收购", "并购", "投资", "IPO"]),
    ("#应用", ["电商", "购物", "搜索", "医疗", "教育", "营销", "广告", "内容审核"]),
]

CORE_VALUE = {
    "#政策": "AI 监管开始从讨论走向执行",
    "#芯片": "算力和芯片供给仍是行业上限",
    "#机器人": "具身智能正在加速进入真实场景",
    "#智能体": "AI 正从问答工具转向执行工具",
    "#模型": "大模型竞争继续向生态和落地延伸",
    "#产品": "AI 产品正努力改变默认入口",
    "#融资": "资本正在重新定价 AI 赛道",
    "#应用": "AI 正在更直接地改变消费和工作流程",
}

KEYWORD_RULES = [
    "OpenAI",
    "DeepSeek",
    "Gemini",
    "Claude",
    "Grok",
    "Copilot",
    "Codex",
    "台积电",
    "英伟达",
    "微软",
    "谷歌",
    "Meta",
    "腾讯",
    "阿里",
    "字节",
    "机器人",
    "智能体",
    "大模型",
    "算力",
    "芯片",
    "融资",
    "收购",
    "监管",
    "电商",
    "搜索",
]

DEFAULT_KEYWORDS = {
    "#政策": ["监管", "合规", "治理"],
    "#芯片": ["算力", "供应链", "芯片"],
    "#机器人": ["具身智能", "场景落地", "自动化"],
    "#智能体": ["任务执行", "工作流", "助手"],
    "#模型": ["大模型", "训练", "推理"],
    "#产品": ["产品化", "功能上线", "用户入口"],
    "#融资": ["融资", "估值", "并购"],
    "#应用": ["应用落地", "真实场景", "商业化"],
}

WHY_IT_MATTERS = {
    "#政策": "监管口径一旦收紧，会直接影响模型训练、内容分发和商业化边界。",
    "#芯片": "算力与芯片决定模型训练和推理上限，也会影响行业成本曲线。",
    "#机器人": "具身智能最难的是从 Demo 走向稳定量产和真实场景，这类消息通常代表落地进展。",
    "#智能体": "智能体一旦能稳定执行任务，就会把 AI 从聊天工具推进到生产力工具。",
    "#模型": "大模型竞争已经不只看单点指标，还要看生态、工具链和场景落地。",
    "#产品": "系统级或应用级产品更新通常会改变默认入口和用户习惯，值得持续观察。",
    "#融资": "融资、收购和估值变化往往反映资本对赛道的重新判断。",
    "#应用": "AI 应用能否真正进入高频场景，决定它是否只是概念还是可规模化产品。",
}

MODEL_LAUNCH_TRIGGERS = (
    "发布",
    "推出",
    "上线",
    "首发",
    "正式发布",
    "内测",
    "预览",
    "开源",
    "新模型",
    "新版本",
    "新品",
)

MODEL_METRIC_KEYWORDS = (
    "参数",
    "参数量",
    "规模",
    "精度",
    "准确率",
    "benchmark",
    "分数",
    "得分",
    "性能",
    "推理",
    "速度",
    "延迟",
    "tokens/s",
    "token/s",
    "上下文",
    "窗口",
    "吞吐",
    "成本",
    "价格",
)


def classify(title: str, desc: str) -> str:
    text = f"{title} {desc}"
    for category, keywords in CATEGORY_RULES:
        if any(keyword.lower() in text.lower() for keyword in keywords):
            return category
    return "#应用"


def pick_keywords(category: str, title: str, desc: str) -> list[str]:
    text = f"{title} {desc}"
    result: list[str] = []
    for token in KEYWORD_RULES:
        if token.lower() in text.lower() and f"#{token}" not in result:
            result.append(f"#{token}")
        if len(result) >= 3:
            break
    for token in DEFAULT_KEYWORDS.get(category, []):
        if len(result) >= 3:
            break
        candidate = f"#{token}"
        if candidate not in result:
            result.append(candidate)
    while len(result) < 3:
        result.append(f"#{category.lstrip('#')}")
    return result[:3]


def core_value(category: str) -> str:
    return CORE_VALUE.get(category, "行业动向值得持续跟踪")


def is_model_launch(category: str, title: str, desc: str) -> bool:
    if category != "#模型":
        return False
    text = f"{title} {desc}".lower()
    return any(trigger.lower() in text for trigger in MODEL_LAUNCH_TRIGGERS)


def extract_metric_clauses(text: str, limit: int = 2) -> list[str]:
    cleaned = re.sub(r"\[[^\]]+\]", "", text)
    clauses: list[str] = []
    for raw_clause in re.split(r"[。！？；;，,\n]", cleaned):
        clause = re.sub(r"\s+", " ", raw_clause).strip()
        if not clause:
            continue
        if any(keyword.lower() in clause.lower() for keyword in MODEL_METRIC_KEYWORDS):
            clauses.append(clause)
        if len(clauses) >= limit:
            break
    return clauses


def make_summary(title: str, desc: str, category: str) -> str:
    if is_model_launch(category, title, desc):
        text = lead_clause(desc) or first_sentence(desc) or title
        metrics = extract_metric_clauses(desc)
        if metrics:
            extras: list[str] = []
            for clause in metrics:
                if clause and clause not in text and not text.startswith(clause):
                    extras.append(clause)
                if len(extras) >= 2:
                    break
            if extras:
                text = f"{text}；" + "；".join(extras)
        return trim_summary(text, min_len=90, max_len=160, overflow=40)
    text = first_sentence(desc) or title
    return trim_summary(text, min_len=60, max_len=120, overflow=30)


def why_it_matters(category: str, source_count: int) -> str:
    base = WHY_IT_MATTERS.get(category, "这类新闻会影响行业节奏、产品判断和后续落地路径。")
    if source_count >= 3:
        return f"{base} 这条消息来自 {source_count} 个来源交叉佐证，行业关注度较高。"
    return base


def format_time(ms: int) -> str:
    return dt.datetime.fromtimestamp(ms / 1000, tz=TZ).strftime("%Y-%m-%d %H:%M")


def build_output_path(
    output: Path | None,
    output_dir: Path,
    filename_template: str,
    limit: int,
) -> Path:
    if output is not None:
        return output

    now = dt.datetime.now(TZ)
    values = {
        "date": now.strftime("%Y-%m-%d"),
        "timestamp": now.strftime("%Y%m%d-%H%M%S"),
        "limit": limit,
    }
    try:
        filename = filename_template.format(**values)
    except KeyError as exc:
        missing = exc.args[0]
        raise ValueError(f"filename template 缺少占位符: {missing}") from exc

    return output_dir / filename


def get_execution_dir() -> Path:
    pwd = os.environ.get("PWD")
    if pwd:
        try:
            return Path(pwd).expanduser().resolve()
        except OSError:
            pass
    try:
        return Path.cwd().resolve()
    except (OSError, RuntimeError):
        return Path.home().resolve()


def get_default_output_dir() -> Path:
    override = os.environ.get("AI_NEWS_DAILY_DATA_DIR")
    if override:
        return Path(override).expanduser()
    cwd = get_execution_dir()
    if cwd.name == "ai-news-daily":
        return cwd / "data"
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent.parent
    if (project_root / "data").is_dir() and (project_root / "package.json").exists():
        return project_root / "data"
    return Path.home() / "Documents" / "sunchao251" / "code" / "ai-news-daily" / "data"


def merge_article(list_item: dict[str, Any], detail_item: dict[str, Any], html: str, rank: int) -> NewsItem:
    merged = {**list_item, **detail_item}
    source_list = merged.get("source_list") or list_item.get("source_list") or []
    count_info = merged.get("count_info") or list_item.get("count_info") or {}
    title = merged.get("title") or list_item.get("title") or ""
    desc = merged.get("desc") or list_item.get("desc") or ""
    publish_time = int(merged.get("publish_time") or list_item.get("publish_time") or 0)
    news_id = int(merged.get("ainews_id") or list_item.get("ainews_id") or 0)
    author_handle = get_meta_author(html)
    url = DETAIL_URL.format(id=news_id)
    return NewsItem(
        rank=rank,
        news_id=news_id,
        title=title,
        desc=desc,
        author_handle=author_handle,
        source_list=source_list,
        count_info=count_info,
        publish_time=publish_time,
        url=url,
    )


def parse_detail_page(article_id: int) -> tuple[dict[str, Any], str]:
    html = fetch_html(DETAIL_URL.format(id=article_id))
    payload = extract_nuxt_data(html)
    resolve_value = build_resolver(payload)
    root = resolve_value(payload[1])
    article = find_first_dict(
        root,
        lambda d: d.get("ainews_id") == article_id and "source_list" in d and "publish_time" in d,
    )
    if not article:
        article = find_first_dict(root, lambda d: "source_list" in d and "publish_time" in d) or {}
    return article, html


def parse_list_page(limit: int) -> list[dict[str, Any]]:
    html = fetch_html(LIST_URL)
    payload = extract_nuxt_data(html)
    resolve_value = build_resolver(payload)
    root = resolve_value(payload[1])
    feed = find_first_dict(root, lambda d: "aiNewsList" in d and isinstance(d.get("aiNewsList"), list))
    if not feed:
        raise ValueError("无法从列表页提取 aiNewsList")
    return feed["aiNewsList"][:limit]


def build_items(limit: int) -> list[NewsItem]:
    list_items = parse_list_page(limit)
    results: list[NewsItem] = []
    for index, list_item in enumerate(list_items, start=1):
        article_id = int(list_item.get("ainews_id") or 0)
        detail_item, html = parse_detail_page(article_id)
        results.append(merge_article(list_item, detail_item, html, index))
    return results


def render_markdown(items: list[NewsItem]) -> str:
    now = dt.datetime.now(TZ)
    report_date = now.strftime("%Y-%m-%d")
    generated_at = now.strftime("%Y-%m-%d %H:%M:%S")
    blocks: list[str] = []
    for item in items:
        category = classify(item.title, item.desc)
        summary = make_summary(item.title, item.desc, category)
        keywords = pick_keywords(category, item.title, item.desc)
        section_title = f"{item.title}: {core_value(category)}"
        fav = int(item.count_info.get("favorite_num") or 0)
        comment = int(item.count_info.get("comment_num") or 0)
        block = "\n".join(
            [
                "---",
                f"## [Top {item.rank}] {section_title}",
                "> [!abstract] 核心速递",
                f"> **分类**: {category} | **作者**: {item.author_handle} | **热度分**: {item.heat_score}",
                f"> **一句话总结**: {summary}",
                f"> **关键词**: {' '.join(keywords)}",
                ">",
                f"> **为何值得关注**: {why_it_matters(category, item.source_count)}",
                ">",
                f"> **互动指标**: 来源数 {item.source_count} | 收藏数 {fav} | 评论数 {comment}",
                f"> **原文链接**: [虎嗅原文]({item.url}) | **发布时间**: {format_time(item.publish_time)}",
            ]
        )
        blocks.append(block)
    return "\n".join(
        [
            f"# 虎嗅 AI 科技热点 | {report_date}",
            "",
            f"> 更新时间: {generated_at}",
            "> 来源: 虎嗅 AI News",
            "> 仓库: ai-news-daily",
            "",
            "---",
            "",
            f"## Top {len(items)} 虎嗅 AI 热点",
            "",
            "\n\n".join(blocks),
            "",
            f"*由 huxiu-ai-news Skill 自动生成，生成时间: {generated_at}*",
            "",
        ]
    )


def render_json(items: list[NewsItem], limit: int) -> str:
    payload = {
        "source": "huxiu-ai-news",
        "limit": limit,
        "generated_at": dt.datetime.now(TZ).strftime("%Y-%m-%d %H:%M"),
        "items": [item.to_dict() for item in items],
    }
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def git_commit_and_push(file_path: Path, commit_message: str | None = None) -> bool:
    """自动提交并推送到 Git 仓库"""
    try:
        # 查找 Git 仓库根目录
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            cwd=file_path.parent,
        )
        if result.returncode != 0:
            print(f"警告: 未找到 Git 仓库，跳过提交")
            return False
        
        repo_root = Path(result.stdout.strip())
        
        # 检查是否有远程仓库
        result = subprocess.run(
            ["git", "remote", "-v"],
            capture_output=True,
            text=True,
            cwd=repo_root,
        )
        if result.returncode != 0 or not result.stdout.strip():
            print(f"警告: Git 仓库没有配置远程仓库，跳过推送")
            return False
        
        # 获取相对路径
        try:
            rel_path = file_path.relative_to(repo_root)
        except ValueError:
            rel_path = file_path.name
        
        # 添加文件
        result = subprocess.run(
            ["git", "add", str(rel_path)],
            capture_output=True,
            text=True,
            cwd=repo_root,
        )
        if result.returncode != 0:
            print(f"警告: git add 失败: {result.stderr}")
            return False
        
        # 检查是否有变更需要提交
        result = subprocess.run(
            ["git", "diff", "--cached", "--quiet"],
            capture_output=True,
            cwd=repo_root,
        )
        if result.returncode == 0:
            print(f"提示: 没有变更需要提交")
            return True
        
        # 提交
        now = dt.datetime.now(TZ).strftime("%Y-%m-%d %H:%M")
        message = commit_message or f"update: 虎嗅 AI 新闻 {now}"
        result = subprocess.run(
            ["git", "commit", "-m", message],
            capture_output=True,
            text=True,
            cwd=repo_root,
        )
        if result.returncode != 0:
            print(f"警告: git commit 失败: {result.stderr}")
            return False
        
        print(f"已提交: {message}")
        
        # 推送
        result = subprocess.run(
            ["git", "push"],
            capture_output=True,
            text=True,
            cwd=repo_root,
        )
        if result.returncode != 0:
            print(f"警告: git push 失败: {result.stderr}")
            return False
        
        print(f"已推送到远程仓库")
        return True
        
    except Exception as e:
        print(f"警告: Git 操作失败: {e}")
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description="抓取虎嗅 AI 科技频道 Top N 并输出 Markdown")
    parser.add_argument("--limit", type=int, default=10, help="输出条数，默认 10")
    parser.add_argument("--output", type=Path, help="将 Markdown 写入指定文件")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=get_default_output_dir(),
        help="输出根目录，默认读取 AI_NEWS_DAILY_DATA_DIR；否则优先找当前工作区中的 ai-news-daily/data 或 data，最后退回当前目录下的 data",
    )
    parser.add_argument(
        "--filename-template",
        default="{date}/huxiu/content.md",
        help="文件名模板，支持 {date}、{timestamp}、{limit}，默认写入 {date}/huxiu/content.md",
    )
    parser.add_argument(
        "--format",
        choices=("markdown", "json"),
        default="markdown",
        help="输出格式；json 模式适合交给大模型继续生成最终 markdown",
    )
    parser.add_argument("--stdout", action="store_true", help="只输出到标准输出，不写入文件")
    parser.add_argument(
        "--git-push",
        action="store_true",
        help="保存后自动提交并推送到 Git 仓库",
    )
    parser.add_argument(
        "--git-message",
        help="自定义 Git 提交信息",
    )
    args = parser.parse_args()

    try:
        items = build_items(max(1, args.limit))
        content = render_json(items, args.limit) if args.format == "json" else render_markdown(items)
    except (HTTPError, URLError, ValueError, json.JSONDecodeError) as exc:
        raise SystemExit(f"抓取失败: {exc}") from exc

    if args.stdout:
        print(content, end="")
    else:
        output_path = build_output_path(args.output, args.output_dir, args.filename_template, args.limit)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        print(f"已保存到: {output_path}")
        
        # 自动提交到 Git
        if args.git_push:
            git_commit_and_push(output_path, args.git_message)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
