/* Acceptance tests for "All your pensions, in one view".
   Contract: the header of assets/js/pots.js.

   Runs BOTH ways with no build step:
       node tests/pots.test.js
       python3 tests/run-tests.py pots      (headless Chrome) */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('pots', { tolerance: 0.005 });
  var eq = t.eq, group = t.group;
  function yes(label, cond) { return eq(label, cond ? 1 : 0, 1); }

  var P = isNode ? require('../assets/js/pots.js') : root.PBPots;

  var rows = [
    { name: 'Acme Foods scheme', kind: 'workplace', value: '40,000', amc: '1' },
    { name: 'My PRSA', kind: 'prsa', value: 25000, amc: 0.75 },
    { name: 'Old bond', kind: 'prb', value: '€15000', amc: '' },
    { name: 'Nothing yet', kind: 'other', value: '' },
    { name: 'Typo', kind: 'other', value: 'lots' }
  ];
  var s = P.summarise(rows);

  group('1  what counts');
  eq('1. rows with no value, or not a number, are left out', s.count, 3);
  eq('1. EUR signs and commas are read', s.total, 80000);
  yes('1. names are tidied', P.summarise([{ name: '  a   b ', value: 1 }]).rows[0].name === 'a b');
  eq('1. a value of nothing is not a pot', P.summarise([{ name: 'x', value: 0 }]).count, 0);

  group('2  shares of the whole');
  eq('2. EUR 40,000 of EUR 80,000', s.rows[0].share, 0.5);
  eq('2. EUR 25,000', s.rows[1].share, 0.3125);
  eq('2. the shares add up to 1', s.rows.reduce(function (a, r) { return a + r.share; }, 0), 1);

  group('3  charges, in euro a year, and what is unknown stays unknown');
  eq('3. 1% of EUR 40,000', s.rows[0].yearlyCharge, 400);
  eq('3. 0.75% of EUR 25,000', s.rows[1].yearlyCharge, 187.5);
  yes('3. a blank charge is unknown, not zero', s.rows[2].yearlyCharge === null);
  eq('3. the known charges add up', s.yearlyCharges, 587.5);
  eq('3. two charges known', s.chargesKnown, 2);
  eq('3. one not known', s.chargesUnknown, 1);
  eq('3. a charge of 0 is known and zero', P.summarise([{ name: 'x', value: 100, amc: '0' }]).yearlyCharges, 0);
  eq('3. and counted as known', P.summarise([{ name: 'x', value: 100, amc: '0' }]).chargesKnown, 1);

  group('4  reading what was typed');
  eq('4. EUR 40,000', P.amount('€40,000'), 40000);
  eq('4. with spaces', P.amount(' 40 000 '), 40000);
  eq('4. pence', P.amount('12345.60'), 12345.6);
  yes('4. blank is null', P.amount('  ') === null);
  yes('4. 40k is not read', isNaN(P.amount('40k')) && P.amount('40k') !== null);
  yes('4. nor a minus', isNaN(P.amount('-5')));
  eq('4. a charge with a per cent sign', P.rate('1%'), 1);
  eq('4. a decimal comma in a charge', P.rate('0,75'), 0.75);
  eq('4. a leading point', P.rate('.5'), 0.5);
  yes('4. a charge of "one" is not read', isNaN(P.rate('one')));
  yes('4. a blank charge is null', P.rate('') === null);
  var comma = P.summarise([{ name: 'x', value: '25,000', amc: '0,75' }]);
  eq('4. and 0,75% of EUR 25,000 is EUR 187.50, not 75%', comma.yearlyCharges, 187.5);
  var bad = P.summarise([{ name: 'x', value: '40k', amc: '1' }, { name: 'y', value: 100, amc: 'abc' }]);
  eq('4. a value not read is left out', bad.count, 1);
  eq('4. a charge not read is unknown', bad.chargesUnknown, 1);

  group('5  limits and empties');
  var many = [];
  for (var i = 0; i < 14; i++) many.push({ name: 'p' + i, value: 1000 });
  eq('5. at most ten pots', P.summarise(many).count, P.MAX);
  var none = P.summarise([]);
  eq('5. nothing entered: no pots', none.count, 0);
  eq('5. and a total of nothing', none.total, 0);
  eq('5. six kinds of pension to choose from', P.KINDS.length, 6);
}(typeof self !== 'undefined' ? self : this));
