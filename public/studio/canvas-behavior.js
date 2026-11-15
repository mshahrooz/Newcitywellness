/* Homepage-only interactions. The preview does not send enquiries. */
function enableHomepageBehavior(doc, getEditing = () => false, notify = () => {}) {
  const win = doc.defaultView, $ = (s) => doc.querySelector(s);
  const header = $('.site-header'), nav = $('.header-nav'), menu = $('.mobile-toggle');
  const drop = $('.nav-dropdown'), dropBtn = $('.nav-dropdown-toggle');
  function clearMenus() {
    nav?.classList.remove('is-open'); drop?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false'); dropBtn?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open menu');
  }
  function sync() {
    const desktop = win.matchMedia('(min-width: 901px)').matches;
    header?.classList.toggle('is-scrolled', !desktop && win.scrollY > 40);
    nav?.classList.toggle('is-pinned', desktop && header.getBoundingClientRect().bottom <= 0);
  }
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    drop?.classList.remove('open'); dropBtn?.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open?'Close menu':'Open menu');
  });
  dropBtn?.addEventListener('click', () => dropBtn.setAttribute('aria-expanded',String(drop.classList.toggle('open'))));
  doc.addEventListener('pointerdown', e => {if (!e.target.closest('.site-header,.header-nav')) clearMenus();});
  doc.addEventListener('keydown', e => {if (e.key === 'Escape') clearMenus();});
  win.addEventListener('scroll', sync, {passive:true}); win.addEventListener('resize',sync); sync();
  doc.querySelectorAll('.testimonial-slider-controls').forEach(controls=>{
    const rail=controls.parentElement.querySelector('.testimonial-grid');
    const prev=controls.querySelector('[aria-label="Previous patient experience"]');
    const next=controls.querySelector('[aria-label="Next patient experience"]');
    const count=controls.querySelector('.testimonial-slider-count');
    if(!rail)return;
    let nearest=0;
    function sliderSync(){
      if(!rail.children.length)return;
      const cards=[...rail.children],first=cards[0],offset=rail.scrollLeft+first.offsetLeft;
      nearest=cards.reduce((best,c,i)=>Math.abs(c.offsetLeft-offset)<Math.abs(cards[best].offsetLeft-offset)?i:best,0);
      if(count?.firstChild)count.firstChild.textContent=nearest+1;
      prev?.setAttribute('aria-disabled',String(nearest===0));next?.setAttribute('aria-disabled',String(nearest===cards.length-1));
    }
    function go(n){const first=rail.children[0],c=rail.children[nearest+n];if(c&&first)rail.scrollTo({left:c.offsetLeft-first.offsetLeft,behavior:'smooth'});}
    prev?.addEventListener('click',()=>go(-1));next?.addEventListener('click',()=>go(1));rail.addEventListener('scroll',sliderSync,{passive:true});
  });
  doc.querySelectorAll('form').forEach(f=>f.addEventListener('submit',e=>{
    e.preventDefault();
    if(!getEditing())notify('The contact form is disabled in this preview.');
  }));
  // Keep navigation and bookings as reference links. They do not submit anything from the editor.
  doc.querySelectorAll('a[href]').forEach(a=>{
    if (!a.getAttribute('href').startsWith('#')) {a.target='_blank';a.rel='noopener noreferrer';}
  });
  return () => {win.removeEventListener('scroll',sync);win.removeEventListener('resize',sync);};
}
