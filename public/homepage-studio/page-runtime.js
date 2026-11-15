/* Interactions retained when a visual publication replaces the React page body. */
function enableStudioPageBehavior(doc, editing = () => false, preview = false) {
  const win = doc.defaultView;
  const controller = new win.AbortController();
  const on = (node, event, fn) => node?.addEventListener(event, e => { if (!editing()) fn(e); }, { signal: controller.signal });

  const faq = [...doc.querySelectorAll('.faq-list > details')];
  const photos = [...doc.querySelectorAll('.faq-media [data-photo]')];
  const highlight = item => {
    const index = faq.indexOf(item);
    photos.forEach(photo => photo.classList.toggle('is-active', Number(photo.dataset.photo) === index));
  };
  for (const item of faq) on(item, 'toggle', () => { if (item.open) highlight(item); });
  function faqHash() {
    const item = faq.find(item => '#'+item.id === win.location.hash);
    if (item) { item.open = true; highlight(item); item.scrollIntoView({block:'start'}); }
  }
  if (faq.length && !preview) { on(win, 'hashchange', faqHash); faqHash(); }

  for (const form of doc.querySelectorAll('form.faq-form, form.contact-page-form')) {
    on(form, 'submit', e => {
      e.preventDefault();
      if (preview) return;
      const data = new win.FormData(form);
      if (data.get('website')) return;
      const field = name => String(data.get(name) ?? '').trim();
      const faqForm = form.classList.contains('faq-form');
      const name = (faqForm ? [field('first_name'),field('last_name')] : [field('firstName'),field('lastName')]).filter(Boolean).join(' ');
      const subject = faqForm ? 'Website question'+(name?' from '+name:'') : 'Website contact inquiry';
      const message = [name?'Name: '+name:'','Email: '+field('email'),'Phone: '+field('phone'),'',field('message')].filter((text,i)=>i!==0||text).join('\n');
      const status = form.querySelector('[role=status]');
      if (status) status.textContent = 'Your email app will open a draft. Review and send it there, or write to newcitywellness@gmail.com.';
      win.location.href = 'mailto:newcitywellness@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
    });
  }

  const groups = [
    null,
    'AB IB JG KB JK BA KD ES RB ML HB OK'.split(' '),
    'DG EW AR BA YF KB ES AS'.split(' '),
    'SB PP JF CM SM AA LM'.split(' ')
  ];
  const reviewButtons = [...doc.querySelectorAll('.reviews-filters button')];
  const reviews = [...doc.querySelectorAll('#review-results > .reviews-card')];
  const reviewCount = doc.querySelector('.reviews-count');
  reviewButtons.forEach((button,index) => on(button,'click',() => {
    const filter = groups[index];
    let count = 0;
    for (const card of reviews) {
      const initials = card.getAttribute('aria-labelledby')?.replace(/^story-/,'').toUpperCase();
      card.hidden = !!filter && !filter.includes(initials);
      if (!card.hidden) count++;
    }
    reviewButtons.forEach(b => b.setAttribute('aria-pressed', String(b===button)));
    if (reviewCount) reviewCount.textContent = count+' '+(count===1?'story':'stories');
  }));

  const panel = doc.querySelector('#condition-search-panel');
  const form = panel?.querySelector('form[role=search]'), input = form?.querySelector('input[type=search]');
  const trigger = doc.querySelector('.condition-search-trigger'), results = doc.querySelector('#conditions-list');
  if (trigger && input && panel && results) {
    const sections = [...results.querySelectorAll('.condition-section')];
    const countLabel = form.querySelector('.condition-result-count');
    const note = results.querySelector('#did-you-know');
    const field = input.closest('.condition-search-field');
    const clear = doc.createElement('button');
    clear.dataset.studioRuntime = ''; clear.type = 'button'; clear.className = 'condition-search-clear'; clear.textContent = 'Clear'; clear.hidden = true;
    field?.append(clear);
    const empty = doc.createElement('div');
    empty.dataset.studioRuntime = ''; empty.className = 'container condition-empty'; empty.textContent = 'No matching topics. Try a broader search or contact the clinic.'; empty.hidden = true;
    results.append(empty);
    const dot = doc.createElement('span'); dot.dataset.studioRuntime = ''; dot.className = 'condition-search-dot'; dot.hidden = true;
    trigger.append(dot);
    const originalCounts = sections.map(s => s.querySelector('.condition-count')?.textContent);
    const normalize = text => text.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g,' ').trim();
    function update() {
      const words = normalize(input.value).split(/\s+/).filter(Boolean);
      let total = 0, categories = 0;
      sections.forEach((section,i) => {
        const title = normalize(section.querySelector('h2')?.textContent || '');
        const topics = [...section.querySelectorAll('li.chip')];
        let matches = 0;
        topics.forEach(topic=>{
          const text = title+' '+normalize(topic.textContent);
          topic.hidden = !words.every(word=>text.includes(word));
          topic.classList.toggle('is-match', !!words.length&&!topic.hidden);
          if (!topic.hidden) matches++;
        });
        section.hidden = !!words.length&&!matches;
        const label = section.querySelector('.condition-count');
        if (label) label.textContent = words.length ? matches+' of '+topics.length+' topics' : originalCounts[i];
        total+=matches; categories+=matches>0;
      });
      results.classList.toggle('is-searching', !!words.length);
      results.setAttribute('aria-label', words.length?'Condition search results':'Conditions by category');
      if (note) note.hidden=!!words.length;
      empty.hidden=total>0||!words.length;
      clear.hidden=!input.value;
      dot.hidden=!words.length||!panel.hidden;
      if(countLabel)countLabel.textContent=words.length?(total?total+' '+(total===1?'topic':'topics')+' in '+categories+' '+(categories===1?'category':'categories'):'No matching topics'):total+' topics to explore';
    }
    function toggle(open) {
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open?'Close condition search':'Open condition search');
      if (open) input.focus({preventScroll:true});
      dot.hidden=open||!normalize(input.value);
    }
    on(trigger,'click',()=>toggle(panel.hidden));
    on(input,'input',update);
    on(clear,'click',()=>{input.value='';update();input.focus();});
    on(form,'submit',e=>{e.preventDefault();toggle(false);results.focus({preventScroll:true});results.scrollIntoView({block:'start'});});
    on(doc,'pointerdown',e=>{if(!panel.hidden&&!e.target.closest('.condition-search-widget'))toggle(false);});
    on(doc,'keydown',e=>{if(e.key==='Escape'&&!panel.hidden&&!e.defaultPrevented){e.preventDefault();toggle(false);trigger.focus();}});
    on(doc.querySelector('.condition-finder nav'),'click',e=>{
      if(!e.target.closest('a[href^="#"]')||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
      if (input.value) {input.value='';update();}
    });
    on(win,'hashchange',()=>{if (input.value) {input.value='';update();}});
  }
  return () => { controller.abort(); };
}
if (!document.currentScript?.hasAttribute('data-preview-runtime')) enableStudioPageBehavior(document);
