#!/usr/bin/env python3
"""Produce a strict, non-sensitive SiteOne summary for Cotativa's public homepage.

The raw SiteOne scan stays inside the ephemeral runner and is never uploaded.
Only explicitly allowed aggregate numeric fields appear in the public artifact.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

PUBLIC_SITE = "https://cotativa.com/"


def safe_score(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return round(number, 2) if math.isfinite(number) and 0 <= number <= 100 else None


def summarize(source: object) -> dict:
    if not isinstance(source, dict):
        raise ValueError("Invalid SiteOne report: expected object")
    scores = source.get("qualityScores")
    stats = source.get("stats")
    if not isinstance(scores, dict) or not isinstance(stats, dict):
        raise ValueError("Invalid SiteOne report: qualityScores/stats missing")
    if not isinstance(source.get("summary"), dict):
        raise ValueError("Invalid SiteOne report: summary missing")
    if not isinstance(source.get("results"), list):
        raise ValueError("Invalid SiteOne report: results missing")

    overall_data = scores.get("overall")
    overall = safe_score(overall_data.get("score")) if isinstance(overall_data, dict) else None
    count = stats.get("totalUrls")
    total = count if isinstance(count, int) and not isinstance(count, bool) and 0 <= count <= 10 else None

    allowed_codes = {"seo", "security", "accessibility", "performance", "best-practices"}
    categories = []
    for category in scores.get("categories", []):
        if not isinstance(category, dict):
            continue
        code = category.get("code")
        score = safe_score(category.get("score"))
        if isinstance(code, str) and code in allowed_codes and score is not None:
            categories.append({"code": code, "score": score})

    return {
        "schema": 1,
        "target": PUBLIC_SITE,
        "source": "siteone-crawler",
        "data_classification": "public-aggregate-only",
        "overall_score": overall,
        "total_urls": total,
        "categories": categories[:5],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = json.loads(args.input.read_text(encoding="utf-8"))
    summary = summarize(report)
    args.output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("COTATIVA_PUBLIC_SITEONE_SUMMARY_OK")
    print("Raw URL-level scan excluded from the artifact")


if __name__ == "__main__":
    main()
