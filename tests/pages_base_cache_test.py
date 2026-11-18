import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


script = Path(__file__).resolve().parents[1] / "scripts/pages-base-cache.py"
spec = importlib.util.spec_from_file_location("pages_base_cache", script)
cache = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cache)


class PagesBaseCacheTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "work"
        self.root.mkdir()
        self.git("init", "-q")
        self.home = "src/content/homepage-studio-published.json"
        self.page = "src/content/studio-pages/about.json"
        self.publication = {
            self.home: "home", self.page: "about",
            "public/homepage-studio/draft.json": "home draft",
            "public/homepage-studio/pages/about/draft.json": "about draft",
            "public/images/homepage-studio/new.webp": "image",
            "public/media/homepage-studio/attachment.bin": "document",
        }
        self.sources = {
            "src/app/page.tsx": "layout", "public/homepage-studio/layout-v1.css": "css",
            "public/homepage-studio/pages/site.js": "runtime",
            "public/studio/studio.js": "editor", "bun.lock": "dependencies",
        }
        for path, text in (self.publication | self.sources).items():
            self.write(path, text)
        self.commit()

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root)

    def write(self, path, text):
        file = self.root / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(text, encoding="utf-8")

    def commit(self):
        self.git("add", "-A")
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.test", "commit", "-qm", "Test")

    def test_publishing_reuses_base_but_source_changes_invalidate(self):
        original = cache.fingerprint(self.root, "/Newcitywellness")
        for path in self.publication:
            self.write(path, "new publication")
        self.commit()
        self.assertEqual(cache.fingerprint(self.root, "/Newcitywellness"), original)
        self.assertNotEqual(cache.fingerprint(self.root, "/somewhere-else"), original)
        self.write("public/homepage-studio/pages/site.js", "new source")
        self.commit()
        self.assertNotEqual(cache.fingerprint(self.root, "/Newcitywellness"), original)

    def test_base_build_omits_publications_and_restores_them_after_failure(self):
        original_run = subprocess.run
        def run(*args, **kwargs):
            if args[0][0] == "git":
                return original_run(*args, **kwargs)
            for path in self.publication:
                self.assertFalse((self.root / path).exists(), path)
            for path in self.sources:
                self.assertTrue((self.root / path).is_file(), path)
            raise subprocess.CalledProcessError(1, "next-build")
        with patch.object(cache.subprocess, "run", run):
            with self.assertRaises(subprocess.CalledProcessError):
                cache.build(self.root, "test-key")
        for path, text in self.publication.items():
            self.assertEqual((self.root / path).read_text(), text)


if __name__ == "__main__":
    unittest.main()
