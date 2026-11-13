#!/usr/bin/env python3
"""Check that published HTML and CSS do not load off-site images."""

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

CSS_URL = re.compile(r"""url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)""", re.I)
CSS_IMAGE_SET = re.compile(r"""(?:-webkit-)?image-set\(\s*("[^"]*"|'[^']*')|,\s*("[^"]*"|'[^']*')\s+(?:[0-9.]+(?:x|dpi|dpcm|dppx)|type\()""", re.I)
CSS_COMMENT = re.compile(r"/\*.*?\*/", re.S)
IMAGE_SUFFIX = re.compile(r"\.(?:avif|bmp|gif|ico|jpe?g|png|svgz?|tiff?|webp)$", re.I)
IMAGE_META = {"og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"}
IMAGE_CSS = re.compile(r"(?:^|[;{}])\s*(?:background(?:-image)?|border-image(?:-source)?|list-style(?:-image)?|mask(?:-image|-border-source)?|content|cursor)\s*:\s*[^;{}]*$", re.I)


def srcset_urls(value):
    # URL tokens may contain commas, including those in a data URI.
    remaining = value
    while remaining := remaining.lstrip(" ,\t\r\n\f"):
        parts = remaining.split(maxsplit=1)
        candidate = parts[0]
        yield candidate.rstrip(",")
        remaining = parts[1] if len(parts) > 1 else ""
        if not candidate.endswith(","):
            _, _, remaining = remaining.partition(",")


class ImageReferences(HTMLParser):
    def __init__(self, record, css):
        super().__init__()
        self.record = record
        self.css = css
        self.picture_depth = 0
        self.in_style = False

    def handle_starttag(self, tag, pairs):
        a = dict(pairs)
        line = self.getpos()[0]
        check = []
        if tag == "picture":
            self.picture_depth += 1
        if tag == "img" or (tag == "input" and (a.get("type") or "").lower() == "image"):
            check.extend(a.get(k) for k in ("src", "data-src"))
        if tag == "img" or (tag == "source" and self.picture_depth):
            for key in ("srcset", "data-srcset"):
                check.extend(srcset_urls(a.get(key) or ""))
            if tag == "source":
                check.append(a.get("src"))
        if tag == "video":
            check.append(a.get("poster"))
        if tag in {"image", "use"}:
            check.extend(a.get(k) for k in ("href", "xlink:href"))
        if tag == "link":
            rel = (a.get("rel") or "").lower().split()
            if "icon" in rel or "apple-touch-icon" in rel or (a.get("as") or "").lower() == "image":
                check.append(a.get("href"))
                check.extend(srcset_urls(a.get("imagesrcset") or ""))
        if tag == "meta" and ((a.get("property") or a.get("name") or "").lower() in IMAGE_META):
            check.append(a.get("content"))
        if tag == "style":
            self.in_style = True
        if a.get("style"):
            self.css(a["style"], line)
        for url in check:
            if url:
                self.record(url, line)

    def handle_endtag(self, tag):
        if tag == "picture":
            self.picture_depth = max(0, self.picture_depth - 1)
        if tag == "style":
            self.in_style = False

    def handle_data(self, data):
        if self.in_style:
            self.css(data, self.getpos()[0])


def audit(root):
    failures = set()
    pages = sorted(root.rglob("*.html"))
    if not pages:
        raise SystemExit(f"No exported HTML found in {root}")

    for file in [*pages, *sorted(root.rglob("*.css"))]:
        def record(url, line):
            url = url.strip()
            if url.startswith("//") or urlsplit(url).scheme.lower() in {"http", "https"}:
                failures.add((file.relative_to(root).as_posix(), line, url))

        def css_urls(text, first_line=1):
            text = CSS_COMMENT.sub(lambda m: "\n" * m[0].count("\n"), text)
            boundary = 0
            for match in CSS_URL.finditer(text):
                url = next(group for group in match.groups() if group is not None).strip()
                start = max(text.rfind(marker, boundary, match.start()) for marker in ";{}")
                if start != -1: boundary = start
                if IMAGE_SUFFIX.search(urlsplit(url).path) or IMAGE_CSS.search(text[boundary:match.start()]):
                    record(url, first_line + text.count("\n", 0, match.start()))

            for match in CSS_IMAGE_SET.finditer(text):
                candidate = next(group for group in match.groups() if group is not None)[1:-1]
                record(candidate, first_line + text.count("\n", 0, match.start()))

        source = file.read_text(encoding="utf-8")
        if file.suffix == ".html":
            parser = ImageReferences(record, css_urls)
            parser.feed(source)
            parser.close()
        else:
            css_urls(source)
    return pages, sorted(failures)


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("output", nargs="?", type=Path, default=Path("out"))
    args = cli.parse_args()
    pages, failures = audit(args.output)
    if failures:
        for page, line, url in failures:
            print(f"{page}:{line}: external image {url}")
        raise SystemExit("Store optimized image files in this repository and reference them locally.")
    print(f"No external image URLs found in {len(pages)} exported HTML pages or their CSS.")
