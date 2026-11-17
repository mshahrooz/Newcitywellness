#!/usr/bin/env python3
"""Build Page Studio canvases and install validated visual publications for GitHub Pages."""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from html import escape
from urllib.parse import urlsplit
from studio_seo import apply_seo, baseline_seo, draft_overrides

TAGS = set("a article body br builder-copy button circle div footer form h1 h2 h3 h4 h5 h6 header img input li main nav p path rect section span strong svg textarea ul label select option video source figure figcaption template ol em small aside blockquote details summary dl dt dd picture hr iframe noscript cite".split())
BLOCKED_ATTRS = {"srcdoc", "action", "formaction", "ping", "nonce", "integrity", "contenteditable", "autofocus"}
STYLE_BLOCKED = re.compile(r"url\s*\(|expression\s*\(|@import|javascript\s*:|\\|[<>]", re.I)
ASSET_PATH = re.compile(r"(?:images/|media/homepage-studio/)[a-zA-Z0-9_./-]+$")
EMBED_SANDBOX = {
    "youtube": "allow-scripts allow-same-origin allow-presentation",
    "remote": "allow-scripts allow-forms allow-presentation",
    "html": "allow-scripts",
}


def studio_embed(attrs):
    kind, src = attrs.get("data-ncw-embed"), attrs.get("src", "")
    title = attrs.get("title", "")
    if (kind not in EMBED_SANDBOX or attrs.get("sandbox") != EMBED_SANDBOX[kind]
            or not title or not title.strip() or len(title) > 160
            or attrs.get("referrerpolicy") != "strict-origin-when-cross-origin"
            or attrs.get("allow") != "encrypted-media; fullscreen; picture-in-picture"):
        return False
    if kind == "youtube":
        return bool(re.fullmatch(r"https://www\.youtube-nocookie\.com/embed/[A-Za-z0-9_-]{11}(?:\?start=[1-9][0-9]{0,5})?", src))
    if kind == "html":
        return len(src) <= 125000 and bool(re.fullmatch(r"data:text/html;charset=utf-8;base64,[A-Za-z0-9+/]+={0,2}", src))
    if len(src) > 4096 or not src.startswith("https://") or re.search(r"[\x00-\x20\x7f\\]", src):
        return False
    try:
        url = urlsplit(src)
        return bool(url.hostname and url.username is None and url.password is None and url.port != 0)
    except ValueError:
        return False


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


def registry(root, name):
    text = (root / "supabase/functions/publish-homepage/pages.mjs").read_text()
    return json.loads(text.split("export const " + name + " = ", 1)[1].split(";\n", 1)[0])


def paths(key):
    if key == "home":
        return "src/content/homepage-studio-published.json", "homepage-studio/draft.json"
    return f"src/content/studio-pages/{key}.json", f"homepage-studio/pages/{key}/draft.json"


def guard(root, route=""):
    extra = set()
    if route:
        extra = {str(p.relative_to(root)) for p in (root / "src/app" / route.split("/")[0]).iterdir()
                 if p.is_file() and p.suffix in {".tsx", ".ts", ".css"}}
        extra.add(f"src/app/{route}/page.tsx")
    return {name: hashlib.sha256((root / name).read_bytes()).hexdigest()
            for name in (*TREE_BUILDERS, *sorted(extra)) if (root / name).is_file()}


class StudioPage(HTMLParser):
    def __init__(self, output, prefix, key="home", embed=None):
        super().__init__(convert_charrefs=True)
        self.output = output
        self.base = prefix.rstrip("/") + "/"
        self.main = 0
        self.form = 0
        self.ids = set()
        self.key = key
        self.embed = embed

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def asset(self, value, as_download=False):
        if not value.startswith(self.base):
            raise ValueError("Studio media must be local")
        path = value[len(self.base):]
        if not ASSET_PATH.fullmatch(path) or any(p in (".", "..", "") for p in path.split("/")):
            raise ValueError("Invalid Studio asset path")
        if path.endswith(".bin") and (not as_download or not re.fullmatch(r"media/homepage-studio/[a-f0-9]{32}\.bin", path)):
            raise ValueError("Studio documents must be linked as downloads")
        if not (self.output / path).is_file():
            raise ValueError("Missing Studio asset: " + path)

    def handle_starttag(self, tag, attrs):
        if tag not in TAGS or tag == "body":
            raise ValueError("Unexpected page element: " + tag)
        a = dict(attrs)
        self.main += tag == "main"
        self.form += tag == "form"
        forms = {"home": "contact-form", "faqs": "faq-form", "contact-us": "contact-page-form"}
        if tag == "iframe":
            original = self.embed and a.get("src") == self.embed and not a.get("data-ncw-embed")
            if len(a) != len(attrs) or not (original or studio_embed(a)):
                raise ValueError("Unsupported Studio embed")
        if tag == "form" and not ((self.key in forms and forms[self.key] in (a.get("class") or "").split())
                                   or (self.key == "conditions-treated" and a.get("role") == "search")):
            raise ValueError("Only the existing contact form type is supported")
        for key, v in attrs:
            v = v or ""
            if key.startswith("on") or key in BLOCKED_ATTRS:
                raise ValueError("Unsafe page attribute: " + key)
            if key == "style" and STYLE_BLOCKED.search(v):
                raise ValueError("Unexpected CSS in homepage styles")
            if key in {"src", "poster"}:
                if tag == "iframe":
                    if key != "src":
                        raise ValueError("Unapproved Studio embed")
                else:
                    self.asset(v)
            if key == "srcset":
                for url in v.split(","):
                    pair = url.strip().split()
                    if not pair:
                        raise ValueError("Malformed image srcset")
                    self.asset(pair[0])
            if key in {"href", "xlink:href"}:
                if re.search(r"[\x00-\x20\\]", v) or v.startswith("//") or urlsplit(v).scheme not in ("", "http", "https", "tel", "mailto"):
                    raise ValueError("Unsafe page link")
                if v.startswith(self.base + "media/homepage-studio/") and urlsplit(v).path.endswith(".bin"):
                    self.asset(v, tag == "a" and key == "href" and "download" in a)
            if key == "id":
                if v in self.ids:
                    raise ValueError("Duplicate page element id: " + v)
                self.ids.add(v)

    def handle_decl(self, decl):
        raise ValueError("A Studio publication must contain only page body content")


def strip_scripts(html):
    html = SCRIPT.sub(
        lambda m: m[0] if re.match(r"""<script\b[^>]*\btype=["']application/ld\+json["']""", m[0], re.I) else "",
        html)
    return re.sub(r"""<link\b[^>]*(?:\bas=["']script["']|\brel=["']modulepreload["'])[^>]*>""", "", html, flags=re.I)


def apply(root, output, prefix, key="home", route="", embed=None):
    source_path, draft_path = paths(key)
    source = root / source_path
    if not source.exists():
        return False
    raw = source.read_bytes()
    if len(raw) > 1800000:
        raise ValueError("Page Studio publication exceeds its size limit")
    obj = json.loads(raw)
    if not isinstance(obj, dict):
        raise ValueError("Page Studio publication must be a JSON object")
    fragment = obj.get("html")
    if obj.get("version") != 1 or not isinstance(fragment, str) or not isinstance(obj.get("id"), str) or not PUBLISH_ID.fullmatch(obj["id"]):
        raise ValueError("Unknown Page Studio publication format")
    if obj.get("page", "home") != key:
        raise ValueError("Publication does not match the Studio page")
    if obj.get("guard") != guard(root, route):
        print(f"Studio publication for {key} uses a different baseline. Keeping the native page.")
        return False
    if not isinstance(obj.get("draftSha256"), str) or not HEX.fullmatch(obj["draftSha256"]):
        raise ValueError("Missing publication draft digest")
    draft = output / draft_path
    raw_draft = draft.read_bytes() if draft.is_file() else b""
    if not raw_draft or hashlib.sha256(raw_draft).hexdigest() != obj["draftSha256"]:
        raise ValueError("Published draft failed its integrity check")
    check = StudioPage(output, prefix, key, embed)
    check.feed(fragment)
    check.close()
    if check.main != 1:
        raise ValueError("A Studio publication requires one main element")
    root_page = output / route / "index.html"
    current = root_page.read_text()
    if not BODY.search(current) or not HEAD_END.search(current):
        raise ValueError("Cannot locate the exported page head/body")
    # Retain the native head and styles except for explicit Studio SEO overrides.
    # The edited DOM is no longer the Next React tree, so no hydration scripts run on this page.
    changed = BODY.sub(lambda m: m[1] + fragment + m[2], current, count=1)
    changed = apply_seo(strip_scripts(changed), draft_overrides(raw_draft))
    base = prefix.rstrip("/") + "/"
    def versioned(file):
        asset = output / file
        if not asset.is_file():
            raise ValueError("Missing Studio runtime: " + file)
        version = hashlib.sha256(asset.read_bytes()).hexdigest()[:16]
        return base + file + "?v=" + version

    inject = (
        '<meta name="homepage-studio-publication" content="' + obj["id"] + '">'
        '<link rel="stylesheet" href="' + versioned("homepage-studio/layout-v1.css") + '">'
        '<script defer src="' + versioned("homepage-studio/responsive-offsets.js") + '"></script>'
        '<script defer src="' + versioned("homepage-studio/homepage-v1.js") + '"></script>'
        + (('<script defer src="' + versioned("homepage-studio/page-runtime.js") + '"></script>') if route else '')
    )
    changed = HEAD_END.sub(lambda m: inject + m[0], changed, count=1)
    root_page.write_text(changed)
    print(f"Studio publication {obj['id']} applied to {root_page.relative_to(output)}.")
    return True


def emit_studio(root, output, prefix):
    pages = registry(root, "PAGES")
    (output / "studio/embeds.js").write_bytes((root / "supabase/functions/publish-homepage/embeds.js").read_bytes())
    embeds = registry(root, "EMBEDS")
    base = escape(prefix.rstrip("/") + "/", quote=True)
    css = output / "studio/canvas-edits.css"
    suffix = hashlib.sha256(css.read_bytes()).hexdigest()[:16]
    asset_name = "homepage-studio/fresh-home.js"
    asset_hash = hashlib.sha256((output / asset_name).read_bytes()).hexdigest()[:16]
    assets = {}
    routes = escape(json.dumps([p[2] for p in pages]), quote=True)
    for key, _label, route in pages:
        html_file = output / route / "index.html"
        native_html = html_file.read_text()
        assets[key] = {"seo": baseline_seo(native_html)}
        if route:
            canvas = strip_scripts(native_html)
            canvas = HEAD_END.sub(lambda m: f'<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="{base}studio/canvas-edits.css?v={suffix}">' + m[0], canvas, count=1)
            target = output / f"studio/pages/{key}.html"
            target.parent.mkdir(exist_ok=True)
            target.write_text(canvas)
            assets[key].update({"guard": guard(root, route), "canvas": hashlib.sha256(canvas.encode()).hexdigest()[:16]})
        published = apply(root, output, prefix, key, route, embeds.get(key))
        html = html_file.read_text()
        revision = hashlib.sha256(html.encode() + asset_hash.encode()).hexdigest()[:24]
        publication = re.search(r'<meta name="homepage-studio-publication" content="([a-f0-9-]{36})">', html) if published else None
        manifest = "homepage-studio/live-revision.json" if not route else f"homepage-studio/pages/{key}/live-revision.json"
        script = f'<script defer src="{base}{asset_name}?v={asset_hash}" data-manifest="{manifest}" data-routes="{routes}"></script>'
        html_file.write_text(HEAD_END.sub(lambda m: f'<meta name="ncw-home-revision" content="{revision}">' + script + m[0], html, count=1))
        target = output / manifest
        target.parent.mkdir(parents=True, exist_ok=True)
        metadata = {"revision": revision, "publication": publication[1] if publication else None}
        if publication:
            source_path, draft_path = paths(key)
            content = (root / source_path).read_bytes()
            metadata["source"] = hashlib.sha1(f"blob {len(content)}\0".encode() + content).hexdigest()
            metadata["draftSha256"] = hashlib.sha256((output / draft_path).read_bytes()).hexdigest()
        target.write_text(json.dumps(metadata) + "\n")
    (output / "studio/pages.js").write_text(
        "const STUDIO_PAGES = " + json.dumps(pages, ensure_ascii=False) +
        ";\nconst STUDIO_PAGE_ASSETS = " + json.dumps(assets) +
        ";\nconst STUDIO_EMBEDS = " + json.dumps(embeds) + ";\n")


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("export", type=Path)
    cli.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    cli.add_argument("--base-path", default="/Newcitywellness")
    args = cli.parse_args()
    emit_studio(args.root, args.export, args.base_path)
