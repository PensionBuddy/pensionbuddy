/* All your pensions, in one view (my-pensions.html, Run 20 #12).

   The reader lists what they have: a name, the kind of pension, what it is
   worth now and, if they know it, the annual charge. This adds them up:
   the total, each pot's share of it, and what the annual charges come to in
   euro a year at today's values. Nothing is projected and nothing is
   judged: a pot is not "too small" or "too dear" here, and the page says
   what each figure is.

   Rows the reader left without a value are left out of every sum, and so
   are values that are not numbers. A charge left blank is unknown, not
   zero: such a pot counts in the total and its charge in no sum, and the
   page is told how many charges it did not know.

   amount() and rate() read what was typed: a number, null when the field
   is blank, or NaN when something is there that is not a number, so the
   page can say it was not read rather than drop it without a word. An
   amount may carry a euro sign and thousands commas ("€40,000"). A charge
   may carry a per cent sign, and a comma in it is a decimal point ("0,75"
   is 0.75%): no annual charge runs to thousands.

   Contract: this header and tests/pots.test.js.
   Loads as a plain script (window.PBPots) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBPots = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KINDS = [
    ['workplace', 'A pension from a job'],
    ['prsa', 'A PRSA'],
    ['personal', 'A personal pension'],
    ['prb', 'A Personal Retirement Bond'],
    ['avc', 'AVCs'],
    ['other', 'Something else']
  ];
  var MAX = 10;

  var NUMBER = /^(\d+(\.\d*)?|\.\d+)$/;

  function amount(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).replace(/[€,\s]/g, '');
    if (s === '') return null;
    return NUMBER.test(s) ? +s : NaN;
  }

  function rate(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).replace(/[%\s]/g, '');
    if (s === '') return null;
    if (/^\d*,\d+$/.test(s)) s = s.replace(',', '.');
    return NUMBER.test(s) ? +s : NaN;
  }

  function isNum(x) { return x !== null && x === x; }

  /* rows: [{ name, kind, value, amc }] with value in euro and amc in percent */
  function summarise(rows) {
    var kept = (rows || []).slice(0, MAX).map(function (r) {
      var amc = rate(r && r.amc);
      return { name: String(r && r.name || '').replace(/\s+/g, ' ').trim(), kind: r && r.kind, value: amount(r && r.value), amc: isNum(amc) ? amc : null };
    }).filter(function (r) { return isNum(r.value) && r.value > 0; });
    var total = kept.reduce(function (s, r) { return s + r.value; }, 0);
    var known = 0, charges = 0;
    kept.forEach(function (r) {
      r.share = total > 0 ? r.value / total : 0;
      r.yearlyCharge = r.amc === null ? null : r.value * r.amc / 100;
      if (r.yearlyCharge !== null) { known++; charges += r.yearlyCharge; }
    });
    return {
      count: kept.length,
      total: total,
      rows: kept,
      yearlyCharges: charges,
      chargesKnown: known,
      chargesUnknown: kept.length - known
    };
  }

  return { KINDS: KINDS, MAX: MAX, amount: amount, rate: rate, summarise: summarise };
}));
