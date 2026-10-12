/* The 60-second pension readiness check (Run 20 #4).

   One question to say which of the three situations fits (the same three the
   booking form asks about), then five about things the reader knows or has
   done, each worth up to 20 points, so the score runs from 0 to 100.

   WHAT IS SCORED, AND WHAT IS NOT. Every question is about something the
   reader can find out or do: where their pensions are, what they charge,
   whether they have checked their State Pension record, whether they have a
   figure to aim for. Nothing scores what is out of their hands, such as an
   employer that pays nothing in or the size of a salary, and nothing scores
   booking a call: a score that rose for talking to Damian would be a
   gamified sales funnel, which the Central Bank's guidance names (General
   Guidance 3.5.7). Every point the reader did not get comes back as one
   step, with the page on this site (or the public service) that helps.

   INFORMATION ONLY. This is not a suitability assessment, not advice and
   not a view of anyone's finances: it counts answers. The answers stay in
   the browser; nothing here sends or stores them.

   Contract: this header and tests/readiness.test.js.
   Loads as a plain script (window.PBReadiness) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBReadiness = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PERSONAS = [
    { key: 'tracker', label: 'I have pensions from old jobs to sort out.' },
    { key: 'starter', label: 'I am starting out, or have not started a pension yet.' },
    { key: 'director', label: 'I run a company and pay myself.' }
  ];

  /* Each option's points; each question's step for anything short of 20. */
  var Q = {
    whereAll: { text: 'Do you know where all of your pensions are?', options: [
      ['Yes, every one', 20], ['Some of them', 10], ['No, or I am not sure', 0]],
      step: { text: 'Track down the pensions you have lost sight of.', href: 'tracker.html', link: 'How we help you find them' } },
    worth: { text: 'Do you know roughly what they are worth now?', options: [
      ['Yes, from a recent statement', 20], ['Roughly', 10], ['No idea', 0]],
      step: { text: 'Ask each provider for a current value, or have us ask for you.', href: 'tracker.html', link: 'How we help' } },
    charges: { text: 'Do you know what your pensions charge you each year?', options: [
      ['Yes', 20], ['Roughly', 10], ['No', 0]],
      step: { text: 'Find out what the charges take out of your pot by retirement.', href: 'pension-fees-calculator.html', link: 'Open the charges calculator' } },
    paying: { text: 'Are you paying into a pension now?', options: [
      ['Yes, and my employer pays in too', 20], ['Yes, on my own', 20], ['Not at the moment', 0]],
      step: { text: 'See what a monthly amount could grow to, and what tax relief adds.', href: 'pension-calculator.html', link: 'Open the pension calculator' } },
    employer: { text: 'Do you know what your employer would pay into a pension for you?', options: [
      ['Yes', 20], ['I am not sure', 0], ['I am self-employed', 20]],
      step: { text: 'Ask your employer what they pay in, and compare auto-enrolment with a personal pension.', href: 'broker-vs-autoenrolment.html', link: 'Open the comparison' } },
    relief: { text: 'Do you know how tax relief works on what you pay in?', options: [
      ['Yes', 20], ['Roughly', 10], ['No', 0]],
      step: { text: 'See how much of each payment Revenue gives back.', href: 'glossary.html#tax-relief', link: 'Tax relief, explained' } },
    company: { text: 'Does your company pay into a pension for you?', options: [
      ['Yes, every year', 20], ['Some years', 10], ['Not yet', 0]],
      step: { text: 'See what a company contribution could grow to, and the corporation tax it could save.', href: 'director-calculator.html', link: 'Open the director calculator' } },
    limit: { text: 'Do you know how much your company could pay in for you?', options: [
      ['Yes, it has been worked out', 20], ['Roughly', 10], ['No', 0]],
      step: { text: 'The limit depends on your age, salary and service, and needs a proper calculation.', href: 'director.html', link: 'For company directors' } },
    statePension: { text: 'Have you checked your State Pension record on MyWelfare.ie?', options: [
      ['Yes', 20], ['No', 0], ['I did not know I could', 0]],
      step: { text: 'Check your Pay-Related Social Insurance (PRSI) record on MyWelfare.ie, then see what it could pay.', href: 'state-pension-entitlement.html', link: 'Open the entitlement check' } },
    target: { text: 'Do you have a figure for what you will need a year in retirement?', options: [
      ['Yes', 20], ['A rough idea', 10], ['Not really', 0]],
      step: { text: 'Pick a way of life to aim for, from the Pensions Council’s research.', href: 'index.html#gap', link: 'Start from a way of life' } }
  };

  var SETS = {
    tracker: ['whereAll', 'worth', 'charges', 'statePension', 'target'],
    starter: ['paying', 'employer', 'relief', 'statePension', 'target'],
    director: ['company', 'limit', 'charges', 'statePension', 'target']
  };

  var ZONES = [
    { key: 'early', from: 0, to: 39, label: 'Early days', line: 'Plenty you can do, and the first steps are simple ones.' },
    { key: 'onway', from: 40, to: 74, label: 'On the way', line: 'A few gaps are worth closing.' },
    { key: 'good', from: 75, to: 100, label: 'In good shape', line: 'Worth keeping under review as things change.' }
  ];

  function questions(persona) {
    var set = SETS[persona];
    if (!set) return null;
    return set.map(function (k) {
      return { key: k, text: Q[k].text, options: Q[k].options.map(function (o, i) { return { index: i, label: o[0], points: o[1] }; }) };
    });
  }

  function zone(score) {
    for (var i = 0; i < ZONES.length; i++) if (score >= ZONES[i].from && score <= ZONES[i].to) return ZONES[i];
    return null;
  }

  /* answers: { questionKey: optionIndex }. Unanswered questions score 0 and
     are reported, so a page can refuse to score a half-finished check. */
  function score(persona, answers) {
    var qs = questions(persona);
    if (!qs) return null;
    var total = 0, missing = [], moves = [];
    qs.forEach(function (q) {
      var i = answers ? answers[q.key] : undefined;
      var opt = (typeof i === 'number') ? q.options[i] : null;
      if (!opt) { missing.push(q.key); return; }
      total += opt.points;
      if (opt.points < 20) moves.push({ key: q.key, points: 20 - opt.points, text: Q[q.key].step.text, href: Q[q.key].step.href, link: Q[q.key].step.link });
    });
    moves.sort(function (a, b) { return b.points - a.points; });
    return { persona: persona, score: total, zone: zone(total), complete: missing.length === 0, missing: missing, moves: moves };
  }

  return { PERSONAS: PERSONAS, ZONES: ZONES, SETS: SETS, questions: questions, zone: zone, score: score };
}));
