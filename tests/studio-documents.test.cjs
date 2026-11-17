'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const { createHash, webcrypto } = require('node:crypto');
const docs = fs.readFileSync('public/studio/documents.js','utf8');
const publish = fs.readFileSync('public/studio/publish.js','utf8');
const sandbox={URL, atob, btoa, Blob, TextEncoder, TextDecoder, crypto:webcrypto};
const code=docs+publish.replace('return {start,details,','return {uploadZip,start,details,').replace('StudioPublish.start();','');
vm.createContext(sandbox);
const client=vm.runInContext(code+'\n({docs:StudioDocuments,publish:StudioPublish});',sandbox);
const prefix='data:application/octet-stream;base64,';

test('a 25 MB document is hashed and packaged as opaque bytes even with an active file extension', async ()=>{
  const {MAX_FILE, parse, filename}=client.docs;
  assert.equal(MAX_FILE,25*1024*1024);
  const payload=Buffer.alloc(MAX_FILE,0x7a);
  payload.write('<html><h1>Not an inline page</h1></html>');
  const encoded=payload.toString('base64');
  const data=prefix+encoded;
  assert.equal(parse(data).length,MAX_FILE);
  const expected=createHash('sha256').update(payload).digest('hex').slice(0,32)+'.bin';
  const file=await client.publish.fromData(data,true);
  assert.equal(file.ext,'bin');
  assert.equal(file.name,expected);
  assert.equal(filename('attachment.html'),'attachment.html');
  const zip=Buffer.from(await client.publish.uploadZip(new Map([['public/media/homepage-studio/'+file.name,file.encoded]])).arrayBuffer());
  assert.equal(zip.readUInt32LE(18),MAX_FILE);
  assert.ok(zip.length>24*1024*1024&&zip.length<32*1024*1024);
  assert.equal(parse(prefix+Buffer.alloc(MAX_FILE+1).toString('base64')),null);
  await assert.rejects(client.publish.fromData(data,false),/supported local image or video/);
});

test('document filenames keep extensions, and old PDF drafts still publish', async()=>{
  const { parse, filename }=client.docs;
  assert.equal(filename('my report.xlsx'),'my report.xlsx');
  assert.equal(filename('folder/strange\\file.docx'),'folder_strange_file.docx');
  assert.equal(parse(prefix+'Z==='),null);
  assert.equal(parse('data:text/html;base64,PGI+'),null);
  assert.equal(parse(prefix).length,0);
  const old='data:application/pdf;base64,'+Buffer.from('%PDF-1.7').toString('base64');
  assert.equal((await client.publish.fromData(old,true)).ext,'pdf');
});

test('safe document URLs keep the original basename, spaces, and extension', async()=>{
  const data=prefix+Buffer.from('%PDF-1.7\\n').toString('base64');
  const expected=createHash('sha256').update(Buffer.from('%PDF-1.7\\n')).digest('hex').slice(0,32);
  const file=await client.publish.fromData(data,true,'Q17 consignment.pdf');
  assert.equal(file.name,expected+'/Q17 consignment.pdf');
  assert.equal(file.ext,'pdf');
  const other=await client.publish.fromData(data,true,'financial-report.xlsx');
  assert.equal(other.name,expected+'/financial-report.xlsx');
  assert.equal(client.docs.storageName('my source.html',expected),expected+'.bin');
  assert.equal(client.docs.storageName('custom-script.js',expected),expected+'.bin');
  assert.equal(client.docs.storageName('../../report.docx',expected),expected+'/.._.._report.docx');
});
