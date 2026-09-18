#!/usr/bin/env python3
"""The same pages, before and after, in the real browser.

The node sweep drives the page scripts behind a DOM written for the purpose. It
can walk tens of millions of states, and it can only ever be as right as that
DOM. This is the check on it: the pages as they actually ship, in the local
headless Chrome, driven through the same states, with everything a reader could
see read back out of the live document.

Two traps, both hit before:

  * Serve the OLD page from a directory holding the OLD assets. A built page
    links its scripts by URL, so serving it from the repository root silently
    loads the NEW ones and the comparison comes out clean for the wrong reason.
    `git archive HEAD` gives a clean tree of the last commit; each side is
    served from its own root. The ?v= hash in each script URL is the free
    check that the two really loaded different bytes, and it is asserted.

  * A throw inside an input listener never reaches dispatchEvent, so a probe's
    own try/catch sees nothing. A capture-phase window error listener does.

    python3 browser-diff.py
    BASELINE_REF=HEAD~1 python3 browser-diff.py

The baseline checkout is made here, from the ref, rather than left to whoever
runs this: forgetting it is the whole trap.
"""
import html as htmllib
import json
import os
import re
import socket
import shutil
import subprocess
import sys
import tempfile
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import functools

WORK = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(WORK))
# The scratch checkout of the baseline is a fresh mkdtemp per run, made in
# checkout_baseline() and removed in main()'s finally. It used to be one fixed
# path under the temp directory, and two runs at once (two worktrees verifying
# in parallel) each deleted the other's tree: one died with FileNotFoundError
# on the probe page it had just written. Same for the probe page itself, which
# carries the process id in its name below for the same reason.
BASELINE_REF = os.environ.get('BASELINE_REF', 'HEAD')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

PAGES = {
    'pension-calculator.html': {
        'ranges': ['age', 'ret', 'pot', 'mine', 'earn', 'emp', 'growth'],
        'states': [
            {'age': 40, 'ret': 66, 'pot': 50000, 'mine': 300, 'earn': 50000, 'emp': 150, 'growth': 5},
            {'age': 18, 'ret': 50, 'pot': 0, 'mine': 0, 'earn': 10000, 'emp': 0, 'growth': 1},
            {'age': 70, 'ret': 75, 'pot': 1500000, 'mine': 5000, 'earn': 300000, 'emp': 5000, 'growth': 8},
            {'age': 55, 'ret': 60, 'pot': 250000, 'mine': 1275, 'earn': 115000, 'emp': 425, 'growth': 3.5},
            {'age': 29, 'ret': 68, 'pot': 5000, 'mine': 25, 'earn': 31000, 'emp': 75, 'growth': 6.5},
        ],
        'clicks': ['t20', 't40'],
    },
    'director-calculator.html': {
        'ranges': ['age', 'ret', 'sal', 'pot', 'contrib', 'growth'],
        'states': [
            {'age': 48, 'ret': 66, 'sal': 100000, 'pot': 150000, 'contrib': 40000, 'growth': 5},
            {'age': 25, 'ret': 50, 'sal': 30000, 'pot': 0, 'contrib': 0, 'growth': 1},
            {'age': 70, 'ret': 75, 'sal': 1000000, 'pot': 3000000, 'contrib': 500000, 'growth': 8},
            {'age': 60, 'ret': 61, 'sal': 250000, 'pot': 900000, 'contrib': 120000, 'growth': 3.5},
            {'age': 34, 'ret': 68, 'sal': 65000, 'pot': 25000, 'contrib': 7500, 'growth': 6.5},
        ],
        # sendResults() is the page's only inline handler and it opens a mailto,
        # so it is exercised by the scope check below rather than clicked
    },
    'broker-vs-autoenrolment.html': {
        'ranges': ['age', 'salary', 'phase', 'gross', 'match', 'extra', 'tmatch'],
        'states': [
            {'age': 35, 'salary': 50000, 'phase': 1, 'gross': 0, 'match': 0, 'extra': 0, 'tmatch': 0},
            {'age': 18, 'salary': 20000, 'phase': 1, 'gross': 0, 'match': 0, 'extra': 0, 'tmatch': 0},
            {'age': 70, 'salary': 250000, 'phase': 12, 'gross': 50000, 'match': 15, 'extra': 2000, 'tmatch': 100},
            {'age': 46, 'salary': 82000, 'phase': 7, 'gross': 12250, 'match': 6.5, 'extra': 615, 'tmatch': 35},
            {'age': 61, 'salary': 120000, 'phase': 4, 'gross': 25000, 'match': 3, 'extra': 1000, 'tmatch': 50},
        ],
        'toggles': ['futureOn', 'matchOn', 'tmatchOn'],
        'clicks': ['st0', 'st1', 'st2', 'm1', 'm2'],
    },
    'state-pension-reality-check.html': {
        'ranges': ['contribs', 'age'],
        'states': [
            {'contribs': 2080, 'age': 40}, {'contribs': 0, 'age': 18}, {'contribs': 520, 'age': 66},
            {'contribs': 468, 'age': 65}, {'contribs': 1560, 'age': 52},
        ],
    },
    'state-pension-entitlement.html': {
        'ranges': ['birth', 'entry', 'paid', 'credited', 'homecaring'],
        'states': [
            {'birth': 1962, 'entry': 1985, 'paid': 1560, 'credited': 260, 'homecaring': 0},
            {'birth': 1960, 'entry': 1976, 'paid': 0, 'credited': 0, 'homecaring': 0},
            {'birth': 2008, 'entry': 2026, 'paid': 2600, 'credited': 1040, 'homecaring': 1040},
            {'birth': 1968, 'entry': 1990, 'paid': 520, 'credited': 520, 'homecaring': 520},
            {'birth': 1975, 'entry': 1991, 'paid': 2080, 'credited': 0, 'homecaring': 0},
        ],
        # moving the birth year is the one action that clamps another slider
        'birthWalk': [1960, 1999, 1961, 2008, 1970],
    },
}

PROBE = r"""
<script>
window.__errs = [];
window.addEventListener('error', function (e) {
  window.__errs.push((e.message || e.type) + ' @' + (e.lineno || '?'));
}, true);

window.addEventListener('load', function () {
  var CFG = __CFG__;

  function snap() {
    var out = {};
    var all = document.querySelectorAll('[id]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      // Shared site chrome, unrelated to the calculator and carrying state of
      // its own: the consent bar, the Ask Buddy widget, and the nav's live
      // countdown to the tax deadline, which reads the clock and so differs
      // between any two runs taken minutes apart. Everything else on the page
      // is compared, this page's own script having written all of it.
      if (/^(pbe|ask|consent|cookie|nt)/i.test(el.id)) continue;
      if (el.id === 'nav' || el.id === 'navTick') continue;
      var e = { t: el.textContent, h: el.hidden, c: el.className };
      var av = el.getAttribute('aria-valuetext');
      if (av !== null) e.av = av;
      for (var k = 0; k < ['aria-pressed','aria-selected','aria-current','tabindex','value','min','max'].length; k++) {
        var n = ['aria-pressed','aria-selected','aria-current','tabindex','value','min','max'][k];
        var v = el.getAttribute(n);
        if (v !== null) e[n] = v;
      }
      var f = el.style.getPropertyValue('--fill');
      if (f) e.fill = f;
      if (el.style.width) e.w = el.style.width;
      if (el.style.display) e.d = el.style.display;
      if (el.style.transform) e.tr = el.style.transform;
      if (el.style.opacity) e.o = el.style.opacity;
      out[el.id] = e;
    }
    return out;
  }

  function setR(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function click(id) {
    var el = document.getElementById(id);
    if (el) el.click();
  }
  function toggle(id, on) {
    var el = document.getElementById(id);
    if (!el) return;
    el.checked = on;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* The pension calculator eases its headline figures and its chart toward a
     new target over about 45 frames. Sampling that at a fixed instant compares
     how far an animation has got, not what the page says, and the new page
     makes one extra request for the shared runtime, which is enough to move
     the sampling point. So the tween is settled first, exactly as
     tests/run-tests.py's drift probe does, and the comparison is of the figures
     the reader is left looking at. `anims` and `chart` are top-level bindings
     in the page's own classic script, readable here by bare name. */
  function settle() {
    try {
      if (typeof anims === 'object') {
        for (var k in anims) {
          var a = anims[k];
          a.cur = a.target;
          // write the end state here rather than waiting for the next frame:
          // under --virtual-time-budget the frame may never come, and then the
          // comparison is of two stalled animations rather than two pages
          var el = document.getElementById(k);
          if (el) el.textContent = a.fmt(a.target);
        }
      }
      // the pension calculator's chart carries two series (b, u) and the
      // director calculator's one (v), so copy whichever arrays are there
      // rather than naming them: getting this wrong leaves the chart's own
      // axis label mid-animation and reads as a difference between the pages
      if (typeof chart === 'object' && chart.inited && chart.tgt) {
        var copied = false;
        for (var key in chart.tgt) {
          var t = chart.tgt[key];
          if (Object.prototype.toString.call(t) === '[object Array]') {
            if (!t.length) continue;
            chart.cur[key] = t.slice();
            copied = true;
          } else {
            chart.cur[key] = t;
          }
        }
        if (copied) chart.render();
      }
    } catch (e) { window.__errs.push('settle: ' + e.message); }
  }

  (async function () {
    var frames = [];
    // the scripts this page actually loaded, hashes included: the proof that
    // the two sides are not the same bytes served twice
    var srcs = [].slice.call(document.querySelectorAll('script[src]')).map(function (s) {
      return s.getAttribute('src');
    });
    settle(); await wait(120);
    frames.push({ label: 'load', snap: snap() });

    for (var i = 0; i < CFG.states.length; i++) {
      var st = CFG.states[i];
      for (var j = 0; j < CFG.ranges.length; j++) setR(CFG.ranges[j], st[CFG.ranges[j]]);
      await wait(1100);                       // let the debounce run
      settle(); await wait(120);
      frames.push({ label: 'state' + i, snap: snap() });

      for (var t = 0; t < (CFG.toggles || []).length; t++) {
        toggle(CFG.toggles[t], true);
        await wait(900); settle(); await wait(120);
        frames.push({ label: 'state' + i + '+on:' + CFG.toggles[t], snap: snap() });
        toggle(CFG.toggles[t], false);
        await wait(900); settle(); await wait(120);
        frames.push({ label: 'state' + i + '+off:' + CFG.toggles[t], snap: snap() });
      }
      for (var c = 0; c < (CFG.clicks || []).length; c++) {
        click(CFG.clicks[c]);
        await wait(900); settle(); await wait(120);
        frames.push({ label: 'state' + i + '+click:' + CFG.clicks[c], snap: snap() });
      }
    }

    // moving the birth year can clamp the entry year and leave a note
    for (var b = 0; b < (CFG.birthWalk || []).length; b++) {
      setR('birth', CFG.birthWalk[b]);
      await wait(700); settle(); await wait(120);
      frames.push({ label: 'birth:' + CFG.birthWalk[b], snap: snap() });
    }

    var pre = document.createElement('pre');
    pre.id = '__diff__';
    pre.textContent = JSON.stringify({ srcs: srcs, frames: frames, errors: window.__errs });
    document.body.appendChild(pre);
  })();
});
</script>
"""


def serve(directory):
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    h = functools.partial(QuietHandler, directory=directory)
    srv = ThreadingHTTPServer(('127.0.0.1', port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def dump(url, budget):
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox',
                        '--virtual-time-budget=%d' % budget, '--dump-dom', url],
                       capture_output=True, timeout=300)
    return p.stdout.decode('utf-8', 'replace')


def probe(root, page, cfg, budget=120000):
    src = open(os.path.join(root, page), encoding='utf-8', errors='replace').read()
    js = PROBE.replace('__CFG__', json.dumps(cfg))
    # named per process: two runs serving the same working tree at once must
    # not write, load and remove one file between them
    name = '__bdiff-%d.html' % os.getpid()
    tmp = os.path.join(root, name)
    open(tmp, 'w', encoding='utf-8').write(src.replace('</body>', js + '</body>'))
    srv, port = serve(root)
    try:
        dom = dump('http://127.0.0.1:%d/%s' % (port, name), budget)
    finally:
        srv.shutdown()
        os.remove(tmp)
    m = re.search(r'<pre id="__diff__">(.*?)</pre>', dom, re.S)
    if not m:
        return None
    return json.loads(htmllib.unescape(m.group(1)))


def checkout_baseline():
    """A clean tree of BASELINE_REF, with its own assets/js, in a directory that
    belongs to this run alone. Serving the old page from the repository root
    instead would silently load the NEW modules, and the comparison would come
    out clean for the wrong reason. The caller removes the directory."""
    old = tempfile.mkdtemp(prefix='pb-render-diff-old-')
    archive = subprocess.run(['git', 'archive', BASELINE_REF], cwd=ROOT,
                             capture_output=True, check=True).stdout
    subprocess.run(['tar', '-x', '-C', old], input=archive, check=True)
    return old


def main():
    print('real browser, working tree against %s' % BASELINE_REF)
    old = checkout_baseline()
    try:
        bad = run(old)
    finally:
        shutil.rmtree(old, ignore_errors=True)
    print('\n%s' % ('every page renders identically in the browser, before and after'
                    if not bad else 'FAILURES: %d' % bad))
    sys.exit(1 if bad else 0)


def run(old):
    """Every page, old tree against working tree. The number that failed."""
    bad = 0
    for page, cfg in PAGES.items():
        a = probe(old, page, cfg)
        b = probe(ROOT, page, cfg)
        if a is None or b is None:
            print('  FAIL %-38s could not read the probe output (%s)'
                  % (page, 'old' if a is None else 'new'))
            bad += 1
            continue

        # the two sides must not be the same bytes served twice
        same = set(a['srcs']) == set(b['srcs'])
        differs = 0
        cells = 0
        shown = []
        for fa, fb in zip(a['frames'], b['frames']):
            for k in set(list(fa['snap'].keys()) + list(fb['snap'].keys())):
                x, y = fa['snap'].get(k), fb['snap'].get(k)
                cells += 1
                if x != y:
                    differs += 1
                    if len(shown) < 6:
                        shown.append((fa['label'], k, x, y))
        errs = a['errors'] + b['errors']
        ok = not differs and not errs and len(a['frames']) == len(b['frames'])
        if not ok:
            bad += 1
        print('  %s %-38s %d frames, %d cells, %d differing, %d errors%s'
              % ('ok  ' if ok else 'FAIL', page, len(a['frames']), cells, differs, len(errs),
                 '   [WARNING: both sides loaded the same script URLs]' if same and a['srcs'] else ''))
        for label, k, x, y in shown:
            print('        %s #%s' % (label, k))
            print('          old %s' % json.dumps(x)[:150])
            print('          new %s' % json.dumps(y)[:150])
        for e in errs[:4]:
            print('        error: %s' % e)
    return bad


if __name__ == '__main__':
    main()
