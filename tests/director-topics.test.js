/* Acceptance tests for the directors' "what to talk about" list.
   Contract: the header of assets/js/director-topics.js.

   Runs BOTH ways with no build step:
       node tests/director-topics.test.js
       python3 tests/run-tests.py director-topics      (headless Chrome) */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('director-topics');
  var eq = t.eq, group = t.group;

  var D = isNode ? require('../assets/js/director-topics.js') : root.PBDirectorTopics;
  function keys(list) { return list.map(function (x) { return x.q || 'always'; }).join(' '); }

  group('1  four questions, every one needed');
  eq('1. four', D.QUESTIONS.length, 4);
  eq('1. nothing answered: no list', D.topics({}), null);
  eq('1. and all four reported missing', D.missing({}).join(' '), 'drExec drMore drAge drBig');
  eq('1. a made-up answer counts as missing', D.missing({ drExec: 'maybe', drMore: 'no', drAge: 'no', drBig: 'no' }).join(' '), 'drExec');

  group('2  yes and not sure list the topic; no leaves it out');
  eq('2. all no: only the deadline', keys(D.topics({ drExec: 'no', drMore: 'no', drAge: 'no', drBig: 'no' })), 'always');
  eq('2. all yes: everything, deadline last', keys(D.topics({ drExec: 'yes', drMore: 'yes', drAge: 'yes', drBig: 'yes' })), 'drExec drMore drAge drBig always');
  eq('2. not sure counts as yes', keys(D.topics({ drExec: 'unsure', drMore: 'no', drAge: 'no', drBig: 'unsure' })), 'drExec drBig always');

  group('3  topics, not advice');
  var every = D.TOPICS.concat([D.ALWAYS]);
  eq('3. no topic tells the reader what to do', every.filter(function (x) { return /\b(you should|we recommend|we advise|best option|must move)\b/i.test(x.text); }).length, 0);
  eq('3. every topic links somewhere on the site', every.every(function (x) { return /^(#[a-z]+|[a-z-]+\.html)$/.test(x.href); }), true);
  eq('3. the executive pension topic names all three places it could go', /master trust, a PRSA or a buy-out bond/.test(D.TOPICS[0].text), true);
}(typeof self !== 'undefined' ? self : this));
