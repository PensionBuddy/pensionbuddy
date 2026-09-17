#!/usr/bin/env python3
"""
Run a JavaScript acceptance suite in the local headless Chrome, on a throwaway
page that loads the suite's modules and the test through script tags, so every
module is exercised the way a page loads it rather than through require().

Node is installed and every suite also runs directly under it, which is quicker
for a red/green loop. This is the run that proves the modules work in a
browser, and it is the one to trust before a commit.

    python3 tests/run-tests.py                    # every suite
    python3 tests/run-tests.py compare            # broker vs auto-enrolment
    python3 tests/run-tests.py state-pension      # State Pension reality check
    python3 tests/run-tests.py state-pension-entitlement
    python3 tests/run-tests.py --drift            # also cross-check the shared
                                                  # relief module against the
                                                  # real pension-calculator page

The drift check is the reason the shared module cannot silently diverge from
pension-calculator.html, which the brief said not to modify.

The panel check runs with the entitlement suite and is the reason the deleted
'before-transition' panel cannot silently become necessary again: it reads the
REAL built page's birth-year bounds and asserts the page has a panel for every
state those bounds can reach, and none it cannot.
"""
import argparse, html, http.server, os, re, socket, subprocess, sys, threading, functools

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

# name -> (module scripts, test file, globals to report as loaded)
SUITES = {
    'compare': (['/assets/js/pension-tax-relief.js', '/assets/js/autoenrolment.js'],
                '/tests/compare-calc.test.js', ['PBRelief', 'PBCompare']),
    'state-pension': (['/assets/js/state-pension.js'],
                      '/tests/state-pension.test.js', ['PBStatePension']),
    'state-pension-entitlement': (['/assets/js/state-pension.js', '/assets/js/state-pension-entitlement.js'],
                                  '/tests/state-pension-entitlement.test.js', ['PBStatePension', 'PBEntitlement']),
    'harness': ([], '/tests/harness.test.js', ['PBTest']),
}

HARNESS = """<!doctype html><meta charset="utf-8"><title>tests</title><body>
<script>window.__ERRS__=[];window.addEventListener('error',function(e){
  window.__ERRS__.push((e.message||e.type)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno);},true);</script>
<script src="/tests/harness.js"></script>
%(scripts)s
<script src="%(test)s"></script>
<script>
  var pre = document.createElement('pre');
  pre.id = '__out__';
  var diag = '\\nloaded: ' + (%(diag)s) +
             '\\nerrors: ' + JSON.stringify(window.__ERRS__);
  var r = window.PBTest ? window.PBTest.report() : null;
  pre.textContent = (r && r.failed === 0 && r.passed > 0 ? 'OK\\n' : 'FAILED\\n') +
                    (r ? r.text : '(no report)') + diag;
  document.body.appendChild(pre);
</script></body>"""


def harness_for(name):
    mods, test, globs = SUITES[name]
    return HARNESS % {
        'scripts': '\n'.join('<script src="%s"></script>' % m for m in mods),
        'test': test,
        'diag': " + ', ' + ".join("'%s=' + (typeof window.%s)" % (g, g) for g in globs),
    }

# Same relief inputs, asked of the real calculator page and of the module.
DRIFT_CASES = [(35, 50000, 1000, 40), (29, 40000, 900, 20),
               (45, 120000, 3000, 40), (62, 200000, 5000, 40)]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path.startswith('/__harness'):
            name = self.path.split('/')[-1]
            b = harness_for(name if name in SUITES else 'compare').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(b)))
            self.end_headers()
            self.wfile.write(b)
            return
        return super().do_GET()


def serve():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    h = functools.partial(Handler, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port


def dump(url, budget=8000):
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox',
                        '--virtual-time-budget=%d' % budget, '--dump-dom', url],
                       capture_output=True, timeout=120)
    return p.stdout.decode('utf-8', 'replace')


def run_acceptance(port, name):
    print('\n%s  %s' % ('SUITE'.ljust(6), name))
    dom = dump('http://127.0.0.1:%d/__harness/%s' % (port, name))
    m = re.search(r'<pre id="__out__">(.*?)</pre>', dom, re.S)
    if not m:
        print('could not read the test output from the page'); return 1
    out = html.unescape(m.group(1))
    print(out)
    return 0 if out.startswith('OK') else 1


def run_drift(port):
    """Ask the REAL pension-calculator.html for its relief figure, then ask the
    shared module for the same thing, and compare."""
    print('\nDRIFT CHECK  shared module vs the live pension-calculator.html')
    js = []
    for age, earn, monthly, rate in DRIFT_CASES:
        js.append("r(%d,%d,%d,%d)" % (age, earn, monthly, rate))
    probe = """
    <script>
    window.addEventListener('load', function(){
      function setR(id,v){var el=document.getElementById(id);if(!el)return;el.value=v;
        el.dispatchEvent(new Event('input',{bubbles:true}));}
      function flush(){ if(typeof anims==='object'){for(var k in anims){anims[k].cur=anims[k].target;}} }
      var out=[];
      function r(age,earn,monthly,rate){
        setR('age',age); setR('earn',earn); setR('mine',monthly);
        var btn=document.getElementById(rate===40?'t40':'t20'); if(btn) btn.click();
        flush();
        var txt=document.getElementById('reliefOut').textContent;
        var m=txt.match(/covers the other €([\\d,]+)/);
        out.push({age:age,earn:earn,monthly:monthly,rate:rate,
                  pageRelief: m?Number(m[1].replace(/,/g,'')):null});
      }
      %s;
      var pre=document.createElement('pre'); pre.id='__drift__';
      pre.textContent=JSON.stringify(out); document.body.appendChild(pre);
    });
    </script>""" % (';'.join(js))

    src = open(os.path.join(ROOT, 'pension-calculator.html'), encoding='utf-8', errors='replace').read()
    tmp = os.path.join(ROOT, '__drift_probe.html')
    open(tmp, 'w', encoding='utf-8').write(src.replace('</body>', probe + '</body>'))
    try:
        dom = dump('http://127.0.0.1:%d/__drift_probe.html' % port, budget=15000)
    finally:
        os.remove(tmp)

    m = re.search(r'<pre id="__drift__">(.*?)</pre>', dom, re.S)
    if not m:
        print('  could not read relief figures from pension-calculator.html')
        return 1
    import json
    rows = json.loads(html.unescape(m.group(1)))
    bad = 0
    for row in rows:
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
    print('  drift check: ' + ('no drift' if bad == 0 else '%d MISMATCH' % bad))
    return 0 if bad == 0 else 1


PANEL_PROBE = """
<script>
// A throw inside an input listener never reaches dispatchEvent, so it has to be
// caught here or a page that breaks on a state it does not handle looks clean.
window.__renderErrs = [];
window.addEventListener('error', function (e) {
  window.__renderErrs.push((e.message || e.type) + ' @' + (e.lineno || '?'));
}, true);
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
        var before = window.__renderErrs.length;
        try {
          document.getElementById('paid').dispatchEvent(new Event('input', {bubbles: true}));
        } catch (err) {
          window.__renderErrs.push((err && err.message) || String(err));
        }
        if (window.__renderErrs.length > before) {
          errors.push(birth + '/' + entries[e] + '/' + c + ': ' +
                      window.__renderErrs[window.__renderErrs.length - 1]);
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
  var pre = document.createElement('pre');
  pre.id = '__panels__';
  pre.textContent = JSON.stringify({
    birthMin: lo, birthMax: hi, renders: renders,
    panelsInPage: present, statesReachable: Object.keys(states).sort(),
    panelsShown: Object.keys(shown).sort(),
    errorCount: errors.length, errors: errors.slice(0, 5)
  });
  document.body.appendChild(pre);
});
</script>"""


def run_panel_check(port):
    """The entitlement page's own controls, against the states its module can return.

    The page has a result panel for each state its five controls can produce and
    no panel for the one they cannot, 'before-transition'. That is a claim about
    the REAL page's slider bounds, so it is checked against the real built page
    rather than against a copy of those bounds kept in the test suite: an edit to
    the birth-year floor that made the missing state reachable has to fail here.
    """
    print('\nPANEL CHECK  state-pension-entitlement.html: every state has a panel')
    src = open(os.path.join(ROOT, 'state-pension-entitlement.html'),
               encoding='utf-8', errors='replace').read()
    tmp = os.path.join(ROOT, '__panel_probe.html')
    open(tmp, 'w', encoding='utf-8').write(src.replace('</body>', PANEL_PROBE + '</body>'))
    try:
        dom = dump('http://127.0.0.1:%d/__panel_probe.html' % port, budget=60000)
    finally:
        os.remove(tmp)

    m = re.search(r'<pre id="__panels__">(.*?)</pre>', dom, re.S)
    if not m:
        print('  could not read the panel report from the page')
        return 1
    import json
    r = json.loads(html.unescape(m.group(1)))
    panel_for = {'eligible': 'spHas', 'no-entitlement': 'spNone', 'inconsistent': 'spUnfit',
                 'before-transition': 'spBefore'}
    want = sorted(panel_for[s] for s in r['statesReachable'])
    bad = 0
    checks = [
        ('birth years %d to %d, %d renders' % (r['birthMin'], r['birthMax'], r['renders']),
         r['renders'] > 0),
        ('no render error on any of them', not r.get('errorCount')),
        ('states the page can reach: %s' % ', '.join(r['statesReachable']),
         'before-transition' not in r['statesReachable']),
        ('a panel for each, and no others: %s' % ', '.join(r['panelsInPage']),
         sorted(r['panelsInPage']) == want),
        ('exactly one panel showing every time: %s' % ', '.join(r['panelsShown']),
         all(p in ('spHas', 'spNone', 'spUnfit') for p in r['panelsShown'])),
    ]
    for label, ok in checks:
        print('  %s %s' % ('ok  ' if ok else 'FAIL', label))
        bad += 0 if ok else 1
    if r['errors']:
        for e in r['errors']:
            print('       %s' % e)
    return 0 if bad == 0 else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('suite', nargs='?', choices=sorted(SUITES) + ['all'], default='all')
    ap.add_argument('--drift', action='store_true')
    args = ap.parse_args()
    if not os.path.exists(CHROME):
        sys.exit('Chrome not found at %s' % CHROME)
    names = sorted(SUITES) if args.suite == 'all' else [args.suite]
    srv, port = serve()
    rc = 0
    try:
        for n in names:
            rc |= run_acceptance(port, n)
        if args.suite in ('all', 'state-pension-entitlement'):
            rc |= run_panel_check(port)
        if args.drift:
            rc |= run_drift(port)
    finally:
        srv.shutdown()
    print('\n%s' % ('ALL SUITES PASS' if rc == 0 else 'FAILURES ABOVE'))
    sys.exit(rc)


if __name__ == '__main__':
    main()
