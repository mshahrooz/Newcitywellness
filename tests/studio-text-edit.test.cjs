const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const studio=fs.readFileSync('public/studio/studio.js','utf8');
const text=vm.runInNewContext(fs.readFileSync('public/studio/text-edit.js','utf8')+'\nStudioText');
const str=data=>({nodeType:3,data,get textContent(){return this.data;}});
function el(name,children=[],attrs={}){
  const a=new Map(Object.entries(attrs));
  const n={nodeType:1,localName:name,childNodes:children,
    ownerDocument:{createTextNode:str},append(k){children.push(k);k.parentElement=n;},
    hasAttribute:k=>a.has(k),getAttribute:k=>a.get(k)||null,setAttribute:(k,v)=>a.set(k,v),
    get textContent(){return children.map(x=>x.textContent).join('');},
    matches(selectors){
      return selectors.split(',').some(s=>{
        s=s.trim();
        if(s==='input:not([type=hidden])')return name==='input'&&a.get('type')!=='hidden';
        const m=/^([a-z-]+)?(?:\[([a-z-]+)(?:="([^"]+)")?\])?$/.exec(s);
        return !!m&&(!m[1]||name===m[1])&&(!m[2]||a.has(m[2])&&(!m[3]||a.get(m[2])===m[3]));
      });
    },
    closest(s){return this.matches(s)?this:this.parentElement?.closest(s)||null;},
    querySelectorAll(s){return children.flatMap(c=>c.nodeType!==1?[]:[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)]);}
  };
  for(const child of children)child.parentElement=n;
  return n;
}
const editable={'data-bs-native-copy':''};
test('a link label can be edited without altering its destination, icon or arrow',()=>{
  const icon=el('svg',[str('hidden icon')],{'aria-hidden':'true'}), arrow=el('span',[str('→')]);
  const copy=el('builder-copy',[str('Learn More '),arrow],{'data-builder-copy':'learn'});
  const target=el('a',[icon,copy],{...editable,href:'/service','aria-label':'Learn More'});
  assert.equal(text.value(target),'Learn More');
  assert.equal(text.apply(target,{value:'More about this service'}),true);
  assert.equal(text.value(target),'More about this service');
  assert.equal(target.getAttribute('href'),'/service');
  assert.equal(target.getAttribute('aria-label'),'More about this service');
  assert.equal(target.childNodes[0],icon);
  assert.equal(copy.childNodes[1],arrow);
  assert.equal(arrow.textContent,'→');
});
test('text with explicit line breaks and emphasis keeps its HTML',()=>{
  const strong=el('strong',[str('Digestive')]), br=el('br'), line=el('span',[strong,br,str('Issues')],editable);
  assert.equal(text.value(line),'Digestive\nIssues');
  assert.equal(text.apply(line,{value:'Digestive\nHealth'}),true);
  assert.equal(text.value(line),'Digestive\nHealth');
  assert.equal(line.childNodes[0],strong);
  assert.equal(line.childNodes[1],br);
  assert.equal(strong.textContent,'Digestive');
  text.apply(line,{value:'<b>Text</b>\nHealth'});
  assert.equal(strong.textContent,'<b>Text</b>');
});
test('editing a form placeholder does not modify other field attributes',()=>{
  const field=el('input',[],{...editable,placeholder:'Name',name:'fullName',type:'text'});
  assert.equal(text.getLabel(field),'Placeholder');
  assert.equal(text.apply(field,{value:'Your full name'}),true);
  assert.equal(field.getAttribute('placeholder'),'Your full name');
  assert.equal(field.getAttribute('name'),'fullName');
});
test('plain clicks prefer a text target and Alt-click retains the layout selection path',()=>{
  assert.match(studio,/markDirectDragSurfaces\(\);\s+StudioText.mark\(D,zoneOf\)/);
  assert.match(studio,/const text=!e.altKey\?StudioText.target\(e.target\):null/);
  assert.match(studio,/if\(!text&&summary/);
  assert.match(studio,/const n=text\|\|dividerFrom/);
  assert.match(studio,/case 'copy-text':return StudioText.apply\(n,op\)/);
});
