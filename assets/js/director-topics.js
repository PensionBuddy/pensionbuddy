/* What a director might want to talk through, from four yes / no / not
   sure answers (director-pension-rules.html, Run 20 #6).

   Topics only. Each names a rule the page sets out and where it bites; none
   says what to do, and tests/director-topics.test.js holds every topic to
   that. "Not sure" counts as yes, because the list is of things worth
   raising. The October deadline and the company's year end apply to every
   director, so that topic is always on the list.

   Loads as a plain script (window.PBDirectorTopics) or via require(). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBDirectorTopics = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var QUESTIONS = ['drExec', 'drMore', 'drAge', 'drBig'];

  var TOPICS = [
    { q: 'drExec', text: 'Whether your executive pension can carry on under the full rules, and if not, where it could go: a master trust, a PRSA or a buy-out bond.', href: '#executive' },
    { q: 'drMore', text: 'Company payments into a PRSA above 100% of your pay are a benefit-in-kind; a master trust is limited by Revenue’s maximum funding rules instead.', href: '#prsa' },
    { q: 'drAge', text: 'A move to a PRSA is not allowed after a scheme’s normal retirement age, so the timing of any move matters.', href: '#executive' },
    { q: 'drBig', text: 'How much of the Standard Fund Threshold your pensions would use, and whether the year you take them changes that.', href: 'standard-fund-threshold.html' }
  ];
  var ALWAYS = { q: null, text: 'The October deadline for what you pay in yourself, and your company’s year end for what it pays.', href: '#october' };

  /* answers: { drExec: 'yes' | 'no' | 'unsure', ... } */
  function missing(answers) {
    return QUESTIONS.filter(function (q) { var a = answers && answers[q]; return a !== 'yes' && a !== 'no' && a !== 'unsure'; });
  }
  function topics(answers) {
    if (missing(answers).length) return null;
    return TOPICS.filter(function (t) { return answers[t.q] !== 'no'; }).concat([ALWAYS]);
  }

  return { QUESTIONS: QUESTIONS, TOPICS: TOPICS, ALWAYS: ALWAYS, missing: missing, topics: topics };
}));
