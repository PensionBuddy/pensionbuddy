#!/usr/bin/env python3
"""
Run every JavaScript suite, and the checks that drive the real built pages, in
ONE launch of the local headless Chrome.

Node is installed and every suite also runs directly under it, which is quicker
for a red/green loop. This is the run that proves the modules and the suites
load in a browser through script tags, in the order a page loads them, and it
is the one to trust before a commit.

    python3 tests/run-tests.py                    # every suite and every page check
    python3 tests/run-tests.py compare            # broker vs auto-enrolment
    python3 tests/run-tests.py state-pension      # State Pension reality check
    python3 tests/run-tests.py state-pension-entitlement   # plus its panel check
    python3 tests/run-tests.py harness            # the harness's own test
    python3 tests/run-tests.py --drift            # also cross-check the shared
                                                  # relief module against the
                                                  # real pension-calculator page

ONE LAUNCH. Starting Chrome costs about two seconds; everything the run does
inside it costs well under one. So one parent page is served, it opens one
same-origin iframe per job, one after another, and copies each frame's result
up into a single <pre> the --dump-dom reads. One frame per job rather than one
document for everything, because a suite that runs alone with its own modules
cannot come to depend on a module another suite loaded, and a module that
fails to load is charged to the suite that needed it.

NOTHING IS WRITTEN INTO THE REPOSITORY. A real page under test is read from
disk and served with its probe injected in memory, the way tools/verify.py
serves its audits. The old runner wrote two throwaway copies into the root
and removed them afterwards; tests/runner.test.py asserts they are gone.

The panel check runs with the entitlement suite and is the reason the deleted
'before-transition' panel cannot silently become necessary again: it reads the
REAL built page's birth-year bounds and asserts the page has a panel for every
state those bounds can reach, and none it cannot.

The drift check is the reason the shared module cannot silently diverge from
pension-calculator.html, which the brief said not to modify.

Every suite is also GATED on its exact assertion count, so a suite that ran
nothing, or lost a section, fails here even when every assertion it did make
passed. Adding an assertion means raising the number, on purpose.

TWO TEST-ONLY HOOKS, read from the environment, so tests/runner.test.py can
prove the run is able to fail. Neither touches a file on disk.

    PB_MUTATE="<repo path>|<find>|<replace>"  one change to that file's SERVED
                                              bytes, module, suite or page
    PB_BREAK=drop-module | swap-order | suite-404 | collector
                                              one deliberate fault in the run itself
"""
import argparse, base64, html, http.server, json, os, re, socket, subprocess, sys, threading, functools
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
MUTATE = os.environ.get('PB_MUTATE')
BREAK = os.environ.get('PB_BREAK')

# name -> (module scripts in load order, test file, globals to report as loaded,
#          the exact number of assertions the suite makes)
SUITES = {
    'compare': (['/assets/js/pension-tax-relief.js', '/assets/js/autoenrolment.js'],
                '/tests/compare-calc.test.js', ['PBRelief', 'PBCompare'], 141),
    'state-pension': (['/assets/js/state-pension.js'],
                      '/tests/state-pension.test.js', ['PBStatePension'], 80),
    'state-pension-entitlement': (['/assets/js/state-pension.js', '/assets/js/state-pension-entitlement.js'],
                                  '/tests/state-pension-entitlement.test.js', ['PBStatePension', 'PBEntitlement'], 608),
    'harness': ([], '/tests/harness.test.js', ['PBTest'], 59),
}

# The jobs that drive a REAL built page: job -> (page, the suite it runs with,
# polls allowed before the parent gives up on it). 'drift' only runs on --drift.
PAGE_JOBS = {
    'panel': ('state-pension-entitlement.html', 'state-pension-entitlement', 2400),
    'drift': ('pension-calculator.html', None, 800),
}
SUITE_POLLS = 800          # 25ms of virtual time each: 20s of idle for a suite
BUDGET = 200000            # virtual ms for the whole launch; idle time is free


def jobs_for(suite, drift):
    names = sorted(SUITES) if suite == 'all' else [suite]
    jobs = list(names)
    for job, (page, owner, polls) in PAGE_JOBS.items():
        if job != 'drift' and (suite == 'all' or owner == suite):
            jobs.append(job)
    if drift:
        jobs.append('drift')
    return jobs


# ---------------------------------------------------------------- documents

# A suite's frame: the harness first, so its capture-phase error listener is
# installed before any module can throw, then the modules, then the suite,
# then the result. A throw in one script tag does not stop the next, so the
# result script always runs and always reports what the harness recorded.
SUITE_FRAME = """<!doctype html><meta charset="utf-8"><title>%(name)s</title><body>
<script src="/tests/harness.js"></script>
%(scripts)s
<script src="%(test)s"></script>
<script>
(function () {
  var out = { kind: 'suite', name: %(name_json)s, loaded: {} };
%(loaded)s
  if (!window.PBTest) {
    out.error = 'tests/harness.js did not load';
  } else {
    out.report = window.PBTest.report();
    out.errors = window.PBTest.errors();
  }
  var pre = document.createElement('pre');
  pre.id = '__result__';
  pre.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(out))));
  document.body.appendChild(pre);
})();
</script></body>"""


def suite_frame(name):
    mods, test, globs, _ = SUITES[name]
    mods = list(mods)
    if BREAK == 'drop-module' and '/assets/js/state-pension.js' in mods:
        mods.remove('/assets/js/state-pension.js')
    if BREAK == 'swap-order':
        mods.reverse()
    if BREAK == 'suite-404':
        test = '/tests/does-not-exist.test.js'
    return SUITE_FRAME % {
        'name': html.escape(name),
        'name_json': json.dumps(name),
        'scripts': '\n'.join('<script src="%s"></script>' % m for m in mods),
        'test': test,
        'loaded': '\n'.join("  out.loaded[%s] = typeof window.%s;" % (json.dumps(g), g) for g in globs),
    }


# Injected at the top of <head> of a real page under test, before any of its
# own scripts: a throw inside an input listener never reaches dispatchEvent,
# so a probe's own try/catch would see nothing, and a module that fails to
# load is only visible from a listener installed ahead of it.
HEAD_JS = """<script>
window.__errs = [];
window.addEventListener('error', function (e) {
  var t = e.target;
  if (t && t !== window && t.tagName) {
    window.__errs.push('resource failed: <' + t.tagName.toLowerCase() + '> ' + (t.src || t.href || ''));
    return;
  }
  window.__errs.push((e.message || e.type) + ' @' + (e.lineno || '?'));
}, true);
</script>
"""

# Every probe ends the same way: one element the parent page can find.
PUBLISH = """
  var pre = document.createElement('pre');
  pre.id = '__result__';
  pre.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(out))));
  document.body.appendChild(pre);
"""

PANEL_PROBE = """
<script>
window.addEventListener('load', function () {
  var PANELS = ['spHas', 'spNone', 'spUnfit', 'spBefore'];
  var present = PANELS.filter(function (id) { return !!document.getElementById(id); });
  var b = document.getElementById('birth');
  var lo = +b.min, hi = +b.max, YEAR = new Date().getFullYear();
  var AGE = window.PBStatePension.PENSION_AGE;
  var COUNTS = [[0,0,0], [468,260,0], [520,0,0], [1560,260,0], [2600,1040,1040]];
  var states = {}, shown = {}, errors = [], renders = 0;
  for (var birth = lo; birth <= hi; birth++) {
    var emin = birth + 16, emax = Math.min(YEAR, birth + AGE - 1);
    var entries = [emin, Math.floor((emin + emax) / 2), emax];
    for (var e = 0; e < entries.length; e++) {
      for (var c = 0; c < COUNTS.length; c++) {
        document.getElementById('birth').value = birth;
        var en = document.getElementById('entry');
        en.min = emin; en.max = emax; en.value = entries[e];
        document.getElementById('paid').value = COUNTS[c][0];
        document.getElementById('credited').value = COUNTS[c][1];
        document.getElementById('homecaring').value = COUNTS[c][2];
        var before = window.__errs.length;
        try {
          document.getElementById('paid').dispatchEvent(new Event('input', {bubbles: true}));
        } catch (err) {
          window.__errs.push((err && err.message) || String(err));
        }
        if (window.__errs.length > before) {
          errors.push(birth + '/' + entries[e] + '/' + c + ': ' + window.__errs[window.__errs.length - 1]);
        }
        renders++;
        states[window.PBEntitlement.entitlement({
          paid: COUNTS[c][0], credited: COUNTS[c][1], homeCaring: COUNTS[c][2],
          entryYear: entries[e], drawdownYear: birth + AGE
        }).state] = 1;
        shown[present.filter(function (id) {
          return !document.getElementById(id).hidden;
        }).join('+') || '(none)'] = 1;
      }
    }
  }
  var out = { kind: 'panel', data: {
    birthMin: lo, birthMax: hi, renders: renders,
    panelsInPage: present, statesReachable: Object.keys(states).sort(),
    panelsShown: Object.keys(shown).sort(),
    errorCount: errors.length, errors: errors.slice(0, 5)
  } };
%(publish)s
});
</script>""" % {'publish': PUBLISH}

# Same relief inputs, asked of the real calculator page and of the module.
DRIFT_CASES = [(35, 50000, 1000, 40), (29, 40000, 900, 20),
               (45, 120000, 3000, 40), (62, 200000, 5000, 40)]

DRIFT_PROBE = """
<script>
window.addEventListener('load', function () {
  function setR(id, v) { var el = document.getElementById(id); if (!el) return; el.value = v;
    el.dispatchEvent(new Event('input', {bubbles: true})); }
  function flush() { if (typeof anims === 'object') { for (var k in anims) { anims[k].cur = anims[k].target; } } }
  var rows = [];
  function r(age, earn, monthly, rate) {
    setR('age', age); setR('earn', earn); setR('mine', monthly);
    var btn = document.getElementById(rate === 40 ? 't40' : 't20'); if (btn) btn.click();
    flush();
    var txt = document.getElementById('reliefOut').textContent;
    var m = txt.match(/covers the other €([\\d,]+)/);
    rows.push({age: age, earn: earn, monthly: monthly, rate: rate,
               pageRelief: m ? Number(m[1].replace(/,/g, '')) : null});
  }
  %(calls)s;
  var out = { kind: 'drift', rows: rows, errors: window.__errs };
%(publish)s
});
</script>""" % {'calls': ';'.join('r(%d,%d,%d,%d)' % c for c in DRIFT_CASES), 'publish': PUBLISH}

PROBES = {'panel': PANEL_PROBE, 'drift': DRIFT_PROBE}


def page_document(page, probe):
    """A real page from disk with a probe injected, in memory only."""
    src = open(os.path.join(ROOT, page), encoding='utf-8', errors='replace').read()
    src = mutated(page, src)
    src = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + HEAD_JS, src, count=1, flags=re.I)
    return src.replace('</body>', PROBES[probe] + '</body>', 1)


# The parent page. Frames are opened one at a time: they share the renderer
# thread, so a frame's synchronous work blocks the poll anyway, and one at a
# time keeps every error attributable to one job. A result the frame cannot
# produce becomes an error entry rather than a missing key, so the Python
# side never has to guess what happened to a job.
RUN_PAGE = """<!doctype html><meta charset="utf-8"><title>run</title><body>
<script>
(function () {
  var JOBS = %(jobs)s;
  var results = {};
  function decode(b64) {
    try { return JSON.parse(decodeURIComponent(escape(atob(b64)))); }
    catch (e) { return { error: 'undecodable result: ' + e.message }; }
  }
  function finish() {
    if (%(collector_broken)s) return;
    var pre = document.createElement('pre');
    pre.id = '__out__';
    pre.textContent = btoa(unescape(encodeURIComponent(JSON.stringify({ jobs: results }))));
    document.body.appendChild(pre);
  }
  function next() {
    var j = JOBS.shift();
    if (!j) return finish();
    var f = document.createElement('iframe');
    f.width = 1200; f.height = 900;
    f.src = j.url;
    document.body.appendChild(f);
    var polls = 0, done = false;
    function settle(v) {
      if (done) return;
      done = true;
      results[j.name] = v;
      f.parentNode.removeChild(f);
      next();
    }
    function poll() {
      if (done) return;
      polls++;
      try {
        // about:blank until the navigation commits, so look for the result
        // rather than trusting the first document that is not null
        var d = f.contentDocument;
        var p = d && d.getElementById('__result__');
        if (p) return settle(decode(p.textContent));
      } catch (e) {
        // a SecurityError is not "not ready": the frame has left the origin
        return settle({ error: 'cross-origin frame: ' + e.message });
      }
      if (polls > j.polls) return settle({ error: 'no result after ' + polls + ' polls' });
      setTimeout(poll, 25);
    }
    setTimeout(poll, 25);
  }
  next();
})();
</script></body>"""


def run_page(jobs):
    specs = []
    for name in jobs:
        if name in SUITES:
            specs.append({'name': name, 'url': '/__suite/' + name, 'polls': SUITE_POLLS})
        else:
            page, _, polls = PAGE_JOBS[name]
            specs.append({'name': name, 'url': '/%s?probe=%s' % (page, name), 'polls': polls})
    return RUN_PAGE % {'jobs': json.dumps(specs),
                       'collector_broken': 'true' if BREAK == 'collector' else 'false'}


# ------------------------------------------------------------------ serving

def mutated(rel, text):
    """PB_MUTATE applied to one file's served bytes, and to nothing on disk."""
    if not MUTATE:
        return text
    path, find, repl = MUTATE.split('|', 2)
    if path.strip('/') != rel.strip('/'):
        return text
    if find not in text:
        sys.exit('PB_MUTATE: %r not found in %s' % (find, rel))
    return text.replace(find, repl, 1)


TYPES = {'.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css'}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, body, ctype='text/html'):
        b = body.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', '%s; charset=utf-8' % ctype)
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == '/__run':
            return self.send(run_page(q.get('jobs', [''])[0].split(',')))
        if u.path.startswith('/__suite/'):
            name = u.path.split('/')[-1]
            if name not in SUITES:
                self.send_error(404, 'no suite named %s' % name)
                return
            return self.send(suite_frame(name))
        rel = u.path.lstrip('/')
        if 'probe' in q and rel.endswith('.html') and os.path.isfile(os.path.join(ROOT, rel)):
            return self.send(page_document(rel, q['probe'][0]))
        if MUTATE and os.path.isfile(os.path.join(ROOT, rel)):
            text = open(os.path.join(ROOT, rel), encoding='utf-8', errors='replace').read()
            return self.send(mutated(rel, text), TYPES.get(os.path.splitext(rel)[1], 'text/plain'))
        return super().do_GET()


def serve():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    h = functools.partial(Handler, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port


def dump(url, budget=BUDGET):
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox',
                        '--window-size=1280,1000', '--virtual-time-budget=%d' % budget,
                        '--dump-dom', url],
                       capture_output=True, timeout=300)
    return p.stdout.decode('utf-8', 'replace')


def launch(port, jobs):
    """One Chrome launch. Returns {job name: result} or None."""
    dom = dump('http://127.0.0.1:%d/__run?jobs=%s' % (port, ','.join(jobs)))
    m = re.search(r'<pre id="__out__">(.*?)</pre>', dom, re.S)
    if not m:
        return None
    return json.loads(base64.b64decode(html.unescape(m.group(1))).decode('utf-8'))['jobs']


# ---------------------------------------------------------------- reporting

def report_suite(name, r):
    print('\nSUITE  %s' % name)
    _, _, globs, expected = SUITES[name]
    if r is None or r.get('error'):
        print('  FAIL %s' % (r or {}).get('error', 'no result from the frame'))
        return 1
    rep = r['report']
    print(rep['text'])
    print('loaded: ' + ', '.join('%s=%s' % (g, r['loaded'].get(g)) for g in globs))
    print('errors: ' + json.dumps(r.get('errors', [])))
    gate = rep['passed'] == expected
    print('GATE   %s %d assertions (expected %d)%s' % (name, rep['passed'], expected, '' if gate else '  FAIL'))
    return 0 if (rep['failed'] == 0 and gate) else 1


def report_panel(r):
    """The entitlement page's own controls, against the states its module can return.

    The page has a result panel for each state its five controls can produce and
    no panel for the one they cannot, 'before-transition'. That is a claim about
    the REAL page's slider bounds, so it is checked against the real built page
    rather than against a copy of those bounds kept in the test suite: an edit to
    the birth-year floor that made the missing state reachable has to fail here.
    """
    print('\nPANEL CHECK  state-pension-entitlement.html: every state has a panel')
    if r is None or r.get('error'):
        print('  FAIL %s' % (r or {}).get('error', 'no result from the frame'))
        return 1
    d = r['data']
    panel_for = {'eligible': 'spHas', 'no-entitlement': 'spNone', 'inconsistent': 'spUnfit',
                 'before-transition': 'spBefore'}
    want = sorted(panel_for[s] for s in d['statesReachable'])
    bad = 0
    checks = [
        ('birth years %d to %d, %d renders' % (d['birthMin'], d['birthMax'], d['renders']),
         d['renders'] > 0),
        ('no render error on any of them', not d.get('errorCount')),
        ('states the page can reach: %s' % ', '.join(d['statesReachable']),
         'before-transition' not in d['statesReachable']),
        ('a panel for each, and no others: %s' % ', '.join(d['panelsInPage']),
         sorted(d['panelsInPage']) == want),
        ('exactly one panel showing every time: %s' % ', '.join(d['panelsShown']),
         all(p in ('spHas', 'spNone', 'spUnfit') for p in d['panelsShown'])),
    ]
    for label, ok in checks:
        print('  %s %s' % ('ok  ' if ok else 'FAIL', label))
        bad += 0 if ok else 1
    for e in d.get('errors', []):
        print('       %s' % e)
    return 0 if bad == 0 else 1


def report_drift(r):
    """Ask the REAL pension-calculator.html for its relief figure, then ask the
    shared module for the same thing, and compare."""
    print('\nDRIFT CHECK  shared module vs the live pension-calculator.html')
    if r is None or r.get('error'):
        print('  FAIL %s' % (r or {}).get('error', 'no result from the frame'))
        return 1
    bad = 0
    for row in r['rows']:
        # what the shared module says, monthly, to match the page's wording
        band = (0.15 if row['age'] < 30 else 0.20 if row['age'] < 40 else 0.25
                if row['age'] < 50 else 0.30 if row['age'] < 55 else 0.35 if row['age'] < 60 else 0.40)
        limit = round(band * min(row['earn'], 115000))
        relievable = min(row['monthly'] * 12, limit)
        module_monthly = round(relievable / 12 * row['rate'] / 100)
        ok = row['pageRelief'] is not None and abs(module_monthly - row['pageRelief']) <= 1
        bad += 0 if ok else 1
        print('  %s age %2d  earn %6d  %4d/mo @%d%%   page %s   module %s'
              % ('PASS' if ok else 'FAIL', row['age'], row['earn'], row['monthly'],
                 row['rate'], row['pageRelief'], module_monthly))
    for e in r.get('errors', []):
        print('  error: %s' % e)
        bad += 1
    print('  drift check: ' + ('no drift' if bad == 0 else '%d MISMATCH' % bad))
    return 0 if bad == 0 else 1


REPORTERS = {'panel': report_panel, 'drift': report_drift}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('suite', nargs='?', choices=sorted(SUITES) + ['all'], default='all')
    ap.add_argument('--drift', action='store_true')
    args = ap.parse_args()
    if not os.path.exists(CHROME):
        sys.exit('Chrome not found at %s' % CHROME)
    jobs = jobs_for(args.suite, args.drift)
    srv, port = serve()
    try:
        results = launch(port, jobs)
    finally:
        srv.shutdown()
    if results is None:
        print('could not read the report from the harness page')
        sys.exit(1)
    rc = 0
    for name in jobs:
        r = results.get(name)
        if name in SUITES:
            rc |= report_suite(name, r)
        else:
            rc |= REPORTERS[name](r)
    print('\n%s' % ('ALL SUITES PASS' if rc == 0 else 'FAILURES ABOVE'))
    sys.exit(rc)


if __name__ == '__main__':
    main()
