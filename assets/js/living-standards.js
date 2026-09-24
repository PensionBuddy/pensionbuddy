/* The Irish Retirement Living Standards: three standards of living, for one
   person or a couple, and what each is spent on in a month.

   ------------------------------------------------------------------------
   SOURCE, read from the report itself on 2026-09-24 (Run 20):
   Pensions Council, "Irish Retirement Living Standards", researched by KPMG,
   September 2024, published December 2024.
   https://pensionscouncil.ie/wp-content/uploads/2024/12/Irish-Retirement-Living-Standards_2024.pdf

     Headline figures      p. 9 (annual) and p. 12 (monthly); every annual
                           figure is exactly its monthly figure x 12.
     Monthly split         the table on p. 12, repeated on p. 41: seven cost
                           categories that add up EXACTLY to each total.
     Ability to save       a separate row on p. 12, OUTSIDE the total. Kept
                           here as `save` and never added into anything.

   What the figures are, in the report's terms: estimated national averages
   of annual SPENDING at the 2024 cost of living, not an income target, not
   what any one household needs, and not advice; the report puts them within
   5 to 10% either way. Housing costs are included (the survey was mostly
   people who own their home outright), and so are local property tax, car
   tax and insurance, which the report counts under once-off costs. The
   couple Modest figure was set to reflect two State Pensions. No newer
   edition exists as of 2026-09-24; the Council's minutes of 11 February
   2026 record an update being discussed with KPMG.

   state-pension.js carries the three SINGLE totals too, for the reality
   check, with a housing share for each. tests/living-standards.test.js
   asserts the two agree, so neither can move without the other.
   ------------------------------------------------------------------------

   Contract: the header above and tests/living-standards.test.js.
   Loads as a plain script (window.PBLivingStandards) or via require(). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBLivingStandards = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LEVELS = ['modest', 'moderate', 'comfortable'];
  var HOUSEHOLDS = ['single', 'couple'];

  var LABELS = { modest: 'Modest', moderate: 'Moderate', comfortable: 'Comfortable' };

  /* in the report's order, with the report's names, lightly shortened */
  var CATEGORIES = [
    { key: 'housing',   label: 'Housing, including utilities' },
    { key: 'food',      label: 'Food' },
    { key: 'transport', label: 'Transport' },
    { key: 'health',    label: 'Health' },
    { key: 'leisure',   label: 'Leisure' },
    { key: 'clothing',  label: 'Clothing and personal' },
    { key: 'onceOff',   label: 'Once-off costs' }
  ];

  /* euro a month, p. 12. `save` is the separate "ability to save" row. */
  var MONTHLY = {
    single: {
      modest:      { housing: 600, food: 400, transport: 50,  health: 150, leisure: 50,  clothing: 50,  onceOff: 300, save: 50 },
      moderate:    { housing: 750, food: 450, transport: 100, health: 250, leisure: 150, clothing: 100, onceOff: 500, save: 100 },
      comfortable: { housing: 800, food: 525, transport: 175, health: 300, leisure: 200, clothing: 175, onceOff: 625, save: 150 }
    },
    couple: {
      modest:      { housing: 700, food: 550, transport: 175, health: 200, leisure: 150, clothing: 125, onceOff: 500, save: 100 },
      moderate:    { housing: 800, food: 625, transport: 225, health: 300, leisure: 250, clothing: 200, onceOff: 700, save: 200 },
      comfortable: { housing: 900, food: 700, transport: 275, health: 350, leisure: 300, clothing: 225, onceOff: 850, save: 300 }
    }
  };

  function standard(level, household) {
    var hh = household || 'single';
    var row = MONTHLY[hh] && MONTHLY[hh][level];
    if (!row) throw new Error('no living standard ' + level + ' for ' + hh);
    var total = 0;
    CATEGORIES.forEach(function (c) { total += row[c.key]; });
    return {
      level: level,
      label: LABELS[level],
      household: hh,
      monthly: total,
      annual: total * 12,
      save: row.save,
      categories: CATEGORIES.map(function (c) {
        return { key: c.key, label: c.label, monthly: row[c.key], annual: row[c.key] * 12, share: row[c.key] / total };
      })
    };
  }

  return {
    LEVELS: LEVELS,
    HOUSEHOLDS: HOUSEHOLDS,
    LABELS: LABELS,
    CATEGORIES: CATEGORIES,
    MONTHLY: MONTHLY,
    standard: standard
  };
}));
