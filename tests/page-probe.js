/* The probes that drive a REAL built page, served into it by tests/run-tests.py.

   A built page is read from disk and served with this file injected before
   </body>, in memory only, and the kind of probe named in the query string:

       state-pension-reality-check.html?probe=page&clock=2026-09-16T12:00:00Z
       state-pension-entitlement.html?probe=page&clock=...
       state-pension-entitlement.html?probe=panel
       pension-calculator.html?probe=drift

   Every probe ends by publishing one <pre id="__result__"> for the parent
   page to collect. The parent, the serving and the reporting are in
   tests/run-tests.py; what a probe asserts is here, where it can be read.

   THE PAGE PROBE (?probe=page) is the test surface the two State Pension
   page scripts never had. It drives the page's own sliders through real
   input events, one event per slider, at the spec's worked examples, and
   reads back what the page wrote, in three tiers:

     A. spec figures, typed in from the worked-example tables by hand, on the
        headline cells. This is the only tier that can catch the module and
        the page agreeing on a wrong number, and it is deliberately asserted
        at rows that are NOT the page's shipped default, because the default
        figures are already in the static markup and prove nothing.
     B. the module's own result, through the page's own formatters
        (window.PBPage), on every sentence cell: the figure in the sentence
        must be the module's figure. The wording is the page's business and
        tests/render-diff owns "the wording did not change".
     C. structure: which panel shows, the sub-panel flags, the bar widths,
        and the exact aria-valuetext of every slider, because a call site
        that loses its wording map silently announces "€66" where the page
        said "66 years".

   Every row of the spec's table is accounted for: driven, skipped with the
   live bound or step that blocks it, or module-only, and the probe asserts
   the three sets add up to the whole table. A skip is a statement, not a
   hole. Which rows are reachable depends on the clock, because the birth
   slider's floor is this year minus 66, so the runner pins the clock (see
   PB_CLOCK there) and the probe asserts the pin took.

   THE PANEL CHECK (?probe=panel) and THE DRIFT CHECK (?probe=drift) are
   older and only moved here from Python strings; their evaluation stays in
   tests/run-tests.py. */
(function () {
  'use strict';

  var q = {};
  location.search.slice(1).split('&').forEach(function (kv) {
    var p = kv.split('=');
    if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
  });
  var PAGE = location.pathname.split('/').pop();

  function publish(out) {
    var pre = document.createElement('pre');
    pre.id = '__result__';
    pre.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(out))));
    document.body.appendChild(pre);
  }

  var $ = function (id) { return document.getElementById(id); };
  var text = function (id) { var el = $(id); return el ? el.textContent : undefined; };

  /* Set a slider the way a reader does: value, then a real input event, one
     per slider, birth before entry on the entitlement page because entry's
     bounds follow birth. Returns what the slider holds afterwards, which the
     row asserts against what it asked for: a value the browser clamped is a
     state the row did not ask for. */
  function setRange(id, v) {
    var el = $(id);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return +el.value;
  }

  /* Every slider step: a count that is not a multiple of the step cannot be
     set, and the click-to-type editor on these pages snaps to the step too. */
  function onStep(id, v) {
    var el = $(id), step = +el.step || 1, min = +el.min || 0;
    return (v - min) % step === 0;
  }
  function inRange(id, v) {
    var el = $(id);
    return v >= +el.min && v <= +el.max;
  }

  // ======================================================= the reality check
  function realityCheck(t) {
    var SP = window.PBStatePension, P = window.PBPage;
    var euro = P.euro, euro2 = P.euro2, num = P.num;
    var YEAR = new Date().getFullYear();
    var pinned = q.clock ? new Date(q.clock).getUTCFullYear() : null;

    t.eq('modules: PBStatePension and PBPage are on the page',
         typeof SP === 'object' && typeof P === 'object', true);
    if (pinned) t.eq('clock: the page read the pinned year ' + pinned, YEAR, pinned);

    /* S9 rows. `drive` rows carry the figures the spec states, typed in by
       hand; the rest of what the page shows is checked against the module. */
    var ROWS = [
      { rows: '1, 7, 8, 9, 10', contribs: 2080, age: 40,
        weekly: '€299.30', annual: '€15,564',
        gaps: { modest: ['81%', '€3,636 a year', '€303 a month'],
                moderate: ['56%', '€12,036 a year', '€1,003 a month'],
                comfortable: ['46%', '€18,036 a year', '€1,503 a month'] } },
      { rows: '2, 11', contribs: 1560, age: 40,
        weekly: '€224.48', annual: '€11,673',
        gaps: { comfortable: ['35%', '€21,927 a year', '€1,827 a month'] } },
      { rows: '5', contribs: 520, age: 40, weekly: '€74.83', annual: '€3,891' },
      { rows: '4', contribs: 0, age: 40, none: true, shortBy: '520' },
      { rows: '17 exact at 58', contribs: 2080, age: 58, status: 'exact' },
      { rows: '17 exact at 57', contribs: 2080, age: 57, status: 'exact' },
      { rows: '17 floor at 58', contribs: 1560, age: 58, status: 'floor' },
      { rows: '17 rate at 57', contribs: 1560, age: 57, status: 'rate' },
      { rows: '14 at 66', contribs: 2080, age: 66, atAge: true },
      // rows the sliders cannot reach today; driven if they ever can be
      { rows: '3', contribs: 519, age: 40, none: true, shortBy: '1' },
      { rows: '6', contribs: 2500, age: 40, weekly: '€299.30', annual: '€15,564' }
    ];
    var MODULE_ONLY = { '13': 'the three target figures are constants, asserted in the suite',
                        '15': 'transition() by year has no control on this page',
                        '16': 'earliestDrawdownYear() is reached through row 17' };
    // row 12, a covered standard, is unreachable by arithmetic: the maximum
    // annual figure is below the lowest standard, so it is asserted the other
    // way round on every driven state, below
    var accounted = {};
    function account(rows) {
      rows.split(',').forEach(function (r) { accounted[r.trim().split(' ')[0]] = 1; });
    }
    Object.keys(MODULE_ONLY).forEach(account);
    accounted['12'] = 1;

    ROWS.forEach(function (row) {
      account(row.rows);
      var label = 'S9 row ' + row.rows;
      var blocked = [];
      if (!onStep('contribs', row.contribs)) blocked.push(row.contribs + ' is not on the contribs step of ' + $('contribs').step);
      if (!inRange('contribs', row.contribs)) blocked.push(row.contribs + ' is outside contribs ' + $('contribs').min + ' to ' + $('contribs').max);
      if (!inRange('age', row.age)) blocked.push(row.age + ' is outside age ' + $('age').min + ' to ' + $('age').max);
      if (blocked.length) { t.skip(label, blocked.join('; ')); return; }

      var got = [setRange('contribs', row.contribs), setRange('age', row.age)];
      t.eq(label + ': the sliders took contribs ' + row.contribs + ' and age ' + row.age,
           got.join('/'), row.contribs + '/' + row.age);

      var res = SP.statePension(row.contribs);
      var years = row.contribs / 52;

      // C. the sliders announce the page's wording, exactly
      t.eq(label + ': contribs aria-valuetext', $('contribs').getAttribute('aria-valuetext'),
           num(row.contribs) + ' reckonable contributions, ' + years + ' years');
      t.eq(label + ': age aria-valuetext', $('age').getAttribute('aria-valuetext'), row.age + ' years old');
      t.eq(label + ': contribsV', text('contribsV'), num(row.contribs));
      t.eq(label + ': ageV', text('ageV'), String(row.age));

      // C. one panel
      t.eq(label + ': the eligible panel shows iff eligible', !$('spHas').hidden, res.eligible);
      t.eq(label + ': the no-entitlement panel shows iff not', !$('spNone').hidden, !res.eligible);

      var toGo = SP.yearsUntilPensionAge(row.age);
      if (row.atAge) {
        t.has(label + ': ageNote says at or past 66', text('ageNote'), 'You are at or past 66.');
      } else {
        t.has(label + ': ageNote counts the years to 66', text('ageNote'), 'You have ' + toGo + ' years until 66.');
      }

      if (res.eligible) {
        // A. the spec's figures, where the row states them
        if (row.weekly) t.eq(label + ': weekly, the spec figure', text('spWeekly'), row.weekly);
        if (row.annual) t.eq(label + ': annual, the spec figure', text('spAnnual'), row.annual);
        // B. and the module's, through the page's formatters, always
        t.eq(label + ': weekly is the module figure', text('spWeekly'), euro2(res.weekly));
        t.eq(label + ': annual is the module figure', text('spAnnual'), euro(res.annual));
        if (res.fraction === 1) {
          t.has(label + ': spFoot names the full record', text('spFoot'), 'The maximum rate, which takes a full 2,080 reckonable contributions, or forty years.');
        } else {
          var pctOfMax = Math.round(res.fraction * 100);
          t.has(label + ': spFoot carries the count', text('spFoot'), num(row.contribs) + ' contributions is ' + years + ' years');
          t.has(label + ': spFoot carries the percentage', text('spFoot'), pctOfMax + '% of a full record, so the rate is ' + pctOfMax + '% of the maximum');
        }
        // exact, floor or rate is still the module's decision and the spec rows
        // still carry it; the page stopped wording it on 2026-09-20 (the
        // caveat sentence under the result was removed, Damian's call), so
        // nothing on the page is asserted for it any more
        var status = SP.floorStatus(res, row.age, YEAR);
        if (row.status) t.eq(label + ': the module status is the one the spec expects', status, row.status);

        t.has(label + ': lsIntro', text('lsIntro'), 'The bar shows how much of each one the State Pension covers.');
        var gaps = SP.gaps(res.annualCents);
        gaps.forEach(function (g) {
          var rowEl = document.querySelector('.lsrow[data-std="' + g.standard + '"]');
          var covered = Math.max(0, Math.min(1, res.annualCents / g.targetCents));
          var gap = rowEl.querySelector('.lsgap').textContent;
          // the page writes the raw proportion and the browser serialises it
          // back to six significant digits, so compare within a thousandth
          var width = parseFloat(rowEl.querySelector('.lsbar i').style.width);
          t.eq(label + ': ' + g.standard + ' bar width is the covered share, ' + (Math.round(covered * 10000) / 100) + '%',
               Math.abs(width - covered * 100) < 0.001, true);
          t.eq(label + ': ' + g.standard + ' is never covered (row 12: the maximum is below every standard)',
               rowEl.classList.contains('is-covered'), false);
          t.has(label + ': ' + g.standard + ' gap carries the percentage', gap, 'covers ' + Math.round(covered * 100) + '%');
          t.has(label + ': ' + g.standard + ' gap carries the module\'s year figure', gap, euro(g.gapAnnual) + ' a year');
          t.has(label + ': ' + g.standard + ' gap carries the module\'s month figure', gap, euro(g.gapMonthly) + ' a month');
          if (row.gaps && row.gaps[g.standard]) {
            row.gaps[g.standard].forEach(function (needle) {
              t.has(label + ': ' + g.standard + ' gap, the spec figure ' + needle, gap, needle);
            });
          }
        });
        var sr = text('srSummary');
        t.has(label + ': srSummary carries the weekly figure', sr, 'State Pension ' + euro2(res.weekly) + ' a week, ' + euro(res.annual) + ' a year.');
        t.has(label + ': srSummary carries the three gaps', sr,
              'modest standard of living that is ' + euro(gaps[0].gapAnnual) + ' a year short, moderate ' +
              euro(gaps[1].gapAnnual) + ' short, comfortable ' + euro(gaps[2].gapAnnual) + ' short.');
      } else {
        t.has(label + ': spNoneFoot carries the count', text('spNoneFoot'), num(row.contribs) + ' contributions is ' + years + ' years');
        t.has(label + ': spNoneFoot carries the shortfall', text('spNoneFoot'), num(res.shortBy) + ' more would bring the total to 520');
        if (row.shortBy) t.has(label + ': the spec shortfall', text('spNoneFoot'), row.shortBy + ' more would bring');
        t.has(label + ': lsIntro says nothing is covered', text('lsIntro'), 'With no Contributory entitlement, none of these is covered by it.');
        SP.gaps(0).forEach(function (g) {
          var rowEl = document.querySelector('.lsrow[data-std="' + g.standard + '"]');
          t.eq(label + ': ' + g.standard + ' bar is empty', rowEl.querySelector('.lsbar i').style.width, '0%');
          t.has(label + ': ' + g.standard + ' gap is the whole target', rowEl.querySelector('.lsgap').textContent,
                'You would need ' + euro(g.target) + ' a year from somewhere else.');
        });
        t.has(label + ': srSummary says there is no entitlement', text('srSummary'),
              'With ' + num(row.contribs) + ' reckonable contributions there is no State Pension (Contributory) entitlement. ' +
              num(res.shortBy) + ' more contributions would bring the total to 520. Qualifying needs 520 paid contributions.');
      }
    });

    var all = [];
    for (var i = 1; i <= 17; i++) all.push(String(i));
    var missing = all.filter(function (r) { return !accounted[r]; });
    t.eq('S9: every row is driven, skipped with a reason, or named module-only', missing.join(','), '');
  }

  // ======================================================= the entitlement check
  function entitlementCheck(t) {
    var SP = window.PBStatePension, ENT = window.PBEntitlement, P = window.PBPage;
    var euro = P.euro, euro2 = P.euro2, num = P.num, yr = P.yr, pct = P.pct;
    var euro2c = function (c) { return euro2(c / 100); };
    var AGE = SP.PENSION_AGE;
    var YEAR = new Date().getFullYear();
    var pinned = q.clock ? new Date(q.clock).getUTCFullYear() : null;

    t.eq('modules: PBStatePension, PBEntitlement and PBPage are on the page',
         typeof SP === 'object' && typeof ENT === 'object' && typeof P === 'object', true);
    if (pinned) {
      t.eq('clock: the page read the pinned year ' + pinned, YEAR, pinned);
      // the pin is only observable through a bound the page derives from it
      t.eq('clock: the birth floor follows the pinned year', +$('birth').min, pinned - AGE);
    }

    var bandLabel = function (b) { return b.max === null ? b.min + ' or over' : b.min + ' to ' + b.max; };

    /* S8 rows. drawdown = birth + 66, as the page works it out. The figures
       are the spec's, typed in; `basis` and the sentences are asserted
       against the module. */
    var ROWS = [
      { row: '1', birth: 1960, entry: 1986, paid: 2080, credited: 0, hc: 0,
        weekly: '€299.30', annual: '€15,564', m1: '€299.30', m2: '€299.30', basis: 'tie' },
      { row: '2', birth: 1962, entry: 1985, paid: 1560, credited: 260, hc: 0,
        weekly: '€280.86', annual: '€14,605', m1: '€261.89', m2: '€280.86', basis: 'method2', gain: '€18.97',
        average: 42, years: 43, band: '40 to 47', bandRate: '€293.50', mix: [60, 40],
        note: 'the shipped default: these figures are in the static markup, so this row proves the least' },
      { row: '3', birth: 1964, entry: 1990, paid: 1040, credited: 0, hc: 780,
        weekly: '€261.89', annual: '€13,618', m1: '€261.89', m2: '€259.05', basis: 'method1',
        average: 26, years: 40, band: '20 to 29', bandRate: '€254.80', mix: [40, 60] },
      { row: '8 eligible over exactly ten years', birth: 1960, entry: 2016, paid: 520, credited: 0, hc: 0,
        m1: '€74.83', average: 52, years: 10 },
      { row: '8 one year more than fits', birth: 1960, entry: 2016, paid: 572, credited: 0, hc: 0,
        inconsistent: true, maxForYears: '520' },
      { row: '8 over nine years', birth: 1960, entry: 2017, paid: 520, credited: 0, hc: 0,
        inconsistent: true, maxForYears: '468' },
      { row: '9', birth: 1964, entry: 1990, paid: 1040, credited: 780, hc: 0,
        weekly: '€252.09', annual: '€13,109', m1: '€224.48', m2: '€252.09', basis: 'method2', gain: '€27.61',
        average: 46, years: 40, band: '40 to 47', bandRate: '€293.50', mix: [40, 60], capBit: true, extras: '520 of your 780' },
      { row: '10', birth: 1960, entry: 1986, paid: 520, credited: 520, hc: 1040,
        weekly: '€248.74', m1: '€224.48', m2: '€248.74', basis: 'method2',
        average: 26, years: 40, band: '20 to 29', bandRate: '€254.80', mix: [80, 20], capBit: true, extras: '1,040 of your 1,560' },
      { row: '11', birth: 1986, entry: 2004, paid: 1560, credited: 0, hc: 0,
        weekly: '€224.48', m1: '€224.48', basis: 'method1', after: true },
      { row: '13', birth: 1962, entry: 1985, paid: 468, credited: 260, hc: 0, none: true, shortBy: '52' },
      { row: '14 second case', birth: 1960, entry: 2000, paid: 1560, credited: 0, hc: 0,
        inconsistent: true, maxForYears: '1,352' },
      { row: '15', birth: 1967, entry: 1985, paid: 1560, credited: 260, hc: 0,
        weekly: '€262.61', m1: '€261.89', m2: '€262.61', basis: 'method2', gain: '€0.72',
        average: 38, years: 48, band: '30 to 39', bandRate: '€269.10', mix: [10, 90] },
      { row: '16', birth: 1960, entry: 1976, paid: 2080, credited: 0, hc: 0,
        weekly: '€299.30', m1: '€299.30', m2: '€294.66', basis: 'method1',
        average: 42, years: 50, band: '40 to 47', bandRate: '€293.50', mix: [80, 20] },
      { row: '22', birth: 1960, entry: 1986, paid: 2080, credited: 0, hc: 1040,
        weekly: '€299.30', annual: '€15,564', m1: '€299.30', m2: '€299.30', basis: 'tie', capped: '3,120' },
      // rows the sliders cannot reach today; driven if they ever can be
      { row: '4', birth: 1960, entry: 1970, paid: 520, credited: 0, hc: 0, m1: '€74.83', below10: true },
      { row: '5', birth: 1960, entry: 1986, paid: 1900, credited: 0, hc: 0, average: 48, years: 40 },
      { row: '6', birth: 1960, entry: 1986, paid: 1896, credited: 0, hc: 0, average: 47, years: 40 },
      { row: '7', birth: 1960, entry: 1966, paid: 570, credited: 0, hc: 0, average: 10, years: 60 },
      { row: '12', birth: 1958, entry: 1990, paid: 1560, credited: 0, hc: 0 },
      { row: '14 first case', birth: 1960, entry: 2026, paid: 520, credited: 0, hc: 0, inconsistent: true, maxForYears: '0' }
    ];
    var MODULE_ONLY = { '17': 'band() at every boundary has no page state',
                        '18': 'the share of every transition year is reached through the years, not a control',
                        '19': 'the interface itself',
                        '20': 'coercion of missing fields',
                        '21': 'the sweep of the whole input space' };
    var accounted = {};
    Object.keys(MODULE_ONLY).forEach(function (r) { accounted[r] = 1; });

    function drive(row) {
      accounted[row.row.split(' ')[0]] = 1;
      var label = 'S8 row ' + row.row;
      var drawdown = row.birth + AGE;
      var blocked = [];
      if (!inRange('birth', row.birth)) {
        blocked.push('birth ' + row.birth + ' is outside the slider ' + $('birth').min + ' to ' + $('birth').max + ' (drawdown ' + drawdown + ')');
      } else {
        // entry's bounds follow birth, so ask the page for them
        setRange('birth', row.birth);
        if (!inRange('entry', row.entry)) {
          blocked.push('entry ' + row.entry + ' is outside ' + $('entry').min + ' to ' + $('entry').max + ' for a birth year of ' + row.birth);
        }
      }
      [['paid', row.paid], ['credited', row.credited], ['homecaring', row.hc]].forEach(function (c) {
        if (!onStep(c[0], c[1])) blocked.push(c[1] + ' is not on the ' + c[0] + ' step of ' + $(c[0]).step);
        if (!inRange(c[0], c[1])) blocked.push(c[1] + ' is outside ' + c[0] + ' ' + $(c[0]).min + ' to ' + $(c[0]).max);
      });
      if (blocked.length) { t.skip(label, blocked.join('; ')); return; }

      var got = [setRange('birth', row.birth), setRange('entry', row.entry), setRange('paid', row.paid),
                 setRange('credited', row.credited), setRange('homecaring', row.hc)];
      var want = [row.birth, row.entry, row.paid, row.credited, row.hc];
      t.eq(label + ': the five sliders took birth/entry/paid/credited/homecaring ' + want.join('/'),
           got.join('/'), want.join('/'));

      var res = ENT.entitlement({ paid: row.paid, credited: row.credited, homeCaring: row.hc,
                                  entryYear: row.entry, drawdownYear: drawdown });

      // C. the sliders announce the page's wording, exactly
      t.eq(label + ': birth aria-valuetext', $('birth').getAttribute('aria-valuetext'),
           'born in ' + yr(row.birth) + ', reaching 66 in ' + yr(drawdown));
      t.eq(label + ': entry aria-valuetext', $('entry').getAttribute('aria-valuetext'),
           'first paid PRSI in the ' + yr(row.entry) + ' contribution year');
      t.eq(label + ': paid aria-valuetext', $('paid').getAttribute('aria-valuetext'),
           num(row.paid) + ' paid contributions, ' + (row.paid / 52) + ' years');
      t.eq(label + ': credited aria-valuetext', $('credited').getAttribute('aria-valuetext'),
           num(row.credited) + ' credited contributions, ' + (row.credited / 52) + ' years');
      t.eq(label + ': homecaring aria-valuetext', $('homecaring').getAttribute('aria-valuetext'),
           num(row.hc) + ' HomeCaring Periods, ' + (row.hc / 52) + ' years');
      t.eq(label + ': the five value cells', [text('birthV'), text('entryV'), text('paidV'), text('creditedV'), text('homecaringV')].join('|'),
           [yr(row.birth), yr(row.entry), num(row.paid), num(row.credited), num(row.hc)].join('|'));

      // the birth note turns on the transition window
      if (SP.transition(drawdown) === 'after') {
        t.has(label + ': birthNote says the transition has ended', text('birthNote'),
              'You reach 66 in ' + yr(drawdown) + ', after the transition ends in ' + yr(SP.TRANSITION_LAST) + ', so only the Total Contributions Approach applies.');
      } else {
        t.has(label + ': birthNote names the drawdown year', text('birthNote'),
              'You reach 66 in ' + yr(drawdown) + ', the year this page assumes your pension starts.');
      }
      t.has(label + ': entryNote carries the April rule', text('entryNote'), 'Before 2002 the contribution year ran from April to April.');
      t.eq(label + ': entryNote reports no clamp when entry was set last', text('entryNote').indexOf('Moved to'), -1);

      // C. exactly one panel
      var shown = ['spHas', 'spNone', 'spUnfit'].filter(function (id) { return !$(id).hidden; });
      var expectPanel = { eligible: 'spHas', 'no-entitlement': 'spNone', inconsistent: 'spUnfit' }[res.state];
      t.eq(label + ': the module state is what the spec expects', res.state,
           row.none ? 'no-entitlement' : row.inconsistent ? 'inconsistent' : 'eligible');
      t.eq(label + ': exactly the panel for the state shows', shown.join('+'), expectPanel);

      if (res.state === 'no-entitlement') {
        var nf = text('spNoneFoot');
        t.has(label + ': spNoneFoot carries the paid count and shortfall', nf,
              'With ' + num(res.paid) + ' paid you would need ' + num(res.paidShortBy) + ' more to qualify.');
        if (row.shortBy) t.has(label + ': the spec shortfall', nf, 'need ' + row.shortBy + ' more');
        t.has(label + ': srSummary', text('srSummary'),
              'With ' + num(res.paid) + ' paid contributions there is no State Pension (Contributory) entitlement. ' +
              num(res.paidShortBy) + ' more paid contributions would be needed to qualify.');
        return;
      }
      if (res.state === 'inconsistent') {
        var uf = text('spUnfitFoot');
        var fit = num(res.entered) + ' paid and credited contributions is more than the ' + num(res.maxForYears) +
                  ' that fit between ' + yr(row.entry) + ' and the end of ' + yr(drawdown - 1) + ' at 52 a year.';
        t.has(label + ': spUnfitFoot says what does not fit', uf, fit);
        if (row.maxForYears) t.has(label + ': the spec maximum for the years', uf, 'more than the ' + row.maxForYears + ' that fit');
        t.has(label + ': srSummary', text('srSummary'), 'These details do not fit together. ' + fit);
        return;
      }

      var tca = res.tca, ya = res.yearlyAverage, m2 = res.method2, award = res.award;
      // A. the spec's figures
      if (row.weekly) t.eq(label + ': weekly, the spec figure', text('spWeekly'), row.weekly);
      if (row.annual) t.eq(label + ': annual, the spec figure', text('spAnnual'), row.annual);
      if (row.m1) t.eq(label + ': Method 1, the spec figure', text('m1Rate'), row.m1 + ' a week');
      if (row.m2) t.eq(label + ': Method 2, the spec figure', text('m2Rate'), row.m2 + ' a week');
      if (row.basis) t.eq(label + ': the basis the spec expects', award.basis, row.basis);
      if (row.average !== undefined) t.eq(label + ': the yearly average the spec works out', ya.average, row.average);
      if (row.years !== undefined) t.eq(label + ': over the years the spec counts', ya.years, row.years);
      // B. the module's figures, through the page's formatters
      t.eq(label + ': weekly is the award', text('spWeekly'), euro2(award.weekly));
      t.eq(label + ': annual is the award', text('spAnnual'), euro(award.annual));
      t.eq(label + ': Method 1 is the module\'s', text('m1Rate'), euro2(tca.weekly) + ' a week');
      var starting = 'for a pension starting in ' + yr(res.drawdownYear);
      t.has(label + ': spFoot names the basis', text('spFoot'),
            award.basis === 'tie' ? 'Both calculations give this figure, ' + starting + '.'
            : 'Worked out under the ' + (award.basis === 'method2' ? 'Yearly Average blend' : 'Total Contributions Approach') + ', ' + starting + '.');
      if (tca.capped) {
        t.has(label + ': m1Detail says the record is over a full one', text('m1Detail'),
              num(tca.reckonable) + ' reckonable contributions, more than a full record of 2,080, so the maximum rate.');
        if (row.capped) t.has(label + ': the spec reckonable count', text('m1Detail'), row.capped + ' reckonable');
      } else {
        t.has(label + ': m1Detail carries the reckonable count and the fraction', text('m1Detail'),
              num(tca.reckonable) + ' reckonable contributions, ' + pct(tca.fraction) + ' of a full record of 2,080.');
      }
      t.eq(label + ': the cap note shows iff a TCA cap bit', !$('m1Cap').hidden, tca.capBit);
      if (row.capBit !== undefined) t.eq(label + ': capBit as the spec expects', tca.capBit, row.capBit);
      if (tca.capBit) {
        t.has(label + ': m1Cap counts the extras', text('m1Cap'),
              num(tca.extrasCounted) + ' of your ' + num(res.credited + res.homeCaring) + ' credits and HomeCaring Periods count; the rest are over the caps.');
        if (row.extras) t.has(label + ': the spec extras count', text('m1Cap'), row.extras);
      }

      var hasM2 = !m2.reason;
      t.eq(label + ': the Method 2 row shows iff there is a Method 2 figure', !$('m2Row').hidden, hasM2);

      /* The two bars measure the two rates against the maximum personal rate.
         style.width reads back at six significant digits, so these compare as
         numbers, not as strings. The amber tail belongs to whichever method is
         lower and to neither when only one applies or the two agree, which is
         the same verdict the closing sentence states in words. */
      var widthPct = function (id) { return parseFloat($(id).style.width); };
      var onScale = function (cents) { return cents / SP.MAX_WEEKLY_CENTS * 100; };
      t.eq(label + ': the Method 1 bar is its rate against the maximum',
           Math.round(widthPct('m1Fill') * 1000) / 1000, Math.round(onScale(tca.weeklyCents) * 1000) / 1000);
      if (hasM2) {
        t.eq(label + ': the Method 2 bar is its rate against the maximum',
             Math.round(widthPct('m2Fill') * 1000) / 1000, Math.round(onScale(m2.weeklyCents) * 1000) / 1000);
      }
      var lowC = hasM2 ? Math.min(tca.weeklyCents, m2.weeklyCents) : tca.weeklyCents;
      var highC = hasM2 ? Math.max(tca.weeklyCents, m2.weeklyCents) : tca.weeklyCents;
      var tail = highC > lowC ? (tca.weeklyCents < m2.weeklyCents ? 'm1' : 'm2') : null;
      var paidRow = { m1: res.award.basis !== 'method2', m2: hasM2 && res.award.basis !== 'method1' };
      ['m1', 'm2'].forEach(function (m) {
        t.eq(label + ': the amber tail is on ' + m + ' only when ' + m + ' is the lower of the two',
             !$(m + 'Gap').hidden, tail === m);
        if (tail === m) {
          t.eq(label + ': the tail starts at the lower rate',
               Math.round(parseFloat($(m + 'Gap').style.left) * 1000) / 1000,
               Math.round(onScale(lowC) * 1000) / 1000);
          t.eq(label + ': the tail spans the difference between the two',
               Math.round(widthPct(m + 'Gap') * 1000) / 1000,
               Math.round(onScale(highC - lowC) * 1000) / 1000);
          t.eq(label + ': the tail is labelled with that difference',
               text(m + 'Lab'), euro2c(highC - lowC));
        } else if (paidRow[m]) {
          t.eq(label + ': ' + m + ' is labelled as the one the Department pays',
               text(m + 'Lab'), 'Paid');
          t.eq(label + ': the paid label sits at that method\'s own rate',
               Math.round(parseFloat($(m + 'Lab').style.left) * 1000) / 1000,
               Math.round(onScale(m === 'm1' ? tca.weeklyCents : m2.weeklyCents) * 1000) / 1000);
        } else {
          t.eq(label + ': ' + m + ' carries no label when it is neither paid nor short', $(m + 'Lab').hidden, true);
        }
      });
      t.has(label + ': the scale is named as the maximum personal rate', text('mScale'),
            'The maximum personal rate is ' + euro2c(SP.MAX_WEEKLY_CENTS) + ' a week.');
      t.eq(label + ': the closing sentence shows with it', !$('mClose').hidden, hasM2);
      t.eq(label + ': the reason shows instead when there is none', !$('mWhy').hidden, !hasM2);
      if (row.after) t.eq(label + ': the spec expects no Method 2, after the transition', m2.reason, 'after-transition');
      if (row.below10) t.eq(label + ': the spec expects no Method 2, average below 10', m2.reason, 'yearly-average-below-10');

      if (hasM2) {
        t.has(label + ': bothSub names the last year of both calculations', text('bothSub'),
              'Until the end of ' + yr(SP.TRANSITION_LAST) + ' the Department works the rate out both ways and pays the higher.');
        t.eq(label + ': Method 2 is the module\'s', text('m2Rate'), euro2(m2.weekly) + ' a week');
        var d = text('m2Detail');
        t.has(label + ': m2Detail carries the average over the years', d,
              'A yearly average of ' + ya.average + ' over ' + ya.years + ' years, ' + yr(res.entryYear) + ' to ' + yr(res.drawdownYear - 1));
        t.has(label + ': m2Detail carries the band and its rate', d,
              'falls in the ' + bandLabel(ya.band) + ' band at ' + euro2c(ya.band.weeklyCents) + ' a week.');
        t.has(label + ': m2Detail carries the mix', d, 'the mix is ' + m2.yaShare + '% of that rate and ' + m2.tcaShare + '% of the Total Contributions Approach rate.');
        if (row.band) t.has(label + ': the spec band', d, 'the ' + row.band + ' band at ' + row.bandRate + ' a week');
        if (row.mix) t.has(label + ': the spec mix', d, 'the mix is ' + row.mix[0] + '% of that rate and ' + row.mix[1] + '%');
        var close = text('mClose');
        if (award.basis === 'method2') {
          t.has(label + ': mClose names the gain', close,
                'The Department pays the higher. That is ' + euro2(award.weekly) + ', ' + euro2(award.gain) + ' a week more than the Total Contributions Approach alone.');
          if (row.gain) t.has(label + ': the spec gain', close, row.gain + ' a week more');
        } else if (award.basis === 'tie') {
          t.has(label + ': mClose says both give the same figure', close, 'Both calculations give the same figure. At a full record the Total Contributions Approach already gives the maximum.');
        } else if (res.homeCaring > 0) {
          t.has(label + ': mClose explains HomeCaring under TCA only', close, 'That is the Total Contributions Approach figure. Your HomeCaring Periods count under it and not under Yearly Average.');
        } else {
          t.has(label + ': mClose explains the lower blend', close,
                'A yearly average of ' + ya.average + ' over ' + ya.years + ' years falls in the ' + bandLabel(ya.band) + ' band, and the blend of that band\'s rate with the TCA rate comes to less.');
        }
        var sr = text('srSummary');
        t.has(label + ': srSummary carries the award', sr, 'State Pension (Contributory) ' + euro2(award.weekly) + ' a week, ' + euro(award.annual) + ' a year, ');
        t.has(label + ': srSummary names the other figure', sr,
              award.basis === 'tie' ? 'and both calculations give this figure.'
              : award.basis === 'method2' ? 'under the Yearly Average blend. The Total Contributions Approach alone gives ' + euro2(tca.weekly) + '.'
              : 'under the Total Contributions Approach. The Yearly Average blend gives ' + euro2(m2.weekly) + '.');
      } else {
        t.has(label + ': bothSub says one calculation applies', text('bothSub'), 'Only one calculation applies to these details.');
        t.has(label + ': mWhy gives the reason', text('mWhy'),
              m2.reason === 'after-transition'
                ? 'You reach 66 in ' + yr(res.drawdownYear) + ', after the transition ends in ' + yr(SP.TRANSITION_LAST) + '. Only the Total Contributions Approach applies, so on the contributions entered this is your rate.'
                : 'Your yearly average is ' + ya.average + ' over ' + ya.years + ' years. Below 10 the Yearly Average method gives nothing');
        t.has(label + ': srSummary says only the TCA applies', text('srSummary'),
              'State Pension (Contributory) ' + euro2(award.weekly) + ' a week, ' + euro(award.annual) + ' a year. Only the Total Contributions Approach applies.');
      }
    }

    ROWS.forEach(drive);

    /* The birth-to-entry clamp, spec S2 coupled bounds: moving the birth year
       can push the entry year outside its bounds, and the page clamps it and
       says so until the entry slider is next touched. The panel check sets
       entry's bounds directly and never goes through this; here the birth
       slider is moved through its own input event. */
    if (inRange('birth', 1960) && inRange('birth', 2008)) {
      setRange('birth', 1960); setRange('entry', 1976);
      var after = setRange('birth', 2008);
      t.eq('clamp: birth moved to 2008', after, 2008);
      t.eq('clamp: entry was pulled up to the earliest year for that birth', +$('entry').value, 2024);
      t.has('clamp: entryNote says it moved to the earliest', text('entryNote'), 'Moved to 2024, the earliest it can be for that birth year.');
      t.eq('clamp: entryV follows', text('entryV'), '2024');
      setRange('entry', 2026);
      t.eq('clamp: the note clears once entry is touched', text('entryNote').indexOf('Moved to'), -1);
      setRange('birth', 1960);
      t.eq('clamp: entry was pulled down to the latest year for a 1960 birth', +$('entry').value, 2025);
      t.has('clamp: entryNote says it moved to the latest', text('entryNote'), 'Moved to 2025, the latest it can be for that birth year.');
    } else {
      t.skip('clamp: birth 1960 and 2008 both on the slider', 'the slider runs ' + $('birth').min + ' to ' + $('birth').max);
    }

    var all = [];
    for (var i = 1; i <= 22; i++) all.push(String(i));
    var missing = all.filter(function (r) { return !accounted[r]; });
    t.eq('S8: every row is driven, skipped with a reason, or named module-only', missing.join(','), '');
  }

  // ======================================================= the panel check
  function panelCheck() {
    var PANELS = ['spHas', 'spNone', 'spUnfit', 'spBefore'];
    var present = PANELS.filter(function (id) { return !!$(id); });
    var b = $('birth');
    var lo = +b.min, hi = +b.max, YEAR = new Date().getFullYear();
    var AGE = window.PBStatePension.PENSION_AGE;
    var COUNTS = [[0,0,0], [468,260,0], [520,0,0], [1560,260,0], [2600,1040,1040]];
    var states = {}, shown = {}, errors = [], renders = 0;
    for (var birth = lo; birth <= hi; birth++) {
      var emin = birth + 16, emax = Math.min(YEAR, birth + AGE - 1);
      var entries = [emin, Math.floor((emin + emax) / 2), emax];
      for (var e = 0; e < entries.length; e++) {
        for (var c = 0; c < COUNTS.length; c++) {
          $('birth').value = birth;
          var en = $('entry');
          en.min = emin; en.max = emax; en.value = entries[e];
          $('paid').value = COUNTS[c][0];
          $('credited').value = COUNTS[c][1];
          $('homecaring').value = COUNTS[c][2];
          var before = window.__errs.length;
          try {
            $('paid').dispatchEvent(new Event('input', { bubbles: true }));
          } catch (err) {
            window.__errs.push((err && err.message) || String(err));
          }
          if (window.__errs.length > before) {
            errors.push(birth + '/' + entries[e] + '/' + c + ': ' + window.__errs[window.__errs.length - 1]);
          }
          renders++;
          states[window.PBEntitlement.entitlement({
            paid: COUNTS[c][0], credited: COUNTS[c][1], homeCaring: COUNTS[c][2],
            entryYear: entries[e], drawdownYear: birth + AGE
          }).state] = 1;
          shown[present.filter(function (id) { return !$(id).hidden; }).join('+') || '(none)'] = 1;
        }
      }
    }
    return { kind: 'panel', data: {
      birthMin: lo, birthMax: hi, renders: renders,
      panelsInPage: present, statesReachable: Object.keys(states).sort(),
      panelsShown: Object.keys(shown).sort(),
      errorCount: errors.length, errors: errors.slice(0, 5)
    } };
  }

  // ======================================================= the drift check
  function driftCheck() {
    var CASES = JSON.parse(q.cases || '[]');
    function flush() { if (typeof anims === 'object') { for (var k in anims) { anims[k].cur = anims[k].target; } } }
    var rows = [];
    CASES.forEach(function (c) {
      setRange('age', c[0]); setRange('earn', c[1]); setRange('mine', c[2]);
      var btn = $(c[3] === 40 ? 't40' : 't20'); if (btn) btn.click();
      flush();
      var txt = text('reliefOut');
      var m = txt.match(/covers the other €([\d,]+)/);
      rows.push({ age: c[0], earn: c[1], monthly: c[2], rate: c[3],
                  pageRelief: m ? Number(m[1].replace(/,/g, '')) : null });
    });
    return { kind: 'drift', rows: rows, errors: window.__errs };
  }

  window.addEventListener('load', function () {
    if (q.probe === 'panel') return publish(panelCheck());
    if (q.probe === 'drift') return publish(driftCheck());
    var H = window.PBTest;
    if (!H) return publish({ kind: 'page', page: PAGE, error: 'tests/harness.js is not on the page' });
    var t = H.suite('page ' + PAGE);
    if (PAGE === 'state-pension-reality-check.html') realityCheck(t);
    else if (PAGE === 'state-pension-entitlement.html') entitlementCheck(t);
    else t.fail('no page probe for ' + PAGE, 'the probe knows the two State Pension pages');
    publish({ kind: 'page', page: PAGE, clock: q.clock || null, report: H.report(), errors: H.errors() });
  });
}());
