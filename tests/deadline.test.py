#!/usr/bin/env python3
"""The 15 October cut-off and Revenue's deadline, in headless Chrome (Run 29).

    python3 tests/deadline.test.py

ONE Chrome launch. Each job pins the page's clock (Date is replaced before
any page script runs) and reads what assets/js/pb-deadline.js wrote.

What it proves:
  1. every root page loads pb-deadline.js once and carries neither of the
     two inline scripts it replaced; the chip counts to the end of
     15 October and says so to a screen reader, with the tax year
  2. the home page's band: "Book by 15 October so we have time to process
     before the Revenue deadline.", its clock to the second, and Revenue's
     own deadline beside it: 31 October, or 18 November through the Revenue
     Online Service; the same words as the page's markup, so a reader
     without JavaScript reads what a reader with it reads
  3. the calculators' "Tax deadline" row counts to 15 October and states
     Revenue's deadline for the tax year
  4. an hour before the cut-off the chip says 0d 00h 59m
  5. after the cut-off (R29-4, Run 30): a second after it, everything counts
     to Revenue's own deadline, 18 November online, and says the cut-off has
     passed (chip, its label, the band's eyebrow, heading, clock and
     screen-reader line, the calculators' row), with 31 October named while
     it is still ahead and marked passed once it is not; an hour before
     18 November ends the chip says 0d 00h 59m; a second after it,
     everything moves on to 15 October next year and the next tax year; and
     in a year with no Revenue Online Service date (2027) the count after the
     cut-off is to 31 October, and the band says "mid-November"
"""
import base64, glob, html, json, os, re, socket, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
from harness import eq, report  # noqa: E402

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
REV = '31 October, or 18 November if you pay and file online through the Revenue Online Service'
REV_NEXT = '31 October, or mid-November if you pay and file online through the Revenue Online Service'
HEAD = 'Book by 15 October so we have time to process before the Revenue deadline.'
CALCS = ('pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html')

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
    NOW, HOUR, AFTER = '2026-09-25T12:00:00', '2026-10-15T23:00:00', '2026-10-16T00:00:01'
    NOV, LAST, ROLL, NOROS = '2026-11-01T00:00:00', '2026-11-18T23:00:00', '2026-11-19T00:00:01', '2027-10-16T00:00:00'
    jobs = [[p, NOW] for p in pages]
    jobs += [['index.html', HOUR], ['index.html', AFTER], ['pension-calculator.html', AFTER],
             ['index.html', NOV], ['director-calculator.html', NOV], ['index.html', LAST],
             ['index.html', ROLL], ['pension-calculator.html', ROLL], ['index.html', NOROS],
             ['broker-vs-autoenrolment.html', NOROS]]
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

    LEFT = 'About 20 days left to book by 15 October, so we have time to process your contribution before the Revenue deadline for the 2025 tax year.'
    # 1
    for page in pages:
        src = open(os.path.join(ROOT, page), encoding='utf-8').read()
        eq('1. %s: loads pb-deadline.js once, and neither old inline script' % page,
           (src.count('assets/js/pb-deadline.js'), '/* Pay & File countdown' in src, '/* Pay & File: a contribution' in src),
           (1, False, False))
        r = R.get((page, NOW))
        eq('1. %s: reported' % page, r is not None, True)
        if not r:
            continue
        eq('1. %s: the chip counts to the end of 15 October' % page, r['chip'], '20d 11h 59m')
        eq('1. %s: and says so to a screen reader' % page, r['label'], LEFT + ' Opens the full explanation.')
        eq('1. %s: its label names the cut-off' % page, r['chipLab'], 'to book by 15 October')
        eq('1. %s: no script error' % page, r['errors'], [])
    # 2
    r = R[('index.html', NOW)]
    eq('2. the band: its eyebrow names whose date it is', r['eyebrow'], 'Damian\u2019s cut-off')
    eq('2. the band: the cut-off, in the brief\'s words', r['head'], HEAD)
    # the band ticks each second, and the page takes a moment to load
    eq('2. the band: its clock, to the second', (r['band'][:3], 50 <= int(r['band'][3]) <= 59), (['20', '11', '59'], True))
    eq('2. the band: Revenue\'s own deadline beside it', r['rev'], REV)
    eq('2. the band: the tax year', r['year'], '2025')
    eq('2. the band: for a screen reader', r['sr'], LEFT + ' Revenue’s deadline is ' + REV + '.')
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    flat = re.sub(r'\s+', ' ', src)
    eq('2. without JavaScript the band says the same', ('<h2>%s</h2>' % HEAD in src, '<span id="tkRev">%s</span>' % REV in flat), (True, True))
    # 3
    for page in CALCS:
        r = R[(page, NOW)]
        eq('3. %s: the row counts to 15 October and states Revenue\'s deadline' % page, r['row'],
           'About 20 days left to book by 15 October, so we have time to process before the Revenue deadline. '
           'Revenue’s deadline for a contribution against your 2025 tax bill is ' + REV +
           '. After that, 2025’s allowance is gone for good.')
    # 4
    r = R[('index.html', HOUR)]
    eq('4. an hour before the cut-off', (r['chip'], r['band'][:3]), ('0d 00h 59m', ['00', '00', '59']))
    # 5
    ROS_T = '18 November, Revenue’s deadline for the 2025 tax year if you pay and file online through the Revenue Online Service'
    PASSED = 'Our 15 October cut-off has passed. '
    OTHER = ' If you do not pay and file online, it is 31 October.'
    left = PASSED + 'About 34 days left until ' + ROS_T + '.'
    r = R[('index.html', AFTER)]
    # the clocks go back on 25 October, so the count has an hour more in it
    eq('5. a second after the cut-off, the chip counts to 18 November', (r['chip'], r['chipLab']), ('34d 00h 59m', 'to Revenue’s deadline'))
    eq('5. and says so to a screen reader', r['label'], left + ' Opens the full explanation.')
    eq('5. the band: its eyebrow is Revenue\'s now', r['eyebrow'], 'Revenue’s deadline')
    eq('5. the band: the cut-off has passed, Revenue\'s has not', r['head'],
       PASSED + 'Revenue’s deadline is 18 November if you pay and file online.')
    eq('5. the band: its clock, to 18 November', r['band'][:3], ['34', '00', '59'])
    eq('5. the band: both of Revenue\'s dates, while 31 October is ahead', (r['rev'], r['year']), (REV, '2025'))
    eq('5. the band: for a screen reader', r['sr'], left + OTHER)
    r = R[('pension-calculator.html', AFTER)]
    eq('5. the row counts to 18 November', r['row'],
       left + OTHER + ' After that, 2025’s allowance is gone for good.')
    r = R[('index.html', NOV)]
    left = PASSED + 'About 17 days left until ' + ROS_T + '.'
    eq('5. on 1 November: still counting to 18 November', (r['chip'], r['band'][:3]), ('17d 23h 59m', ['17', '23', '59']))
    eq('5. and 31 October is marked passed', r['rev'],
       '18 November if you pay and file online through the Revenue Online Service (the 31 October date has passed)')
    eq('5. and no longer offered to a screen reader', r['sr'], left)
    r = R[('director-calculator.html', NOV)]
    eq('5. nor in the row', r['row'], left + ' After that, 2025’s allowance is gone for good.')
    r = R[('index.html', LAST)]
    eq('5. an hour before 18 November ends', (r['chip'], r['band'][:3], r['head'].startswith(PASSED)), ('0d 00h 59m', ['00', '00', '59'], True))
    r = R[('index.html', ROLL)]
    eq('5. a second after it, the next year\'s cut-off', (r['chip'], r['band'][:2], r['chipLab']), ('330d 22h 59m', ['330', '22'], 'to book by 15 October'))
    eq('5. in the cut-off\'s words again', (r['eyebrow'], r['head']), ('Damian\u2019s cut-off', HEAD))
    eq('5. for the next tax year', r['year'], '2026')
    eq('5. and a year with no Revenue Online Service date says mid-November', r['rev'], REV_NEXT)
    r = R[('pension-calculator.html', ROLL)]
    eq('5. the row moves on too', r['row'].startswith('About 330 days left to book by 15 October') and '2026 tax bill' in r['row'], True)
    r = R[('index.html', NOROS)]
    left = PASSED + 'About 16 days left until 31 October, Revenue’s deadline for the 2026 tax year.'
    eq('5. with no online date for the year, the count after the cut-off is to 31 October', (r['chip'], r['band'][:3]), ('16d 00h 59m', ['16', '00', '59']))
    eq('5. and the band says so', (r['head'], r['sr'], r['year']), (PASSED + 'Revenue’s deadline is 31 October.', left, '2026'))
    r = R[('broker-vs-autoenrolment.html', NOROS)]
    eq('5. and the row', r['row'], left + ' After that, 2026’s allowance is gone for good.')
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
