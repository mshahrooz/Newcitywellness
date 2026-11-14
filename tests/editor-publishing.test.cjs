const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const vm = require("node:vm")
const ts = require("typescript")

function transpile(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, "..", file), "utf8")
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { exports: {}, require: name => dependencies[name], process, TextDecoder, Uint8Array, atob, btoa, ...globals }
  vm.runInNewContext(code, context, { filename: file })
  return context.exports
}
const blank = { version: 1, pages: {} }
const model = transpile("src/content/editor-model.ts", { "./editor-content.json": { default: blank } })
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

function mockGitHub(snapshotSha = "original-blob") {
  const calls = []
  let blob = 0
  async function fetch(url, options) {
    const route = new URL(url).pathname
    const body = options.body ? JSON.parse(options.body) : undefined
    calls.push({ route, options, body })
    let value
    if (route === "/user") value = { login: "editor-test" }
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
  const store = transpile("src/app/admin/github-store.ts", { "../../content/editor-model": model }, { fetch })
  return { calls, store }
}

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
