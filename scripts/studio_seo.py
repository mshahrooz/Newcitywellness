"""Extract validated Studio SEO overrides and update only the appropriate head tags."""
import base64
import gzip
import io
import json
import re
from html import escape, unescape
from html.parser import HTMLParser
from urllib.parse import urlsplit

MAX_DRAFT = 4 * 1024 * 1024
LIMITS = {"title": 160, "description": 360, "canonical": 1200,
          "socialTitle": 160, "socialDescription": 360, "robots": 20}
HEAD = re.compile(r"(<head\b[^>]*>)(.*?)(</head\s*>)", re.I | re.S)
TAG = re.compile(r"<!--.*?-->|<script\b[^>]*>.*?</script\s*>|<title\b[^>]*>.*?</title\s*>"
                 r"""|<(?:meta|link)\b(?:"[^"]*"|'[^']*'|[^'">])*>""", re.I | re.S)


def valid_seo(value):
    if not isinstance(value, dict):
        return None
    result = {}
    for key, limit in LIMITS.items():
        raw = value.get(key)
        if raw is None:
            raw = ""
        if not isinstance(raw, str):
            return None
        text = " ".join(raw.split())
        if len(text.encode("utf-16-le", errors="surrogatepass")) // 2 > limit or re.search(r"[\x00-\x1f\x7f\ud800-\udfff]", text):
            return None
        result[key] = text
    canonical = result["canonical"]
    if canonical:
        if not canonical.lower().startswith("https://") or re.search(r"[\s\\#]", canonical):
            return None
        try:
            url = urlsplit(canonical)
            if not url.hostname or url.username is not None or url.password is not None:
                return None
            _port = url.port
        except ValueError:
            return None
    if result["robots"] not in ("", "index", "noindex"):
        return None
    return result


def draft_overrides(raw):
    # Called only after the existing publication's draft checksum has matched.
    # Invalid/old SEO operations cannot break an otherwise valid page build.
    try:
        if len(raw) > MAX_DRAFT:
            return {}
        draft = json.loads(raw)
        if draft.get("encoding") == "gzip-base64":
            encoded = base64.b64decode(draft["data"], validate=True)
            with gzip.GzipFile(fileobj=io.BytesIO(encoded)) as zipped:
                plain = zipped.read(MAX_DRAFT + 1)
            if len(plain) > MAX_DRAFT:
                return {}
            draft = json.loads(plain)
        operations = draft.get("operations", [])
        if not isinstance(operations, list):
            return {}
        for op in reversed(operations):
            if isinstance(op, dict) and op.get("kind") == "seo" and op.get("id") == "page-seo":
                value = valid_seo(op.get("value"))
                if value is not None:
                    return {key: text for key, text in value.items() if text}
    except (ValueError, TypeError, OSError, EOFError, AttributeError, KeyError):
        pass
    return {}


class HeadTag(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.key = None
        self.value = ""
        self.feed(source)
        self.close()

    def handle_starttag(self, name, pairs):
        attrs = dict(pairs)
        if name == "link" and "canonical" in (attrs.get("rel") or "").lower().split():
            self.key, self.value = "canonical", attrs.get("href") or ""
        elif name == "meta":
            prop = (attrs.get("property") or attrs.get("name") or "").lower()
            if prop in {"description", "robots", "og:title", "og:description", "twitter:title", "twitter:description"}:
                self.key, self.value = prop, attrs.get("content") or ""


def tag_identity(source):
    lower = source[:9].lower()
    if lower.startswith("<title"):
        return "title", unescape(re.sub(r"^<title\b[^>]*>|</title\s*>$", "", source, flags=re.I))
    if lower.startswith(("<meta", "<link")):
        tag = HeadTag(source)
        return tag.key, tag.value
    return None, ""


def baseline_seo(html):
    head = HEAD.search(html)
    if not head:
        return {}
    keys = {"title": "title", "description": "description", "canonical": "canonical",
            "og:title": "socialTitle", "og:description": "socialDescription"}
    baseline = {}
    for part in TAG.finditer(head[2]):
        key, value = tag_identity(part[0])
        if key in keys and value:
            baseline.setdefault(keys[key], value)
    return baseline


def apply_seo(html, overrides):
    if not overrides:
        return html
    safe = {key: escape(value, quote=True) for key, value in overrides.items()}
    tags = {}
    if "title" in safe:
        tags["title"] = "<title>" + safe["title"] + "</title>"
    if "description" in safe:
        tags["description"] = f'<meta name="description" content="{safe["description"]}">'
    if "canonical" in safe:
        tags["canonical"] = f'<link rel="canonical" href="{safe["canonical"]}">'
    if "robots" in safe:
        tags["robots"] = f'<meta name="robots" content="{safe["robots"]},follow">'
    for field, label in (("socialTitle", "title"), ("socialDescription", "description")):
        if field in safe:
            tags["og:" + label] = f'<meta property="og:{label}" content="{safe[field]}">'
            tags["twitter:" + label] = f'<meta name="twitter:{label}" content="{safe[field]}">'

    def update(match):
        pending = dict(tags)
        def replace(part):
            name, _ = tag_identity(part[0])
            return pending.pop(name, "") if name in tags else part[0]
        body = TAG.sub(replace, match[2]) + "".join(pending.values())
        return match[1] + body + match[3]
    return HEAD.sub(update, html, count=1)
