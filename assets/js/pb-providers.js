/* The provider ticker (Run 29): a strip of provider logos under the home
   page's hero, labelled "Providers we hold agencies with".

   IT IS SWITCHED OFF. With ON false this file does nothing at all: no markup,
   no styles, and the page's mount (<div data-pb-providers hidden>) stays
   empty and hidden, so nothing shows on the live site.

   BEFORE SWITCHING IT ON (docs/STATUS.md, Run 29, R29-1 and R29-2):
     1. each provider's written permission to show its name and logo here;
     2. the list below matches the agencies named on how-we-work.html, which
        is still a placeholder there (R20-9c);
     3. real logo files, each set as `logo` below; until then every provider
        is a box with its name in text.
   The wording is "Providers we hold agencies with". Not "partners", not
   "we work with": an agency is the fact, a partnership is a claim.

   THE ONE PLACE TO EDIT: ON, LABEL and PROVIDERS, just below.
     ON         true shows the strip, false (the default) shows nothing
     PROVIDERS  in the order shown; `logo` is null (the name in a box) or a
                path such as 'assets/img/providers/zurich.svg', used once
                permission is in, with the name as its alt text

   How it behaves, once on: the logos scroll right to left in a loop, faded
   at both edges; hovering pauses them, and a Pause button stops them for
   anyone not using a mouse (movement over five seconds needs a way to stop
   it: WCAG 2.2.2). With reduced motion asked for, it is a still row, centred
   and wrapped, with no button. Screen readers get one list of the providers;
   the copies that make the loop seamless are hidden from them. */
(function () {
  'use strict';

  var ON = false;
  var LABEL = 'Providers we hold agencies with';
  var PROVIDERS = [
    { name: 'Zurich', logo: null },
    { name: 'Irish Life', logo: null },
    { name: 'Aviva', logo: null },
    { name: 'New Ireland', logo: null },
    { name: 'Royal London', logo: null },
    { name: 'Standard Life', logo: null }
  ];

  if (!ON) return;
  var mount = document.querySelector('[data-pb-providers]');
  if (!mount || !PROVIDERS.length) return;

  /* The loop moves the track by one set. The set is repeated until there are
     at least 24 boxes, about 4,000px, so the track outruns the widest screen
     at any point in the loop, whatever the length of the list. */
  var copies = Math.max(2, Math.ceil(24 / PROVIDERS.length));
  var secs = PROVIDERS.length * 5;

  var css = [
    '.pb-prov{padding:26px 0 30px}',
    '.pb-prov-head{display:flex;align-items:center;justify-content:center;gap:14px;margin:0 0 14px}',
    '.pb-prov-label{margin:0;font-size:14px;font-weight:600;color:var(--ink-2);text-align:center}',
    '.pb-prov-pause{font:inherit;font-size:13px;font-weight:600;color:var(--teal-700);background:none;',
    '  border:1px solid var(--line-2);border-radius:999px;padding:6px 12px;cursor:pointer}',
    '.pb-prov-pause:hover{border-color:var(--teal);background:var(--teal-50)}',
    '.pb-prov-pause:focus-visible{outline:3px solid var(--ring);outline-offset:2px}',
    '.pb-prov-strip{overflow:hidden;',
    '  -webkit-mask-image:linear-gradient(to right,transparent,#000 72px,#000 calc(100% - 72px),transparent);',
    '  mask-image:linear-gradient(to right,transparent,#000 72px,#000 calc(100% - 72px),transparent)}',
    '.pb-prov-track{display:flex;width:max-content;margin:0;padding:0;list-style:none;',
    '  animation:pbProv ' + secs + 's linear infinite}',
    '.pb-prov-strip:hover .pb-prov-track,.pb-prov.is-paused .pb-prov-track{animation-play-state:paused}',
    '.pb-prov-item{flex:0 0 auto;margin:0 12px;list-style:none}',
    '.pb-prov-box{display:flex;align-items:center;justify-content:center;min-width:150px;height:60px;',
    '  padding:0 22px;border:1px solid var(--line-2);border-radius:10px;background:var(--surface);',
    '  font-size:16px;font-weight:600;color:var(--ink-2);white-space:nowrap}',
    '.pb-prov-box img{display:block;max-height:36px;max-width:150px;width:auto;height:auto}',
    '@keyframes pbProv{from{transform:translateX(0)}to{transform:translateX(-' + (100 / copies) + '%)}}',
    '@media(max-width:600px){.pb-prov-box{min-width:124px;height:52px;padding:0 16px;font-size:15px}',
    '  .pb-prov-item{margin:0 8px}}',
    '@media(prefers-reduced-motion:reduce){',
    '  .pb-prov-strip{-webkit-mask-image:none;mask-image:none}',
    '  .pb-prov-track{animation:none;width:auto;max-width:var(--maxw);margin:0 auto;padding:0 18px;',
    '    flex-wrap:wrap;justify-content:center;row-gap:12px}',
    '  .pb-prov-item.is-clone,.pb-prov-pause{display:none}}'
  ].join('\n');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  var style = el('style');
  style.textContent = css;
  document.head.appendChild(style);

  var root = el('div', 'pb-prov');
  var head = el('div', 'pb-prov-head');
  var label = el('p', 'pb-prov-label', LABEL);
  label.id = 'pbProvLabel';
  var pause = el('button', 'pb-prov-pause', 'Pause');
  pause.type = 'button';
  pause.setAttribute('aria-pressed', 'false');
  pause.setAttribute('aria-label', 'Pause the provider logos');
  pause.addEventListener('click', function () {
    var paused = root.classList.toggle('is-paused');
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', paused ? 'true' : 'false');
  });
  head.appendChild(label);
  head.appendChild(pause);

  var strip = el('div', 'pb-prov-strip');
  var track = el('ul', 'pb-prov-track');
  track.setAttribute('aria-labelledby', 'pbProvLabel');
  for (var c = 0; c < copies; c++) {
    PROVIDERS.forEach(function (p) {
      var li = el('li', 'pb-prov-item' + (c ? ' is-clone' : ''));
      if (c) li.setAttribute('aria-hidden', 'true');
      var box = el('span', 'pb-prov-box');
      if (p.logo) {
        var img = el('img');
        img.src = p.logo;
        img.alt = c ? '' : p.name;
        img.loading = 'lazy';
        box.appendChild(img);
      } else {
        box.textContent = p.name;
      }
      li.appendChild(box);
      track.appendChild(li);
    });
  }
  strip.appendChild(track);
  root.appendChild(head);
  root.appendChild(strip);
  mount.appendChild(root);
  mount.hidden = false;
})();
