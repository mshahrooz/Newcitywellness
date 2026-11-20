"""Wait for GitHub to index the Pages upload before attempting deployment."""

import json
import os
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def wait(request, artifact_id, name, *, deadline=45, fetch=urlopen, sleep=time.sleep, now=time.monotonic):
    end = now() + deadline
    while now() < end:
        try:
            with fetch(request, timeout=min(5, max(1, end - now()))) as response:
                artifacts = json.load(response)["artifacts"]
            if any(str(a["id"]) == artifact_id and a["name"] == name and not a.get("expired") for a in artifacts):
                return True
        except HTTPError as error:
            if error.code not in {404, 429, 500, 502, 503, 504}:
                raise
        except (URLError, TimeoutError):
            pass
        print("Waiting for the Pages artifact to become visible.", flush=True)
        sleep(min(2, max(0, end - now())))
    return False


def main():
    env = os.environ
    repo, run = env["GITHUB_REPOSITORY"], env["GITHUB_RUN_ID"]
    name, artifact_id = env["PAGES_ARTIFACT_NAME"], env["PAGES_ARTIFACT_ID"]
    if not artifact_id.isdecimal():
        raise ValueError("Upload did not return a valid Pages artifact ID.")
    query = urlencode({"name": name, "per_page": 10})
    url = f"{env['GITHUB_API_URL']}/repos/{repo}/actions/runs/{run}/artifacts?{query}"
    request = Request(url, headers={
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    request.add_unredirected_header("Authorization", "Bearer " + env["GH_TOKEN"])
    if wait(request, artifact_id, name):
        print(f"Pages artifact {name} ({artifact_id}) is ready.")
        return 0
    print("::error::GitHub did not make the uploaded Pages artifact visible within 45 seconds.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
