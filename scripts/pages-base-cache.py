"""Cache the original static export separately from Studio publications."""
import hashlib
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path


STUDIO_OUTPUT = re.compile(
    r"(?:src/content/(?:homepage-studio-published\.json|studio-pages/[a-z0-9-]+\.json)"
    r"|public/homepage-studio/(?:draft\.json|pages/[a-z0-9-]+/draft\.json)"
    r"|public/(?:images|media)/homepage-studio/.+"
    r"|\.github/uptime/supabase\.json)"
)
MARKER = ".ncw-static-base"


def tracked(root):
    tree = subprocess.check_output(["git", "ls-tree", "-rz", "HEAD"], cwd=root)
    for entry in tree.split(b"\0"):
        if entry:
            flags, name = entry.split(b"\t", 1)
            yield os.fsdecode(name), flags


def is_publication(path):
    return bool(STUDIO_OUTPUT.fullmatch(path))


def fingerprint(root, base_path):
    # Byte identity of tracked site inputs. Exclude mutable Studio publications,
    # their uploaded media, and the operational keep-alive report.
    digest = hashlib.sha256(base_path.encode() + b"\0")
    for path, flags in tracked(root):
        if not is_publication(path):
            digest.update(flags + b"\t" + os.fsencode(path) + b"\0")
    return digest.hexdigest()


def build(root, key):
    # Neither Next nor Tailwind should read any of the mutable publication
    # inputs while making the base export. Always put those files back.
    with tempfile.TemporaryDirectory(prefix=".ncw-pages-inputs-", dir=root.parent) as holding:
        moved = []
        try:
            for path, _ in tracked(root):
                if not is_publication(path):
                    continue
                source, saved = root / path, Path(holding) / path
                saved.parent.mkdir(parents=True, exist_ok=True)
                source.replace(saved)
                moved.append((source, saved))
            subprocess.run(["bun", "run", "designs:compile"], cwd=root, check=True)
            subprocess.run(["node", "node_modules/next/dist/bin/next", "build", "--webpack"], cwd=root, check=True)
        finally:
            for source, saved in reversed(moved):
                saved.replace(source)
    output = root / "out"
    if not (output / "index.html").is_file() or not (output / "_next" / "static").is_dir():
        raise RuntimeError("The base static export is incomplete")
    (output / MARKER).write_text(key + "\n", encoding="utf-8")


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent
    key = fingerprint(repo, os.environ.get("BASE_PATH", ""))
    if sys.argv[1:] == ["fingerprint"]:
        print(key)
    elif sys.argv[1:] == ["build"]:
        build(repo, key)
    else:
        raise SystemExit("Use fingerprint or build")
