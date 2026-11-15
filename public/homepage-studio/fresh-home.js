/* Serve the current Studio document on navigation or return to this tab. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script) return;
  const home = new URL('../', script.src);
  const marker = document.querySelector('meta[name="ncw-home-revision"]');
  const revision = marker?.content;
  const revisionParam = 'ncw_rev';
  const retryParam = 'ncw_retry';
  const pagePath = url => url.pathname.slice(home.pathname.length).replace(/(?:^|\/)index\.html$/, '').replace(/\/$/, '');
  let known = [''];
  try { if (script.dataset?.routes) known = JSON.parse(script.dataset.routes); } catch {}
  const isStudioPage = url => url.origin === home.origin && url.pathname.startsWith(home.pathname) && known.includes(pagePath(url));
  const here = new URL(location.href);
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href]');
    if (!a || a.hasAttribute('download') || a.target && a.target !== '_self') return;
    const url = new URL(a.href, location.href);
    if (!isStudioPage(url) || pagePath(url) === pagePath(new URL(location.href)) && url.hash) return;
    e.preventDefault();
    location.assign(url.href);
  }, true);
  if (!isStudioPage(here)) return;

  if (!revision || !/^[a-f0-9]{24}$/.test(revision)) return;
  let running = false, lastCheck = 0;
  function hasInProgressForm() {
    return [...document.querySelectorAll('form:not([role=search]) input:not([type=hidden]), form textarea, form select')].some(input => {
      if (input.type === 'checkbox' || input.type === 'radio') return input.checked !== input.defaultChecked;
      if (input.tagName === 'SELECT') {
        const options = [...input.options];
        if (input.multiple) return options.some(option => option.selected !== option.defaultSelected);
        const selected = options.map(option => option.defaultSelected).lastIndexOf(true);
        const firstEnabled = options.findIndex(option => !option.disabled && !option.closest('optgroup[disabled]'));
        return input.selectedIndex !== (selected < 0 ? firstEnabled : selected);
      }
      return 'defaultValue' in input && input.value !== input.defaultValue;
    });
  }
  async function check() {
    if (running || document.visibilityState === 'hidden' || Date.now() - lastCheck < 3000) return;
    running = true;
    lastCheck = Date.now();
    try {
      const manifestUrl = new URL(script.dataset?.manifest || 'homepage-studio/live-revision.json', home);
      manifestUrl.searchParams.set('check', String(lastCheck));
      const res = await fetch(manifestUrl, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const current = await res.json();
      if (!/^[a-f0-9]{24}$/.test(current?.revision) || current.revision === revision || hasInProgressForm()) return;
      const next = new URL(location.href);
      if (next.searchParams.get(revisionParam) === current.revision) {
        if (next.searchParams.has(retryParam)) return;
        next.searchParams.set(retryParam, String(lastCheck));
      } else {
        next.searchParams.set(revisionParam, current.revision);
        next.searchParams.delete(retryParam);
      }
      location.replace(next.href);
    } catch {
      // An offline or unavailable version check must never interrupt the existing page.
    } finally {
      running = false;
    }
  }
  window.addEventListener('pageshow', e => { if (e.persisted) void check(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void check(); });
  void check();
})();
