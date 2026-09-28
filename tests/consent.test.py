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
     element exists, window.dataLayer does not exist, PBTrack does; and
     keyboard focus is scrolled clear of the bar (html.pb-consent-open,
     8px over its height), room that goes with the bar in 2 and 3
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
  9. on a phone's first load (320x568, 375x667, 375x812, 412x915, 560x800, and held
     sideways at 667x375 and 915x412), on the 14 pages whose first screen
     carries the regulator and QFA line (the hero's lockup or the page
     header's review line): that line is drawn, on the screen, whole, and
     the cookie bar is below it; the bar is one line with its link and two
     buttons side by side, 100px or less, and on a phone the line over the
     buttons, which are 44px tall and the same width; of the lockup's two copies exactly one is drawn, the
     one under the eyebrow, so keyboard order is drawing order; and at
     1200x800 the one at the end, as before (Run 33)
  8. at 320, 375 and 1200px, while the choice is open Ask Buddy's button
     waits unseen (and so out of the tab order), never on the bar; once
     the choice is made it is back, whole, in its corner (Run 32, part 3b)
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
            stored:localStorage.getItem('pb-consent'), track:typeof window.PBTrack,
            // while the bar is up, focus is scrolled clear of it: the class and its height on <html>
            pad:(function(){ var d=document.documentElement, b=document.querySelector('.pb-consent');
              return [d.classList.contains('pb-consent-open'), getComputedStyle(d).scrollPaddingBottom, b?b.offsetHeight+8+'px':null]; })()};
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
    // Ask Buddy moves with a transition, and virtual time runs no frames, so
    // the probe reads where it comes to rest: transitions off, then measure.
    // While the choice is open it waits unseen (Run 32, part 3b); once the
    // choice is made it comes back to its corner
    var st=document.createElement('style'); st.textContent='*{transition:none!important}'; document.head.appendChild(st);
    function buddy(){
      var b=document.querySelector('.pb-consent'), k=document.getElementById('pbBuddyBtn');
      var kr=k?k.getBoundingClientRect():null, br=b&&document.body.classList.contains('pb-banner-open')?b.getBoundingClientRect():null;
      // its corner, whether or not it is aside now, and what of the page lies there
      var aside=!!k&&k.classList.contains('pb-b-aside'), home=kr&&{left:kr.left-(aside?kr.width+32:0),top:kr.top,bottom:kr.bottom};
      if(home)home.right=home.left+kr.width;
      var under=!!home&&[].some.call(document.querySelectorAll(PBMotion.CAVEATS+',input:not([type=hidden]),select,textarea'),function(el){
        if(el.closest('.pb-bookbar,.pb-peek,.pb-consent,#pbBuddyPanel,#pbBuddyBtn'))return false;
        var r=el.getBoundingClientRect(); return r.width>0&&r.left<home.right+8&&r.right>home.left-8&&r.top<home.bottom+8&&r.bottom>home.top-8;
      });
      return {width:innerWidth, barTop:br?Math.round(br.top):null, aside:aside, under:under,
              shown:!!k&&getComputedStyle(k).visibility==='visible',
              onBar:!!(kr&&br)&&kr.bottom>br.top&&kr.top<br.bottom&&kr.right>br.left&&kr.left<br.right,
              inView:!!kr&&kr.left>=0&&kr.right<=document.documentElement.clientWidth&&kr.top>=0&&kr.bottom<=innerHeight};
    }
    // Ask Buddy's script starts after the first frame (type="text/pb-late"):
    // wait for its button, so "unseen" is never just "not there yet"
    (function wait(n){
      if(!document.getElementById('pbBuddyBtn')&&n<80){ later(25,function(){ wait(n+1); }); return; }
      later(50,function(){
        R.exists=!!document.getElementById('pbBuddyBtn'); R.open=buddy();
        document.querySelector('.pb-c-no').click();
        later(50,function(){ R.after=buddy(); done(); });
      });
    })(0);
    return;
  }
  if(job==='lockup'){
    // first load, no answer yet: the bar is up. The line a phone must show
    // on its first screen: the hero's lockup (exactly one of its two copies
    // is drawn), or the page header's review line. Drawn means a real box
    later(50,function(){
      function drawn(e){ return !!e && e.getClientRects().length>0 && getComputedStyle(e).visibility==='visible'; }
      function box(e){ var r=e.getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]; }
      var b=document.querySelector('.pb-consent'), regs=[].slice.call(document.querySelectorAll('.pb-hero-copy > .pb-reg'));
      var shown=regs.filter(drawn), l=shown[0]||[].filter.call(document.querySelectorAll('.phead .pb-reviewed'),drawn)[0]||null;
      var h1=document.querySelector('h1'), p=b?b.querySelector('p'):null;
      R.vw=document.documentElement.clientWidth; R.vh=innerHeight;
      R.regs=regs.length; R.regsDrawn=shown.length; R.line=l?l.className:null; R.box=l?box(l):null;
      R.beforeH1=l&&h1?!!(l.compareDocumentPosition(h1)&Node.DOCUMENT_POSITION_FOLLOWING):null;
      R.bar=b?box(b):null;
      R.pbox=p?box(p):null;
      R.textLines=p?Math.round(p.getBoundingClientRect().height/parseFloat(getComputedStyle(p).lineHeight)):null;
      R.text=p?p.textContent:null;
      R.link=p&&p.querySelector('a')?drawn(p.querySelector('a')):null;
      R.buttons=b?[].map.call(b.querySelectorAll('button'),function(x){ return drawn(x)?box(x):null; }):[];
      done();
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
                    'var f=document.createElement("iframe");f.style.cssText="width:"+(j[3]||1200)+"px;height:"+(j[4]||800)+"px";'
                    'f.src="/"+j[0]+"?__consent="+j[1];document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=f.contentDocument.getElementById("__consent");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],j[2],p.textContent,j[3]||1200,j[4]||800]);f.remove();next();return;}'
                    'if(n>1200){OUT.push([j[0],j[1],j[2],null,j[3]||1200,j[4]||800]);f.remove();next();return;}setTimeout(poll,25);})();}'
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


# Run 33: the pages whose first screen carries the regulator and QFA line
# (the hero's lockup, or the page header's review line), and the phones they
# are checked on: the widths Damian named, at the screens of the devices
# that have them (iPhone SE first and third generation, iPhone 12 mini,
# Pixel 7)
FIRST_SCREEN = ('index.html', 'director.html', 'starter.html', 'tracker.html',
                'pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html',
                'director-pension-rules.html', 'my-pensions.html', 'pension-fees-calculator.html', 'pia.html',
                'standard-fund-threshold.html', 'state-pension-entitlement.html', 'state-pension-reality-check.html')
PHONES = ((320, 568), (375, 667), (375, 812), (412, 915), (560, 800))   # 560: the widest the phone bar gets
SIDEWAYS = ((667, 375), (915, 412))   # phones held sideways: the bar is one row
WIDE = ((1200, 800),)                  # the lockup at the end of the hero, as it always was
HERO_PAGES = ('index.html', 'director.html', 'starter.html', 'tracker.html')

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
    jobs += [[p, 'lockup', 'fresh', w, h] for p in FIRST_SCREEN for (w, h) in PHONES + SIDEWAYS + WIDE]
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
    R, OVER, LOCK = {}, [], {}
    for row in json.loads(html.unescape(m.group(1))):
        page, job, start, b64 = row[:4]
        got = json.loads(base64.b64decode(b64).decode('utf-8')) if b64 else None
        if job == 'overlap':
            OVER.append((page, row[4], got))
        if job == 'lockup':
            LOCK[(page, row[4], row[5])] = got
        R[(page, job, start)] = got

    # 1
    for page in pages:
        r = R.get((page, 'load', 'fresh'))
        eq('1. %s: reported' % page, r is not None, True)
        if not r:
            continue
        L = r['load']
        eq('1. %s: no answer yet, the bar is up' % page, (L['bar'], L['open']), (True, True))
        eq('1. %s: and keyboard focus is scrolled clear of it (8px over its height)' % page, L['pad'][:2], [True, L['pad'][2]])
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
    eq('2. and the room kept for it goes', r['pad'], [False, 'auto', None])
    rr = R[('index.html', 'no', 'fresh')]
    eq('2. the analytics cookies were there', '_ga=' in rr['cookieBefore'] and '_gid=' in rr['cookieBefore'], True)
    eq('2. and are deleted', ('_ga=' in rr['cookieAfter'], '_gid=' in rr['cookieAfter']), (False, False))
    L = R[('starter.html', 'load', 'rejected')]['load']
    eq('2. on the next page: no bar, nothing loads', (L['bar'], L['gtm'], L['dl']), (False, [], None))
    # 3
    r = R[('index.html', 'yes', 'fresh')]['after']
    eq('3. "That\'s fine" is remembered', r['stored'], 'accepted')
    eq('3. the bar goes', (r['bar'], r['open']), (False, False))
    eq('3. and the room kept for it goes', r['pad'], [False, 'auto', None])
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
            r = [x for x in OVER if x[0] == page and x[1] == w]
            r = r[0][2] if r else None
            eq('8. %s at %dpx: reported' % (page, w), r is not None, True)
            if r:
                eq('8. %s at %dpx: while the choice is open, Ask Buddy waits unseen, not on the bar' % (page, w),
                   (r['exists'], r['open']['shown'], r['open']['onBar']), (True, False, False))
                # back in its corner, or aside for a caveat or a field that lies there
                # (whether the observer has reported it yet varies under virtual time)
                back = r['after']['shown'] and r['after']['barTop'] is None and (
                    (not r['after']['aside'] and r['after']['inView']) or (r['after']['aside'] and r['after']['under']))
                eq('8. %s at %dpx: once it is made, Ask Buddy is back in its corner, or aside for a caveat there' % (page, w),
                   back, True)
    # 9
    for page in FIRST_SCREEN:
        hero = page in HERO_PAGES
        for (w, h) in PHONES + SIDEWAYS + WIDE:
            r = LOCK.get((page, w, h))
            what = 'lockup' if hero else 'review line'
            eq('9. %s at %dx%d: reported, and the %s drawn' % (page, w, h, what), bool(r) and r['box'] is not None, True)
            if not r or r['box'] is None:
                continue
            L, T, Rt, B = r['box']
            if hero:
                eq('9. %s at %dx%d: one of the lockup\'s two copies is drawn, the %s, and keyboard order is drawing order'
                   % (page, w, h, 'one under the eyebrow' if (w, h) not in WIDE else 'one at the end'),
                   (r['regs'], r['regsDrawn'], r['line'], r['beforeH1']),
                   (2, 1, 'pb-reg pb-reg-top', True) if (w, h) not in WIDE else (2, 1, 'pb-reg', False))
            if (w, h) in WIDE:
                continue
            eq('9. %s at %dx%d: the %s is on the first screen, whole, and the cookie bar is below it' % (page, w, h, what),
               (B > T, Rt > L, T >= 0, B <= r['vh'], L >= 0, Rt <= r['vw'], r['bar'] is not None and B <= r['bar'][1]),
               (True, True, True, True, True, True, True))
            eq('9. %s at %dx%d: the bar is one line, the link and two buttons side by side, 100px or less' % (page, w, h),
               (r['textLines'], r['text'], r['link'], len([x for x in r['buttons'] if x]),
                len(set(x[1] // 4 for x in r['buttons'] if x)) == 1, r['bar'][3] - r['bar'][1] <= 100),
               (1, 'May we use a little analytics? Privacy Notice', True, 2, True, True))
            if (w, h) in PHONES:
                bs = [x for x in r['buttons'] if x]
                bw = [x[2] - x[0] for x in bs]
                eq('9. %s at %dx%d: on a phone the line sits over the buttons, which are 44px tall, one line of label each, and the same width' % (page, w, h),
                   (r['pbox'][3] <= min(x[1] for x in bs), all(44 <= x[3] - x[1] <= 48 for x in bs), len(bw) == 2 and abs(bw[0] - bw[1]) <= 4),
                   (True, True, True))
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
