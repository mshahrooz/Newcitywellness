"""Stamp editing anchors in generated canvas HTML only."""
import hashlib
import re
from html.parser import HTMLParser

VOID = set("area base br col embed hr img input link meta param source track wbr".split())
SKIP = set("script style svg template head noscript".split())
EDITABLE = set("h1 h2 h3 h4 h5 h6 p img a button input textarea select label summary details blockquote figure figcaption hr article li dt dd legend strong em small span div builder-copy section th td".split())


class Canvas(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.nodes = []
        self.lines = [0] + [m.end() for m in re.finditer("\n", html)]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.start(tag, attrs, tag in VOID)

    def handle_startendtag(self, tag, attrs):
        self.start(tag, attrs, True)

    def start(self, tag, pairs, void):
        attrs = dict(pairs)
        pos = self.getpos()
        offset = self.lines[pos[0] - 1] + pos[1]
        attr = next((attrs[k] for k in ("id", "data-builder-section", "data-builder-copy", "data-editor-field",
                                       "data-editor-image", "name") if attrs.get(k)), "")
        classes = " ".join(x for x in (attrs.get("class") or "").split() if not re.match(r"delay-|is-|motion-|from-", x))
        own = (tag + ":" + attr) if attr else (tag + "." + classes if classes else tag)
        node = {"tag": tag, "attrs": attrs, "source": self.get_starttag_text(), "offset": offset,
                "stable": attr, "parent": tuple(x["own"] for x in self.stack[-7:]), "own": own, "text": []}
        blocked = any(x["tag"] in SKIP for x in self.stack)
        if not blocked and tag in EDITABLE and "data-bs-id" not in attrs:
            self.nodes.append(node)
        if not void:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        if not self.stack or self.stack[-1]["tag"] in SKIP or not data.strip():
            return
        # Unnamed leaves include nearby copy. Named fields do not rely on their text.
        for node in self.stack[-3:]:
            if len(node["text"]) < 9:
                node["text"].append(data)


def stamp(html, page):
    tree = Canvas(html)
    counts, replacements = {}, []
    for node in tree.nodes:
        attrs = node["attrs"]
        content = "" if node["stable"] else " ".join("".join(node["text"]).split())[:120]
        resource = "" if node["stable"] else (attrs.get("href") or attrs.get("src") or "").split("?", 1)[0]
        key = "|".join((page, *node["parent"], node["own"], content, resource))
        digest = hashlib.sha256(key.encode()).hexdigest()[:20]
        counts[digest] = ordinal = counts.get(digest, 0) + 1
        anchor = "studio-" + digest + ("-" + str(ordinal) if ordinal > 1 else "")
        end = node["offset"] + len(node["source"]) - (2 if node["source"].endswith("/>") else 1)
        replacements.append((end, f' data-bs-id="{anchor}"'))
    out, index = [], 0
    for end, addition in replacements:
        out.append(html[index:end])
        out.append(addition)
        index = end
    out.append(html[index:])
    return "".join(out)
