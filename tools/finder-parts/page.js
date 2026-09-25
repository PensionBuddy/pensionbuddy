/* find-my-pension.html, the old pension finder (Run 20 #1).

   What a trace needs, the Letter of Authority and what is sent all live in
   assets/js/pension-finder.js, covered by tests/pension-finder.test.js. This
   file only moves between the four steps, reads the form into the shape the
   module expects, and paints what the module returns.

   SENDING (Run 27). The whole trace is posted to Netlify Forms as the
   form's hidden fields (PBFinder.fields, assets/js/pb-forms.js), and the
   page only says "sent" on a real success. When the post is refused or
   fails, the reader's email app opens with the details and a one-line
   authority ready to go to Damian, and the page says exactly that: nothing
   has been sent by the page itself. A signature drawn on screen cannot
   travel in an email link, so that route offers the letter to save as a
   PDF and attach.

   TONE: no urgency, no promise of a find. The module's messages say what is
   missing and nothing else. */
(function () {
  'use strict';
  var F = window.PBFinder, P = window.PBPage;
  var form = document.getElementById('pfForm');
  if (!F || !P || !form) return;
  var $ = P.$;
  var MAX = F.MAX_EMPLOYERS;
  var steps = [$('pfStep1'), $('pfStep2'), $('pfStep3'), $('pfStep4')];
  var dots = [].slice.call(document.querySelectorAll('#pfSteps li'));
  var err = $('pfErr'), emps = $('pfEmps'), add = $('pfEmpAdd');
  var drawn = null;          // the drawn signature, as a PNG data URL, or null
  var today = new Date();

  /* ---------------------------------------------------------- employers */
  var FIELDS = [
    ['Name', 'Employer’s name', 'organization', ''],
    ['From', 'From, the year', '', 'e.g. 1998'],
    ['To', 'To, the year', '', 'e.g. 2004'],
    ['Provider', 'Pension provider or scheme, if you know it', '', ''],
    ['Ref', 'Policy or member number, if you have one', '', '']
  ];
  function rows() { return [].slice.call(emps.querySelectorAll('.pf-emp')); }

  function field(i, f) {
    var id = 'pfEmp' + i + f[0];
    var wrap = document.createElement('div'); wrap.className = 'pf-field';
    var lab = document.createElement('label'); lab.htmlFor = id; lab.textContent = f[1];
    if (f[0] === 'Provider' || f[0] === 'Ref') {
      var o = document.createElement('span'); o.className = 'pf-opt'; o.textContent = ' (optional)'; lab.appendChild(o);
    }
    var inp = document.createElement('input'); inp.id = id; inp.type = 'text';
    if (f[2]) inp.autocomplete = f[2];
    if (f[3]) inp.placeholder = f[3];
    if (f[0] === 'From' || f[0] === 'To') { inp.inputMode = 'numeric'; inp.maxLength = 4; }
    wrap.appendChild(lab); wrap.appendChild(inp);
    return wrap;
  }

  /* renumber every row so ids, legends and the module's field names agree */
  function renumber() {
    rows().forEach(function (r, i) {
      r.setAttribute('data-i', i);
      r.querySelector('legend').textContent = 'Employer ' + (i + 1);
      FIELDS.forEach(function (f) {
        var inp = r.querySelector('[id^="pfEmp"][id$="' + f[0] + '"]');
        var lab = inp && r.querySelector('label[for="' + inp.id + '"]');
        if (!inp) return;
        inp.id = 'pfEmp' + i + f[0];
        if (lab) lab.htmlFor = inp.id;
      });
      var x = r.querySelector('.pf-emp-x');
      if (x) x.setAttribute('aria-label', 'Remove employer ' + (i + 1));
    });
    add.hidden = rows().length >= MAX;
  }

  function addRow() {
    if (rows().length >= MAX) return;
    var i = rows().length;
    var fs = document.createElement('fieldset'); fs.className = 'pf-emp';
    var lg = document.createElement('legend'); fs.appendChild(lg);
    var x = document.createElement('button'); x.type = 'button'; x.className = 'pf-emp-x'; x.textContent = 'Remove';
    fs.appendChild(x);
    fs.appendChild(field(i, FIELDS[0]));
    var two = document.createElement('div'); two.className = 'pf-two';
    two.appendChild(field(i, FIELDS[1])); two.appendChild(field(i, FIELDS[2]));
    fs.appendChild(two);
    fs.appendChild(field(i, FIELDS[3])); fs.appendChild(field(i, FIELDS[4]));
    emps.appendChild(fs);
    renumber();
    fs.querySelector('input').focus();
  }
  add.addEventListener('click', addRow);
  emps.addEventListener('click', function (e) {
    var x = e.target.closest('.pf-emp-x');
    if (!x) return;
    var r = x.closest('.pf-emp'), i = rows().indexOf(r);
    r.parentNode.removeChild(r);
    renumber();
    var left = rows(), next = left[Math.min(i, left.length - 1)];
    (next ? next.querySelector('input') : add).focus();
  });

  /* ---------------------------------------------------------- the form, read */
  function val(id) { var el = $(id); return el ? el.value : ''; }
  function data() {
    return {
      employers: rows().map(function (r, i) {
        return { name: val('pfEmp' + i + 'Name'), from: val('pfEmp' + i + 'From'), to: val('pfEmp' + i + 'To'),
                 provider: val('pfEmp' + i + 'Provider'), ref: val('pfEmp' + i + 'Ref') };
      }),
      fullName: val('pfName'), otherNames: val('pfOther'), dob: val('pfDob'), address: val('pfAddress'),
      email: val('pfEmail'), phone: val('pfPhone'),
      consents: { phone: $('pfPhoneOk').checked === true, marketing: $('pfOptin').checked === true },
      signature: { typed: val('pfSigned'), confirmed: $('pfConfirm').checked === true, drawn: drawn }
    };
  }

  /* ---------------------------------------------------------- problems */
  function clear() {
    err.textContent = '';
    [].forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) { el.removeAttribute('aria-invalid'); });
  }
  function show(list) {
    clear();
    if (!list.length) return true;
    err.textContent = list.map(function (p) { return p.message; }).join(' ');
    list.forEach(function (p) { var el = $(p.field); if (el) el.setAttribute('aria-invalid', 'true'); });
    var first = $(list[0].field);
    if (first && first.focus) first.focus();
    return false;
  }

  /* ---------------------------------------------------------- steps */
  function go(n) {
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    dots.forEach(function (d, i) {
      d.classList.toggle('pf-on', i === n);
      d.classList.toggle('pf-past', i < n);
      if (i === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    var h = steps[n].querySelector('h2');
    if (n === 2) { paintLetter($('pfLetter'), false); sizePad(); }
    if (h) h.focus();
  }
  $('pfNext1').addEventListener('click', function () { if (show(F.problems('where', data(), today))) go(1); });
  $('pfNext2').addEventListener('click', function () { if (show(F.problems('who', data(), today))) go(2); });
  $('pfBack2').addEventListener('click', function () { clear(); go(0); });
  $('pfBack3').addEventListener('click', function () { clear(); go(1); });

  /* ---------------------------------------------------------- the letter */
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  function paintLetter(box, signed) {
    var L = F.letter(data(), today);
    box.textContent = '';
    box.appendChild(el('h3', L.title));
    box.appendChild(el('p', L.to, 'pf-to'));
    L.paragraphs.forEach(function (p) { box.appendChild(el('p', p)); });
    box.appendChild(el('p', 'Where I worked:'));
    var ul = el('ul');
    L.employers.forEach(function (e) {
      ul.appendChild(el('li', e.name + ', ' + e.years + (e.provider ? ', ' + e.provider : '') + (e.ref ? ', reference ' + e.ref : '')));
    });
    box.appendChild(ul);
    if (signed) {
      if (drawn) { var img = document.createElement('img'); img.src = drawn; img.alt = 'Signature, drawn by ' + L.signedBy; box.appendChild(img); }
      box.appendChild(el('p', 'Signed: ' + L.signature));
    }
    box.appendChild(el('p', 'Name: ' + (L.signedBy || '')));
    box.appendChild(el('p', 'Date: ' + L.signedOn));
  }

  /* ---------------------------------------------------------- signature pad
     Optional. Pointer events cover mouse, pen and touch; touch-action:none
     in the stylesheet stops the page scrolling under a finger. The typed
     name is the signature; this adds a drawn one to the saved letter. */
  var pad = $('pfPad'), ctx = pad && pad.getContext ? pad.getContext('2d') : null, drawing = false, marks = false;
  function sizePad() {
    if (!ctx) return;
    var r = pad.getBoundingClientRect(), k = window.devicePixelRatio || 1;
    if (!r.width) return;
    var keep = marks ? pad.toDataURL('image/png') : null;
    pad.width = Math.round(r.width * k); pad.height = Math.round(r.height * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0B1F1C';
    if (keep) { var im = new Image(); im.onload = function () { ctx.drawImage(im, 0, 0, r.width, r.height); }; im.src = keep; }
  }
  function at(e) { var r = pad.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  if (ctx) {
    pad.addEventListener('pointerdown', function (e) {
      drawing = true; pad.setPointerCapture && pad.setPointerCapture(e.pointerId);
      var p = at(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    });
    pad.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = at(e); ctx.lineTo(p[0], p[1]); ctx.stroke(); marks = true;
    });
    function end() { if (!drawing) return; drawing = false; if (marks) drawn = pad.toDataURL('image/png'); }
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('pointerleave', end);
    window.addEventListener('resize', function () { if (!steps[2].hidden) sizePad(); });
  }
  $('pfPadClear').addEventListener('click', function () {
    if (ctx) ctx.clearRect(0, 0, pad.width, pad.height);
    marks = false; drawn = null;
  });

  /* ---------------------------------------------------------- sending */
  function finish(message) {
    $('pfDone').textContent = message;
    var list = F.tracker(F.employers(data().employers, today.getFullYear()));
    var track = $('pfTrack'); track.textContent = '';
    list.forEach(function (t) {
      var li = el('li'); li.appendChild(el('b', t.name));
      var st = el('div', null, 'pf-stages');
      t.stages.forEach(function (s) {
        var tag = el('span', s.label, 'pf-stage' + (s.state === 'done' ? ' pf-done-s' : s.state === 'next' ? ' pf-next-s' : ''));
        tag.setAttribute('title', s.state === 'done' ? 'Done' : s.state === 'next' ? 'Next' : 'Later');
        st.appendChild(tag);
      });
      /* the pills are drawn for the eye; a screen reader hears one sentence
         saying where each stage stands, rather than the three words twice */
      st.setAttribute('aria-hidden', 'true');
      var sr = el('span', ' (' + t.stages.map(function (s) { return s.label + ': ' + (s.state === 'done' ? 'done' : 'not yet'); }).join(', ') + ')');
      sr.className = 'tk-sr';
      li.appendChild(st); li.appendChild(sr);
      track.appendChild(li);
    });
    paintLetter($('pfPrintLetter'), true);
    go(3);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = data();
    if (!show(F.problems('sign', d, today))) return;
    function viaEmail() {
      window.location.href = F.mailto(d, today, LEAD_FALLBACK_ADDRESS);
      finish('Your email app should have opened with your details ready to send to Damian. Nothing has been sent until you press send there. Please attach your signed letter: choose "Save or print your letter" below, then save it as a PDF.');
    }
    if (!window.PBForms) { viaEmail(); return; }
    if (form.getAttribute('aria-busy') === 'true') return;   // one send per click
    form.setAttribute('aria-busy', 'true');
    PBForms.send(form, F.fields(d, today, location.href)).then(function (ok) {
      form.removeAttribute('aria-busy');
      if (ok) finish('Thanks - we\'ve got it. Damian will be in touch personally.');
      else viaEmail();
    });
  });
  $('pfPrint').addEventListener('click', function () { window.print(); });

  renumber();
})();
