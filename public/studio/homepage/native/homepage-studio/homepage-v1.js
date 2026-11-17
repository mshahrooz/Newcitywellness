/* Shared navigation, responsive offsets and homepage features for Studio publications. */
(() => {
  'use strict';
  if(typeof StudioResponsiveOffsets!=='undefined')StudioResponsiveOffsets.observe(document);
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.header-nav');
  const menu = header?.querySelector('.mobile-toggle');
  const drop = nav?.querySelector('.nav-dropdown');
  const dropBtn = drop?.querySelector('.nav-dropdown-toggle');
  const buttonLink = menu?.querySelector('path');
  function setDropdown(open) {
    drop?.classList.toggle('open', open);
    dropBtn?.setAttribute('aria-expanded', String(open));
  }
  function setMenu(open) {
    nav?.classList.toggle('is-open', open);
    menu?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    buttonLink?.setAttribute('d', open ? 'm6 6 12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16');
    if (!open) setDropdown(false);
  }
  menu?.addEventListener('click', () => setMenu(!nav?.classList.contains('is-open')));
  dropBtn?.addEventListener('click', () => setDropdown(!drop?.classList.contains('open')));
  document.addEventListener('pointerdown', e => {
    if (e.target instanceof Element && !e.target.closest('.site-header,.header-nav')) setMenu(false);
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a[href]')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (drop?.classList.contains('open')) { setDropdown(false); dropBtn?.focus(); }
    else if (nav?.classList.contains('is-open')) { setMenu(false); menu?.focus(); }
  });
  function sync() {
    const desktop = window.matchMedia('(min-width:901px)').matches;
    header?.classList.toggle('is-scrolled', !desktop && window.scrollY > 40);
    nav?.classList.toggle('is-pinned', !!(desktop && header && header.getBoundingClientRect().bottom <= 0));
  }
  window.addEventListener('scroll', sync, {passive:true});
  window.addEventListener('resize', sync);
  sync();

  document.querySelectorAll('.testimonial-slider-controls').forEach(controls => {
    const rail=controls.parentElement.querySelector('.testimonial-grid');
    const prev=controls.querySelector('[aria-label="Previous patient experience"]');
    const next=controls.querySelector('[aria-label="Next patient experience"]');
    const count=controls.querySelector('.testimonial-slider-count');
    if (!rail) return;
    let active=0;
    function update() {
      const cards=[...rail.children];
      if (!cards.length) return;
      const first=cards[0].offsetLeft;
      active=cards.reduce((best,c,i)=>Math.abs(c.offsetLeft-first-rail.scrollLeft)<Math.abs(cards[best].offsetLeft-first-rail.scrollLeft)?i:best,0);
      if (count?.firstChild?.nodeType===3) count.firstChild.textContent=String(active+1);
      prev?.setAttribute('aria-disabled',String(active===0));
      next?.setAttribute('aria-disabled',String(active===cards.length-1));
    }
    function move(step) {
      const first=rail.children[0], card=rail.children[active+step];
      if (card && first) rail.scrollTo({left:card.offsetLeft-first.offsetLeft});
    }
    prev?.addEventListener('click',()=>move(-1));
    next?.addEventListener('click',()=>move(1));
    rail.addEventListener('scroll',update,{passive:true});
    update();
  });

  // Match the original homepage: open the visitor's email app. No form data is sent by the site.
  document.querySelectorAll('form.contact-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent('Website enquiry - New City Acupuncture & Wellness Center');
    const body = encodeURIComponent(
      'Name: ' + (data.get('name') || '') + '\nEmail: ' + (data.get('email') || '') +
      '\nPhone: ' + (data.get('phone') || '') + '\n\nMessage:\n' + (data.get('message') || '')
    );
    location.href = 'mailto:newcitywellness@gmail.com?subject=' + subject + '&body=' + body;
  }));

  document.querySelectorAll('.bs-bg-layer video').forEach(video => {
    video.muted = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.autoplay = false;
      video.pause();
    } else {
      video.autoplay = true;
      video.play().catch(() => {});
    }
  });
})();
