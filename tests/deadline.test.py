#!/usr/bin/env python3
"""Revenue's deadline, in headless Chrome (Run 29; the online date since Run 31).

    python3 tests/deadline.test.py

ONE Chrome launch. Each job pins the page's clock (Date is replaced before
any page script runs) and reads what assets/js/pb-deadline.js wrote.

What it proves:
  1. every root page and both games: no 15 October cut-off anywhere (the
     date, "to book by", "Damian's cut-off"; R30-6, Run 31); every root page
     loads pb-deadline.js once and carries neither of the two inline scripts
     it replaced; the chip counts to the end of 18 November, Revenue's online
     deadline, says so to a screen reader with the tax year, and its label
     reads "to Revenue's deadline"
  2. the home page's band: eyebrow "Revenue's deadline", heading "Revenue's
     deadline is 18 November if you pay and file online.", its clock to the
     second, 31 October as the second line, the tax year and the
     screen-reader line; the same words as the page's markup, so a reader
     without JavaScript reads what a reader with it reads
  3. the calculators' "Tax deadline" row counts to 18 November and gives 31
     October beside it
  4. through the year: the day after the old cut-off changes nothing; on 1
     November 31 October is marked passed; an hour before 18 November ends
     the chip says 0d 00h 59m; a second after it, everything moves on to the
     next tax year, and in a year with no Revenue Online Service date (2027)
     the count is to 31 October and the online date is "usually later, in
     mid-November"; a second after that 31 October, on to 2028
"""
import base64, glob, html, json, os, re, socket, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
from harness import eq, report  # noqa: E402

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
ONLINE = 'pay and file online through the Revenue Online Service'
T25 = '18 November, Revenue’s deadline for the 2025 tax year if you ' + ONLINE
REV = 'If you do not ' + ONLINE + ', it is 31 October.'
REV_PASSED = 'If you do not ' + ONLINE + ', it was 31 October, and that has passed.'
REV_NEXT = 'If you ' + ONLINE + ', it is usually later, in mid-November.'
HEAD = 'Revenue’s deadline is 18 November if you pay and file online.'
CALCS = ('pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html')
# the cut-off's words; the comparison's "standard rate cut-off point" is tax, not a date
GONE = re.compile(r"15 October|15th October|to book by|Damian(&rsquo;|\u2019|')s cut-off|\bour (15 October )?cut-off", re.I)

CLOCK = r"""<script>(function(){
  var D=Date, off=new D(%s).getTime()-D.now();
  function F(){ if(!(this instanceof F)) return new D(D.now()+off).toString();
    var a=[].slice.call(arguments); return a.length ? new (Function.prototype.bind.apply(D,[null].concat(a)))() : new D(D.now()+off); }
  F.now=function(){ return D.now()+off; }; F.UTC=D.UTC; F.parse=D.parse; F.prototype=D.prototype;
  window.Date=F;
})();</script>"""

PROBE = r"""<script>
(function(){
  var R={errors:[]};
  window.addEventListener('error',function(e){ if(e.message) R.errors.push(String(e.message)); },true);
  function t(id){ var e=document.getElementById(id); return e ? e.textContent : null; }
  setTimeout(function(){
    var chip=document.getElementById('navTick');
    R.chip=t('ntVal'); R.label=chip?chip.getAttribute('aria-label'):null;
    var cl=chip?chip.querySelector('.nt-l'):null; R.chipLab=cl?cl.textContent:null;
    R.band=[t('tkD'),t('tkH'),t('tkM'),t('tkS')];
    var h=document.querySelector('.tick h2'); R.head=h?h.textContent:null;
    var e=document.querySelector('.tick .eyebrow'); R.eyebrow=e?e.textContent:null;
    R.rev=t('tkRev'); R.year=t('tkYear'); R.sr=t('tkSr'); R.row=t('deadlineText');
    var p=document.createElement('pre'); p.id='__dl';
    p.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(R)))); document.body.appendChild(p);
  },200);
})();
</script>"""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == '/__dl':
            body = ('<!doctype html><meta charset="utf-8"><body><script>'
                    'var JOBS=%s,OUT=[];localStorage.setItem("pb-consent","rejected");'
                    'function next(){var j=JOBS.shift();if(!j){var p=document.createElement("pre");p.id="__all";'
                    'p.textContent=JSON.stringify(OUT);document.body.appendChild(p);return;}'
                    'var f=document.createElement("iframe");f.style.cssText="width:1200px;height:800px";'
                    'f.src="/"+j[0]+"?__dl="+encodeURIComponent(j[1]);document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=f.contentDocument.getElementById("__dl");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],p.textContent]);f.remove();next();return;}'
                    'if(n>800){OUT.push([j[0],j[1],null]);f.remove();next();return;}setTimeout(poll,25);})();}'
                    'next();</script></body>') % q['jobs'][0]
            return self._send(body.encode('utf-8'))
        path = u.path.lstrip('/')
        fs = os.path.join(ROOT, path)
        if path.endswith('.html') and os.path.isfile(fs) and '__dl' in q:
            t = open(fs, encoding='utf-8').read()
            t = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + CLOCK % json.dumps(q['__dl'][0]), t, count=1)
            t = t.replace('</body>', PROBE + '</body>', 1)
            return self._send(t.encode('utf-8'))
        return super().do_GET()

    def _send(self, b):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(b)


def main():
    if not os.path.exists(CHROME):
        print('Chrome not found at %s' % CHROME)
        sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    pages = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, '*.html')))
    NOW, OCT16, NOV = '2026-09-25T12:00:00', '2026-10-16T00:00:01', '2026-11-01T00:00:00'
    LAST, ROLL, ROLL2 = '2026-11-18T23:00:00', '2026-11-19T00:00:01', '2027-11-01T00:00:01'
    jobs = [[p, NOW] for p in pages]
    jobs += [['index.html', OCT16], ['index.html', NOV], ['director-calculator.html', NOV],
             ['index.html', LAST], ['index.html', ROLL], ['pension-calculator.html', ROLL],
             ['index.html', ROLL2], ['broker-vs-autoenrolment.html', ROLL2]]
    url = 'http://127.0.0.1:%d/__dl?jobs=%s' % (port, json.dumps(jobs).replace(' ', ''))
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
                        '--disable-extensions', '--mute-audio', '--window-size=1280,900',
                        '--host-resolver-rules=MAP www.googletagmanager.com ~NOTFOUND',
                        '--virtual-time-budget=120000', '--dump-dom', url], capture_output=True, timeout=300)
    m = re.search(r'<pre id="__all">([^<]*)</pre>', p.stdout.decode('utf-8', 'replace'))
    eq('0. one Chrome launch returned every job', bool(m), True)
    if not m:
        srv.shutdown(); report(); return
    R = {(pg, clock): (json.loads(base64.b64decode(b).decode('utf-8')) if b else None)
         for pg, clock, b in json.loads(html.unescape(m.group(1)))}

    LEFT = 'About 54 days left until ' + T25 + '.'
    # 1
    for f in sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'games', '*.html')) +
                    [os.path.join(ROOT, 'assets', 'js', 'pb-deadline.js')]):
        eq('1. %s: no 15 October cut-off' % os.path.relpath(f, ROOT),
           [m.group(0) for m in GONE.finditer(open(f, encoding='utf-8').read())], [])
    for page in pages:
        src = open(os.path.join(ROOT, page), encoding='utf-8').read()
        eq('1. %s: loads pb-deadline.js once, and neither old inline script' % page,
           (src.count('assets/js/pb-deadline.js'), '/* Pay & File countdown' in src, '/* Pay & File: a contribution' in src),
           (1, False, False))
        r = R.get((page, NOW))
        eq('1. %s: reported' % page, r is not None, True)
        if not r:
            continue
        # the clocks go back on 25 October, so the count has an hour more in it
        eq('1. %s: the chip counts to the end of 18 November' % page, r['chip'], '54d 12h 59m')
        eq('1. %s: and says so to a screen reader' % page, r['label'], LEFT + ' Opens the full explanation.')
        eq('1. %s: its label names Revenue\'s deadline' % page, r['chipLab'], 'to Revenue’s deadline')
        eq('1. %s: no script error' % page, r['errors'], [])
    # 2
    r = R[('index.html', NOW)]
    eq('2. the band: its eyebrow names whose date it is', r['eyebrow'], 'Revenue’s deadline')
    eq('2. the band: the online deadline', r['head'], HEAD)
    # the band ticks each second, and the page takes a moment to load
    eq('2. the band: its clock, to the second', (r['band'][:3], 50 <= int(r['band'][3]) <= 59), (['54', '12', '59'], True))
    eq('2. the band: 31 October as the second line', r['rev'], REV)
    eq('2. the band: the tax year', r['year'], '2025')
    eq('2. the band: for a screen reader', r['sr'], LEFT + ' ' + REV)
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    flat = re.sub(r'\s+', ' ', html.unescape(src))
    eq('2. without JavaScript the band says the same',
       ('<span id="tkTag">Revenue’s deadline</span>' in flat, '<h2>%s</h2>' % HEAD in flat,
        '<span id="tkRev">%s</span>' % REV in flat, '<span id="tkYear">2025</span>' in flat), (True, True, True, True))
    chip = re.search(r'<a class="nav-tick" id="navTick"[^>]*>.*?</a>', flat)
    eq('2. without JavaScript the chip names Revenue\'s deadline',
       bool(chip) and 'to Revenue’s deadline</span>' in chip.group(0) and 'Countdown to Revenue’s deadline' in chip.group(0), True)
    # 3
    for page in CALCS:
        r = R[(page, NOW)]
        eq('3. %s: the row counts to 18 November, with 31 October beside it' % page, r['row'],
           LEFT + ' ' + REV + ' After that, 2025’s allowance is gone for good.')
    # 4
    r = R[('index.html', OCT16)]
    eq('4. the day after the old cut-off changes nothing', (r['chip'], r['head'], r['eyebrow'], r['rev']),
       ('34d 00h 59m', HEAD, 'Revenue’s deadline', REV))
    r = R[('index.html', NOV)]
    left = 'About 17 days left until ' + T25 + '.'
    eq('4. on 1 November: still counting to 18 November', (r['chip'], r['band'][:3]), ('17d 23h 59m', ['17', '23', '59']))
    eq('4. and 31 October is marked passed', (r['rev'], r['sr']), (REV_PASSED, left + ' ' + REV_PASSED))
    r = R[('director-calculator.html', NOV)]
    eq('4. in the row too', r['row'], left + ' ' + REV_PASSED + ' After that, 2025’s allowance is gone for good.')
    r = R[('index.html', LAST)]
    eq('4. an hour before 18 November ends', (r['chip'], r['band'][:3], r['head']), ('0d 00h 59m', ['00', '00', '59'], HEAD))
    r = R[('index.html', ROLL)]
    left = 'About 346 days left until 31 October, Revenue’s deadline for the 2026 tax year.'
    eq('4. a second after it, the next tax year', (r['chip'], r['band'][:2], r['year']), ('346d 23h 59m', ['346', '23'], '2026'))
    eq('4. with no online date for 2027, the count is to 31 October',
       (r['head'], r['rev'], r['sr']), ('Revenue’s deadline is 31 October.', REV_NEXT, left + ' ' + REV_NEXT))
    r = R[('pension-calculator.html', ROLL)]
    eq('4. the row moves on too', r['row'], left + ' ' + REV_NEXT + ' After that, 2026’s allowance is gone for good.')
    r = R[('index.html', ROLL2)]
    eq('4. a second after 31 October 2027, on to 2028 and the 2027 tax year', (r['chip'], r['year']), ('365d 23h 59m', '2027'))
    r = R[('broker-vs-autoenrolment.html', ROLL2)]
    eq('4. and the row', r['row'].endswith('2027’s allowance is gone for good.'), True)
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
