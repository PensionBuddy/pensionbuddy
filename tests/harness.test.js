/* Tests for the test harness itself: tests/harness.js.

   Runs BOTH ways, like every suite:
       node tests/harness.test.js
       python3 tests/run-tests.py harness        (headless Chrome)

   The harness cannot be trusted to report on its own failures, so every
   assertion here is made by the shipped default registry ABOUT a second,
   sandboxed registry from H.create(): the sandbox is driven through the same
   public API a suite uses, and what it recorded is compared against literals.
   Nothing here reaches into either registry's internals. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('harness');
  var eq = t.eq, has = t.has;

  // A fresh registry, and one suite in it, driven and then read back. The
  // sandbox reports through the same report() a runner reads, so the text it
  // produces is the thing under test, not a private counter.
  function drive(name, opts, fn) {
    var box = H.create();
    var s = box.suite(name, opts);
    fn(s, box);
    return box.report();
  }

  // ---------------------------------------------------------------- 1. eq
  var r = drive('a', null, function (s) { s.eq('one is one', 1, 1); });
  eq('1. a passing eq counts one pass', r.passed, 1);
  eq('1. and no failure', r.failed, 0);
  has('1. the line reads ok, two spaces, label', r.text, '  ok   one is one');
  has('1. one suite: the summary is the last line', r.text, '\nALL PASS  1 passed, 0 failed');
  eq('1. no SUITE header when there is only one suite', r.text.indexOf('SUITE'), -1);

  r = drive('a', null, function (s) { s.eq('one is two', 1, 2); });
  eq('1. a failing eq counts one failure', r.failed, 1);
  has('1. the line reads FAIL, one space, label', r.text, '  FAIL one is two');
  has('1. expected on its own continuation line', r.text, '\n         expected 2');
  has('1. actual on the next', r.text, '\n         actual   1');
  has('1. the summary says FAILURES', r.text, '\nFAILURES  0 passed, 1 failed');

  // eq is strict: the cent suites say "no tolerances anywhere" and mean it
  r = drive('a', null, function (s) {
    s.eq('string vs number', '1', 1);
    s.eq('undefined vs null', undefined, null);
    s.eq('0.1 + 0.2', 0.1 + 0.2, 0.3);
    s.eq('undefined is undefined', undefined, undefined);
    s.eq('true is true', true, true);
  });
  eq('1. strict: three of five fail', r.failed, 3);
  eq('1. strict: undefined and true pass', r.passed, 2);
  has('1. undefined is printed as undefined', r.text, 'expected null\n         actual   undefined');

  // ---------------------------------------------------------- 2. tolerance
  // compare-calc's module returns euro floats, so that suite declares a
  // tolerance of half a cent. It has to be APPLIED when declared and absent
  // otherwise: today every compare assertion happens to pass strictly, so
  // nothing but this test would notice a harness that lost the tolerance.
  r = drive('a', { tolerance: 0.005 }, function (s) {
    s.eq('within', 0.004, 0);
    s.eq('at the edge', 0.005, 0);
    s.eq('beyond', 0.006, 0);
    s.eq('a string never matches under a tolerance', 'x', 'x');
  });
  eq('2. within the tolerance passes', r.text.indexOf('  ok   within') >= 0, true);
  eq('2. the edge is outside: strictly less than', r.text.indexOf('  FAIL at the edge') >= 0, true);
  eq('2. beyond fails', r.text.indexOf('  FAIL beyond') >= 0, true);
  eq('2. a tolerance suite compares numbers only, so equal strings FAIL',
     r.text.indexOf('  FAIL a string never matches under a tolerance') >= 0, true);
  r = drive('a', null, function (s) { s.eq('within, no tolerance declared', 0.004, 0); });
  eq('2. with no tolerance declared the same comparison is strict', r.failed, 1);
  r = drive('a', { tolerance: 0 }, function (s) { s.eq('zero tolerance is strict', 0.004, 0); });
  eq('2. a tolerance of zero is strict too', r.failed, 1);

  // ------------------------------------------------------------- 3. money
  // Copied from the two cent suites, suffix included: the label diff that
  // proves the migration changed nothing depends on that suffix being exact.
  r = drive('a', null, function (s) {
    s.money('weekly', 29930, 299.30);
    s.money('cents', 7483, 74.83);
    s.money('wrong', 29930, 299.31);
  });
  has('3. the label carries " = EUR " and two decimals', r.text, '  ok   weekly = EUR 299.30');
  has('3. the euro figure is compared in whole cents', r.text, '  ok   cents = EUR 74.83');
  has('3. a cent out fails with the cents shown', r.text, '  FAIL wrong = EUR 299.31\n         expected 29931\n         actual   29930');
  eq('3. counts', r.passed + '/' + r.failed, '2/1');

  // --------------------------------------------------------------- 4. has
  r = drive('a', null, function (s) {
    s.has('found', 'The State Pension covers 60%', '60%');
    s.has('missing', 'The State Pension covers 60%', '61%');
    s.has('not a string', undefined, '60%');
  });
  eq('4. has: one pass, two failures', r.passed + '/' + r.failed, '1/2');
  has('4. a miss prints the needle', r.text, '  FAIL missing\n         missing  "61%"');
  has('4. and the haystack it was not in', r.text, '\n         in       "The State Pension covers 60%"');
  has('4. a non-string haystack is a miss, printed as such', r.text, '  FAIL not a string\n         missing  "60%"\n         in       undefined');

  // ------------------------------------------------------------- 5. group
  r = drive('a', null, function (s) {
    s.eq('w', 1, 1);
    s.group('CASE 1  a heading');
    s.eq('x', 1, 1);
  });
  eq('5. a group heading moves no counter', r.passed + '/' + r.failed, '2/0');
  has('5. it prints as a blank line then the heading, flush left', r.text, '  ok   w\n\nCASE 1  a heading\n  ok   x');

  // -------------------------------------------------------------- 6. skip
  r = drive('a', null, function (s) {
    s.skip('S8 row 4', 'entry 1970 is below the slider floor of 1976');
    s.eq('x', 1, 1);
  });
  eq('6. a skip is neither a pass nor a failure', r.passed + '/' + r.failed, '1/0');
  eq('6. it is counted on its own', r.skipped, 1);
  has('6. the line names the reason', r.text, '  skip S8 row 4  (entry 1970 is below the slider floor of 1976)');
  has('6. and the summary reports it', r.text, 'ALL PASS  1 passed, 0 failed, 1 skipped');
  r = drive('a', null, function (s) { s.eq('x', 1, 1); });
  eq('6. no skipped count in the summary when there are none', r.text.indexOf('skipped'), -1);

  // -------------------------------------------------------------- 7. fail
  r = drive('a', null, function (s) { s.fail('page-probe.js did not load', 'no <script> for it'); });
  eq('7. fail counts one failure', r.failed, 1);
  has('7. and prints the detail on a continuation line', r.text, '  FAIL page-probe.js did not load\n         no <script> for it');

  // ---------------------------------------------------------- 8. uncaught
  // The one throw guard. Whatever catches an exception, node's process
  // listener or the browser's capture-phase error listener, hands it here,
  // and the record names the last assertion that completed so a reader can
  // see how far the suite got.
  r = drive('a', null, function (s, box) {
    s.eq('the last one that ran', 1, 1);
    box.uncaught(new Error('boom'));
  });
  eq('8. an uncaught error is one failure', r.failed, 1);
  has('8. recorded as uncaught with its message', r.text, '  FAIL  uncaught: boom');
  has('8. after the last completed label', r.text, '\n         after: the last one that ran');
  has('8. the summary is FAILURES', r.text, 'FAILURES  1 passed, 1 failed');
  r = drive('a', null, function (s, box) { box.uncaught('a string, not an Error'); });
  has('8. a thrown non-Error is recorded by its string', r.text, 'uncaught: a string, not an Error');
  has('8. with no assertion before it, after says none', r.text, 'after: (none)');
  var box0 = H.create();
  box0.uncaught(new Error('a module threw at load'));
  r = box0.report();
  eq('8. an error before any suite exists is still a failure', r.failed, 1);
  has('8. attributed to a synthetic suite', r.text, 'SUITE  (before any suite)');
  has('8. carrying the message', r.text, 'uncaught: a module threw at load');

  // ------------------------------------------------------- 9. many suites
  var box = H.create();
  var s1 = box.suite('first');
  s1.eq('a', 1, 1);
  var s2 = box.suite('second');
  s2.eq('b', 1, 2);
  s2.skip('c', 'why');
  r = box.report();
  has('9. each suite gets a SUITE header', r.text, 'SUITE  first\n  ok   a\nALL PASS  1 passed, 0 failed');
  has('9. and its own summary', r.text, 'SUITE  second\n  FAIL b\n');
  has('9. the last line totals every suite', r.text, '\nFAILURES  1 passed, 1 failed, 1 skipped');
  eq('9. report() returns the totals', r.passed + '/' + r.failed + '/' + r.skipped, '1/1/1');
  eq('9. and one record per suite, in order', r.suites.map(function (x) { return x.name; }).join(','), 'first,second');
  eq('9. each record carries its own counts', r.suites[1].failed, 1);
  var threw = false;
  try { box.suite('first'); } catch (e) { threw = true; }
  eq('9. a duplicate suite name throws', threw, true);

  // an uncaught error lands on the suite that was running, the most recent one
  box.uncaught(new Error('late'));
  r = box.report();
  has('9. an uncaught error goes to the most recent suite', r.text, 'SUITE  second\n  FAIL b\n         expected 2\n         actual   1\n  skip c  (why)\n  FAIL  uncaught: late\n         after: b');

  // ---------------------------------------------------- 10. registries
  eq('10. the default registry is separate from a created one',
     H.suites().some(function (s) { return s.name === 'first'; }), false);
  eq('10. and the created one holds only its own', box.suites().map(function (s) { return s.name; }).join(','), 'first,second');
  eq('10. create() is on the default registry only, not on a sandbox', typeof box.create, 'undefined');
  eq('10. eq returns the outcome', drive('a', null, function (s) { s.eq('x', 1, 1); }).passed, 1);
  var got;
  drive('a', null, function (s) { got = s.eq('x', 1, 2); });
  eq('10. eq returns false on a miss', got, false);
  drive('a', null, function (s) { got = s.has('x', 'ab', 'b'); });
  eq('10. has returns true on a hit', got, true);

}(typeof self !== 'undefined' ? self : this));
