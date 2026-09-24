/* Acceptance tests for the 60-second readiness check.
   Contract: the header of assets/js/readiness.js.

   Runs BOTH ways with no build step:
       node tests/readiness.test.js
       python3 tests/run-tests.py readiness      (headless Chrome)

   Beyond the arithmetic, these hold the check to what its header promises:
   every question worth 20, a score from 0 to 100, nothing scored for things
   out of the reader's hands, and every lost point handed back as a step. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('readiness');
  var eq = t.eq, has = t.has, group = t.group;

  var R = isNode ? require('../assets/js/readiness.js') : root.PBReadiness;

  function all(persona, index) {
    var a = {};
    R.questions(persona).forEach(function (q) { a[q.key] = index; });
    return a;
  }

  group('1  three situations, the booking form\'s three');
  eq('1. tracker, starter, director', R.PERSONAS.map(function (p) { return p.key; }).join(' '), 'tracker starter director');
  eq('1. an unknown situation has no questions', R.questions('pilot'), null);
  eq('1. and no score', R.score('pilot', {}), null);

  group('2  five questions each, every one worth 20');
  R.PERSONAS.forEach(function (p) {
    var qs = R.questions(p.key);
    eq('2. ' + p.key + ': five questions', qs.length, 5);
    eq('2. ' + p.key + ': the best answers make 100', qs.reduce(function (s, q) {
      return s + Math.max.apply(null, q.options.map(function (o) { return o.points; })); }, 0), 100);
    eq('2. ' + p.key + ': every question can score 0 or 20', qs.every(function (q) {
      var pts = q.options.map(function (o) { return o.points; });
      return pts.indexOf(20) >= 0 && Math.min.apply(null, pts) >= 0 && Math.max.apply(null, pts) === 20;
    }), true);
  });
  eq('2. everyone is asked about the State Pension record', R.PERSONAS.every(function (p) { return R.SETS[p.key].indexOf('statePension') >= 0; }), true);
  eq('2. and about a figure to aim for', R.PERSONAS.every(function (p) { return R.SETS[p.key].indexOf('target') >= 0; }), true);

  group('3  the ends of the scale');
  var top = R.score('tracker', all('tracker', 0));
  eq('3. all the best answers: 100', top.score, 100);
  eq('3. in good shape', top.zone.key, 'good');
  eq('3. nothing left to move', top.moves.length, 0);
  var bottom = R.score('starter', { paying: 2, employer: 1, relief: 2, statePension: 1, target: 2 });
  eq('3. all the lowest answers: 0', bottom.score, 0);
  eq('3. early days', bottom.zone.key, 'early');
  eq('3. a step for every question', bottom.moves.length, 5);

  group('4  zones, at their edges');
  eq('4. 39 is early days', R.zone(39).key, 'early');
  eq('4. 40 is on the way', R.zone(40).key, 'onway');
  eq('4. 74 is on the way', R.zone(74).key, 'onway');
  eq('4. 75 is in good shape', R.zone(75).key, 'good');
  eq('4. the zones cover 0 to 100 without a gap', (function () {
    for (var s = 0; s <= 100; s++) if (!R.zone(s)) return false;
    return true;
  }()), true);
  eq('4. every zone has words, not only a colour', R.ZONES.every(function (z) { return !!z.label && !!z.line; }), true);

  group('5  what is out of the reader\'s hands scores the same');
  var withEmployer = R.score('starter', { paying: 0, employer: 0, relief: 0, statePension: 0, target: 0 });
  var onOwn = R.score('starter', { paying: 1, employer: 0, relief: 0, statePension: 0, target: 0 });
  var selfEmployed = R.score('starter', { paying: 1, employer: 2, relief: 0, statePension: 0, target: 0 });
  eq('5. paying in alone scores as well as with an employer', onOwn.score, withEmployer.score);
  eq('5. being self-employed scores as well as knowing an employer\'s rate', selfEmployed.score, withEmployer.score);

  group('6  half-finished checks are reported, not scored as finished');
  var half = R.score('director', { company: 0, limit: 0 });
  eq('6. not complete', half.complete, false);
  eq('6. the three it is missing', half.missing.join(' '), 'charges statePension target');
  eq('6. a nonsense answer counts as missing', R.score('tracker', { whereAll: 7, worth: 0, charges: 0, statePension: 0, target: 0 }).missing.join(' '), 'whereAll');

  group('7  every lost point comes back as a step, biggest first');
  var mid = R.score('tracker', { whereAll: 1, worth: 2, charges: 0, statePension: 1, target: 1 });
  eq('7. 10 + 0 + 20 + 0 + 10', mid.score, 40);
  eq('7. on the way', mid.zone.key, 'onway');
  eq('7. four steps', mid.moves.length, 4);
  eq('7. the 20-point steps first', mid.moves[0].points + ' ' + mid.moves[1].points, '20 20');
  eq('7. then the 10s', mid.moves[2].points + ' ' + mid.moves[3].points, '10 10');
  eq('7. every step names a page', mid.moves.every(function (m) { return !!m.href && !!m.link && !!m.text; }), true);
  has('7. losing points on "where are they" leads to the finder', mid.moves.filter(function (m) { return m.key === 'whereAll'; })[0].href, 'find-my-pension.html');
  has('7. the State Pension step leads to the entitlement check', mid.moves.filter(function (m) { return m.key === 'statePension'; })[0].href, 'state-pension-entitlement.html');
  has('7. the figure to aim for leads to the way-of-life picker', mid.moves.filter(function (m) { return m.key === 'target'; })[0].href, 'index.html#gap');

  group('8  nothing scores booking a call');
  var text = JSON.stringify(R.questions('tracker').concat(R.questions('starter'), R.questions('director')));
  eq('8. no question mentions booking, a call or Damian', /book|call|damian/i.test(text), false);
}(typeof self !== 'undefined' ? self : this));
