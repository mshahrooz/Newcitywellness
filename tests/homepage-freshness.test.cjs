'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const { URL } = require('node:url');

const script = fs.readFileSync(require.resolve('../public/homepage-studio/fresh-home.js'), 'utf8');
const home = 'https://mshahrooz.github.io/Newcitywellness/';
const old = 'a'.repeat(24), latest = 'b'.repeat(24);
async function run({ href = home, revision = old, available = latest, inputs = [] } = {}) {
  const requests = [], replacements = [], assigned = [], events = {};
  const document = {
    currentScript: { src: home + 'homepage-studio/fresh-home.js?v=123' },
    visibilityState: 'visible',
    querySelector: () => ({ content: revision }),
    querySelectorAll: () => inputs,
    addEventListener: (name, fn) => { events[name] = fn; },
  };
  vm.runInNewContext(script, {
    URL, AbortSignal, document, window: { addEventListener: document.addEventListener },
    location: { href, replace: u => replacements.push(u), assign: u => assigned.push(u) },
    fetch: async (u, opts) => {
      requests.push({ url: String(u), cache: opts.cache });
      return { ok: true, json: async () => ({ revision: available }) };
    },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { requests, replacements, assigned, events };
}

test('stale homepage navigates once to the fresh revision and preserves URL parameters', async () => {
  const { requests, replacements } = await run({ href: home + '?utm_source=client#contact' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].cache, 'no-store');
  assert.match(requests[0].url, /\/homepage-studio\/live-revision\.json\?check=\d+$/);
  assert.deepEqual(replacements, [home + '?utm_source=client&ncw_rev=' + latest + '#contact']);
});

test('matching revisions, dirty contact forms and exhausted retries stay on the current page', async () => {
  assert.deepEqual((await run({ revision: latest })).replacements, []);
  assert.deepEqual((await run({ inputs: [{type:'text',value:'Unsent name',defaultValue:''}] })).replacements, []);
  assert.deepEqual((await run({ href: home + '?ncw_rev=' + latest + '&ncw_retry=123' })).replacements, []);
  assert.match((await run({ href: home + '?ncw_rev=' + latest })).replacements[0], /&ncw_retry=\d+$/);
});

test('a link back from an inside page loads the full Studio homepage, not the Next router copy', async () => {
  const { requests, assigned, events } = await run({ href: home + 'about-us/' });
  assert.equal(requests.length, 0);
  let cancelled = false;
  const a = { href: home, hasAttribute: () => false };
  events.click({ button: 0, target: { closest: () => a }, preventDefault: () => { cancelled = true; } });
  assert(cancelled);
  assert.deepEqual(assigned, [home]);
});
