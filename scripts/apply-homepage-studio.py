#!/usr/bin/env python3
"""Install a validated Studio homepage and emit its live revision for GitHub Pages.
"""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from html import escape
from urllib.parse import urlsplit

TAGS = set("a article body br builder-copy button circle div footer form h1 h2 h3 h4 h5 h6 header img input li main nav p path rect section span strong svg textarea ul label select option video source figure figcaption template ol em small".split())
BLOCKED_ATTRS = {"srcdoc", "action", "formaction", "ping", "nonce", "integrity", "contenteditable", "autofocus"}
STYLE_BLOCKED = re.compile(r"url\s*\(|expression\s*\(|@import|javascript\s*:|\\|[<>]", re.I)
ASSET_PATH = re.compile(r"(?:images/|media/homepage-studio/)[a-zA-Z0-9_./-]+$")
TREE_BUILDERS = (
    "src/content/editor-content.json",
    "src/content/grapes-designs.json",
    "src/app/page.tsx",
    "src/app/site-header.tsx",
    "src/app/site-footer.tsx",
    "src/app/layout.tsx",
    "src/app/builder-page.tsx",
    "src/app/editor-blocks.tsx",
    "src/app/testimonial-slider.tsx",
    "src/app/wellness.css",
    "src/app/globals.css",
    "src/app/local-fonts.css",
    "src/app/builder-page.css",
    "src/app/clinic-footer.css",
    "src/app/floating-booking-link.tsx",
    "src/app/floating-booking-link.css",
)
HEX = re.compile(r"[0-9a-f]{64}$")
PUBLISH_ID = re.compile(r"[0-9a-f-]{36}$")
BODY = re.compile(r"(<body\b[^>]*>).*?(</body\s*>)", re.I | re.S)
SCRIPT = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.I | re.S)
HEAD_END = re.compile(r"</head\s*>", re.I)


def guard(root):
    return {name: hashlib.sha256((root / name).read_bytes()).hexdigest()
            for name in TREE_BUILDERS if (root / name).is_file()}


class Homepage(HTMLParser):
    def __init__(self, output, prefix):
        super().__init__(convert_charrefs=True)
        self.output = output
        self.base = prefix.rstrip("/") + "/"
        self.main = 0
        self.form = 0
        self.ids = set()

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def asset(self, value):
        if not value.startswith(self.base):
            raise ValueError("Homepage media must be local")
        path = value[len(self.base):]
        if not ASSET_PATH.fullmatch(path) or any(p in (".", "..", "") for p in path.split("/")):
            raise ValueError("Invalid Studio asset path")
        if not (self.output / path).is_file():
            raise ValueError("Missing homepage asset: " + path)

    def handle_starttag(self, tag, attrs):
        if tag not in TAGS or tag == "body":
            raise ValueError("Unexpected homepage element: " + tag)
        a = dict(attrs)
        self.main += tag == "main"
        self.form += tag == "form"
        if tag == "form" and "contact-form" not in (a.get("class") or "").split():
            raise ValueError("Only the existing contact form type is supported")
        for key, v in attrs:
            v = v or ""
            if key.startswith("on") or key in BLOCKED_ATTRS:
                raise ValueError("Unsafe homepage attribute: " + key)
            if key == "style" and STYLE_BLOCKED.search(v):
                raise ValueError("Unexpected CSS in homepage styles")
            if key in {"src", "poster"}:
                self.asset(v)
            if key == "srcset":
                for url in v.split(","):
                    pair = url.strip().split()
                    if not pair:
                        raise ValueError("Malformed image srcset")
                    self.asset(pair[0])
            if key in {"href", "xlink:href"}:
                if re.search(r"[\x00-\x20\\]", v) or v.startswith("//") or urlsplit(v).scheme not in ("", "http", "https", "tel", "mailto"):
                    raise ValueError("Unsafe homepage link")
            if key == "id":
                if v in self.ids:
                    raise ValueError("Duplicate homepage element id: " + v)
                self.ids.add(v)

    def handle_decl(self, decl):
        raise ValueError("A Studio publication must contain only homepage body content")


def apply(root, output, prefix):
    source = root / "src/content/homepage-studio-published.json"
    if not source.exists():
        print("Homepage Studio has no publication. Keeping the original Next.js homepage.")
        return False
    raw = source.read_bytes()
    if len(raw) > 1800000:
        raise ValueError("Homepage Studio publication exceeds its size limit")
    obj = json.loads(raw)
    if not isinstance(obj, dict):
        raise ValueError("Homepage Studio publication must be a JSON object")
    fragment = obj.get("html")
    if obj.get("version") != 1 or not isinstance(fragment, str) or not isinstance(obj.get("id"), str) or not PUBLISH_ID.fullmatch(obj["id"]):
        raise ValueError("Unknown Homepage Studio publication format")
    if obj.get("guard") != guard(root):
        print("Homepage Studio publication was based on a different homepage revision. Using the current native homepage instead.")
        return False
    if not isinstance(obj.get("draftSha256"), str) or not HEX.fullmatch(obj["draftSha256"]):
        raise ValueError("Missing publication draft digest")
    draft = output / "homepage-studio/draft.json"
    if not draft.is_file() or hashlib.sha256(draft.read_bytes()).hexdigest() != obj["draftSha256"]:
        raise ValueError("Published draft failed its integrity check")
    check = Homepage(output, prefix)
    check.feed(fragment)
    check.close()
    if check.main != 1:
        raise ValueError("A Studio publication requires one homepage main element")
    root_page = output / "index.html"
    current = root_page.read_text()
    if not BODY.search(current) or not HEAD_END.search(current):
        raise ValueError("Cannot locate the exported homepage head/body")
    # Retain exactly the current Pages build's head, SEO metadata, global CSS, and local fonts.
    # The edited DOM is no longer the Next React tree, so no hydration scripts run on this page.
    changed = BODY.sub(lambda m: m[1] + fragment + m[2], current, count=1)
    changed = SCRIPT.sub(
        lambda match: match[0] if re.match(r"""<script\b[^>]*\btype=["']application/ld\+json["']""", match[0], re.I) else "",
        changed,
    )
    changed = re.sub(r"""<link\b[^>]*(?:\bas=["']script["']|\brel=["']modulepreload["'])[^>]*>""", "", changed, flags=re.I)
    base = prefix.rstrip("/") + "/"
    def versioned(file):
        asset = output / file
        if not asset.is_file():
            raise ValueError("Missing Homepage Studio runtime: " + file)
        version = hashlib.sha256(asset.read_bytes()).hexdigest()[:16]
        return base + file + "?v=" + version

    inject = (
        '<meta name="homepage-studio-publication" content="' + obj["id"] + '">'
        '<link rel="stylesheet" href="' + versioned("homepage-studio/layout-v1.css") + '">'
        '<script defer src="' + versioned("homepage-studio/homepage-v1.js") + '"></script>'
    )
    changed = HEAD_END.sub(lambda m: inject + m[0], changed, count=1)
    root_page.write_text(changed)
    print(f"Homepage Studio publication {obj['id']} applied to index.html only.")
    return True


def add_freshness(output, prefix, published):
    """Run after applying the publication, so the manifest reflects what was actually deployed."""
    asset_name = "homepage-studio/fresh-home.js"
    asset = output / asset_name
    asset_hash = hashlib.sha256(asset.read_bytes()).hexdigest()[:16]
    base = escape(prefix.rstrip("/") + "/", quote=True)
    script = f'<script defer src="{base}{asset_name}?v={asset_hash}"></script>'
    root_page = output / "index.html"
    html = root_page.read_text(encoding="utf-8")
    revision = hashlib.sha256(html.encode("utf-8") + asset_hash.encode("ascii")).hexdigest()[:24]
    publication = re.search(r'<meta name="homepage-studio-publication" content="([a-f0-9-]{36})">', html) if published else None
    root_page.write_text(HEAD_END.sub(
        lambda m: f'<meta name="ncw-home-revision" content="{revision}">' + script + m[0], html, count=1),
        encoding="utf-8",
    )
    # Only public Next pages need to route Home links to the full published document.
    for page in output.rglob("index.html"):
        first = page.relative_to(output).parts[0]
        if page == root_page or first in {"admin", "api", "studio", "homepage-studio", "_next", "_not-found"}:
            continue
        content = page.read_text(encoding="utf-8")
        page.write_text(HEAD_END.sub(lambda m: script + m[0], content, count=1), encoding="utf-8")
    manifest = {"revision": revision, "publication": publication[1] if publication else None}
    (output / "homepage-studio/live-revision.json").write_text(json.dumps(manifest) + "\n", encoding="utf-8")


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("export", type=Path)
    cli.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    cli.add_argument("--base-path", default="/Newcitywellness")
    args = cli.parse_args()
    published = apply(args.root, args.export, args.base_path)
    add_freshness(args.export, args.base_path, published)
