#!/usr/bin/env python3
"""The cookie choice and Google Tag Manager, in headless Chrome (Run 27).

    python3 tests/consent.test.py

ONE Chrome launch. A parent page opens each job in a same-origin iframe,
after setting the stored answer ('pb-consent') the job starts from, and a
probe injected at the foot of the page reports what it finds. Google's
server is never reached: www.googletagmanager.com resolves to nothing, so
the test sees the script element GTM would load, never Google's reply.

What it proves:
  1. every root page, with no answer yet: the bar is up, no GTM script
     element exists, window.dataLayer does not exist, PBTrack does
  2. "No thanks": remembered, the bar goes, nothing loads, and on the next
     page nothing loads and no bar returns; Google Analytics cookies an
     earlier "accepted" left are deleted
  3. "That's fine": remembered, GTM's script for GTM-KQCRZDNB is added
     once, and on the next page it loads with no bar
  4. an event sent before the answer waits in memory: accepted, it reaches
     the dataLayer after gtm.js; refused, it is gone; sent after a refusal,
     it is never kept, so changing to yes later on the page sends neither
  5. PBTrack's `then` runs at once without GTM, and within ~1.6 s with a
     GTM that never answers
  6. the first real touch on a calculator is counted once, with its name;
     a replayed (untrusted) event and a lead form inside it are not
  7. the booking form's submit is an event; the Privacy Notice's button
     forgets the answer and brings the bar back
  8. at 320, 375 and 1200px, Ask Buddy's button sits above the bar, not on
     "That's fine"
"""
import base64, glob, html, json, os, re, socket, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
from harness import eq, report  # noqa: E402

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
GTM = 'https://www.googletagmanager.com/gtm.js?id=GTM-KQCRZDNB'

PROBE = r"""<script>
(function(){
  var R={errors:[]}, q=new URLSearchParams(location.search), job=q.get('__consent');
  window.addEventListener('error',function(e){ if(e.message) R.errors.push(String(e.message)); },true);
  function gtm(){ return [].map.call(document.querySelectorAll('script[src*="googletagmanager"]'),function(s){return s.src;}); }
  function state(){
    return {bar:!!document.querySelector('.pb-consent'), open:document.body.classList.contains('pb-banner-open'),
            gtm:gtm(), dl:window.dataLayer?window.dataLayer.map(function(e){return e.event||'';}):null,
            stored:localStorage.getItem('pb-consent'), track:typeof window.PBTrack};
  }
  function done(){ var p=document.createElement('pre'); p.id='__consent';
    p.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(R)))); document.body.appendChild(p); }
  function later(ms,f){ setTimeout(f,ms); }
  R.load=state();
  if(job==='load'){ return done(); }
  if(job==='no'){ document.cookie='_ga=GA1.1.1.1; path=/'; document.cookie='_gid=GA1.1.2; path=/';
    R.cookieBefore=document.cookie;
    document.querySelector('.pb-c-no').click(); R.after=state(); R.cookieAfter=document.cookie; return done(); }
  if(job==='yes'){ document.querySelector('.pb-c-yes').click(); R.after=state(); return done(); }
  if(job==='queue-yes'){ PBTrack('early',{n:1}); R.before=state(); document.querySelector('.pb-c-yes').click();
    R.after=state(); R.early=window.dataLayer.filter(function(e){return e.event==='early';}); return done(); }
  if(job==='queue-no'){ PBTrack('early'); document.querySelector('.pb-c-no').click(); R.after=state();
    PBTrack('late'); R.late=state();
    var b=document.createElement('button'); b.setAttribute('data-pb-consent-reset',''); document.body.appendChild(b);
    b.click(); document.querySelector('.pb-c-yes').click(); R.changed=state(); return done(); }
  if(job==='then-off'){ var hit=false; PBTrack('x',null,function(){hit=true;}); R.thenAtOnce=hit; return done(); }
  if(job==='then-on'){ var t0=performance.now(); PBTrack('x',null,function(){ R.thenMs=Math.round(performance.now()-t0); done(); }); return; }
  if(job==='first'){
    var root=document.querySelector('[data-pb-calc]'), el=root.querySelector('input[type=range]');
    var lead=root.querySelector('form[data-netlify] input[type=email]');
    R.calc=root.getAttribute('data-pb-calc');
    el.dispatchEvent(new Event('input',{bubbles:true}));                 // a replay: untrusted
    R.afterReplay=state().dl;
    PBConsent.first({isTrusted:true,type:'input',target:lead});          // the lead form: not the calculator
    R.afterLead=state().dl;
    PBConsent.first({isTrusted:true,type:'input',target:el});
    PBConsent.first({isTrusted:true,type:'click',target:el});
    R.events=window.dataLayer.filter(function(e){return e.event==='calculator_first_interaction';});
    return done();
  }
  if(job==='booking'){
    document.getElementById('qName').value='Test Person'; document.getElementById('qEmail').value='test@example.com';
    document.getElementById('pDirector').click(); document.getElementById('qualForm').requestSubmit();
    later(200,function(){ R.after=state(); done(); }); return;
  }
  if(job==='overlap'){
    // Ask Buddy moves with a 0.2s transition, and virtual time runs no frames,
    // so the probe reads where it comes to rest: transitions off, then measure
    var st=document.createElement('style'); st.textContent='*{transition:none!important}'; document.head.appendChild(st);
    later(50,function(){
      var b=document.querySelector('.pb-consent'), k=document.getElementById('pbBuddyBtn')||document.querySelector('.pb-b-btn');
      var br=b.getBoundingClientRect(), kr=k?k.getBoundingClientRect():null;
      R.width=innerWidth; R.barTop=Math.round(br.top); R.barHeight=Math.round(br.height);
      R.lift=getComputedStyle(document.body).getPropertyValue('--pb-consent-h');
      R.buddyCss=k?getComputedStyle(k).bottom:null;
      R.buddyBottom=kr?Math.round(kr.bottom):null; done();
    });
    return;
  }
  if(job==='reset'){ document.querySelector('[data-pb-consent-reset]').click(); R.after=state();
    R.focus=document.activeElement&&document.activeElement.className; return done(); }
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
        if u.path == '/__consent':
            body = ('<!doctype html><meta charset="utf-8"><body><script>'
                    'var JOBS=%s,OUT=[];'
                    'function next(){var j=JOBS.shift();if(!j){var p=document.createElement("pre");p.id="__all";'
                    'p.textContent=JSON.stringify(OUT);document.body.appendChild(p);return;}'
                    'if(j[2]==="fresh")localStorage.removeItem("pb-consent");else localStorage.setItem("pb-consent",j[2]);'
                    'var f=document.createElement("iframe");f.style.cssText="width:"+(j[3]||1200)+"px;height:800px";'
                    'f.src="/"+j[0]+"?__consent="+j[1];document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=f.contentDocument.getElementById("__consent");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],j[2],p.textContent,j[3]||1200]);f.remove();next();return;}'
                    'if(n>1200){OUT.push([j[0],j[1],j[2],null,j[3]||1200]);f.remove();next();return;}setTimeout(poll,25);})();}'
                    'next();</script></body>') % q['jobs'][0]
            return self._send(body.encode('utf-8'))
        path = u.path.lstrip('/')
        fs = os.path.join(ROOT, path)
        if path.endswith('.html') and os.path.isfile(fs) and '__consent' in q:
            t = open(fs, encoding='utf-8').read()
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


CALCS = {
    'pension-calculator.html': 'pension-calculator',
    'director-calculator.html': 'director-calculator',
    'broker-vs-autoenrolment.html': 'broker-vs-autoenrolment',
    'pension-fees-calculator.html': 'pension-fees-calculator',
    'pia.html': 'pia',
    'standard-fund-threshold.html': 'standard-fund-threshold',
    'state-pension-entitlement.html': 'state-pension-entitlement',
    'state-pension-reality-check.html': 'state-pension-reality-check',
}


def main():
    if not os.path.exists(CHROME):
        print('Chrome not found at %s' % CHROME)
        sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    pages = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, '*.html')))
    jobs = [[p, 'load', 'fresh'] for p in pages]
    jobs += [['index.html', 'no', 'fresh'], ['starter.html', 'load', 'rejected'],
             ['index.html', 'yes', 'fresh'], ['starter.html', 'load', 'accepted'],
             ['index.html', 'queue-yes', 'fresh'], ['index.html', 'queue-no', 'fresh'],
             ['index.html', 'then-off', 'fresh'], ['index.html', 'then-on', 'accepted'],
             ['booking.html', 'booking', 'accepted'], ['privacy.html', 'reset', 'accepted']]
    jobs += [[p, 'first', 'accepted'] for p in sorted(CALCS)]
    jobs += [[p, 'overlap', 'fresh', w] for p in ('director.html', 'index.html', 'pension-calculator.html')
             for w in (320, 375, 1200)]
    url = 'http://127.0.0.1:%d/__consent?jobs=%s' % (port, json.dumps(jobs).replace(' ', ''))
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
                        '--disable-extensions', '--mute-audio', '--window-size=1280,1000',
                        '--host-resolver-rules=MAP www.googletagmanager.com ~NOTFOUND',
                        '--virtual-time-budget=240000', '--dump-dom', url],
                       capture_output=True, timeout=300)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'<pre id="__all">([^<]*)</pre>', dom)
    eq('0. one Chrome launch returned every job', bool(m), True)
    if not m:
        report(); return
    R, OVER = {}, []
    for row in json.loads(html.unescape(m.group(1))):
        page, job, start, b64 = row[:4]
        got = json.loads(base64.b64decode(b64).decode('utf-8')) if b64 else None
        if job == 'overlap':
            OVER.append((page, row[4], got))
        R[(page, job, start)] = got

    # 1
    for page in pages:
        r = R.get((page, 'load', 'fresh'))
        eq('1. %s: reported' % page, r is not None, True)
        if not r:
            continue
        L = r['load']
        eq('1. %s: no answer yet, the bar is up' % page, (L['bar'], L['open']), (True, True))
        eq('1. %s: and nothing from Google is loaded' % page, (L['gtm'], L['dl']), ([], None))
        eq('1. %s: PBTrack is there for the page' % page, L['track'], 'function')
        eq('1. %s: no script error' % page, r['errors'], [])
        src = open(os.path.join(ROOT, page), encoding='utf-8').read()
        eq('1. %s: loads pb-consent.js once, and names Google nowhere itself' % page,
           (src.count('assets/js/pb-consent.js'), 'googletagmanager' in src, 'ANALYTICS_SRC' in src), (1, False, False))

    # 2
    r = R[('index.html', 'no', 'fresh')]['after']
    eq('2. "No thanks" is remembered', r['stored'], 'rejected')
    eq('2. the bar goes, and nothing loads', (r['bar'], r['open'], r['gtm'], r['dl']), (False, False, [], None))
    rr = R[('index.html', 'no', 'fresh')]
    eq('2. the analytics cookies were there', '_ga=' in rr['cookieBefore'] and '_gid=' in rr['cookieBefore'], True)
    eq('2. and are deleted', ('_ga=' in rr['cookieAfter'], '_gid=' in rr['cookieAfter']), (False, False))
    L = R[('starter.html', 'load', 'rejected')]['load']
    eq('2. on the next page: no bar, nothing loads', (L['bar'], L['gtm'], L['dl']), (False, [], None))
    # 3
    r = R[('index.html', 'yes', 'fresh')]['after']
    eq('3. "That\'s fine" is remembered', r['stored'], 'accepted')
    eq('3. the bar goes', (r['bar'], r['open']), (False, False))
    eq('3. GTM-KQCRZDNB is loaded, once', r['gtm'], [GTM])
    eq('3. gtm.js starts the dataLayer', r['dl'], ['gtm.js'])
    L = R[('starter.html', 'load', 'accepted')]['load']
    eq('3. on the next page: loaded, no bar', (L['bar'], L['gtm'], L['dl']), (False, [GTM], ['gtm.js']))
    # 4
    r = R[('index.html', 'queue-yes', 'fresh')]
    eq('4. before the answer, the event waits and nothing loads', (r['before']['gtm'], r['before']['dl']), ([], None))
    eq('4. accepted: it follows gtm.js into the dataLayer', r['after']['dl'], ['gtm.js', 'early'])
    eq('4. with its fields', r['early'], [{'event': 'early', 'n': 1}])
    r = R[('index.html', 'queue-no', 'fresh')]
    eq('4. refused: it is gone, and nothing loads', (r['after']['gtm'], r['after']['dl']), ([], None))
    eq('4. and an event after refusing is not kept either', (r['late']['gtm'], r['late']['dl']), ([], None))
    eq('4. so a later yes on the same page sends neither', r['changed']['dl'], ['gtm.js'])
    # 5
    eq('5. without GTM, then runs at once', R[('index.html', 'then-off', 'fresh')]['thenAtOnce'], True)
    ms = (R[('index.html', 'then-on', 'accepted')] or {}).get('thenMs')
    eq('5. with a GTM that never answers, then runs by ~1.6 s', ms is not None and ms <= 1700, True)
    # 6
    for page, name in sorted(CALCS.items()):
        r = R.get((page, 'first', 'accepted'))
        eq('6. %s: reported' % page, r is not None, True)
        if not r:
            continue
        eq('6. %s: marked "%s"' % (page, name), r['calc'], name)
        eq('6. %s: a replayed event is not the reader' % page, r['afterReplay'], ['gtm.js'])
        eq('6. %s: nor is its lead form' % page, r['afterLead'], ['gtm.js'])
        eq('6. %s: the first real touch counts once' % page, r['events'],
           [{'event': 'calculator_first_interaction', 'calculator': name}])
        eq('6. %s: no script error' % page, r['errors'], [])
    # 8
    for page in ('director.html', 'index.html', 'pension-calculator.html'):
        for w in (320, 375, 1200):
            r = R.get((page, 'overlap', 'fresh'))
            r = [x for x in OVER if x[0] == page and x[1] == w]
            r = r[0][2] if r else None
            eq('8. %s at %dpx: reported' % (page, w), r is not None, True)
            if r:
                eq('8. %s at %dpx: Ask Buddy sits above the bar, not on it' % (page, w),
                   r['buddyBottom'] is not None and r['buddyBottom'] <= r['barTop'], True)
    # 7
    r = R[('booking.html', 'booking', 'accepted')]['after']
    eq('7. the booking form\'s submit is an event', r['dl'], ['gtm.js', 'booking_form_submit'])
    r = R[('privacy.html', 'reset', 'accepted')]
    eq('7. the Privacy Notice\'s button forgets the answer', r['after']['stored'], None)
    eq('7. and brings the bar back', (r['after']['bar'], r['after']['open']), (True, True))
    eq('7. with the focus on it', r['focus'], 'pb-c-yes')
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
