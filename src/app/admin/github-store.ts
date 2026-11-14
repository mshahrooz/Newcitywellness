import { validContent, type EditorContent } from "../../content/editor-model"

import { assetPaths } from "../../content/builder-model"

export const repo = "mshahrooz/Newcitywellness"
export const branch = "main"
const contentPath = "src/content/editor-content.json"
export const repoUrl = `https://github.com/${repo}`
export const tokenSetupUrl = "https://github.com/settings/personal-access-tokens/new?name=New+City+Wellness+Editor&target_name=mshahrooz&expires_in=90&contents=write"
const api = "https://api.github.com"

export type Snapshot = { content: EditorContent; sha: string }
type Ref = { object: { sha: string } }
type GitObject = { sha: string }
type Commit = GitObject & { tree: GitObject }
type RepositoryAccess = { full_name: string; permissions?: { push?: boolean }; archived?: boolean; disabled?: boolean }
const tokenHelp = "Sign in to GitHub as mshahrooz, select Only select repositories → Newcitywellness, and set Repository permissions → Contents to Read and write."
const repoPath = `/repos/${repo}`

function operation(path: string, method: string) {
  if (path === "/user") return "checking your GitHub token"
  if (path === repoPath) return "checking access to Newcitywellness"
  if (path.includes("/contents/")) return "reading the editor content file"
  if (path.includes("/git/ref")) return method === "PATCH" ? "updating the main branch" : "reading the main branch"
  if (path.includes("/git/blobs")) return "storing content or an uploaded file"
  if (path.includes("/git/trees")) return "assembling the changes"
  return method === "GET" ? "reading the current commit" : "creating the publishing commit"
}

export class GitHubAccessError extends Error {
  constructor(message: string, public readonly needsToken = false) { super(message) }
}

async function request<T>(token: string, path: string, method = "GET", data?: unknown): Promise<T> {
  const step = operation(path, method)
  let response: Response
  try {
    response = await fetch(api + path, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      },
      cache: "no-store",
      body: data === undefined ? undefined : JSON.stringify(data),
    })
  } catch {
    throw new Error(`Could not reach GitHub while ${step}. Check your connection and retry. Your draft has not been cleared.`)
  }
  if (!response.ok) {
    const detail: { message?: unknown } = await response.json().catch(() => ({}))
    // Classify GitHub's reply for recovery, but never echo server text or credentials.
    const message = typeof detail?.message === "string" ? detail.message : ""
    if (response.status === 401) throw new GitHubAccessError("GitHub rejected this token (401). It may be expired, revoked, or copied incorrectly. Create a fresh fine-grained token and paste it directly into the builder.", true)
    if (response.status === 429 || (response.status === 403 && (response.headers.get("x-ratelimit-remaining") === "0" || /rate limit|abuse detection/i.test(message)))) {
      throw new Error("GitHub is temporarily rate limiting requests. Wait a few minutes and retry. You do not need a new token.")
    }
    if ((response.status === 403 || response.status === 422) && method === "PATCH" && /protected branch|repository rule|ruleset|GH006|GH013/i.test(message)) {
      throw new Error("GitHub branch rules blocked publishing to main. The draft is still open. Ask the repository owner to review the branch rules before retrying.")
    }
    if (response.status === 403 || response.status === 404) {
      throw new GitHubAccessError(`GitHub returned ${response.status} while ${step}. ${tokenHelp}`, true)
    }
    if (response.status === 409 || response.status === 422) throw new Error(`GitHub could not finish ${step} (${response.status}). Keep your draft open. If a new edit was published, download a draft backup before reopening the editor.`)
    throw new Error(`GitHub returned ${response.status} while ${step}. Try again shortly.`)
  }
  return response.json() as Promise<T>
}

const getHead = (token: string) => request<Ref>(token, `${repoPath}/git/ref/heads/${branch}`)
export async function loadSnapshot(token: string, commit: string): Promise<Snapshot> {
  const file = await request<{content: string; sha: string}>(token, `${repoPath}/contents/${contentPath}?ref=${commit}`)
  const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, "")), char => char.charCodeAt(0))
  const content: unknown = JSON.parse(new TextDecoder().decode(bytes))
  if (!validContent(content)) throw new Error("The repository's content file has an unsupported format.")
  return { content, sha: file.sha }
}

export async function unlock(token: string) {
  // Public repositories can be read anonymously, so verify GitHub accepts the token first.
  const user = await request<{login: string}>(token, "/user")
  const access = await request<RepositoryAccess>(token, repoPath)
  if (access.full_name?.toLowerCase() !== repo.toLowerCase() || access.archived || access.disabled) {
    throw new Error("The Newcitywellness repository is unavailable for publishing. Check the repository status and try again.")
  }
  // Repository metadata is a read-only check, not proof of Contents write scope.
  if (access.permissions?.push === false) {
    throw new GitHubAccessError(`GitHub accepted the token for @${user.login}, but did not report write access to Newcitywellness. ${tokenHelp}`, true)
  }
  const ref = await getHead(token)
  return loadSnapshot(token, ref.object.sha)
}

function encode(bytes: Uint8Array) {
  let binary = ""
  for (let start = 0; start < bytes.length; start += 8192) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 8192))
  }
  return btoa(binary)
}

export async function publish(token: string, snapshot: Snapshot, content: EditorContent, uploads: Map<string, Blob>) {
  if (!validContent(content)) throw new Error("Fill in every block and attach a file to each document before publishing.")
  const json = JSON.stringify(content, null, 2) + "\n"
  if (new TextEncoder().encode(json).length > 900_000) throw new Error("The content draft is too large. Shorten or remove some content before publishing.")
  const { object: { sha: parent } } = await getHead(token)
  const current = await loadSnapshot(token, parent)
  if (current.sha !== snapshot.sha) throw new Error("Another edit was published while you were working. Download a draft backup before reloading the editor.")
  const { tree } = await request<Commit>(token, `${repoPath}/git/commits/${parent}`)
  const contentBlob = await request<GitObject>(token, `${repoPath}/git/blobs`, "POST", {
    encoding: "utf-8", content: json,
  })
  const changedFiles: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [{
    path: contentPath, mode: "100644", type: "blob", sha: contentBlob.sha,
  }]
  const used = new Set(Object.values(content.pages).flatMap(page => page?.blocks?.flatMap(block => block.type === "document" ? [block.file] : []) ?? []))
  for (const page of Object.values(content.pages)) {
    for (const path of assetPaths(page?.layout)) used.add(path)
    for (const image of Object.values(page?.images ?? {})) if (image) used.add(image.path)
  }
  for (const [path, file] of uploads) {
    if (!used.has(path)) continue
    const blob = await request<GitObject>(token, `${repoPath}/git/blobs`, "POST", {
      encoding: "base64", content: encode(new Uint8Array(await file.arrayBuffer())),
    })
    changedFiles.push({ path: `public/${path}`, mode: "100644", type: "blob", sha: blob.sha })
  }
  const nextTree = await request<GitObject>(token, `${repoPath}/git/trees`, "POST", {
    base_tree: tree.sha, tree: changedFiles,
  })
  const commit = await request<GitObject>(token, `${repoPath}/git/commits`, "POST", {
    message: "Publish New City Wellness visual editor changes", tree: nextTree.sha, parents: [parent],
  })
  // A concurrent update to main is rejected. Never force push.
  await request<Ref>(token, `${repoPath}/git/refs/heads/${branch}`, "PATCH", { sha: commit.sha, force: false })
  return { commit: commit.sha, snapshot: { sha: contentBlob.sha, content } }
}
