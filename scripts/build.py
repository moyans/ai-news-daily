#!/usr/bin/env python3
"""
构建脚本：将 Markdown 新闻数据转换为 JSON
"""

import json
import re
import os
from pathlib import Path
from datetime import datetime


SUMMARY_LABELS = (
    "一句话总结",
    "核心速递",
    "摘要",
)

METADATA_PREFIXES = (
    "#",
    ">",
    "---",
    "**一句话总结**",
    "**核心速递**",
    "**摘要**",
    "**时间**",
    "**发布时间**",
    "**分类**",
    "**作者**",
    "**热度分**",
    "**原文链接**",
    "**互动指标**",
    "**关键词**",
    "**为何值得关注**",
    "*由",
)


def extract_label_value(block: str, label: str) -> str:
    pattern = rf'\*\*{re.escape(label)}\*\*[:：]\s*(.+?)(?=\n\*\*|\n---|\Z)'
    match = re.search(pattern, block, re.DOTALL)
    if not match:
        return ""
    value = match.group(1).strip()
    return value


def extract_first_paragraph(block: str) -> str:
    lines = []
    for raw_line in block.splitlines():
        line = raw_line.strip()
        if not line:
            if lines:
                break
            continue

        if line.startswith(METADATA_PREFIXES):
            if lines:
                break
            continue

        lines.append(line)

    return " ".join(lines).strip()


def extract_summary(block: str) -> str:
    for label in SUMMARY_LABELS:
        summary = extract_label_value(block, label)
        if summary:
            return summary

    return extract_first_paragraph(block)


def parse_markdown(content: str, source: str, date: str) -> list[dict]:
    news_list = []
    blocks = re.split(r'^---$', content, flags=re.MULTILINE)
    
    for idx, block in enumerate(blocks):
        if not block.strip():
            continue
        
        news = parse_news_block(block, idx + 1, source, date)
        if news:
            news_list.append(news)
    
    return news_list


def parse_news_block(block: str, rank: int, source: str, date: str) -> dict | None:
    try:
        title_match = re.search(r'^##\s*\[Top\s*\d+\]\s*(.+?)$', block, re.MULTILINE)
        if not title_match:
            return None
        title = title_match.group(1).strip()

        category_match = re.search(r'\*\*分类\*\*:\s*#(\S+)', block)
        category = category_match.group(1) if category_match else "未知"

        heat_match = re.search(r'\*\*热度分\*\*:\s*([\d,]+)', block)
        heat_str = heat_match.group(1).replace(',', '') if heat_match else '0'
        heat = int(heat_str)

        summary = extract_summary(block)

        keywords_match = re.search(r'\*\*关键词\*\*:\s*(.+?)(?:\n|$)', block)
        keywords = []
        if keywords_match:
            keywords = [k.strip().lstrip('#') for k in keywords_match.group(1).split('#') if k.strip()]

        why_match = re.search(r'\*\*为何值得关注\*\*:\s*(.+?)(?:\n\n|\n\*\*|$)', block, re.DOTALL)
        why = why_match.group(1).strip() if why_match else ""

        url_match = re.search(r'\*\*原文链接\*\*:\s*\[.+?\]\((https?://[^\)]+)\)', block)
        url = url_match.group(1) if url_match else ""

        time_match = re.search(r'\*\*(?:发布时间|时间)\*\*[:：]\s*(.+?)(?:\n|$)', block)
        published_at = time_match.group(1).strip() if time_match else ""
        published_date = published_at[:10] if re.match(r'^\d{4}-\d{2}-\d{2}', published_at) else date

        sources_match = re.search(r'来自\s*(\d+)\s*个来源', block)
        sources = int(sources_match.group(1)) if sources_match else 1

        return {
            "id": rank,
            "date": date,
            "published_at": published_at,
            "published_date": published_date,
            "title": title,
            "summary": summary,
            "category": category,
            "tags": keywords,
            "heat": heat,
            "source": source,
            "url": url,
            "why": why,
            "sources": sources
        }
    except Exception as e:
        print(f"解析失败: {e}")
        return None


def scan_data_dir(data_dir: Path) -> list[dict]:
    all_news = []
    
    for md_file in sorted(data_dir.glob("*/*/*.md"), reverse=True):
        parts = md_file.relative_to(data_dir).parts
        date = parts[0]
        source = parts[1]
        
        print(f"处理: {md_file}")
        content = md_file.read_text(encoding="utf-8")
        news_list = parse_markdown(content, source, date)
        all_news.extend(news_list)
    
    return all_news


def get_categories(news_list: list[dict]) -> list[str]:
    categories = set()
    for news in news_list:
        categories.add(news["category"])
    return sorted(list(categories))


def get_dates(news_list: list[dict]) -> list[str]:
    months = set()
    for news in news_list:
        month = news["date"][:7]
        months.add(month)
    return sorted(list(months), reverse=True)


def build(data_dir: Path, output_dir: Path):
    print(f"扫描目录: {data_dir}")
    
    news_list = scan_data_dir(data_dir)
    categories = get_categories(news_list)
    dates = get_dates(news_list)
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    news_by_date = {}
    for news in news_list:
        date = news["date"]
        if date not in news_by_date:
            news_by_date[date] = []
        news_by_date[date].append(news)
    
    archive_dir = output_dir / "archive"
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    for date, news in news_by_date.items():
        archive_file = archive_dir / f"{date}.json"
        archive_data = {
            "date": date,
            "news": news
        }
        archive_file.write_text(json.dumps(archive_data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"归档: {archive_file} ({len(news)} 条)")
    
    output = {
        "meta": {
            "generated_at": datetime.now().isoformat(),
            "total": len(news_list),
            "today": today
        },
        "categories": categories,
        "dates": sorted(news_by_date.keys(), reverse=True),
        "news": news_list
    }
    
    output_file = output_dir / "data.json"
    output_file.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"生成: {output_file}")
    print(f"共 {len(news_list)} 条新闻")


if __name__ == "__main__":
    import sys
    
    project_root = Path(__file__).parent.parent
    data_dir = project_root / "data"
    output_dir = project_root / "docs"
    
    if len(sys.argv) > 1:
        data_dir = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_dir = Path(sys.argv[2])
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    build(data_dir, output_dir)
