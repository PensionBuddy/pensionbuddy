#!/usr/bin/env python3
"""
Run tests/compare-calc.test.js. Node is not installed on this machine, so the
same file is executed in the local headless Chrome instead, on a throwaway
page that loads the two modules and the test.

    python3 tests/run-tests.py           # the acceptance tests
    python3 tests/run-tests.py --drift   # also cross-check the shared relief
                                         # module against the real
                                         # pension-calculator.html page

The drift check is the reason the shared module cannot silently diverge from
pension-calculator.html, which the brief said not to modify.
"""
import argparse, html, http.server, os, re, socket, subprocess, sys, threading, functools

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

HARNESS = """<!doctype html><meta charset="utf-8"><title>tests</title><body>
<script>window.__ERRS__=[];window.addEventListener('error',function(e){
  window.__ERRS__.push((e.message||e.type)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno);},true);</script>
<script src="/assets/js/pension-tax-relief.js"></script>
<script src="/assets/js/autoenrolment.js"></script>
<script src="/tests/compare-calc.test.js"></script>
<script>
  var pre = document.createElement('pre');
  pre.id = '__out__';
  var diag = '\\nloaded: PBRelief=' + (typeof window.PBRelief) +
             ' PBCompare=' + (typeof window.PBCompare) +
             '\\nerrors: ' + JSON.stringify(window.__ERRS__);
  pre.textContent = (window.__TEST_FAILED__ === 0 ? 'OK\\n' : 'FAILED\\n') +
                    (window.__TEST_REPORT__ || '(no report)') + diag;
  document.body.appendChild(pre);
</script></body>"""

# Same relief inputs, asked of the real calculator page and of the module.
DRIFT_CASES = [(35, 50000, 1000, 40), (29, 40000, 900, 20),
               (45, 120000, 3000, 40), (62, 200000, 5000, 40)]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path.startswith('/__harness'):
            b = HARNESS.encode()
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


def run_acceptance(port):
    dom = dump('http://127.0.0.1:%d/__harness' % port)
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--drift', action='store_true')
    args = ap.parse_args()
    if not os.path.exists(CHROME):
        sys.exit('Chrome not found at %s' % CHROME)
    srv, port = serve()
    try:
        rc = run_acceptance(port)
        if args.drift:
            rc |= run_drift(port)
    finally:
        srv.shutdown()
    sys.exit(rc)


if __name__ == '__main__':
    main()
