const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const vm = require("node:vm")
const ts = require("typescript")

function transpile(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, "..", file), "utf8")
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { exports: {}, require: name => dependencies[name], process, TextEncoder, TextDecoder, Uint8Array, atob, btoa, ...globals }
  vm.runInNewContext(code, context, { filename: file })
  return context.exports
}
const blank = { version: 1, pages: {} }
const builder = transpile("src/content/builder-model.ts", {}, { URL })
const model = transpile("src/content/editor-model.ts", { "./editor-content.json": { default: blank }, "./builder-model": builder })
const documentFile = "documents/editor/clinic-hours.pdf"
const imageFile = "images/editor/hero-sample.webp"
const draft = { version: 1, pages: { home: {
  fields: { "hero-title": "Clinic welcome" },
  images: { hero: { path: imageFile, width: 900, height: 600, alt: "Clinic room" } },
  blocks: [
    { type: "heading", text: "Clinic updates", id: "block-a" },
    { type: "document", text: "Clinic hours", id: "block-b", file: documentFile },
  ],
} } }

function mockGitHub(snapshotSha = "original-blob", { fail, push = true } = {}) {
  const calls = []
  let blob = 0
  async function fetch(url, options) {
    const route = new URL(url).pathname
    const body = options.body ? JSON.parse(options.body) : undefined
    calls.push({ route, options, body })
    if (fail && fail.route === route) {
      return { ok: false, status: fail.status, headers: { get: name => fail.headers?.[name] ?? null }, json: async () => ({ message: fail.message }) }
    }
    let value
    if (route === "/user") value = { login: "editor-test" }
    else if (route === "/repos/mshahrooz/Newcitywellness") value = { full_name: "mshahrooz/Newcitywellness", permissions: { push } }
    else if (route.endsWith("/git/ref/heads/main")) value = { object: { sha: "parent-commit" } }
    else if (route.endsWith("/contents/src/content/editor-content.json")) {
      assert.equal(new URL(url).searchParams.get("ref"), "parent-commit")
      value = { sha: snapshotSha, content: Buffer.from(JSON.stringify(blank)).toString("base64") }
    }
    else if (route.endsWith("/git/commits/parent-commit")) value = { tree: { sha: "parent-tree" } }
    else if (route.endsWith("/git/blobs")) value = { sha: "new-blob-" + (++blob) }
    else if (route.endsWith("/git/trees")) value = { sha: "new-tree" }
    else if (route.endsWith("/git/commits")) value = { sha: "new-commit" }
    else if (route.endsWith("/git/refs/heads/main")) value = { object: { sha: "new-commit" } }
    else throw Error("Unexpected endpoint " + route)
    return { ok: true, json: async () => value }
  }
  const store = transpile("src/app/admin/github-store.ts", { "../../content/editor-model": model, "../../content/builder-model": builder }, { fetch })
  return { calls, store }
}

test("reports a revoked token without attempting repository access or echoing GitHub's response", async () => {
  const { calls, store } = mockGitHub(undefined, { fail: { route: "/user", status: 401, message: "private diagnostic" } })
  await assert.rejects(() => store.unlock("mock-only"), error => error.needsToken && /expired, revoked/.test(error.message) && !error.message.includes("private diagnostic"))
  assert.equal(calls.length, 1)
})

test("rejects read-only repository access before opening the publishing editor", async () => {
  const { calls, store } = mockGitHub(undefined, { push: false })
  await assert.rejects(() => store.unlock("mock-only"), error => error.needsToken && /did not report write access/.test(error.message))
  assert.equal(calls.length, 2)
})

test("explains exactly where GitHub denies access and distinguishes a rate limit", async () => {
  const route = "/repos/mshahrooz/Newcitywellness/git/ref/heads/main"
  const denied = mockGitHub(undefined, { fail: { route, status: 404 } }).store
  const limited = mockGitHub(undefined, { fail: { route, status: 403, headers: { "x-ratelimit-remaining": "0" } } }).store
  await assert.rejects(() => denied.unlock("mock-only"), error => error.needsToken && /404 while reading the main branch/.test(error.message))
  await assert.rejects(() => limited.unlock("mock-only"), error => !error.needsToken && /rate limiting/.test(error.message))
})

test("identifies protected-branch and token-scope errors separately at publishing", async () => {
  const route = "/repos/mshahrooz/Newcitywellness/git/refs/heads/main"
  const access = mockGitHub(undefined, { fail: { route, status: 403, message: "Resource not accessible by personal access token" } }).store
  const protectedBranch = mockGitHub(undefined, { fail: { route, status: 422, message: "GH013: Repository rule violations found" } }).store
  const saved = { sha: "original-blob", content: blank }
  await assert.rejects(() => access.publish("mock-only", saved, draft, new Map()), error => error.needsToken && /403 while updating the main branch/.test(error.message))
  await assert.rejects(() => protectedBranch.publish("mock-only", saved, draft, new Map()), error => !error.needsToken && /branch rules blocked/.test(error.message))
})

test("validates page keys, filenames, image dimensions and block identities", () => {
  assert.equal(model.pages.length, 15)
  assert.equal(model.validContent(draft), true)
  const altered = structuredClone(draft)
  altered.pages.home.blocks[1].file = "https://example.org/a.pdf"
  assert.equal(model.validContent(altered), false)
  altered.pages.home.blocks[1].file = documentFile
  altered.pages.home.images.hero.width = 1700
  assert.equal(model.validContent(altered), false)
  altered.pages.home.images.hero.width = 900
  altered.pages.home.blocks[1].id = altered.pages.home.blocks[0].id
  assert.equal(model.validContent(altered), false)
})

test("authenticates with GitHub, publishes assets in one commit, skips unused uploads", async () => {
  const { calls, store } = mockGitHub()
  const token = "mock-only"
  const original = await store.unlock(token)
  const result = await store.publish(token, original, draft, new Map([
    [imageFile, new Blob(["mock webp"])],
    [documentFile, new Blob(["%PDF-1.7"])],
    ["documents/editor/unused.pdf", new Blob(["unused"])],
  ]))
  assert.equal(calls[0].route, "/user")
  assert.ok(calls.every(call => call.options.headers.Authorization === "Bearer " + token))
  assert.equal(result.commit, "new-commit")
  assert.equal(result.snapshot.sha, "new-blob-1")
  const tree = calls.find(call => call.route.endsWith("/git/trees")).body
  assert.deepEqual(tree.tree.map(entry => entry.path), [
    "src/content/editor-content.json", "public/" + imageFile, "public/" + documentFile,
  ])
  assert.deepEqual(calls.at(-1).body, { sha: "new-commit", force: false })
})

test("never creates a commit when the published content changed concurrently", async () => {
  const { calls, store } = mockGitHub("different-blob")
  await assert.rejects(() => store.publish("mock-only", { sha: "original-blob", content: blank }, draft, new Map()), /Another edit/)
  assert.ok(calls.every(call => call.options.method === "GET"))
})

test("builder can insert and move sections, build columns and move content between anchors", () => {
  const native = ["hero", "therapy", "contact"]
  const section = "section-new"
  const before = { section, zone: "after" }
  const anchor = { section: "hero", zone: "after", anchor: "under-hero-copy" }
  const title = { id: "first-title", type: "heading", text: "Welcome", level: 2 }
  const paragraph = { id: "first-text", type: "paragraph", text: "An editable paragraph." }
  let layout = builder.appendSection({}, native, section, "contact", "New content")
  assert.deepEqual(Array.from(builder.sectionOrder(layout, native)), ["hero", "therapy", section, "contact"])
  layout = builder.moveSection(layout, native, section, "hero")
  assert.deepEqual(Array.from(builder.sectionOrder(layout, native)), [section, "hero", "therapy", "contact"])
  layout = builder.addRow(layout, before, "row-one", 2)
  layout = builder.placeItem(layout, { ...before, row: "row-one", column: 1 }, title, "unused")
  layout = builder.placeItem(layout, { ...before, row: "row-one", column: 0 }, paragraph, "unused")
  assert.equal(builder.locateItem(layout, title.id).position.column, 1)
  layout = builder.placeItem(layout, anchor, title, "row-anchor")
  assert.equal(builder.locateItem(layout, title.id).position.anchor, anchor.anchor)
  assert.equal(layout.sections[section].after[0].columns[1].length, 0)
  layout = builder.setColumns(layout, { ...before, row: "row-one" }, 1)
  assert.equal(layout.sections[section].after[0].columns[0][0].text, paragraph.text)
  assert.equal(builder.validLayout(layout), true)
  assert.equal(builder.sectionOrder(builder.removeSection(layout, section), native).includes(section), false)
})

test("builder validates media, buttons, text overrides and colors without accepting arbitrary embed URLs", () => {
  const section = "section-new"
  const photo = { id: "photo", type: "photo", text: "Clinic door", path: "images/editor/new-photo.webp", width: 1200, height: 900 }
  const button = { id: "button", type: "button", text: "Contact us", link: "/contact-us/" }
  const youtube = { id: "youtube", type: "youtube", text: "Video", link: "dQw4w9WgXcQ" }
  const video = { id: "video", type: "video", text: "Clinic introduction", path: "videos/editor/clinic-intro.mp4" }
  const file = { id: "document", type: "document", text: "Download schedule", path: "documents/editor/clinic-schedule.pdf" }
  const paragraph = { id: "text", type: "paragraph", text: "Text", source: { key: "regular-text", scope: "copy" } }
  const layout = { order: ["hero", section], sections: { [section]: { name: "Media", foreground: "#112233", background: "#abcdef",
    after: [{ id: "row", columns: [[photo, button, paragraph], [file, youtube, video]] }] } } }
  const content = { version: 1, shared: { "menu-label": "Services" }, pages: { home: { copy: { "regular-text": "Text" }, layout } } }
  assert.ok(model.validContent(content))
  assert.equal(builder.youtubeId("https://youtu.be/dQw4w9WgXcQ?t=2"), youtube.link)
  assert.equal(builder.youtubeId("https://evil.example/watch?v=dQw4w9WgXcQ"), "")
  assert.equal(builder.youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), youtube.link)
  assert.equal(builder.safeButtonUrl("javascript:alert(1)"), false)
  assert.equal(builder.safeButtonUrl("//example.com"), false)
  layout.sections[section].background = "url(https://example.com)"
  assert.equal(model.validContent(content), false)
  layout.sections[section].background = "#fffaaa"
  video.path = "https://example.com/video.mp4"
  assert.equal(model.validContent(content), false)
  video.path = "videos/editor/clinic-intro.mp4"
  assert.equal(model.validContent(content), true)
  assert.deepEqual(Array.from(builder.assetPaths(layout)).sort(), [photo.path, video.path, file.path].sort())
})

test("builder uploads referenced video and photo files with layout and copy in the same commit", async () => {
  const { calls, store } = mockGitHub()
  const snap = await store.unlock("mock-only")
  const media = [{ id: "local-video", type: "video", text: "Clinic tour", path: "videos/editor/clinic-tour.mp4" },
    { id: "local-photo", type: "photo", text: "Clinic photo", path: "images/editor/clinic-tour.webp", width: 320, height: 210 }]
  const layout = { sections: { hero: { anchors: { "hero-copy": [{ id: "row", columns: [media] }] } } } }
  const input = { version: 1, pages: { home: { copy: { "home-intro": "New copy" }, layout } } }
  await store.publish("mock-only", snap, input, new Map(media.map(asset => [asset.path, new Blob(["test media"])])))
  const tree = calls.find(call => call.route.endsWith("/git/trees")).body
  assert.deepEqual(tree.tree.slice(1).map(entry => entry.path), media.map(asset => "public/" + asset.path))
  assert.deepEqual(JSON.parse(calls.find(call => call.body?.encoding === "utf-8").body.content), input)
})
