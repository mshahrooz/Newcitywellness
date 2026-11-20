import importlib.util
import io
import json
from pathlib import Path
import unittest
from urllib.error import HTTPError


spec = importlib.util.spec_from_file_location(
    "wait_pages_artifact", Path(__file__).parents[1] / "scripts" / "wait-pages-artifact.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class WaitPagesArtifactTest(unittest.TestCase):
    def test_waits_for_the_matching_upload_after_empty_and_transient_results(self):
        replies = iter([
            [],
            HTTPError("https://example.test", 503, "Service unavailable", {}, None),
            [{"name": "github-pages-1", "id": 4}, {"name": "github-pages-2", "id": 5, "expired": True}],
            [{"name": "github-pages-2", "id": 5, "expired": False}],
        ])
        elapsed = 0

        def fetch(_, **kwargs):
            reply = next(replies)
            if isinstance(reply, HTTPError):
                raise reply
            return io.BytesIO(json.dumps({"artifacts": reply}).encode())

        def sleep(seconds):
            nonlocal elapsed
            elapsed += seconds

        self.assertTrue(module.wait(None, "5", "github-pages-2", fetch=fetch, sleep=sleep, now=lambda: elapsed))
        self.assertEqual(elapsed, 6)

    def test_empty_results_expire_without_deploying(self):
        elapsed = 0

        def sleep(seconds):
            nonlocal elapsed
            elapsed += seconds

        self.assertFalse(module.wait(
            None, "5", "github-pages-2", deadline=4,
            fetch=lambda *_args, **_kwargs: io.BytesIO(b'{"artifacts":[]}'),
            sleep=sleep, now=lambda: elapsed,
        ))
        self.assertEqual(elapsed, 4)


if __name__ == "__main__":
    unittest.main()
