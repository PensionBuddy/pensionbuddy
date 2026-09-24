/* Save or send these figures (#5 in Run 20).

   Two buttons beside "Copy a link to these figures", on every calculator:

     Save or print these figures   a one-page report, printed or saved as a
                                   PDF from the browser's own print dialog
     Email them to yourself        the reader's own email app opens with the
                                   figures in it, addressed to no one

   Both carry the same things, read off the page as it stands: the headline
   figures with the page's own labels, the result sentence, the workings
   where the page shows them, what the reader entered, the page's own
   assumptions, the link that opens these figures again (pb-share's, so the
   two can never disagree about what a link carries), any warning box the
   page shows beside its figures, and the page's regulatory statement and
   general disclaimer from its footer. Nothing is worked out here: every
   figure and every sentence of substance in a report is already on the
   page; only the headings and the two next-step lines are new.

   NOTHING REACHES DAMIAN. The email is addressed to no one and sent, if at
   all, by the reader; the report never leaves the browser. So the privacy
   notice's "not sent to us or stored" stays true, and there is no consent
   to ask for. The calculators' own "Email my results" forms, which do go to
   Damian, are unchanged.

   A guess still veiled stays veiled: while any figure is under the guess
   card's veil, both buttons say so instead of giving it away.

   Classic script, loaded after pb-share.js; nothing at top level. */
(function () {
  'use strict';
  var wrap = document.querySelector('.calc-wrap'), results = document.querySelector('.results');
  if (!wrap || !results) return;

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'];
  var VEILED = 'Reveal the illustration first, then save it.';

  /* innerText, whitespace collapsed; a visually hidden part of a label sits
     out of the flow and comes back with a space before its comma */
  function text(el) { return el ? String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').replace(/ ([,.;:])/g, '$1').trim() : ''; }
  function shown(el) { return !!el && !el.closest('[hidden]') && el.getClientRects().length > 0; }
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function today() { var d = new Date(); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  /* .pb-veiled is the blur itself; .pb-veil is only the transition class the
     guess card leaves on a cell once its blur has lifted (pb-guess.js,
     liftVeil), so it must not count */
  function veiled() { return all('.pb-veiled', results).some(shown); }

  /* the page's name, as its <title> gives it, less the site's */
  function title() { return String(document.title || '').replace(/,\s*Pensionbuddy\s*$/, ''); }

  /* each headline figure with the label printed above it */
  function figures() {
    return all('.res-hero .rl', results).filter(shown).map(function (l) {
      var v = l.nextElementSibling;
      return (v && shown(v)) ? [text(l), text(v)] : null;
    }).filter(Boolean);
  }
  function sentence() { var s = all('.pb-say', results).filter(shown)[0]; return text(s); }
  function workings() {
    return all('#pbWork li').map(function (li) {
      var b = li.querySelector('b'), v = text(b);
      return [text(li).replace(v, '').trim(), v];
    });
  }
  /* what the reader entered: every slider with the label beside it and the
     value the page shows for it, the pressed choices, and any box */
  function inputs() {
    var out = [];
    all('.panel label[for]', wrap).forEach(function (l) {
      var c = document.getElementById(l.htmlFor);
      /* a control inside a [hidden] wrapper is switched off (the comparison
         page's other mode, a toggle not ticked) and changes no figure; one
         folded under More options is in a <details>, and still counts */
      if (!c || !wrap.contains(c) || c.closest('.pb-guess') || c.closest('[hidden]')) return;
      if (c.type === 'range') {
        var shownV = document.getElementById(c.id + 'V');
        out.push([text(l), text(shownV) || c.getAttribute('aria-valuetext') || c.value]);
      } else if (c.type === 'checkbox') {
        out.push([text(l), c.checked ? 'yes' : 'no']);
      }
    });
    all('.panel .seg', wrap).forEach(function (seg) {
      var on = seg.querySelector('button.on'), f = seg.closest('.field'), l = f && f.querySelector('label');
      if (on) out.push([text(l) || 'Choice', text(on)]);
    });
    return out;
  }
  function assumptions() {
    var sec = all('section.assume').filter(function (s) { return /assumption/i.test(text(s.querySelector('h3'))); })[0];
    return sec ? all('li', sec).map(text) : [];
  }
  function warnings() { return all('.pb-warn').filter(shown).map(text); }
  function disclosure() { return all('.disclosure p').slice(0, 2).map(text); }
  function link() { return (window.PBShare && window.PBShare.link) ? window.PBShare.link() : location.href; }

  /* ---- the printed report -------------------------------------------- */
  var CSS = '@media screen{.pb-report{display:none}}' +
    '@media print{body>*:not(.pb-report){display:none!important}' +
    '.pb-report{display:block;color:#000;background:#fff;font:11pt/1.5 Inter,system-ui,sans-serif;padding:0}' +
    '.pb-report h1{font-size:18pt;margin:0 0 2pt}.pb-report h2{font-size:12.5pt;margin:14pt 0 4pt}' +
    '.pb-report p{margin:0 0 6pt}.pb-report dl{display:grid;grid-template-columns:auto auto;justify-content:start;gap:2pt 18pt;margin:0}' +
    '.pb-report dt{font-weight:600}.pb-report dd{margin:0}.pb-report ul{margin:0;padding-left:14pt}' +
    '.pb-report .pb-r-warn{border:1.5pt solid #000;padding:6pt 9pt;margin:10pt 0;font-weight:700}' +
    '.pb-report .pb-r-small{font-size:9pt;color:#333}}';

  function el(tag, txt, cls) { var e = document.createElement(tag); if (txt != null) e.textContent = txt; if (cls) e.className = cls; return e; }
  function pairs(list) {
    var dl = el('dl');
    list.forEach(function (p) { dl.appendChild(el('dt', p[0])); dl.appendChild(el('dd', p[1])); });
    return dl;
  }
  function report() {
    var r = el('section', null, 'pb-report');
    r.setAttribute('aria-hidden', 'true');
    r.appendChild(el('h1', title()));
    r.appendChild(el('p', 'Pensionbuddy. Saved on ' + today() + '.', 'pb-r-small'));
    var f = figures();
    if (f.length) { r.appendChild(el('h2', 'Your figures')); r.appendChild(pairs(f)); }
    var s = sentence(); if (s) r.appendChild(el('p', s));
    var w = workings(); if (w.length) { r.appendChild(el('h2', 'How we got this')); r.appendChild(pairs(w)); }
    warnings().forEach(function (t) { r.appendChild(el('p', t, 'pb-r-warn')); });
    var i = inputs(); if (i.length) { r.appendChild(el('h2', 'What you entered')); r.appendChild(pairs(i)); }
    var a = assumptions();
    if (a.length) {
      r.appendChild(el('h2', 'The assumptions behind these numbers'));
      var ul = el('ul'); a.forEach(function (t) { ul.appendChild(el('li', t)); }); r.appendChild(ul);
    }
    r.appendChild(el('h2', 'Next steps'));
    r.appendChild(el('p', 'Open these figures again: ' + link()));
    r.appendChild(el('p', 'Talk them through with Damian in a free 20-minute call: ' + location.origin + '/booking.html'));
    disclosure().forEach(function (t) { r.appendChild(el('p', t, 'pb-r-small')); });
    return r;
  }

  /* ---- the email to yourself ------------------------------------------ */
  function body() {
    var lines = [title() + ', saved on ' + today(), ''];
    figures().forEach(function (p) { lines.push(p[0] + ': ' + p[1]); });
    var s = sentence(); if (s) lines.push('', s);
    var i = inputs();
    if (i.length) { lines.push('', 'What I entered:'); i.forEach(function (p) { lines.push('- ' + p[0] + ': ' + p[1]); }); }
    lines.push('', 'Open these figures again: ' + link());
    warnings().forEach(function (t) { lines.push('', t); });
    var d = disclosure(); if (d.length) lines.push('', d[0]);
    return lines.join('\n');
  }

  /* ---- the buttons ----------------------------------------------------- */
  var row = document.querySelector('.pb-share');
  if (!row) return;
  var said = document.createElement('span');
  said.className = 'pb-share-said';
  said.setAttribute('role', 'status');
  var save = document.createElement('button');
  save.type = 'button'; save.textContent = 'Save or print these figures';
  var mail = document.createElement('button');
  mail.type = 'button'; mail.textContent = 'Email them to yourself';
  row.appendChild(save); row.appendChild(mail); row.appendChild(said);

  var style = null, timer = 0;
  function say(t) { said.textContent = t; clearTimeout(timer); timer = setTimeout(function () { said.textContent = ''; }, 3000); }

  save.addEventListener('click', function () {
    if (veiled()) { say(VEILED); return; }
    if (!style) { style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style); }
    all('body > .pb-report').forEach(function (old) { old.parentNode.removeChild(old); });
    document.body.appendChild(report());
    window.print();
  });
  mail.addEventListener('click', function () {
    if (veiled()) { say(VEILED); return; }
    window.location.href = 'mailto:?subject=' + encodeURIComponent('My figures: ' + title()) +
      '&body=' + encodeURIComponent(body());
    say('Your email app should have opened. Add your own address and send.');
  });

  /* the report's own pieces, for the page probes */
  window.PBReport = { figures: figures, inputs: inputs, assumptions: assumptions, body: body, report: report };
})();
