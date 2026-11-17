'use strict';

// Only Home is enabled in the new builder. Keep deep links to Classic pages
// and allow users to open the Classic Home draft explicitly.
(() => {
  const url = new URL(location.href);
  const page = url.searchParams.get('page');
  if ((!page || page === 'home') && url.searchParams.get('editor') !== 'classic') {
    location.replace(new URL('homepage/', url).href);
  }
})();
