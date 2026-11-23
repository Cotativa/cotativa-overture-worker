#!/usr/bin/env python3
"""Reusable, offline image compositor for PUBLIC, synthetic development previews.

This is not an AI image generation provider. It creates branded-layout graphics
from supplied local JSON, without external requests, clients, credentials or callbacks.
Production customer rendering must run on Cotativa-owned infrastructure.
"""
from __future__ import annotations

import argparse
import json
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1080, 1350
MAX_TITLE = 120
MAX_BODY = 350
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(path, size) if Path(path).exists() else ImageFont.load_default()


def compose(data: dict) -> Image.Image:
    if not isinstance(data, dict):
        raise ValueError("The manifest must be a JSON object")
    title = str(data.get("title", "")).strip()
    body = str(data.get("body", "")).strip()
    label = str(data.get("label", "COTATIVA MEDIA LAB")).strip()
    if not title or len(title) > MAX_TITLE or len(body) > MAX_BODY or len(label) > 65:
        raise ValueError("Invalid image manifest; required title, bounded fields")

    im = Image.new("RGB", (WIDTH, HEIGHT), (8, 22, 37))
    draw = ImageDraw.Draw(im)
    for y in range(HEIGHT):
        f = y / HEIGHT
        color = (int(7 + 13 * f), int(23 + 21 * f), int(37 + 28 * f))
        draw.line((0, y, WIDTH, y), fill=color)
    draw.rounded_rectangle((65, 95, WIDTH - 65, HEIGHT - 100), radius=50, fill=(14, 43, 62))
    draw.rounded_rectangle((112, 147, 395, 208), radius=18, fill=(43, 182, 153))
    draw.text((133, 164), label.upper(), fill=(3, 26, 35), font=_font(19, True))
    y = 320
    for line in textwrap.wrap(title, width=24, break_long_words=False)[:5]:
        draw.text((112, y), line, fill=(247, 251, 255), font=_font(64, True))
        y += 98
    y = max(y + 48, 715)
    for line in textwrap.wrap(body, width=44, break_long_words=False)[:9]:
        draw.text((112, y), line, fill=(188, 211, 223), font=_font(29))
        y += 53
    draw.rounded_rectangle((112, HEIGHT - 238, WIDTH - 112, HEIGHT - 229), radius=4, fill=(65, 211, 179))
    draw.text((112, HEIGHT - 200), "DESIGN / DEVELOPMENT PREVIEW", fill=(144, 175, 191), font=_font(21))
    return im


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    result = compose(data)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.out, format="PNG", optimize=True)
    print(f"PUBLIC_MEDIA_PREVIEW_OK {args.out.name} {result.width}x{result.height}")


if __name__ == "__main__":
    main()
