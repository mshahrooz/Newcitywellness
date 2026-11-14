import { validContent, type EditorContent } from "../../content/editor-model"

export const repo = "mshahrooz/Newcitywellness"
export const branch = "main"
const contentPath = "src/content/editor-content.json"
export const repoUrl = `https://github.com/${repo}`
const api = "https://api.github.com"

export type Snapshot = { content: EditorContent; sha: string }
type Ref = { object: { sha: string } }
type GitObject = { sha: string }
type Commit = GitObject & { tree: GitObject }

async function request<T>(token: string, path: string, method = "GET", data?: unknown): Promise<T> {
  const response = await fetch(api + path, {
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
  if (!response.ok) {
    if (response.status === 401) throw new Error("GitHub rejected that token. Check it or create a new one.")
    if (response.status === 403 || response.status === 404) throw new Error("GitHub denied access. Check that the token has access to Newcitywellness and Contents read and write.")
    if (response.status === 409 || response.status === 422) throw new Error("GitHub could not apply the update. The branch may have changed. Reopen the editor before publishing again.")
    throw new Error(`GitHub returned an error (${response.status}). Try again shortly.`)
  }
  return response.json() as Promise<T>
}

const repoPath = `/repos/${repo}`
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
  await request<{login: string}>(token, "/user")
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
  const { object: { sha: parent } } = await getHead(token)
  const current = await loadSnapshot(token, parent)
  if (current.sha !== snapshot.sha) throw new Error("Another edit was published while you were working. Download a draft backup before reloading the editor.")
  const { tree } = await request<Commit>(token, `${repoPath}/git/commits/${parent}`)
  const contentBlob = await request<GitObject>(token, `${repoPath}/git/blobs`, "POST", {
    encoding: "utf-8", content: JSON.stringify(content, null, 2) + "\n",
  })
  const changedFiles: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [{
    path: contentPath, mode: "100644", type: "blob", sha: contentBlob.sha,
  }]
  const used = new Set(Object.values(content.pages).flatMap(page => page?.blocks?.flatMap(block => block.type === "document" ? [block.file] : []) ?? []))
  for (const page of Object.values(content.pages)) {
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
