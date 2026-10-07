/* The provider ticker (Run 29, switched on in Run 35): a strip of provider
   logos under the home page's hero, labelled "Providers we hold agencies
   with".

   SWITCHED ON 29 September 2026. Damian confirmed that day that written
   permission is held for every provider logo used here (docs/STATUS.md,
   Run 35). The logos are the providers' own artwork, trimmed to one height
   by tools/logos.py into assets/logos/; nothing is redrawn or recoloured.
   Shown in their own colours all the time since 7 October 2026 (they were
   grey until hovered).

   STILL TO DO (docs/STATUS.md, Run 35): when how-we-work.html is released,
   the list below must name exactly the agencies that page names (its list
   is still a placeholder, R20-9c). Change one, change the other.

   The wording is "Providers we hold agencies with". Not "partners", not
   "we work with": an agency is the fact, a partnership is a claim.

   THE ONE PLACE TO EDIT: ON, LABEL and PROVIDERS, just below.
     ON         true shows the strip, false shows nothing at all: no markup,
                no styles, and the page's mount (<div data-pb-providers
                hidden>) stays empty and hidden
     PROVIDERS  in the order shown. `logo` is a file in assets/logos/ (made
                with tools/logos.py) and `w` and `h` its width and height,
                so the page keeps the logo's space before it loads; the name
                is its alt text. `size` is the height it is drawn at on a
                computer, in pixels (seven-eighths of it on a phone): set by
                eye, so that none looks heavier or smaller than the rest
                (Run 36). A bold, wide word like Aviva's is drawn shorter; a
                light one on two lines like Royal London's, or a round crest
                like New Ireland's, taller. `logo: null` draws the name in a
                box instead

   How it behaves: the logos scroll right to left in a loop, faded at both
   edges, in grey; a logo turns to its own colours under the pointer, and
   hovering pauses the strip. A Pause button stops it for anyone not using a
   mouse (movement over five seconds needs a way to stop it: WCAG 2.2.2).
   With reduced motion asked for, it is a still row, centred and wrapped,
   with no button. Screen readers get one list of the providers; the copies
   that make the loop seamless are hidden from them. */
(function () {
  'use strict';

  var ON = true;
  var LABEL = 'Providers we hold agencies with';
  var PROVIDERS = [
    { name: 'Zurich', logo: 'assets/logos/zurich.webp', w: 145, h: 34, size: 30 },
    { name: 'Irish Life', logo: 'assets/logos/irish-life.svg', w: 86.8, h: 40, size: 29 },
    { name: 'Aviva', logo: 'assets/logos/aviva.svg', w: 223.21, h: 40, size: 23 },
    { name: 'New Ireland', logo: 'assets/logos/new-ireland.webp', w: 119, h: 120, size: 56 },
    { name: 'Royal London', logo: 'assets/logos/royal-london.svg', w: 179.72, h: 40, size: 34 },
    { name: 'Standard Life', logo: 'assets/logos/standard-life.svg', w: 193.98, h: 40, size: 27 }
  ];

  if (!ON) return;
  var mount = document.querySelector('[data-pb-providers]');
  if (!mount || !PROVIDERS.length) return;

  /* The loop moves the track by one set. The set is repeated until there are
     at least 24 boxes, about 4,000px (the six logos make a set of about
     1,300px, so four sets, 5,200px), so the track outruns the widest screen
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
    /* a logo: no box, each at its own height (--pb-logo-h, set from `size`),
       in its own colours */
    '.pb-prov-box.pb-prov-logo{min-width:0;padding:0 16px;border:0;background:none}',
    '.pb-prov-box img{display:block;height:calc(var(--pb-logo-h,32) * 1px);width:auto;max-width:none}',
    '@keyframes pbProv{from{transform:translateX(0)}to{transform:translateX(-' + (100 / copies) + '%)}}',
    '@media(max-width:600px){.pb-prov-box{min-width:124px;height:52px;padding:0 16px;font-size:15px}',
    '  .pb-prov-box img{height:calc(var(--pb-logo-h,32) * .875px)}',
    '  .pb-prov-item{margin:0 8px}}',
    '@media(prefers-reduced-motion:reduce){',
    '  .pb-prov-strip{-webkit-mask-image:none;mask-image:none}',
    '  .pb-prov-track{animation:none;width:auto;max-width:none;margin:0 auto;padding:0 18px;',
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
  /* The button's name says what a press will do, and holds the word shown
     on it, so "Play" is found by voice control and heard by a screen reader
     (WCAG 2.5.3, label in name). No aria-pressed as well: a name that
     changes and a pressed state would say the same thing twice. */
  var pause = el('button', 'pb-prov-pause', 'Pause');
  pause.type = 'button';
  pause.setAttribute('aria-label', 'Pause the provider logos');
  pause.addEventListener('click', function () {
    var paused = root.classList.toggle('is-paused');
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-label', paused ? 'Play the provider logos' : 'Pause the provider logos');
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
      var box = el('span', 'pb-prov-box' + (p.logo ? ' pb-prov-logo' : ''));
      if (p.logo) {
        var img = el('img');
        img.src = p.logo;
        img.alt = c ? '' : p.name;
        img.width = Math.round(p.w);
        img.height = Math.round(p.h);
        if (p.size) img.style.setProperty('--pb-logo-h', String(p.size));
        img.loading = 'lazy';
        img.decoding = 'async';
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
