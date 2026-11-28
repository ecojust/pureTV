// Authors serve and control their own game frames. The guide stays in the pureTV page.
(() => {
  const {src, title, titleEn} = document.body.dataset;
  const english = new URLSearchParams(location.search).get('lang') === 'en';
  if (english) {
    document.documentElement.lang = 'en';
    document.title = titleEn + ' · pureTV';
    for (const label of document.querySelectorAll('[data-en]')) label.textContent = label.dataset.en;
  }

  const openGuide = document.getElementById('open-guide');
  const guide = document.getElementById('guide');
  const frame = document.createElement('iframe');
  frame.title = english ? titleEn : title;
  frame.allow = 'fullscreen; autoplay; gamepad';
  frame.allowFullscreen = true;
  frame.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-pointer-lock');

  if (guide) {
    const body = document.getElementById('guide-body');
    const closeGuide = document.getElementById('close-guide');
    openGuide.addEventListener('click', () => {
      frame.inert = true;
      guide.showModal();
    });
    closeGuide.addEventListener('click', () => guide.close());
    guide.addEventListener('close', () => {
      frame.inert = false;
      frame.focus();
    });
    // A game engine can request focus from its own document after loading.
    // In Chromium that can blur the host even while its modal is open.
    window.addEventListener('blur', () => {
      if (guide.open) requestAnimationFrame(() => {
        if (guide.open && document.activeElement === frame) closeGuide.focus();
      });
    });
    guide.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        body.scrollBy(0, event.key === 'ArrowDown' ? 80 : -80);
      }
    });
  } else {
    // Previously published pages may still be in the browser cache.
    const help = document.querySelector('details');
    if (help) {
      help.hidden = parent !== window;
      if (english) help.querySelector('summary').textContent = 'Controls';
    }
  }

  frame.addEventListener('load', () => {
    const keepFocus = Boolean(guide?.open || (openGuide && document.activeElement === openGuide));
    if (parent !== window) parent.postMessage({type: 'puretv:game-ready', keepFocus}, '*');
    if (guide?.open && !guide.contains(document.activeElement)) document.getElementById('close-guide').focus();
    if (!keepFocus) frame.focus();
  }, {once: true});
  frame.src = src;
  document.body.append(frame);
})();
