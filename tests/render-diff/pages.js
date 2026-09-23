'use strict';
/* The five calculator pages, each described once: where its html and its script
   live, which modules it needs, which controls it has, and how one state is
   applied to it.

   THE BASELINE COMES OUT OF GIT. The "old" side of every comparison is read
   from a ref with `git show <ref>:<path>`, not from a copy someone remembered
   to take. That is the difference between a harness that proves one refactor
   and a harness that is still usable for the next one: point it at whatever
   the change is being judged against.

       BASELINE_REF=HEAD~1 node sweep.js compare --axes --corners

   Defaults to HEAD, which answers "does my working tree change anything the
   last commit did not". */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ROOT, inlineCalculatorScript, shippedHtml } = require('./runpage');

const SHARED = 'assets/js/calc-page.js';
const BASELINE_REF = process.env.BASELINE_REF || 'HEAD';

const PAGES = {
  'pension-calculator': {
    html: 'pension-calculator.html',
    parts: null,                                   // inline, and the build skeleton
    modules: [SHARED, 'assets/js/state-pension.js'],  // #11: the maximum rate, on top
    ranges: ['age', 'ret', 'pot', 'mine', 'earn', 'emp', 'growth'],
    settle: p => { p.drainRaf(); p.flushTimers(); p.drainRaf(); },
    apply(p, s) {
      for (const id of this.ranges) p.set(id, s[id]);
      p.ctx.setTax(s.tax);                         // the page's own handler
    },
    driver: 'growth',
  },
  'director-calculator': {
    html: 'director-calculator.html',
    parts: null,                                   // inline, hand-written page
    modules: [SHARED],
    // 'split' is the share of the company contribution the reader puts into
    // the pension rather than taking as salary; it drives the one line under
    // the two columns and is swept like every other control on the page
    ranges: ['age', 'ret', 'sal', 'pot', 'contrib', 'growth', 'split'],
    // no tax segment here: the relief is corporation tax, at a fixed rate
    settle: p => { p.drainRaf(); p.flushTimers(); p.drainRaf(); },
    apply(p, s) { for (const id of this.ranges) p.set(id, s[id]); },
    driver: 'growth',
  },
  compare: {
    html: 'broker-vs-autoenrolment.html',
    parts: 'tools/compare-parts/compare-page.js',
    modules: [SHARED, 'assets/js/pension-tax-relief.js', 'assets/js/autoenrolment.js'],
    ranges: ['age', 'salary', 'phase', 'gross', 'match', 'extra', 'tmatch'],
    checkboxes: ['futureOn', 'matchOn', 'tmatchOn'],
    settle: p => { p.flushTimers(); },
    apply(p, s) {
      for (const id of this.checkboxes) p.setChecked(id, !!s[id]);
      p.ctx.syncToggles();
      p.ctx.setStatus(s.status);
      p.ctx.setMode(s.mode);
      for (const id of this.ranges) p.set(id, s[id]);
    },
    driver: 'extra',
  },
  'state-pension': {
    html: 'state-pension-reality-check.html',
    parts: 'tools/state-pension-parts/page.js',
    modules: [SHARED, 'assets/js/state-pension.js'],
    ranges: ['contribs', 'age'],
    settle: p => { p.flushTimers(); },
    apply(p, s) { for (const id of this.ranges) p.set(id, s[id]); },
    driver: 'contribs',
  },
  entitlement: {
    html: 'state-pension-entitlement.html',
    parts: 'tools/state-pension-entitlement-parts/page.js',
    modules: [SHARED, 'assets/js/state-pension.js', 'assets/js/state-pension-entitlement.js'],
    ranges: ['birth', 'entry', 'paid', 'credited', 'homecaring'],
    settle: p => { p.flushTimers(); },
    apply(p, s) { for (const id of this.ranges) p.set(id, s[id]); },
    driver: 'paid',
  },
};

/* the page script as it is in the working tree */
function currentScript(name) {
  const cfg = PAGES[name];
  const src = cfg.parts
    ? fs.readFileSync(path.join(ROOT, cfg.parts), 'utf8')
    : inlineCalculatorScript(shippedHtml(cfg.html));
  /* MUTATE="<page>|<find>|<replace>" breaks the new script on purpose, so any
     sweep can be asked the only question that matters about it: can it fail?
     A sweep that stays green under a mutation is measuring nothing. */
  const m = process.env.MUTATE;
  if (m) {
    const [page, find, repl] = m.split('|');
    if (page === name) {
      if (!src.includes(find)) throw new Error('MUTATE text not found in ' + name + ': ' + find);
      return src.replace(find, repl);
    }
  }
  return src;
}

function fromGit(ref, rel) {
  return execFileSync('git', ['show', `${ref}:${rel}`],
                      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/* the page script as it was at BASELINE_REF */
function baselineScript(name, ref = BASELINE_REF) {
  const cfg = PAGES[name];
  return cfg.parts ? fromGit(ref, cfg.parts)
                   : inlineCalculatorScript(fromGit(ref, cfg.html));
}

module.exports = { PAGES, currentScript, baselineScript, BASELINE_REF, fromGit, SHARED };
