const { readFileSync } = require("node:fs")
const assert = require("node:assert/strict")
const test = require("node:test")
const vm = require("node:vm")
const ts = require("typescript")

function loadDrag() {
  const output = ts.transpileModule(readFileSync("src/app/admin/pageforge/drag.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  const context = {
    exports: {}, require: () => ({ isElementType: kind => ["heading", "paragraph", "video"].includes(kind) }),
    window: new EventTarget(), CustomEvent
  }
  vm.runInNewContext(output, context)
  return context.exports
}

test("PageForge uses the midpoint of actual sections, ignoring the dragged section", () => {
  const { insertBeforeAtMidpoint } = loadDrag()
  const sections = [{id:"hero",top:10,height:400},{id:"therapies",top:410,height:500},{id:"contact",top:910,height:200}]
  assert.equal(insertBeforeAtMidpoint(100, sections), "hero")
  assert.equal(insertBeforeAtMidpoint(400, sections), "therapies")
  assert.equal(insertBeforeAtMidpoint(100, sections, "hero"), "therapies")
  assert.equal(insertBeforeAtMidpoint(1200, sections), null)
})

test("palette drags use copy and native sections use move, with a matching drag-end event", () => {
  const engine = loadDrag()
  const data = new Map()
  const transfer = {
    get types() { return [...data.keys()] },
    setData: (key,value) => data.set(key,value), getData: key => data.get(key)
  }
  const seen = []
  const cleanup = engine.subscribePageForgeDrag(item => seen.push(item?.type ?? null))
  engine.beginPageForgeDrag(transfer, {type:"palette",kind:"heading"})
  assert.equal(transfer.effectAllowed, "copy")
  assert.equal(engine.readPageForgeDrop(transfer).kind, "heading")
  engine.endPageForgeDrag()
  engine.beginPageForgeDrag(transfer, {type:"section",id:"therapies"})
  assert.equal(transfer.effectAllowed, "move")
  assert.equal(engine.readPageForgeDrop(transfer).id, "therapies")
  engine.endPageForgeDrag()
  assert.deepEqual(seen, ["palette",null,"section",null])
  cleanup()
  assert.equal(engine.readPageForgeDrop({types:["text/plain"]}), null)
  data.set(engine.dragMime, '{"type":"section","id":"[invalid]"}')
  assert.equal(engine.readPageForgeDrop(transfer), null)
})
