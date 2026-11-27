// Third-party games stay on their original sites and receive ordinary browser input.
(() => {
  const { src, title, titleEn } = document.body.dataset;
  const help = document.querySelector('details');
  const english = new URLSearchParams(location.search).get('lang') === 'en';
  if (english) {
    document.documentElement.lang = 'en';
    document.title = titleEn + ' · pureTV';
    help.querySelector('summary').textContent = 'Controls';
    const description = help.querySelector('p');
    description.textContent = description.dataset.en;
  }
  const embedded = parent !== window;
  help.hidden = embedded;
  const frame = document.createElement('iframe');
  frame.title = english ? titleEn : title;
  frame.allow = 'fullscreen; autoplay; gamepad';
  frame.allowFullscreen = true;
  frame.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-pointer-lock');
  frame.addEventListener('load', () => {
    if (embedded) parent.postMessage({type: 'puretv:game-ready'}, '*');
    frame.focus();
  }, {once: true});
  frame.src = src;
  document.body.append(frame);
})();
