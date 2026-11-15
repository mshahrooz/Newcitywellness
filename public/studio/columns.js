/* Resize adjacent tracks without changing the other columns or the page layout. */
const StudioColumns=(()=>{
  const LIMIT=100;
  function count(value){
    const number=Number(value);
    return Number.isSafeInteger(number)&&number>=1&&number<=LIMIT?number:null;
  }
  function valid(widths,n){
    return Array.isArray(widths)&&widths.length===n&&widths.every(w=>Number.isFinite(w)&&w>0&&w<=1e7);
  }
  function shares(widths){
    const whole=widths.reduce((sum,w)=>sum+w,0);
    return widths.map(w=>Math.max(0.0001,Math.round(w/whole*1e6)/1e4));
  }
  function resize(widths,index,delta,minimum){
    if(!valid(widths,widths.length)||!Number.isInteger(index)||index<0||index>=widths.length-1||!Number.isFinite(delta))return null;
    const total=widths[index]+widths[index+1];
    const min=Math.min(total/2,Math.max(0.001,minimum||0));
    const first=Math.max(min,Math.min(total-min,widths[index]+delta));
    if(Math.abs(first-widths[index])<.00001)return widths.slice();
    const next=widths.slice();
    next[index]=first;next[index+1]=total-first;
    return next;
  }
  function sync(grid){
    if(!grid)return;
    const n=grid.children.length;
    grid.style.setProperty('--bs-cols',String(Math.max(1,n)));
    grid.classList.toggle('bs-many-columns',n>8);
  }
  function read(grid){
    const stored=grid.getAttribute('data-bs-widths')?.split(',').map(Number);
    return valid(stored,grid.children.length)?stored:Array(grid.children.length).fill(1);
  }
  function set(grid,widths){
    if(!grid||!valid(widths,grid.children.length))return false;
    const values=shares(widths);
    sync(grid);
    if(values.every(w=>w===values[0])){
      grid.style.removeProperty('--bs-tracks');
      grid.removeAttribute('data-bs-widths');
    }else{
      const tracks=values.map(w=>'minmax(0,'+w+'fr)').join(' ');
      grid.style.setProperty('--bs-tracks',tracks);
      grid.setAttribute('data-bs-widths',values.join(','));
    }
    return true;
  }
  return Object.freeze({LIMIT,count,valid,shares,resize,sync,read,set});
})();
