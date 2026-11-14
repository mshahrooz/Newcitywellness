const assert=require("node:assert/strict")
const test=require("node:test")
const {compile,cleanHtml,cleanCss}=require("../scripts/compile-grapes-designs.cjs")

test("preserves native section ordering, sanitized content and scoped responsive CSS",()=>{
  const output=compile({home:{parts:[{type:"native",id:"hero"},{type:"design",html:'<section id="new"><h2>New title</h2><a href="/contact-us/">Contact</a><img src="/images/first-visit.png" alt="Interior"></section>'},{type:"native",id:"therapies"}],css:"#new{color:green}@media(max-width:600px){#new{padding:12px}}"}})
  assert.deepEqual(output.home.parts.map(p=>p.id??p.type),["hero","design","therapies"])
  assert.match(output.home.parts[1].html,/<h2>New title<\/h2>/)
  assert.match(output.home.parts[1].html,/src="\/images\/first-visit.png"/)
  assert.match(output.home.css,/\.ncw-grapes-home #new/)
  assert.match(output.home.css,/@media\(max-width:600px\)\{\.ncw-grapes-home #new/)
})
test("keeps approved media and strips scripts, unsafe attributes and unapproved network resources",()=>{
  const html=cleanHtml('<section onmouseover="bad()"><script>bad()</script><img src="https://tracker.invalid/a.png"><a href="javascript:bad()">bad URL</a><iframe src="https://other.invalid/test"></iframe><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe><video src="/videos/editor/test.mp4"></video><a download href="/documents/editor/hours.pdf">Hours</a></section>')
  assert.doesNotMatch(html,/onmouseover|script|tracker\.invalid|javascript:|other\.invalid/)
  assert.match(html,/youtube-nocookie\.com\/embed\//)
  assert.match(html,/src="\/videos\/editor\/test.mp4"/)
  assert.match(html,/<a download="hours.pdf" href="\/documents\/editor\/hours.pdf"/)
})
test("prevents authored CSS from reaching the rest of the website or fetching resources",()=>{
  const css=cleanCss('@import "https://bad.invalid/test"; body,.footer{color:red;background:url(https://bad.invalid/bg)} .test::after{content:"</style>"}',"ncw-grapes-home")
  assert.doesNotMatch(css,/@import|url\(|bad\.invalid|<\//)
  assert.match(css,/\.ncw-grapes-home,\.ncw-grapes-home \.footer/)
})
test("rejects duplicate native sections or incorrect page keys",()=>{
  assert.throws(()=>compile({home:{parts:[{type:"native",id:"hero"},{type:"native",id:"hero"}],css:""}}))
  assert.throws(()=>compile({admin:{parts:[],css:""}}))
})

test("publishes project state, design and referenced media atomically, without a force push",async()=>{
  const vm=require("node:vm"), ts=require("typescript"), fs=require("node:fs")
  const calls=[]
  async function fetch(url, options) {
    const route=new URL(url).pathname
    const body=options.body?JSON.parse(options.body):undefined
    calls.push({route,body,options})
    let res
    if(route==="/user") res={login:"editor-test"}
    else if(route.endsWith("/Newcitywellness"))res={full_name:"mshahrooz/Newcitywellness",permissions:{push:true}}
    else if(route.endsWith("/git/ref/heads/main"))res={object:{sha:"main-sha"}}
    else if(route.endsWith("/grapes-designs.json"))res={sha:"existing-designs",content:Buffer.from('{"about":{"parts":[],"css":"","assets":[]}}').toString("base64")}
    else if(route.endsWith("/grapes-projects/home.json"))return {ok:false,status:404,headers:new Headers()}
    else if(route.endsWith("/git/commits/main-sha"))res={tree:{sha:"main-tree"}}
    else if(route.endsWith("/git/blobs"))res={sha:"blob-"+calls.length}
    else if(route.endsWith("/git/trees"))res={sha:"next-tree"}
    else if(route.endsWith("/git/commits"))res={sha:"next-commit"}
    else if(route.endsWith("/git/refs/heads/main"))res={object:{sha:"next-commit"}}
    else throw Error(route)
    return {ok:true,json:async()=>res}
  }
  const compile=(path,modules)=> {
    const js=ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
    const context={exports:{},require:id=>modules[id],process,fetch,TextEncoder,TextDecoder,Uint8Array,atob,btoa}
    vm.runInNewContext(js,context)
    return context.exports
  }
  const model=compile("src/content/grapes-model.ts",{})
  const store=compile("src/app/admin/grapes/github.ts",{"../../../content/grapes-model":model,"../github-store":{repo:"mshahrooz/Newcitywellness",branch:"main"}})
  assert.equal(await store.authorizeStudio("test-only"),"editor-test")
  const old=await store.loadStudioProject("test-only","home")
  const media="images/editor/clinic-room.webp"
  const design={parts:[{type:"native",id:"hero"},{type:"design",html:'<img src="/images/editor/clinic-room.webp">'}],css:"",assets:[]}
  const result=await store.publishStudio("test-only","home",old,{pages:[]},design,new Map([[media,new Blob(["photo"])],["images/editor/not-used.webp",new Blob(["skip"])]]))
  assert.equal(result.commit,"next-commit")
  assert.ok(calls.every(call=>call.options.headers.Authorization==="Bearer test-only"))
  const entries=calls.find(call=>call.route.endsWith("/git/trees")).body.tree
  assert.deepEqual(entries.map(file=>file.path).sort(),["public/"+media,"src/content/grapes-designs.json","src/content/grapes-projects/home.json"].sort())
  assert.ok(JSON.parse(calls.find(call=>call.body?.content?.includes('"about"')).body.content).about)
  assert.deepEqual(calls.at(-1).body,{sha:"next-commit",force:false})
})
