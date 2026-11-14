"use client"

import type { PageKey } from "../../../content/editor-model"
import { designPath, isNativeKey, type GrapesDesign, type GrapesDesigns } from "../../../content/grapes-model"
import { branch, repo, tokenSetupUrl } from "../github-store"

export { tokenSetupUrl }
const api = "https://api.github.com"
const repoPath = `/repos/${repo}`
const projectPath = (page: PageKey) => `src/content/grapes-projects/${page}.json`
const commitLabel = "Publish GrapesJS design"
export type ProjectSnapshot = { designSha: string; projectSha: string | null; project: unknown; design: GrapesDesign | undefined }
type GitRef = { object: { sha: string } }
type FileReply = { sha: string; content: string }
type Sha = { sha: string }
type TreeFile = { path: string; mode: "100644"; type: "blob"; sha: string }

export class StudioApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}
async function request<T>(token: string, path: string, step: string, options?: { method: string; body: unknown }) {
  let response: Response
  try {
    response = await fetch(api + path, {
      method: options?.method ?? "GET",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28",
        ...(options ? {"Content-Type":"application/json"} : {}) },
      body: options ? JSON.stringify(options.body) : undefined,
      cache: "no-store", redirect: "error",
    })
  } catch { throw new StudioApiError(0, `Could not reach GitHub while ${step}. Your draft is still open.`) }
  if (!response.ok) {
    const status = response.status
    if (status === 401) throw new StudioApiError(status, "GitHub rejected this token. Use a current token, then reconnect without closing your draft.")
    if (status === 429 || (status === 403 && response.headers.get("x-ratelimit-remaining")==="0")) throw new StudioApiError(status, "GitHub is rate limiting requests. Wait a few minutes and retry.")
    if (status === 403 || status === 404) throw new StudioApiError(status, `GitHub denied access while ${step} (${status}). Check that the token is scoped to Newcitywellness with Contents read and write.`)
    if (status === 409 || status === 422) throw new StudioApiError(status, `GitHub could not finish ${step} (${status}). Your draft is still open. The branch may have changed or blocked the update.`)
    throw new StudioApiError(status, `GitHub returned ${status} while ${step}.`)
  }
  return response.json() as Promise<T>
}

const readHead = (token: string) => request<GitRef>(token,`${repoPath}/git/ref/heads/${branch}`,"reading the main branch")
const readFile = (token: string, path: string, commit: string) => request<FileReply>(token,`${repoPath}/contents/${path}?ref=${commit}`,"reading the GrapesJS project")
const readOptional = async (token: string, path: string, commit: string) => {
  try { return await readFile(token,path,commit) }
  catch(error) { if (error instanceof StudioApiError && error.status === 404) return null; throw error }
}
function decode<T>(file: FileReply): T {
  const bytes=Uint8Array.from(atob(file.content.replace(/\s/g,"")),char=>char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as T
}
function encode(bytes:Uint8Array) {
  let binary=""
  for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192))
  return btoa(binary)
}
function stringify(value: unknown) {
  const text=JSON.stringify(value)
  if(new TextEncoder().encode(text).length>890_000) throw Error("The design is too large. Remove unused assets or simplify it before publishing.")
  return text+"\n"
}

export async function authorizeStudio(token:string) {
  const user=await request<{login:string}>(token,"/user","checking your GitHub token")
  const info=await request<{full_name:string;permissions?:{push?:boolean}}>(token,repoPath,"checking Newcitywellness access")
  if(info.full_name?.toLowerCase()!==repo.toLowerCase()||info.permissions?.push===false) throw new StudioApiError(403,"This GitHub account does not have write access to Newcitywellness.")
  return user.login
}

export async function loadStudioProject(token:string,page:PageKey):Promise<ProjectSnapshot> {
  const {object:{sha}}=await readHead(token)
  const [design, project]=await Promise.all([readFile(token,designPath,sha),readOptional(token,projectPath(page),sha)])
  const designs=decode<GrapesDesigns>(design)
  return { designSha:design.sha, design:designs[page], projectSha:project?.sha??null, project:project?decode<unknown>(project):null }
}

export async function publishStudio(token:string,page:PageKey,expected:ProjectSnapshot,project:unknown,design:GrapesDesign,uploads:Map<string,Blob>) {
  if(!design.parts.length||design.parts.length>140||design.parts.some(part=>part.type==="native"?!isNativeKey(part.id):part.html.length>250000)||design.css.length>200000) throw Error("This page is empty or exceeds the design limits.")
  const {object:{sha:parent}}=await readHead(token)
  const [current, projectNow, commitData]=await Promise.all([
    readFile(token,designPath,parent),readOptional(token,projectPath(page),parent),request<{tree:Sha}>(token,`${repoPath}/git/commits/${parent}`,"reading the current commit")
  ])
  const currentDesigns=decode<GrapesDesigns>(current)
  if((projectNow?.sha??null)!==expected.projectSha || JSON.stringify(currentDesigns[page])!==JSON.stringify(expected.design)) throw Error("This page was updated in another tab. Download a backup before reopening so you do not overwrite it.")
  const nextDesigns={...currentDesigns,[page]:design}
  const entries:TreeFile[]=[]
  function record(path:string,sha:string) { entries.push({path,mode:"100644",type:"blob",sha}) }
  async function textBlob(path:string,file:string) {
    const data=await request<Sha>(token,`${repoPath}/git/blobs`,"saving editor data",{method:"POST",body:{encoding:"utf-8",content:file}})
    record(path,data.sha)
    return data.sha
  }
  const projectText=stringify(project)
  const designText=stringify(nextDesigns)
  const [designSha,projectSha]=await Promise.all([textBlob(designPath,designText),textBlob(projectPath(page),projectText)])
  for(const [path,blob] of uploads) {
    if(!/^(?:images\/editor\/[\w-]+\.webp|documents\/editor\/[\w-]+\.(?:pdf|docx|txt|xlsx|pptx|csv)|videos\/editor\/[\w-]+\.(?:mp4|webm))$/.test(path)) throw Error("An uploaded file has an invalid path.")
    const used=design.parts.some(part=>part.type==="design"&&part.html.includes("/"+path)) || design.assets.some(asset=>asset.src.endsWith("/"+path))
    if(!used)continue
    const entry=await request<Sha>(token,`${repoPath}/git/blobs`,"uploading a media file",{method:"POST",body:{encoding:"base64",content:encode(new Uint8Array(await blob.arrayBuffer()))}})
    record("public/"+path,entry.sha)
  }
  const tree=await request<Sha>(token,`${repoPath}/git/trees`,"assembling the design commit",{method:"POST",body:{base_tree:commitData.tree.sha,tree:entries}})
  const commit=await request<Sha>(token,`${repoPath}/git/commits`,"creating the design commit",{method:"POST",body:{message:commitLabel+" ("+page+")",parents:[parent],tree:tree.sha}})
  await request<GitRef>(token,`${repoPath}/git/refs/heads/${branch}`,"updating the main branch",{method:"PATCH",body:{sha:commit.sha,force:false}})
  return {commit:commit.sha,snapshot:{designSha,design,projectSha,project}}
}
