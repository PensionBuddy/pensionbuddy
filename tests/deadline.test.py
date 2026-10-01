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
     deadline in days, hours and minutes ("54d 12h 59m"), says so to a
     screen reader in days with
     the tax year, and its label reads "to Revenue's deadline"
  2. the home page's band: eyebrow "Revenue's deadline", heading "Revenue's
     deadline is 18 November if you pay and file online.", its clock
     days, hours and minutes and no seconds, 31 October as the second line,
     the tax year and the screen-reader line; the same words as the page's
     markup, so a reader without JavaScript reads what a reader with it
     reads, and without JavaScript the clock stays hidden, not "--"
  3. the calculators' "Tax deadline" row counts to 18 November and gives 31
     October beside it
  4. through the year: the day after the old cut-off changes nothing; on 1
     November 31 October is marked passed; an hour before 18 November ends
     the chip says 0d 00h 59m; a second after it, everything moves on to the
     next tax year, and in a year with no Revenue Online Service date (2027)
     the count is to 31 October and the online date is "usually later, in
     mid-November"; a second after that 31 October, on to 2028
  5. on the minute, never the second (Run 41; Run 32's D21 had no timer):
     pb-deadline.js sets no interval, only a timeout to the turn of the
     count's minute; pinned three seconds before that turn, the chip and
     the band read the same a second later and one minute less after it;
     within the minute nothing changes on its own, and coming back to the
     tab (visibilitychange) or to the page from the back-forward cache
     (pageshow) counts again; and no page pulses the chip's dot
  6. without JavaScript (Run 32): on every page the chip carries the date,
     "18 Nov 2026, online" ("18 Nov 2026" beside the links from 1440, where
     ", online" would overrun the row), and a name that says so, and the
     calculators' row the date sentence, all in the words of
     PBDeadline.statics(); rendered with every script stripped, at 1440 (the
     chip beside the links, the least room), 1200 and 900, that is what
     shows, the live spans do not, and the nav still fits its row; with
     JavaScript only the live spans show. Every markup check here, and the
     band's in 2, holds the markup to PBDeadline.statics() by the REAL clock,
     not a pinned one: from 19 November 2026 they fail, printing the words
     the markup must move on to, and pass again once it has; the pinned date
     tests statics() itself
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
  window.Date=F; window.__dlShift=function(ms){ off+=ms; };
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
    R.band=t('tkD'); R.bandHM=[t('tkH'),t('tkM')]; var ck=document.querySelector('.tk-clock'); R.clockHidden=ck?ck.hidden:null;
    R.units=document.querySelectorAll('.tk-clock .tk-unit').length;
    var h=document.querySelector('.tick h2'); R.head=h?h.textContent:null;
    var e=document.querySelector('.tick .eyebrow'); R.eyebrow=e?e.textContent:null;
    R.rev=t('tkRev'); R.year=t('tkYear'); R.sr=t('tkSr'); R.row=t('deadlineText');
    R.statics=window.PBDeadline ? PBDeadline.statics(PBDeadline.at(new Date())) : null;
    var vis=function(x){ return x.getClientRects().length>0 && getComputedStyle(x).visibility!=='hidden'; };
    R.shown=chip ? [].filter.call(chip.children,vis).map(function(x){ return x.className; }) : null;
    R.chipShown=chip ? vis(chip) : null; R.clockShown=ck ? vis(ck) : null;
    R.pbjs=document.documentElement.classList.contains('pb-js');
    function out(){ var p=document.createElement('pre'); p.id='__dl';
      p.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(R)))); document.body.appendChild(p); }
    if(/[?&]__dlTick=1/.test(location.search)){
      // pinned three seconds before the count's minute turns: read at about
      // 1.2s (before it) and 2.5s (after it, and before a wall-clock minute would)
      setTimeout(function(){ R.tickSoon=[t('ntVal'),t('tkM')];
        setTimeout(function(){ R.tickAfter=[t('ntVal'),t('tkH'),t('tkM')]; out(); },1300);
      },1000);
      return;
    }
    if(!/[?&]__dlBack=1/.test(location.search)) return out();
    // a day later: nothing changes on its own; coming back does
    window.__dlShift(86400000);
    setTimeout(function(){
      R.laterAlone=t('ntVal');
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false})); R.laterReload=t('ntVal');
      document.dispatchEvent(new Event('visibilitychange')); R.laterTab=t('ntVal');
      window.__dlShift(86400000);
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})); R.laterCache=t('ntVal');
      out();
    },3000);
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
                    # a page with every script stripped runs no probe: read it from here
                    'function off(f){var d=f.contentDocument;'
                    # the frame's first document is about:blank, "complete" at once: wait for the page
                    'if(!d||d.readyState!=="complete"||d.location.search.indexOf("__nojs")<0)return null;'
                    'var w=f.contentWindow,ch=d.getElementById("navTick"),row=d.getElementById("deadlineText");'
                    # rendered: no box when it or any ancestor is display:none
                    'var vis=function(x){return x.getClientRects().length>0&&w.getComputedStyle(x).visibility!=="hidden";};'
                    'var sp=ch?[].filter.call(ch.children,vis):[];'
                    'var R={shown:sp.map(function(x){return x.className;}),text:sp.map(function(x){return x.innerText.replace(/\\s+/g," ").trim();}),'
                    'name:ch?ch.getAttribute("aria-label"):null,row:row?row.textContent:null,rowShown:row?vis(row):null,'
                    'pbjs:d.documentElement.classList.contains("pb-js"),scripts:d.scripts.length,chipShown:ch?vis(ch):null,'
                    'clock:d.querySelector(".tk-clock")?vis(d.querySelector(".tk-clock")):null};'
                    # against the row's own content edge, not the viewport: .nav-in is a padded .wrap
                    'var nv=d.querySelector(".nav-in");R.overrun=nv?Math.round(Math.max.apply(null,[].filter.call(nv.children,vis)'
                    '.map(function(k){return k.getBoundingClientRect().right;}))-(nv.getBoundingClientRect().right-parseFloat(w.getComputedStyle(nv).paddingRight))):null;'
                    'return {textContent:btoa(unescape(encodeURIComponent(JSON.stringify(R))))};}'
                    'function next(){var j=JOBS.shift();if(!j){var p=document.createElement("pre");p.id="__all";'
                    'p.textContent=JSON.stringify(OUT);document.body.appendChild(p);return;}'
                    'var f=document.createElement("iframe");f.style.cssText="width:1200px;height:800px";'
                    'var c=j[1].split("|"),nojs=c[0].indexOf("nojs:")===0;'
                    'if(nojs)f.style.width=c[0].split(":")[1]+"px";'
                    'f.src="/"+j[0]+(nojs?"?__nojs=1":"?__dl="+encodeURIComponent(c[0])+(c[1]?"&__dl"+(c[1]==="tick"?"Tick":"Back")+"=1":""));'
                    'document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=nojs?off(f):f.contentDocument.getElementById("__dl");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],p.textContent]);f.remove();next();return;}'
                    'if(n>800){OUT.push([j[0],j[1],null]);f.remove();next();return;}setTimeout(poll,25);})();}'
                    'next();</script></body>') % q['jobs'][0]
            return self._send(body.encode('utf-8'))
        path = u.path.lstrip('/')
        fs = os.path.join(ROOT, path)
        if path.endswith('.html') and os.path.isfile(fs) and '__nojs' in q:
            # the markup and CSS a reader without JavaScript gets: every script out
            t = re.sub(r'<script\b[^>]*>.*?</script>', '', open(fs, encoding='utf-8').read(), flags=re.S)
            return self._send(t.encode('utf-8'))
        if path.endswith('.html') and os.path.isfile(fs) and '__dl' in q:
            t = open(fs, encoding='utf-8').read()
            clock = q['__dl'][0].split('|')[0]
            if clock != 'real':
                t = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + CLOCK % json.dumps(clock), t, count=1)
            t = t.replace('</body>', PROBE + '</body>', 1)
            return self._send(t.encode('utf-8'))
        return super().do_GET()

    def _send(self, b):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        try:
            self.wfile.write(b)
        except (BrokenPipeError, ConnectionResetError):
            pass    # a frame removed before its page arrived



def right_after_row(src):
    """pb-deadline.js loads inside <main>, and nothing but a comment stands
    between the "Tax deadline" row's closing tag and its script tag"""
    row = src.find('id="deadlineText"')
    tag = src.find('<script src="assets/js/pb-deadline.js')
    close = src.find('</main>')
    if not (0 <= row < tag < close):
        return False
    between = re.sub(r'(?s)<!--.*?-->', '', src[src.find('</div>', row) + len('</div>'):tag])
    return between.strip() == ''

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
    DAY1 = '2026-11-17T12:00:00'
    TURN = '2026-09-25T12:00:57'    # the count's minute turns at :59, the deadline being 23:59:59
    jobs = [[p, NOW] for p in pages]
    jobs += [['index.html', OCT16], ['index.html', NOV], ['director-calculator.html', NOV],
             ['index.html', LAST], ['index.html', ROLL], ['pension-calculator.html', ROLL],
             ['index.html', ROLL2], ['broker-vs-autoenrolment.html', ROLL2],
             ['index.html', DAY1], ['index.html', NOW + '|back'], ['index.html', TURN + '|tick'],
             ['index.html', 'real'], ['pension-calculator.html', 'real']]
    # 1440 is where the chip sits beside the nav's links, with the least room;
    # 1200 and 900 put the links in the menu
    NOJS, NOJS_W = ['index.html', 'glossary.html', 'pia.html'] + list(CALCS), (1440, 1200, 900)
    jobs += [[p, 'nojs:%d' % w] for p in NOJS for w in NOJS_W]
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
        if 'id="deadlineText"' in src:
            # Run 32: straight after the row it fills, inside <main>, or the row
            # grows after the first paint and pushes the calculator down
            eq('1. %s: loads it straight after its "Tax deadline" row, inside <main>' % page,
               right_after_row(src), True)
        r = R.get((page, NOW))
        eq('1. %s: reported' % page, r is not None, True)
        if not r:
            continue
        # the clocks go back on 25 October, so the count has an hour more in it
        eq('1. %s: the chip counts days, hours and minutes to the end of 18 November' % page, r['chip'], '54d 12h 59m')
        eq('1. %s: and says so to a screen reader' % page, r['label'], LEFT + ' Opens the full explanation.')
        eq('1. %s: its label names Revenue\'s deadline' % page, r['chipLab'], 'to Revenue’s deadline')
        eq('1. %s: no script error' % page, r['errors'], [])
    # 2
    r = R[('index.html', NOW)]
    eq('2. the band: its eyebrow names whose date it is', r['eyebrow'], 'Revenue’s deadline')
    eq('2. the band: the online deadline', r['head'], HEAD)
    eq('2. the band: its clock, days, hours and minutes, there with JavaScript',
       (r['band'], r['bandHM'], r['units'], r['clockShown']), ('54', ['12', '59'], 3, True))
    eq('2. the band: 31 October as the second line', r['rev'], REV)
    eq('2. the band: the tax year', r['year'], '2025')
    eq('2. the band: for a screen reader', r['sr'], LEFT + ' ' + REV)
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    flat = re.sub(r'\s+', ' ', html.unescape(src))
    # the band's markup is what a reader without JavaScript gets: held to
    # today's words by the real clock (section 6), and they are these words
    # until 19 November 2026
    T = R[('index.html', 'real')]['statics']
    eq('2. without JavaScript the band says what the script says (by the real clock: move the markup on if not)',
       ('<span id="tkTag">Revenue’s deadline</span>' in flat, '<h2>%s</h2>' % T['bandHead'] in flat,
        '<span id="tkRev">%s</span>' % T['bandRev'] in flat, '<span id="tkYear">%s</span>' % T['bandYear'] in flat),
       (True, True, True, True))
    clock = re.search(r'<div class="tk-clock"([^>]*)>(.*?)</div> </div>', flat)
    # in the markup from the first paint (a hidden clock grew the band when the
    # foot script showed it), and hidden without JavaScript by html:not(.pb-js)
    eq('2. the clock is in the markup, shown from the first paint: days, hours, minutes, no seconds',
       bool(clock) and not re.search(r'(?<![\w-])hidden\b', clock.group(1)) and clock.group(2).count('class="tk-unit"') == 3 and
       all('id="%s"' % i in clock.group(2) for i in ('tkD', 'tkH', 'tkM')) and 'id="tkS"' not in src and
       'html:not(.pb-js) .tk-clock{display:none}' in src, True)
    chip = re.search(r'<a class="nav-tick" id="navTick"[^>]*>.*?</a>', flat)
    eq('2. the chip\'s live label names Revenue\'s deadline',
       bool(chip) and '<span class="nt-l nt-on" aria-hidden="true">to Revenue’s deadline</span>' in chip.group(0), True)
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
    eq('4. on 1 November: still counting to 18 November', (r['chip'], r['band']), ('17d 23h 59m', '17'))
    eq('4. and 31 October is marked passed', (r['rev'], r['sr']), (REV_PASSED, left + ' ' + REV_PASSED))
    r = R[('director-calculator.html', NOV)]
    eq('4. in the row too', r['row'], left + ' ' + REV_PASSED + ' After that, 2025’s allowance is gone for good.')
    r = R[('index.html', LAST)]
    eq('4. an hour before 18 November ends', (r['chip'], r['band'], r['bandHM'], r['head']), ('0d 00h 59m', '0', ['00', '59'], HEAD))
    r = R[('index.html', DAY1)]
    eq('4. a day and a half before it', (r['chip'], r['band']), ('1d 11h 59m', '1'))
    r = R[('index.html', ROLL)]
    left = 'About 346 days left until 31 October, Revenue’s deadline for the 2026 tax year.'
    eq('4. a second after it, the next tax year', (r['chip'], r['band'], r['year']), ('346d 23h 59m', '346', '2026'))  # both ends in GMT: the clocks go back on 31 October 2027
    eq('4. with no online date for 2027, the count is to 31 October',
       (r['head'], r['rev'], r['sr']), ('Revenue’s deadline is 31 October.', REV_NEXT, left + ' ' + REV_NEXT))
    r = R[('pension-calculator.html', ROLL)]
    eq('4. the row moves on too', r['row'], left + ' ' + REV_NEXT + ' After that, 2026’s allowance is gone for good.')
    r = R[('index.html', ROLL2)]
    eq('4. a second after 31 October 2027, on to 2028 and the 2027 tax year', (r['chip'], r['year']), ('365d 23h 59m', '2027'))  # and on 29 October 2028
    r = R[('broker-vs-autoenrolment.html', ROLL2)]
    eq('4. and the row', r['row'].endswith('2027’s allowance is gone for good.'), True)
    # 5
    js = open(os.path.join(ROOT, 'assets', 'js', 'pb-deadline.js'), encoding='utf-8').read()
    code = re.sub(r'(?s)/\*.*?\*/', '', js)
    eq('5. pb-deadline.js sets no interval, and one timeout', (re.findall(r'setInterval\s*\(', code),
       len(re.findall(r'setTimeout\s*\(', code))), ([], 1))
    r = R[('index.html', TURN + '|tick')]
    eq('5. three seconds before the minute turns, then one second on: unchanged',
       (r['chip'], r['bandHM'][1], r['tickSoon']), ('54d 12h 59m', '59', ['54d 12h 59m', '59']))
    eq('5. once it turns, a minute less, without a reload', r['tickAfter'], ['54d 12h 58m', '12', '58'])
    r = R[('index.html', NOW + '|back')]
    eq('5. a day later, within the minute nothing changes on its own, nor on a fresh pageshow',
       (r['chip'], r['laterAlone'], r['laterReload']), ('54d 12h 59m', '54d 12h 59m', '54d 12h 59m'))
    eq('5. coming back to the tab counts again', r['laterTab'], '53d 12h 59m')
    eq('5. and so does coming back from the back-forward cache', r['laterCache'], '52d 12h 59m')
    pulse = {}
    for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
        t = open(f, encoding='utf-8').read()
        css = re.sub(r'(?s)/\*.*?\*/', '', ' '.join(re.findall(r'(?is)<style[^>]*>(.*?)</style>', t)))
        found = re.findall(r'\.nt-dot\{[^}]*animation[^}]*\}|@keyframes ntPulse', css)
        if found:
            pulse[os.path.basename(f)] = found
    eq('5. no page pulses the chip\'s dot', pulse, {})

    # 6
    P = R[('index.html', NOW)]['statics']
    eq('6. PBDeadline.statics() on 25 September 2026',
       (P['chipDate'], P['chipMore'], P['bandHead'], P['bandRev'], P['bandYear']),
       ('18 Nov 2026', ', online', HEAD, REV, '2025'))
    eq('6. PBDeadline.statics() on 25 September 2026: the row', P['row'],
       '<b>18 November 2026</b>, Revenue’s deadline for the 2025 tax year if you ' + ONLINE +
       '. If you do not ' + ONLINE + ', it is 31 October 2026. After that, 2025’s allowance is gone for good.')
    # everything below holds the markup to the words by the REAL clock, so on
    # 19 November 2026 these fail until the markup moves on to what they print
    S = R[('index.html', 'real')]['statics']
    eq('6. by the real clock, the same words on the calculators\' page', R[('pension-calculator.html', 'real')]['statics'], S)
    def chip_off(src):
        flat = re.sub(r'\s+', ' ', html.unescape(src))
        m = re.search(r'<a class="nav-tick" id="navTick"[^>]*aria-label="([^"]*)"[^>]*>(.*?)</a>', flat)
        if not m:
            return None
        spans = [(c, re.sub(r'<[^>]+>', '', body)) for c, body in
                 re.findall(r'<span class="(nt-[^"]*)"[^>]*>((?:[^<]|<span class="nt-more">[^<]*</span>)*)</span>', m.group(2))]
        more = re.search(r'<span class="nt-n nt-off"[^>]*>[^<]*<span class="nt-more">([^<]*)</span></span>', m.group(2))
        return m.group(1), spans, more.group(1) if more else None
    LIVE = [('nt-dot', ''), ('nt-n nt-on', '--'), ('nt-l nt-on', 'to Revenue’s deadline')]
    WANT = (S['chipName'], LIVE + [('nt-n nt-off', S['chipDate'] + S['chipMore'])], S['chipMore'] or None)
    eq('6. every page: the chip carries today\'s date and a name that says so, for a reader without JavaScript',
       {pg: chip_off(open(os.path.join(ROOT, pg), encoding='utf-8').read()) for pg in pages
        if chip_off(open(os.path.join(ROOT, pg), encoding='utf-8').read()) != WANT}, {})
    def row_markup(src):
        m = re.search(r'<span class="dl-text" id="deadlineText">(.*?)</span>', src, re.S)
        return re.sub(r'\s+', ' ', html.unescape(m.group(1))).strip() if m else None
    for page in CALCS:
        eq('6. %s: the row carries today\'s date sentence' % page,
           row_markup(open(os.path.join(ROOT, page), encoding='utf-8').read()), S['row'])
    for page in pages:
        r = R.get((page, NOW))
        if r:
            eq('6. %s: with JavaScript only the live spans show' % page,
               (r['pbjs'], r['chipShown'], r['shown']), (True, True, ['nt-dot', 'nt-n nt-on']))
    plain = re.sub(r'<[^>]+>', '', S['row'])
    for page in NOJS:
        for w in NOJS_W:
            r = R.get((page, 'nojs:%d' % w))
            eq('6. %s at %dpx without JavaScript: reported, with no script left' % (page, w),
               bool(r) and (r['scripts'], r['pbjs']) == (0, False), True)
            if not r:
                continue
            eq('6. %s at %dpx without JavaScript: the chip shows the date, not "--"' % (page, w),
               (r['chipShown'], list(zip(r['shown'], r['text']))),
               (True, [('nt-dot', ''), ('nt-n nt-off', S['chipDate'] + ('' if w >= 1440 else S['chipMore']))]))
            if page == 'index.html':
                eq('6. index.html at %dpx without JavaScript: the band\'s clock is not shown, only its date sentence' % w,
                   r['clock'], False)
            eq('6. %s at %dpx without JavaScript: the nav still fits its row' % (page, w), r['overrun'] <= 0, True)
            eq('6. %s at %dpx without JavaScript: the chip\'s name says the date' % (page, w), r['name'], S['chipName'])
            if page in CALCS:
                eq('6. %s at %dpx without JavaScript: the row shows the date sentence, not nothing' % (page, w),
                   (r['rowShown'], re.sub(r'\s+', ' ', r['row'] or '').strip()), (True, plain))
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
