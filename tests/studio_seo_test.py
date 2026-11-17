import base64
import gzip
import hashlib
import importlib.util
import json
import pathlib
import sys
import tempfile
import unittest

SCRIPTS = pathlib.Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from studio_seo import apply_seo, baseline_seo, draft_overrides

spec = importlib.util.spec_from_file_location("apply_studio", SCRIPTS / "apply-homepage-studio.py")
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)

NATIVE = ('<!doctype html><html><head><title>Default</title>'
          '<meta name="description" content="Default &amp; text">'
          '<meta property="og:title" content="Default social">'
          '<meta name="robots" content="index,follow">'
          '<script type="application/ld+json">{"name":"unrelated"}</script>'
          '<link rel="stylesheet" href="/style.css"></head>'
          '<body><main>Native content</main></body></html>')


def seo_op(value):
    return {"kind": "seo", "id": "page-seo", "value": value}


def draft(ops, compressed=False):
    raw = json.dumps({"version": 1, "page": "new-city-wellness-about-us", "operations": ops}).encode()
    return json.dumps({"encoding": "gzip-base64", "data": base64.b64encode(gzip.compress(raw)).decode()}).encode() if compressed else raw


class SeoPublishingTests(unittest.TestCase):
    def test_blank_keep_original_head_and_new_tags_replace_duplicates(self):
        self.assertEqual(baseline_seo(NATIVE)["description"], "Default & text")
        self.assertEqual(apply_seo(NATIVE, draft_overrides(draft([seo_op({"title": "custom"}), seo_op({})]))), NATIVE)
        new = apply_seo(NATIVE, draft_overrides(draft([seo_op({"title": '</title><script>alert("x")</script>', "robots": "noindex"})])))
        self.assertIn("&lt;/title&gt;&lt;script&gt;", new)
        self.assertNotIn("<script>alert", new)
        self.assertIn('<meta name="robots" content="noindex,follow">', new)
        self.assertIn('type="application/ld+json"', new)
        self.assertIn('href="/style.css"', new)

    def test_old_or_invalid_drafts_do_not_change_head(self):
        for value in (b"bad json", draft([seo_op({"canonical": "javascript:bad"})]),
                      draft([seo_op({"canonical": "https://user:secret@valid.com/"})]),
                      draft([seo_op({"title": "a" * 161})]), draft([])):
            with self.subTest(value=value):
                self.assertEqual(draft_overrides(value), {})

    def test_binary_attachment_requires_download_link_and_a_local_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = pathlib.Path(tmp)
            relative = "media/homepage-studio/" + "d" * 32 + ".bin"
            file = output / relative
            file.parent.mkdir(parents=True)
            file.write_bytes(b"an arbitrary document")
            url = "/Newcitywellness/" + relative
            def validate(markup):
                parser = publisher.StudioPage(output, "/Newcitywellness/", "home")
                parser.feed(markup)
            validate(f'<main><a href="{url}" download="clinic.docx">Download</a></main>')
            for item in (f'<a href="{url}">Link</a>', f'<img src="{url}">', f'<img srcset="{url} 1x">'):
                with self.assertRaisesRegex(ValueError, "linked as downloads"):
                    validate(f"<main>{item}</main>")
            file.unlink()
            with self.assertRaisesRegex(ValueError, "Missing Studio asset"):
                validate(f'<main><a href="{url}" download="clinic.docx">Download</a></main>')

    def test_named_document_url_with_spaces_requires_download(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = pathlib.Path(tmp)
            relative = "media/homepage-studio/" + "d" * 32 + "/Q17 consignment.pdf"
            asset = output / relative
            asset.parent.mkdir(parents=True)
            asset.write_bytes(b"%PDF-1.7\\nexample")
            url = "/Newcitywellness/" + relative.replace(" ", "%20")

            def validate(markup):
                parser = publisher.StudioPage(output, "/Newcitywellness/", "home")
                parser.feed(markup)

            validate(f'<main><a href="{url}" download="Q17 consignment.pdf">Download</a></main>')
            for item in (f'<a href="{url}">Download</a>', f'<img src="{url}">', f'<a href="{url.replace("%20", "%2f")}">Invalid</a>'):
                with self.assertRaises(ValueError):
                    validate(f"<main>{item}</main>")

    def test_old_pdf_bin_link_becomes_named_pdf_in_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = pathlib.Path(tmp)
            hashed = "581854b44889305b13ae8183a7d5bbc9"
            original = output / "media/homepage-studio" / (hashed + ".bin")
            original.parent.mkdir(parents=True)
            original.write_bytes(b"%PDF-1.7\\nlegacy-file")
            markup = f'<main><a href="/Newcitywellness/media/homepage-studio/{hashed}.bin" download="Q17 consignment.pdf">Download</a></main>'
            updated = publisher.restore_legacy_document_urls(markup, output, "/Newcitywellness")
            self.assertIn(f'/media/homepage-studio/{hashed}/Q17%20consignment.pdf', updated)
            self.assertEqual((output / "media/homepage-studio" / hashed / "Q17 consignment.pdf").read_bytes(), original.read_bytes())

    def test_pages_export_applies_compressed_seo_only_to_target_publication(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp) / "repo"
            output = pathlib.Path(tmp) / "out"
            key = "about-us"
            source_path, draft_path = publisher.paths(key)
            target = output / key / "index.html"
            target.parent.mkdir(parents=True)
            target.write_text(NATIVE)
            homepage = output / "index.html"
            homepage.write_text(NATIVE)
            raw = draft([seo_op({"title": "About Us & Care", "description": " About    this page ",
                                 "socialTitle": "About New City", "socialDescription": "Our clinic",
                                 "canonical": "https://example.com/about?x=1&y=2", "robots": "noindex"})], True)
            stored = output / draft_path
            stored.parent.mkdir(parents=True)
            stored.write_bytes(raw)
            source = root / source_path
            source.parent.mkdir(parents=True)
            (root / "src/app" / key).mkdir(parents=True)
            source.write_text(json.dumps({"version": 1, "page": key, "id": "11" * 18,
                                          "html": "<main>Studio visual body</main>",
                                          "guard": publisher.guard(root, key),
                                          "draftSha256": hashlib.sha256(raw).hexdigest()}))
            for name in ("layout-v1.css", "responsive-offsets.js", "homepage-v1.js", "page-runtime.js"):
                asset = output / "homepage-studio" / name
                asset.write_text("")
            self.assertTrue(publisher.apply(root, output, "/Newcitywellness", key, key))
            published = target.read_text()
            self.assertIn("<title>About Us &amp; Care</title>", published)
            self.assertIn('<meta name="description" content="About this page">', published)
            self.assertIn('<link rel="canonical" href="https://example.com/about?x=1&amp;y=2">', published)
            self.assertIn('<meta property="og:title" content="About New City">', published)
            self.assertIn('<meta name="twitter:description" content="Our clinic">', published)
            self.assertIn('<meta name="robots" content="noindex,follow">', published)
            self.assertIn("<main>Studio visual body</main>", published)
            self.assertEqual(homepage.read_text(), NATIVE)


if __name__ == "__main__":
    unittest.main()
