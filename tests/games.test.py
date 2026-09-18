#!/usr/bin/env python3
"""Acceptance tests for the two arcade games in games/, and for the glossary
page that hosts them.

    python3 tests/games.test.py

What this suite proves
----------------------
Both games are single self-contained HTML files with no build step, so the only
way to know their logic is right is to load the real page in a real browser and
drive the API it exposes. That is what happens here: the repository is served
from a throwaway HTTP server on a free port, a probe <script> is injected into a
COPY of each game page (games/__probe_<name>.html, removed again in finally),
and headless Chrome is asked for the finished DOM with --dump-dom. The probe
writes one JSON blob into <pre id="__out__"> and every assertion is made here in
Python, so a failure names the claim rather than a line of browser JavaScript.

The probe installs a capture-phase window 'error' listener before anything else
on the page runs, because a throw inside a listener or an animation frame never
reaches the caller and a broken game would otherwise look clean.

Buddy's Run: the label and fact copy, the speed curve, the collision predicate,
scoring, lives, invulnerability, game over, the persisted best, the no-double-
jump rule, that a jump actually clears an obstacle at both the slowest and the
fastest world speed, and that pause() really stops the simulation.

Jargon Battle: the question bank's shape and copy, that shuffle is a pure,
deterministic permutation, that a battle draws eight distinct questions, and the
whole hit/heart/win/lose state machine, plus a real click-through of the page's
own buttons to prove the best score reaches localStorage.

Static checks apply to the files as they ship: no em dash, every link carries
target="_top" (the games are shown inside an iframe on glossary.html), and the
call to action points at ../booking.html.

The glossary checks are for work happening in parallel. If glossary.html has not
picked the games up yet, the suite waits five minutes, retries once, and then
reports those three lines as SKIP rather than failing.

Same reporting contract as the other suites: one line per assertion, ALL PASS or
FAILURES with counts at the end, exit 0 or 1.
"""
import functools
import html
import http.server
import json
import os
import re
import socket
import subprocess
import sys
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES = os.path.join(ROOT, 'games')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
BUDGET = 25000

_pass, _fail, _skip, _lines = 0, 0, 0, []


def ok(label, cond):
    global _pass, _fail
    if cond:
        _pass += 1
        _lines.append('  ok   ' + label)
    else:
        _fail += 1
        _lines.append('  FAIL ' + label)


def eq(label, actual, expected):
    global _pass, _fail
    if actual == expected:
        _pass += 1
        _lines.append('  ok   ' + label)
    else:
        _fail += 1
        _lines.append('  FAIL ' + label +
                      '\n         expected %r\n         actual   %r' % (expected, actual))


def skip(label, why):
    global _skip
    _skip += 1
    _lines.append('  SKIP ' + label + '  (' + why + ')')


def head(title):
    _lines.append('')
    _lines.append(title)


# --------------------------------------------------------------- the server

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    h = functools.partial(Handler, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port


def dump(url, budget=BUDGET):
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox',
                        '--virtual-time-budget=%d' % budget, '--dump-dom', url],
                       capture_output=True, timeout=180)
    return p.stdout.decode('utf-8', 'replace')


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


ERR_HOOK = """<script>
window.__ERRS__ = [];
window.addEventListener('error', function (e) {
  window.__ERRS__.push((e.message || e.type) + ' @' +
                       String(e.filename || '').split('/').pop() + ':' + (e.lineno || '?'));
}, true);
window.addEventListener('unhandledrejection', function (e) {
  window.__ERRS__.push('unhandled rejection: ' + String((e && e.reason) || ''));
}, true);
</script>"""

EMIT = """
function __emit(obj) {
  var pre = document.getElementById('__out__');
  if (!pre) { pre = document.createElement('pre'); pre.id = '__out__'; document.body.appendChild(pre); }
  pre.textContent = JSON.stringify(obj);
}
function __lcg(seed) {
  var s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function __boot(go) {
  window.addEventListener('load', function () {
    var done = false;
    function fire() {
      if (done) { return; }
      done = true;
      var out;
      try { out = go(); }
      catch (err) { out = { fatal: String((err && err.stack) || err) }; }
      out.errors = (window.__ERRS__ || []).slice();
      __emit(out);
    }
    try {
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(fire, fire);
      }
    } catch (e) { /* no font API, the timeout covers it */ }
    window.setTimeout(fire, 1700);
  });
}
"""


def probe(name, body):
    """Write games/__probe_<name>.html: the real page plus an error hook and a probe."""
    src = read('games/%s.html' % name)
    src = src.replace('<head>', '<head>\n' + ERR_HOOK, 1)
    script = '<script>\n' + EMIT + body + '\n</script>\n'
    src = src.replace('</body>', script + '</body>', 1)
    path = os.path.join(GAMES, '__probe_%s.html' % name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src)
    return path


def run_probe(port, name, body):
    path = probe(name, body)
    try:
        dom = dump('http://127.0.0.1:%d/games/__probe_%s.html' % (port, name))
    finally:
        if os.path.exists(path):
            os.remove(path)
    m = re.search(r'<pre id="__out__">(.*?)</pre>', dom, re.S)
    if not m:
        return None
    return json.loads(html.unescape(m.group(1)))


# ------------------------------------------------------------ Buddy's Run

RUN_PROBE = r"""
__boot(function () {
  var B = window.BuddysRun;
  var R = {};
  if (!B) { R.noApi = true; return R; }

  /* Every auto-spawned label becomes a floating GOOD pill with this rng, which
     sits 90px above the ground: it can never touch a standing Buddy, so nothing
     the game spawns on its own can disturb a life or a score assertion. */
  var FIX = function () { return 0.1; };

  function fresh() { B.setRng(FIX); B.start(); }
  function tickN(n) { for (var k = 0; k < n; k++) { B.tick(1 / 120); } }
  function find(txt) {
    var st = B.state(), k;
    for (k = 0; k < st.labels.length; k++) { if (st.labels[k].text === txt) { return st.labels[k]; } }
    return null;
  }

  R.LABELS = B.LABELS;
  R.FACTS = B.FACTS;
  R.config = B.config;

  /* ---- the speed curve ---- */
  var prev = -1e9, mono = true, top = -1e9, i, v;
  for (i = 0; i <= 2000; i++) {
    v = B.speedFor(i);
    if (v < prev - 1e-9) { mono = false; }
    if (v > top) { top = v; }
    prev = v;
  }
  R.speed = { mono: mono, at0: B.speedFor(0), at2000: B.speedFor(2000), top: top };

  /* ---- the collision predicate ---- */
  var r = __lcg(20250917), sym = true, a, b, n;
  for (n = 0; n < 600; n++) {
    a = { x: Math.round(r() * 80), y: Math.round(r() * 80), w: 1 + Math.round(r() * 30), h: 1 + Math.round(r() * 30) };
    b = { x: Math.round(r() * 80), y: Math.round(r() * 80), w: 1 + Math.round(r() * 30), h: 1 + Math.round(r() * 30) };
    if (B.overlaps(a, b) !== B.overlaps(b, a)) { sym = false; }
  }
  R.ov = {
    symmetric: sym,
    touchRight: B.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }),
    touchLeft: B.overlaps({ x: 10, y: 0, w: 10, h: 10 }, { x: 0, y: 0, w: 10, h: 10 }),
    touchBelow: B.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 10, w: 10, h: 10 }),
    touchCorner: B.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 10, w: 10, h: 10 }),
    real: B.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }),
    realRev: B.overlaps({ x: 5, y: 5, w: 10, h: 10 }, { x: 0, y: 0, w: 10, h: 10 }),
    inside: B.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 2, y: 2, w: 2, h: 2 })
  };

  /* ---- start, and two seconds of running ---- */
  fresh();
  var firstKind = null;
  for (i = 0; i < 240; i++) {
    B.tick(1 / 120);
    var s0 = B.state();
    if (!firstKind && s0.labels.length) { firstKind = s0.labels[0].kind; }
  }
  var st2 = B.state();
  R.after2s = { phase: st2.phase, lives: st2.lives, firstKind: firstKind,
                buddyW: st2.buddy.w, buddyH: st2.buddy.h, groundY: st2.groundY };

  /* ---- a good label is worth ten and then it is gone ---- */
  fresh();
  for (i = 0; i < 1400 && B.state().score === 0; i++) { B.tick(1 / 120); }
  var base = B.state().score;
  var g = B.spawnLabel('good', 'Probe pill', false);
  g.x = B.buddyHit().x + 300;
  var gone = false;
  for (i = 0; i < 1400; i++) {
    B.tick(1 / 120);
    if (!find('Probe pill')) { gone = true; break; }
  }
  R.good = { base: base, gone: gone, score: B.state().score, lives: B.state().lives,
             spawnX: B.config.W, spawnKind: g.kind, spawnH: g.h };

  /* ---- a bad label costs a life, and then he is briefly untouchable ---- */
  fresh();
  var b1 = B.spawnLabel('bad', 'Probe sting', false);
  b1.x = B.buddyHit().x + 60;
  for (i = 0; i < 1400 && B.state().lives === 3; i++) { B.tick(1 / 120); }
  var hit1 = B.state();
  var b2 = B.spawnLabel('bad', 'Probe sting two', false);
  b2.x = B.buddyHit().x + 30;
  var overlapped = false;
  for (i = 0; i < 100; i++) {
    B.tick(1 / 120);
    if (B.overlaps(B.buddyHit(), B.labelHit(b2))) { overlapped = true; }
  }
  var hit2 = B.state();
  R.bad = { lives1: hit1.lives, invuln1: hit1.invulnerableFor,
            lives2: hit2.lives, invuln2: hit2.invulnerableFor, overlapped: overlapped };

  /* ---- three bad hits end it ---- */
  function killRun(preScore) {
    fresh();
    if (preScore) { B._setScore(preScore); }
    var losses = 0, lastLives = 3, waiting = false, guard = 0, tag = 0, l;
    while (B.state().phase === 'running' && guard < 20000) {
      var s = B.state();
      if (!waiting && s.invulnerableFor <= 0) {
        l = B.spawnLabel('bad', 'Probe hit ' + (tag++), false);
        l.x = B.buddyHit().x + 60;
        waiting = true;
      }
      B.tick(1 / 120);
      var s2 = B.state();
      if (s2.lives < lastLives) { losses += 1; lastLives = s2.lives; waiting = false; }
      guard += 1;
    }
    var fin = B.state();
    return { losses: losses, phase: fin.phase, lives: fin.lives, score: fin.score, best: fin.best };
  }
  R.three = killRun(0);

  /* ---- the best score is written down and survives a reset ---- */
  try { window.localStorage.removeItem('pb.buddysRun.best'); } catch (e) { /* private mode */ }
  var death = killRun(880);
  var raw = null;
  try { raw = window.localStorage.getItem('pb.buddysRun.best'); } catch (e) { raw = null; }
  B.reset();
  var idle = B.state();
  R.best = { raw: raw, score: death.score, phase: death.phase,
             stateBest: idle.best, idlePhase: idle.phase,
             idleLabels: idle.labels.length, idleScore: idle.score, idleLives: idle.lives };

  /* ---- no double jump ---- */
  fresh();
  var j1 = B.jump();
  tickN(30);
  var pre = B.state().buddy;
  var j2 = B.jump();
  var post = B.state().buddy;
  R.dbl = { j1: j1, j2: j2, onGround: pre.onGround, vyPre: pre.vy, vyPost: post.vy,
            yPre: pre.y, yPost: post.y };

  /* ---- a held jump clears a bad label, slow and at the cap ---- */
  function clears(dist, score) {
    B.setRng(FIX);
    B.start();
    if (score) { B._setScore(score); }
    var l = B.spawnLabel('bad', 'Probe clear', false);
    l.x = B.buddyHit().x + dist;
    B.jump();
    var guard = 0;
    while (guard < 1200) {
      B.tick(1 / 120);
      if (B.state().lives < 3) { return false; }
      if (l.x + l.w < 0) { return true; }
      guard += 1;
    }
    return false;
  }
  var both = [], slow = 0, fast = 0, d, cs, cf;
  for (d = 40; d <= 400; d += 5) {
    cs = clears(d, 0);
    cf = clears(d, 6000);
    if (cs) { slow += 1; }
    if (cf) { fast += 1; }
    if (cs && cf) { both.push(d); }
  }
  R.clear = { slow: slow, fast: fast, both: both,
              fastSpeed: B.speedFor(6000), slowSpeed: B.speedFor(0) };

  /* ---- pause really stops the world ---- */
  fresh();
  var p = B.spawnLabel('good', 'Probe pause', false);
  p.x = 520;
  tickN(30);
  var beforeX = p.x, beforeScore = B.state().score, beforeY = B.state().buddy.y;
  B.pause();
  var pausedPhase = B.state().phase;
  tickN(240);
  var afterX = p.x, afterScore = B.state().score, afterY = B.state().buddy.y;
  B.resume();
  var resumedPhase = B.state().phase;
  tickN(60);
  R.pause = { pausedPhase: pausedPhase, beforeX: beforeX, afterX: afterX,
              beforeScore: beforeScore, afterScore: afterScore,
              beforeY: beforeY, afterY: afterY,
              resumedPhase: resumedPhase, resumedX: p.x };

  /* ---- jump() is inert when the game is not running ---- */
  B.reset();
  R.idleJump = B.jump();
  R.idlePhase = B.state().phase;

  return R;
});
"""


def check_buddys_run(data):
    head('BUDDY\'S RUN  games/buddys-run.html')
    if data is None:
        ok('the probe page reported a result', False)
        return
    if data.get('fatal'):
        ok('the probe ran without throwing: ' + data['fatal'][:160], False)
        return
    eq('1. the page loads with no console errors', data.get('errors'), [])
    ok('1. window.BuddysRun is exposed', not data.get('noApi'))
    if data.get('noApi'):
        return

    # ------------------------------------------------------------------ copy
    lab = data['LABELS']
    eq('2. LABELS.good has 14 entries', len(lab['good']), 14)
    eq('2. LABELS.bad has 14 entries', len(lab['bad']), 14)
    badly = [t for t in lab['good'] + lab['bad'] if not 2 <= len(t.split()) <= 3]
    eq('2. every label is two or three words', badly, [])
    eq('2. no label appears in both piles',
       sorted(set(lab['good']) & set(lab['bad'])), [])

    facts = data['FACTS']
    eq('3. there are 9 facts', len(facts), 9)
    empty = [i for i, f in enumerate(facts) if not (f.get('text') or '').strip()]
    eq('3. every fact has text', empty, [])
    unpunctuated = [f['text'][-40:] for f in facts if not f['text'].strip().endswith('.')]
    eq('3. every fact is a finished sentence', unpunctuated, [])
    sourceless = [f['text'][:40] for f in facts if not (f.get('source') or '').strip()]
    eq('3. every fact names its source', sourceless, [])
    advice = []
    for f in facts:
        low = f['text'].lower()
        for phrase in ('you should', 'should', 'make sure', 'worth'):
            if phrase in low:
                advice.append((phrase, f['text'][:60]))
    eq('3. no fact gives advice (should / make sure / worth)', advice, [])

    # ----------------------------------------------------------- speed curve
    sp = data['speed']
    cfg = data['config']
    ok('4. speedFor is monotonic non-decreasing over scores 0 to 2000', sp['mono'])
    ok('4. speedFor(0) is the floor, %.1f' % sp['at0'], abs(sp['at0'] - cfg['SPEED_MIN']) < 0.5)
    ok('4. speedFor never exceeds the cap %d (top %.2f)' % (cfg['SPEED_MAX'], sp['top']),
       sp['top'] <= cfg['SPEED_MAX'] + 1e-9)
    ok('4. speedFor climbs towards the cap, %.1f at 2000' % sp['at2000'],
       cfg['SPEED_MAX'] - 1.0 < sp['at2000'] <= cfg['SPEED_MAX'])

    # ------------------------------------------------------------- overlaps
    ov = data['ov']
    ok('5. overlaps is symmetric over 600 random box pairs', ov['symmetric'])
    eq('5. boxes touching on the right edge do not overlap', ov['touchRight'], False)
    eq('5. the same pair the other way round does not overlap', ov['touchLeft'], False)
    eq('5. boxes touching top to bottom do not overlap', ov['touchBelow'], False)
    eq('5. boxes touching at one corner do not overlap', ov['touchCorner'], False)
    eq('5. genuinely crossing boxes do overlap', ov['real'], True)
    eq('5. and the other way round', ov['realRev'], True)
    eq('5. a box wholly inside another overlaps', ov['inside'], True)

    # ------------------------------------------------------- running, lives
    a2 = data['after2s']
    eq('6. two seconds after start() the game is running', a2['phase'], 'running')
    eq('6. and Buddy still has 3 lives', a2['lives'], 3)
    eq('6. the first label out of the gate is a good one', a2['firstKind'], 'good')
    eq('6. Buddy is drawn 108 by 78', [a2['buddyW'], a2['buddyH']], [108, 78])
    eq('6. the ground line is 300', a2['groundY'], 300)

    g = data['good']
    eq('7. a good label passing through Buddy is collected', g['gone'], True)
    eq('7. and it is worth exactly ten points', g['score'] - g['base'], 10)
    eq('7. collecting it costs no lives', g['lives'], 3)

    b = data['bad']
    eq('8. a bad label taken on the chin costs one life', b['lives1'], 2)
    ok('8. and leaves Buddy invulnerable for a moment (%.2fs)' % b['invuln1'], b['invuln1'] > 0)
    eq('8. a second bad label inside that window really did touch him', b['overlapped'], True)
    eq('8. but it costs no second life', b['lives2'], 2)

    t = data['three']
    eq('9. three bad hits and no more end the game', t['losses'], 3)
    eq('9. the game is over', t['phase'], 'over')
    eq('9. with no lives left', t['lives'], 0)

    # ------------------------------------------------------------ best score
    bs = data['best']
    ok('10. the best score reached localStorage pb.buddysRun.best (%s)' % bs['raw'],
       bs['raw'] is not None)
    eq('10. and it is the score at the moment of death', bs['raw'], str(bs['score']))
    eq('10. state() still reports that best after reset()', bs['stateBest'], bs['score'])
    eq('10. reset() returns the game to idle', bs['idlePhase'], 'idle')
    eq('10. reset() clears the world', bs['idleLabels'], 0)
    eq('10. reset() zeroes the score', bs['idleScore'], 0)
    eq('10. reset() gives the three lives back', bs['idleLives'], 3)

    # ------------------------------------------------------------ the jump
    d = data['dbl']
    eq('11. the first jump leaves the ground', d['j1'], True)
    eq('11. Buddy is airborne a quarter second later', d['onGround'], False)
    eq('11. a second jump in mid air does nothing', d['j2'], False)
    eq('11. and does not change his upward speed', d['vyPost'], d['vyPre'])
    eq('12. jump() is inert on the idle screen', data['idleJump'], False)
    eq('12. and leaves the phase alone', data['idlePhase'], 'idle')

    c = data['clear']
    ok('13. some jump distance clears a bad label at the slowest speed (%d of 73)' % c['slow'],
       c['slow'] > 0)
    ok('13. and some clears it at the capped speed (%d of 73)' % c['fast'], c['fast'] > 0)
    ok('13. at least one distance clears it at BOTH speeds: %s'
       % (('px '.join(str(x) for x in c['both'][:6]) + 'px') if c['both'] else 'none'),
       len(c['both']) > 0)

    p = data['pause']
    eq('14. pause() moves the game to paused', p['pausedPhase'], 'paused')
    eq('14. ticking while paused does not move a label', p['afterX'], p['beforeX'])
    eq('14. nor the score', p['afterScore'], p['beforeScore'])
    eq('14. nor Buddy', p['afterY'], p['beforeY'])
    eq('14. resume() puts it back to running', p['resumedPhase'], 'running')
    ok('14. and the world moves again', p['resumedX'] < p['beforeX'])


# --------------------------------------------------------- Jargon Battle

BATTLE_PROBE = r"""
__boot(function () {
  var J = window.JargonBattle;
  var R = {};
  if (!J) { R.noApi = true; return R; }

  R.idle = J.state();
  R.BANK = J.BANK;

  /* ---- shuffle is pure and deterministic ---- */
  var src = [], i;
  for (i = 0; i < 12; i++) { src.push('x' + i); }
  var s1 = J.shuffle(src, __lcg(99));
  var s2 = J.shuffle(src, __lcg(99));
  var s3 = J.shuffle(src, __lcg(4242));
  R.shuffle = { a: s1, b: s2, c: s3, src: src.slice(), sameRef: (s1 === src) };

  /* ---- the draw ---- */
  var picked = J.pickQuestions(8, __lcg(5));
  R.pick = {
    n: picked.length,
    terms: picked.map(function (q) { return q.term; }),
    diffs: picked.map(function (q) { return q.difficulty; }),
    fromBank: picked.every(function (q) { return J.BANK.indexOf(q) >= 0; })
  };
  R.pickAgain = J.pickQuestions(8, __lcg(5)).map(function (q) { return q.term; });
  R.pickClamp = {
    zero: J.pickQuestions(0, __lcg(3)).length,
    one: J.pickQuestions(1, __lcg(3)).length,
    huge: J.pickQuestions(999, __lcg(3)).length,
    bank: J.BANK.length
  };

  /* ---- a new battle ---- */
  var st = J.newBattle(__lcg(42));
  R.newBattle = {
    phase: st.phase, blobHp: st.blobHp, hearts: st.hearts, index: st.index,
    hits: st.hits, total: st.total, options: st.current ? st.current.options.length : -1,
    last: st.last
  };
  var copy = J.state().current.options;
  copy[0] = 'MUTATED BY THE TEST';
  R.optionsAreACopy = (J.state().current.options[0] !== 'MUTATED BY THE TEST');

  /* ---- one right answer ---- */
  J.newBattle(__lcg(42));
  var before = J.state();
  var res = J.answer(before.current.correctIndex);
  var after = J.state();
  R.right = { correct: res.correct, blob: [before.blobHp, after.blobHp],
              hearts: [before.hearts, after.hearts], phase: after.phase,
              hits: after.hits, lastCorrect: after.last ? after.last.correct : null };
  var inert = J.answer(before.current.correctIndex);
  var afterInert = J.state();
  R.inert = { correct: inert.correct, blobHp: afterInert.blobHp,
              hearts: afterInert.hearts, phase: afterInert.phase };

  /* ---- one wrong answer ---- */
  J.newBattle(__lcg(42));
  var wb = J.state();
  var wres = J.answer((wb.current.correctIndex + 1) % 4);
  var wa = J.state();
  R.wrong = { correct: wres.correct, blob: [wb.blobHp, wa.blobHp],
              hearts: [wb.hearts, wa.hearts], phase: wa.phase, hits: wa.hits };

  /* ---- a clean sweep ---- */
  J.newBattle(__lcg(7));
  var terms = [], audit = [], guard = 0, s;
  while (guard < 40) {
    s = J.state();
    if (s.phase !== 'question') { break; }
    terms.push(s.current.term);
    audit.push({ term: s.current.term, options: s.current.options,
                 correctIndex: s.current.correctIndex });
    J.answer(s.current.correctIndex);
    J.next();
    guard += 1;
  }
  var wonState = J.state();
  R.won = { phase: wonState.phase, terms: terms, audit: audit,
            hits: wonState.hits, blobHp: wonState.blobHp, hearts: wonState.hearts };
  R.nextAfterWon = J.next().phase;

  /* ---- three misses ---- */
  J.newBattle(__lcg(11));
  var steps = [], k;
  for (k = 0; k < 6; k++) {
    s = J.state();
    if (s.phase !== 'question') { break; }
    J.answer((s.current.correctIndex + 1) % 4);
    J.next();
    steps.push({ phase: J.state().phase, hearts: J.state().hearts, blobHp: J.state().blobHp });
  }
  var lostState = J.state();
  R.lost = { phase: lostState.phase, hearts: lostState.hearts, steps: steps };

  /* ---- the animation clock ---- */
  var t0 = J.fx.t;
  J.tick(0.016);
  var t1 = J.fx.t;
  J.tick(5);
  var t2 = J.fx.t;
  R.tick = { d1: t1 - t0, d2: t2 - t1 };

  /* ---- and now the page's own buttons, all the way to a win ---- */
  try { window.localStorage.removeItem('pb.jargonBattle.best'); } catch (e) { /* private mode */ }
  var startBtn = document.getElementById('startBtn');
  var nextBtn = document.getElementById('nextBtn');
  var opts = document.getElementById('menu').querySelectorAll('.opt');
  R.dom = { buttons: !!(startBtn && nextBtn) && opts.length === 4 };
  if (R.dom.buttons) {
    startBtn.click();
    nextBtn.click();          /* clear the 'a wild Jargon Blob appears' beat */
    var played = 0;
    for (k = 0; k < 20; k++) {
      s = J.state();
      if (s.phase !== 'question') { break; }
      opts[s.current.correctIndex].click();
      played += 1;
      nextBtn.click();
    }
    var fin = J.state();
    var raw = null;
    try { raw = window.localStorage.getItem('pb.jargonBattle.best'); } catch (e) { raw = null; }
    R.dom.played = played;
    R.dom.phase = fin.phase;
    R.dom.hits = fin.hits;
    R.dom.best = raw;
    var ep = document.getElementById('endPanel');
    var eh = document.getElementById('endHits');
    var eb = document.getElementById('endBest');
    R.dom.endShown = !!(ep && !ep.hidden);
    R.dom.endHits = eh ? eh.textContent : null;
    R.dom.endBest = eb ? eb.textContent : null;
  }

  return R;
});
"""


def check_jargon_battle(data):
    head('JARGON BATTLE  games/jargon-battle.html')
    if data is None:
        ok('the probe page reported a result', False)
        return
    if data.get('fatal'):
        ok('the probe ran without throwing: ' + data['fatal'][:160], False)
        return
    eq('1. the page loads with no console errors', data.get('errors'), [])
    ok('1. window.JargonBattle is exposed', not data.get('noApi'))
    if data.get('noApi'):
        return

    idle = data['idle']
    eq('2. before any battle the phase is idle', idle['phase'], 'idle')
    eq('2. with a full blob and three hearts', [idle['blobHp'], idle['hearts']], [8, 3])
    eq('2. and no current question', idle['current'], None)

    # ------------------------------------------------------------- the bank
    bank = data['BANK']
    ok('3. the bank has at least 20 questions (%d)' % len(bank), len(bank) >= 20)
    missing = [q.get('term', '(no term)') for q in bank
               if not (q.get('term') and q.get('prompt') and q.get('correct'))]
    eq('3. every question has a term, a prompt and a correct answer', missing, [])
    badwrong = [q['term'] for q in bank
                if len(q.get('wrong') or []) != 3 or len(set(q['wrong'])) != 3]
    eq('3. every question has exactly three distinct wrong options', badwrong, [])
    collide = [q['term'] for q in bank if q['correct'] in (q.get('wrong') or [])]
    eq('3. no wrong option repeats the correct answer', collide, [])
    nosays = [q['term'] for q in bank if not (q.get('buddySays') or '').strip()]
    eq('3. Buddy has something to say about every term', nosays, [])
    baddiff = [q['term'] for q in bank if q.get('difficulty') not in (1, 2, 3)]
    eq('3. every difficulty is 1, 2 or 3', baddiff, [])

    terms = [q['term'] for q in bank]
    dup_terms = sorted({t for t in terms if terms.count(t) > 1})
    eq('4. no term appears twice in the bank', dup_terms, [])
    wrongs = [w for q in bank for w in q['wrong']]
    dup_wrong = sorted({w for w in wrongs if wrongs.count(w) > 1})
    eq('4. no wrong option is reused across questions', dup_wrong, [])
    corrects = [q['correct'] for q in bank]
    eq('4. no correct answer is reused as a wrong option elsewhere',
       sorted(set(corrects) & set(wrongs)), [])

    advice = [q['term'] for q in bank
              if 'you should' in q['buddySays'].lower() or 'make sure' in q['buddySays'].lower()]
    eq('5. Buddy never says "you should" or "make sure"', advice, [])
    dashes = [q['term'] for q in bank if '\u2014' in json.dumps(q, ensure_ascii=False)]
    eq('5. no em dash in the question bank', dashes, [])

    # ---------------------------------------------------------- the shuffle
    sh = data['shuffle']
    eq('6. shuffle with a fixed rng is deterministic', sh['a'], sh['b'])
    eq('6. shuffle returns a permutation', sorted(sh['a']), sorted(sh['src']))
    eq('6. shuffle does not mutate its argument', sh['src'],
       ['x%d' % i for i in range(12)])
    eq('6. shuffle returns a new array', sh['sameRef'], False)
    ok('6. a different rng gives a different order', sh['a'] != sh['c'])

    # ------------------------------------------------------------- the draw
    pk = data['pick']
    eq('7. pickQuestions(8) returns 8 questions', pk['n'], 8)
    eq('7. all 8 are distinct', len(set(pk['terms'])), 8)
    eq('7. they are bank objects, not copies', pk['fromBank'], True)
    eq('7. the spread is three easy, three medium, two hard',
       [pk['diffs'].count(1), pk['diffs'].count(2), pk['diffs'].count(3)], [3, 3, 2])
    eq('7. the same rng draws the same eight', data['pickAgain'], pk['terms'])
    cl = data['pickClamp']
    eq('8. pickQuestions(0) is clamped up to one', cl['zero'], 1)
    eq('8. pickQuestions(1) returns one', cl['one'], 1)
    eq('8. pickQuestions(999) is clamped to the bank', cl['huge'], cl['bank'])

    # ----------------------------------------------------------- the battle
    nb = data['newBattle']
    eq('9. newBattle starts on a question', nb['phase'], 'question')
    eq('9. the blob starts on 8', nb['blobHp'], 8)
    eq('9. Buddy starts on 3 hearts', nb['hearts'], 3)
    eq('9. at question index 0 with nothing landed', [nb['index'], nb['hits']], [0, 0])
    eq('9. eight questions in the battle', nb['total'], 8)
    eq('9. four options on the board', nb['options'], 4)
    eq('9. and nothing in the rear-view mirror', nb['last'], None)
    eq('9. state().current.options is a copy', data['optionsAreACopy'], True)

    r = data['right']
    eq('10. answering the correct option is correct', r['correct'], True)
    eq('10. it knocks one off the blob', r['blob'], [8, 7])
    eq('10. and costs no heart', r['hearts'], [3, 3])
    eq('10. the phase moves to result', r['phase'], 'result')
    eq('10. the hit is counted', r['hits'], 1)
    ine = data['inert']
    eq('10. a second answer in the result phase is inert', ine['correct'], False)
    eq('10. and changes nothing', [ine['blobHp'], ine['hearts'], ine['phase']],
       [7, 3, 'result'])

    w = data['wrong']
    eq('11. answering a wrong option is not correct', w['correct'], False)
    eq('11. it costs a heart', w['hearts'], [3, 2])
    eq('11. and leaves the blob alone', w['blob'], [8, 8])
    eq('11. the phase moves to result', w['phase'], 'result')
    eq('11. no hit is counted', w['hits'], 0)

    won = data['won']
    eq('12. eight correct answers win the battle', won['phase'], 'won')
    eq('12. eight questions were asked', len(won['terms']), 8)
    eq('12. and no question was asked twice', len(set(won['terms'])), 8)
    eq('12. the blob is on zero', won['blobHp'], 0)
    eq('12. with every heart intact', won['hearts'], 3)
    eq('12. and eight hits landed', won['hits'], 8)
    eq('12. next() past the end leaves it won', data['nextAfterWon'], 'won')

    by_term = {q['term']: q for q in bank}
    bad_opts = []
    for row in won['audit']:
        src = by_term.get(row['term'])
        if not src:
            bad_opts.append((row['term'], 'not in the bank'))
            continue
        opts = row['options']
        if len(opts) != 4:
            bad_opts.append((row['term'], 'has %d options' % len(opts)))
        if opts.count(src['correct']) != 1:
            bad_opts.append((row['term'], 'correct answer appears %d times'
                             % opts.count(src['correct'])))
        if opts[row['correctIndex']] != src['correct']:
            bad_opts.append((row['term'], 'correctIndex points at %r'
                             % opts[row['correctIndex']]))
        if sorted(opts) != sorted([src['correct']] + src['wrong']):
            bad_opts.append((row['term'], 'options are not the bank entry shuffled'))
    eq('13. every board holds the correct answer exactly once, at correctIndex',
       bad_opts, [])

    lost = data['lost']
    eq('14. three wrong answers lose the battle', lost['phase'], 'lost')
    eq('14. with no hearts left', lost['hearts'], 0)
    eq('14. and it took exactly three', len(lost['steps']), 3)
    eq('14. the hearts came off one at a time',
       [s['hearts'] for s in lost['steps']], [2, 1, 0])

    tk = data['tick']
    ok('15. tick advances the animation clock', abs(tk['d1'] - 0.016) < 1e-9)
    ok('15. and a long frame is clamped to a tenth of a second', abs(tk['d2'] - 0.1) < 1e-9)

    dom = data['dom']
    eq('16. the page has a start button, a next button and four options',
       dom.get('buttons'), True)
    if dom.get('buttons'):
        eq('16. clicking through eight correct answers plays eight questions',
           dom.get('played'), 8)
        eq('16. and wins', dom.get('phase'), 'won')
        eq('16. the end panel is showing', dom.get('endShown'), True)
        eq('16. it reports 8 of 8 hits', dom.get('endHits'), '8 of 8')
        ok('17. the best score reached localStorage pb.jargonBattle.best (%s)'
           % dom.get('best'), dom.get('best') is not None)
        eq('17. and it is the hits landed', dom.get('best'), str(dom.get('hits')))
        eq('17. the panel shows the same best', dom.get('endBest'), '8 of 8')


# ------------------------------------------------------------ static checks

def check_static():
    head('THE FILES AS THEY SHIP')
    # The question bank moved to assets/js/pb-jargon-bank.js, so the house-style
    # guards below follow it there, and pb-jargon-chips.js is in the list too
    # because it holds the chip microcopy. The link checks are about a page
    # inside the arcade iframe and cannot mean anything in a .js file, so they
    # stay on the two game pages.
    for rel in ('games/buddys-run.html', 'games/jargon-battle.html',
                'assets/js/pb-jargon-bank.js', 'assets/js/pb-jargon-chips.js'):
        src = read(rel)
        eq('18. %s has no em dash' % rel, src.count('\u2014'), 0)
        eq('18. %s has no em dash entity' % rel, src.count('&mdash;'), 0)
        if rel.endswith('.html'):
            anchors = re.findall(r'<a\b[^>]*>', src)
            ok('19. %s has links at all (%d)' % (rel, len(anchors)), len(anchors) > 0)
            loose = [a for a in anchors if 'target="_top"' not in a]
            eq('19. %s: every <a> carries target="_top"' % rel,
               [a[:70] for a in loose], [])
            ctas = [a for a in anchors if 'booking.html' in a]
            eq('20. %s links to the booking page once' % rel, len(ctas), 1)
            ok('20. %s: the call to action points at ../booking.html' % rel,
               bool(ctas) and 'href="../booking.html"' in ctas[0])
            ok('20. %s uses the agreed button words' % rel,
               'Book a free 20-minute call' in src)
        placeholders = [t for t in ('TODO', 'FIXME', 'lorem', 'XXX', '[to be confirmed]')
                        if t in src]
        eq('21. %s has no placeholder tokens' % rel, placeholders, [])


GLOSSARY_CHECKS = [
    ('22. glossary.html links to Buddy\'s Run', 'games/buddys-run.html'),
    ('22. glossary.html links to Jargon Battle', 'games/jargon-battle.html'),
    ('22. glossary.html loads games/buddy-sprites.js', 'games/buddy-sprites.js'),
]


def glossary_ready(src):
    return all(needle in src for _, needle in GLOSSARY_CHECKS) and 'id="arcFrame"' in src


def check_glossary(wait=True):
    head('GLOSSARY  the page that hosts both games')
    src = read('glossary.html')
    if not glossary_ready(src) and wait:
        _lines.append('  ..   glossary.html has not picked the games up yet, '
                      'waiting five minutes and retrying once')
        sys.stdout.write('       waiting five minutes for glossary.html\n')
        sys.stdout.flush()
        time.sleep(300)
        src = read('glossary.html')
    if not glossary_ready(src):
        for label, _ in GLOSSARY_CHECKS:
            skip(label, 'glossary.html has not been wired to the games yet')
        skip('22. glossary.html has an iframe with id arcFrame',
             'glossary.html has not been wired to the games yet')
        return
    for label, needle in GLOSSARY_CHECKS:
        ok(label, needle in src)
    ok('22. glossary.html has an iframe with id arcFrame',
       bool(re.search(r'<iframe\b[^>]*id="arcFrame"', src)))


# --------------------------------------------------------------------- main

def main():
    if not os.path.exists(CHROME):
        sys.exit('Chrome not found at %s' % CHROME)
    wait = '--no-wait' not in sys.argv
    srv, port = serve()
    try:
        run = run_probe(port, 'buddys-run', RUN_PROBE)
        battle = run_probe(port, 'jargon-battle', BATTLE_PROBE)
    finally:
        srv.shutdown()
    check_buddys_run(run)
    check_jargon_battle(battle)
    check_static()
    check_glossary(wait)

    summary = '\n' + ('ALL PASS' if _fail == 0 else 'FAILURES') + \
              '  %d passed, %d failed' % (_pass, _fail) + \
              ('' if _skip == 0 else ', %d skipped' % _skip)
    print('\n'.join(_lines) + summary)
    sys.exit(0 if _fail == 0 else 1)


if __name__ == '__main__':
    main()
