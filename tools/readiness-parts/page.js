/* pension-readiness-check.html, the 60-second readiness check (Run 20 #4).

   The questions, the points and the steps all live in assets/js/readiness.js,
   covered by tests/readiness.test.js. This file builds the five questions for
   the situation chosen, adds up the answers through the module, and paints
   the result. Answers are kept in this page's memory only: nothing is sent,
   stored or put in a link, except the situation itself, which the booking
   form asks anyway, carried as booking.html#persona=... so it arrives
   ticked. */
(function () {
  'use strict';
  var R = window.PBReadiness, P = window.PBPage;
  var form = document.getElementById('rdForm');
  if (!R || !P || !form) return;
  var $ = P.$;
  var answers = {}, persona = null;
  var qsBox = $('rdQs'), err = $('rdErr'), result = $('rdResult');

  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }

  function build() {
    qsBox.textContent = '';
    var qs = R.questions(persona);
    if (!qs) return;
    qs.forEach(function (q, n) {
      var fs = el('fieldset', null, 'rd-q'); fs.id = 'rdQ' + (n + 1);
      fs.appendChild(el('legend', (n + 2) + '. ' + q.text));
      q.options.forEach(function (o) {
        var lab = el('label', null, 'rd-opt');
        var inp = document.createElement('input');
        inp.type = 'radio'; inp.name = 'rd_' + q.key; inp.value = String(o.index);
        if (answers[q.key] === o.index) inp.checked = true;
        inp.addEventListener('change', function () { answers[q.key] = o.index; err.textContent = ''; });
        lab.appendChild(inp); lab.appendChild(el('span', o.label));
        fs.appendChild(lab);
      });
      qsBox.appendChild(fs);
    });
  }

  [].forEach.call(form.querySelectorAll('input[name="rdPersona"]'), function (r) {
    r.addEventListener('change', function () { persona = r.value; err.textContent = ''; build(); });
  });

  function show(s) {
    $('rdN').textContent = s.score;
    $('rdMark').style.left = s.score + '%';
    $('rdZone').innerHTML = '';
    var b = el('b', s.zone.label + '.'); $('rdZone').appendChild(b);
    $('rdZone').appendChild(document.createTextNode(' ' + s.zone.line));
    var list = $('rdMoves'); list.textContent = '';
    s.moves.forEach(function (m) {
      var li = el('li');
      li.appendChild(el('span', '+' + m.points + ' ', 'rd-pts'));
      li.appendChild(document.createTextNode(m.text + ' '));
      var a = el('a', m.link); a.href = m.href;
      if (/^https?:/.test(m.href)) a.rel = 'noopener';
      li.appendChild(a);
      list.appendChild(li);
    });
    list.hidden = !s.moves.length;
    $('rdNone').hidden = !!s.moves.length;
    $('rdBook').href = 'booking.html#persona=' + encodeURIComponent(s.persona);
    form.hidden = true;
    result.hidden = false;
    $('rdH').focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!persona) { err.textContent = 'Pick the situation that sounds most like you first.'; form.querySelector('input[name="rdPersona"]').focus(); return; }
    var s = R.score(persona, answers);
    if (!s.complete) {
      err.textContent = 'Answer every question to see your score. ' + s.missing.length + (s.missing.length === 1 ? ' is' : ' are') + ' still open.';
      var first = R.questions(persona).map(function (q) { return q.key; }).indexOf(s.missing[0]);
      var target = $('rdQ' + (first + 1));
      if (target) target.querySelector('input').focus();
      return;
    }
    show(s);
  });

  $('rdAgain').addEventListener('click', function () {
    result.hidden = true;
    form.hidden = false;
    var checked = form.querySelector('input[name="rdPersona"]:checked') || form.querySelector('input[name="rdPersona"]');
    checked.focus();
  });
})();
