const fs = require("node:fs")
const path = require("node:path")
const sanitize = require("sanitize-html")
const postcss = require("postcss")
const selectorParser = require("postcss-selector-parser")

const pages = new Set(["home", "about", "services", "acupuncture", "chinese-medical-massage-tui-na", "cupping", "moxibustion", "chinese-herbal-medicine", "gua-sha", "qi-gong", "faqs", "conditions", "testimonials", "insurance", "contact"])
const base = process.env.BASE_PATH || ""
const sitePath = /^\/(?!\/)[a-z0-9_./%~#?=&:+-]+$/i
const youtube = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[a-z\d_-]{11}$/i
const docPath = /^documents\/editor\/[a-z0-9-]+\.(pdf|docx|txt|xlsx|pptx|csv)$/i
const imagePath = /^images\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(webp|png|jpe?g|avif|svg|gif)$/i
const videoPath = /^videos\/editor\/[a-z0-9-]+\.(mp4|webm)$/i
const ref = p => p.split(/[?#]/)[0]
const local = p => base && p.startsWith(base + "/") ? p.slice(base.length + 1) : p.replace(/^\/+/,"")
const asset = (src, pattern) => typeof src === "string" && sitePath.test(src) && pattern.test(ref(local(src))) && !src.includes("..")
const renderAsset = src => "/" + local(src)
const safeLink = href => typeof href === "string" && !/[\u0000-\u0020\\]/.test(href) && (href.startsWith("#") || href === "/" || sitePath.test(href) || /^https?:\/\/[^/]+/i.test(href) || /^(?:mailto:[^@]+@[^@]+|tel:\+?[\d.()-]+)$/i.test(href))

function cssIsSafe(prop, value) {
  return /^(?:--[a-z\d-]+|-?[a-z][a-z\d-]*)$/i.test(prop) && !/^(?:-moz-binding|behavior)$/i.test(prop) && value.length < 900 &&
    !/[\\@]/.test(value) && !/\b(?:url|expression|image-set|paint|element)\s*\(/i.test(value)
}

function cleanHtml(input) {
  return sanitize(input, {
    allowedTags: ["div","section","article","header","footer","main","aside","nav","figure","figcaption","h1","h2","h3","h4","h5","h6","p","span","br","hr","b","i","strong","em","u","s","mark","small","sub","sup","ul","ol","li","dl","dt","dd","blockquote","pre","code","a","img","video","source","iframe","details","summary"],
    allowedAttributes: {"*":["class","id","role","title","aria-*","dir"],a:["href","download","target","rel"],img:["src","alt","width","height","loading"],video:["src","poster","controls","playsinline","preload","muted"],source:["src","type"],iframe:["src","title","loading","referrerpolicy","allow","allowfullscreen"]},
    allowedSchemes: ["https","http","mailto","tel"], allowProtocolRelative:false, allowedIframeHostnames:["www.youtube-nocookie.com"],
    transformTags: {
      a:(tagName, attr)=>{
        if(!safeLink(attr.href)) delete attr.href
        if(attr.href?.startsWith("/") && base && attr.href.startsWith(base + "/")) attr.href=attr.href.slice(base.length)
        if(attr.target==="_blank") attr.rel="noopener noreferrer"
        else delete attr.target
        if(asset(attr.href,docPath)) attr.download=ref(attr.href).split("/").at(-1)
        else delete attr.download
        return {tagName,attribs:attr}
      },
      img:(tagName,attr)=>{
        if(asset(attr.src,imagePath)) attr.src=renderAsset(attr.src)
        else delete attr.src
        return {tagName,attribs:{...attr,loading:"lazy",alt:attr.alt??""}}
      },
      video:(tagName,attr)=>{
        if(asset(attr.src,videoPath)) attr.src=renderAsset(attr.src)
        else delete attr.src
        if(asset(attr.poster,imagePath)) attr.poster=renderAsset(attr.poster)
        else delete attr.poster
        return {tagName,attribs:{...attr,controls:"",playsinline:"",preload:"none"}}
      },
      source:(tagName,attr)=>({tagName,attribs:asset(attr.src,videoPath)?{...attr,src:renderAsset(attr.src)}:{}}),
      iframe:(tagName,attr)=>({tagName,attribs:youtube.test(attr.src??"")?{src:attr.src,title:attr.title||"YouTube video",loading:"lazy",referrerpolicy:"strict-origin-when-cross-origin",allow:"encrypted-media; picture-in-picture; fullscreen",allowfullscreen:""}:{}}),
    },
    exclusiveFilter: frame => ["img", "iframe", "source"].includes(frame.tag) && !frame.attribs.src,
  })
}

function cleanCss(input, scope) {
  const ast=postcss.parse(input)
  ast.walkAtRules(rule=>{
    if(rule.name.toLowerCase()!=="media" || rule.nodes?.some(child=>child.type!=="rule") || /[\\@{}<>]/.test(rule.params)) rule.remove()
  })
  ast.walkComments(comment=>comment.remove())
  ast.walkDecls(decl=>{if(decl.parent.type!=="rule"||!cssIsSafe(decl.prop,decl.value)) decl.remove()})
  ast.walkRules(rule=>{
    if(rule.parent.type==="rule" || !rule.nodes.length) {rule.remove();return}
    const selector=selectorParser(root=>{
      root.each(node=>{
        const first=node.nodes[0]
        if(!first)return
        if((first.type==="tag"&&/^(?:body|html)$/i.test(first.value)) || (first.type==="pseudo"&&first.value===":root")) {
          first.replaceWith(selectorParser.className({value:scope}))
          if(node.nodes.length>1 && (node.nodes[1].type!=="combinator" || ![" ",">"].includes(node.nodes[1].value))) node.remove()
        } else {
          node.prepend(selectorParser.combinator({value:" "}))
          node.prepend(selectorParser.className({value:scope}))
        }
      })
    }).processSync(rule.selector,{lossless:false})
    if(!selector) rule.remove()
    else rule.selector=selector
  })
  // This output is embedded in a style tag in the static HTML.
  return ast.toString().replace(/</g,"")
}

function compile(input) {
  if(!input || typeof input!=="object" || Array.isArray(input)) throw Error("Expected a design map")
  const output={}
  for(const [page,draft] of Object.entries(input)) {
    if(!pages.has(page)||!draft||!Array.isArray(draft.parts)||draft.parts.length>140||typeof draft.css!=="string"||draft.css.length>200000) throw Error("Invalid GrapesJS design: "+page)
    const seen=new Set()
    const parts=draft.parts.map(part=>{
      if(part?.type==="native" && /^[a-z0-9][a-z0-9-]{0,68}$/.test(part.id) && !seen.has(part.id)) {seen.add(part.id);return {type:"native",id:part.id}}
      if(part?.type==="design" && typeof part.html==="string" && part.html.length<=250000) return {type:"design",html:cleanHtml(part.html)}
      throw Error("Invalid GrapesJS component: "+page)
    })
    output[page]={parts,css:cleanCss(draft.css,"ncw-grapes-"+page)}
  }
  return output
}

if(require.main===module) {
  const folder=path.resolve(__dirname,"../src/content")
  const input=JSON.parse(fs.readFileSync(path.join(folder,"grapes-designs.json"),"utf8"))
  fs.writeFileSync(path.join(folder,"grapes-published.json"),JSON.stringify(compile(input))+"\n")
}
module.exports={compile,cleanHtml,cleanCss}
