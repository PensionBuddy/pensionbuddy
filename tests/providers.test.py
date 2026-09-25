#!/usr/bin/env python3
"""The provider ticker, in headless Chrome (Run 29).

    python3 tests/providers.test.py

Two Chrome launches, one with reduced motion forced on. The ticker ships
switched off, so the page is loaded twice: as it ships, and with
assets/js/pb-providers.js served with `var ON = true;` (the served bytes
only: the file on disk is never touched).

What it proves:
  1. as shipped: the flag is off in the file, and the home page shows
     nothing: the mount is empty and hidden, no .pb-prov, no injected style
  2. switched on: under the label "Providers we hold agencies with", one list
     of the providers in the file's order, each a box with its name, the
     loop's copies hidden from screen readers; the strip is faded at both
     edges and moving; the Pause button stops it and says so (aria-pressed)
     and Play starts it again; hovering pauses it (the rule is in the
     stylesheet it injects); nothing runs past the window at 375 or 1440px
  3. switched on, with reduced motion: a still row, wrapped, no copies shown,
     no fades, no Pause button
  4. the words: "partner" and "we work with" appear only in the comment
     that rules them out; the label is set once
"""
import base64, html, json, os, re, socket, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
from harness import eq, report  # noqa: E402

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
JS = 'assets/js/pb-providers.js'
SRC = open(os.path.join(ROOT, JS), encoding='utf-8').read()
NAMES = re.findall(r"\{ name: '([^']+)', logo: null \}", SRC)

PROBE = r"""<script>
(function(){
  var R={errors:[]};
  window.addEventListener('error',function(e){ if(e.message) R.errors.push(String(e.message)); },true);
  function done(){ var p=document.createElement('pre'); p.id='__prov';
    p.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(R)))); document.body.appendChild(p); }
  setTimeout(function(){
    var m=document.querySelector('[data-pb-providers]'), root=document.querySelector('.pb-prov');
    R.mounts=document.querySelectorAll('[data-pb-providers]').length;
    R.mount=m?{hidden:m.hidden, kids:m.children.length, shown:getComputedStyle(m).display!=='none'}:null;
    R.root=!!root; R.style=[].some.call(document.querySelectorAll('style'),function(s){return s.textContent.indexOf('.pb-prov')>=0;});
    R.w=innerWidth; R.sw=document.documentElement.scrollWidth;
    if(!root) return done();
    var track=root.querySelector('.pb-prov-track'), strip=root.querySelector('.pb-prov-strip');
    R.label=root.querySelector('.pb-prov-label').textContent;
    R.labelledby=track.getAttribute('aria-labelledby')==='pbProvLabel';
    R.spoken=[].map.call(track.querySelectorAll('li:not([aria-hidden="true"])'),function(li){return li.textContent;});
    R.clones=[].every.call(track.querySelectorAll('li.is-clone'),function(li){return li.getAttribute('aria-hidden')==='true';});
    R.cloneCount=track.querySelectorAll('li.is-clone').length;
    R.shownClones=[].filter.call(track.querySelectorAll('li.is-clone'),function(li){return getComputedStyle(li).display!=='none';}).length;
    R.boxes=[].every.call(track.querySelectorAll('.pb-prov-box'),function(b){var r=b.getBoundingClientRect();return r.width>=100&&r.height>=40;});
    var cs=getComputedStyle(strip); R.mask=(cs.maskImage||cs.webkitMaskImage||'none');
    R.anim=[getComputedStyle(track).animationName,getComputedStyle(track).animationPlayState];
    R.wrap=getComputedStyle(track).flexWrap;
    var pb=root.querySelector('.pb-prov-pause'); R.pauseShown=getComputedStyle(pb).display!=='none';
    /* Under --virtual-time-budget no frame is drawn, so a CSS animation never
       starts its clock and cannot be watched moving. Instead: seek it halfway
       and see the track has moved left by a quarter of one set's journey or
       more, and read that it loops for ever. */
    var an=track.getAnimations?track.getAnimations()[0]:null;
    if(an){ var tm=an.effect.getTiming(); R.loop=[tm.duration>0, String(tm.iterations)];
      an.currentTime=tm.duration/2; R.moved=new DOMMatrix(getComputedStyle(track).transform).m41<-50; an.currentTime=0; }
    else { R.loop=null; R.moved=false; }
    setTimeout(function(){
      pb.click(); R.paused=[getComputedStyle(track).animationPlayState,pb.getAttribute('aria-pressed'),pb.textContent];
      pb.click(); R.played=[getComputedStyle(track).animationPlayState,pb.getAttribute('aria-pressed'),pb.textContent];
      R.hoverRule=[].some.call(document.styleSheets,function(s){try{return [].some.call(s.cssRules,function(r){
        return /\.pb-prov-strip:hover \.pb-prov-track/.test(r.selectorText||'') && r.style.animationPlayState==='paused';});}catch(e){return false;}});
      R.sw2=document.documentElement.scrollWidth;
      done();
    },700);
  },300);
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
        if u.path == '/__prov':
            body = ('<!doctype html><meta charset="utf-8"><body style="margin:0"><script>'
                    'var JOBS=%s,OUT=[];localStorage.setItem("pb-consent","rejected");'
                    'function next(){var j=JOBS.shift();if(!j){var p=document.createElement("pre");p.id="__all";'
                    'p.textContent=JSON.stringify(OUT);document.body.appendChild(p);return;}'
                    'var f=document.createElement("iframe");f.style.cssText="border:0;width:"+j[1]+"px;height:900px";'
                    'f.src="/index.html?__prov="+j[0];document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=f.contentDocument.getElementById("__prov");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],p.textContent]);f.remove();next();return;}'
                    'if(n>800){OUT.push([j[0],j[1],null]);f.remove();next();return;}setTimeout(poll,25);})();}'
                    'next();</script></body>') % q['jobs'][0]
            return self._send(body.encode('utf-8'))
        path = u.path.lstrip('/')
        if path == 'index.html' and '__prov' in q:
            t = open(os.path.join(ROOT, path), encoding='utf-8').read()
            mode = q['__prov'][0]
            # the page asks for the script by its stamped URL; tag the request so
            # the handler knows which copy to serve
            t = re.sub(r'(assets/js/pb-providers\.js\?v=[0-9a-f]+)', r'\1&mode=' + mode, t)
            t = t.replace('</body>', PROBE + '</body>', 1)
            return self._send(t.encode('utf-8'))
        if path == JS:
            t = SRC
            if q.get('mode', [''])[0] == 'on':
                t = t.replace('var ON = false;', 'var ON = true;', 1)
            return self._send(t.encode('utf-8'), 'application/javascript')
        return super().do_GET()

    def _send(self, b, ctype='text/html; charset=utf-8'):
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(b)


def launch(port, jobs, extra=()):
    url = 'http://127.0.0.1:%d/__prov?jobs=%s' % (port, json.dumps(jobs).replace(' ', ''))
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
                        '--disable-extensions', '--mute-audio', '--hide-scrollbars', '--window-size=1500,1000',
                        '--host-resolver-rules=MAP www.googletagmanager.com ~NOTFOUND'] + list(extra) +
                       ['--virtual-time-budget=60000', '--dump-dom', url], capture_output=True, timeout=120)
    m = re.search(r'<pre id="__all">([^<]*)</pre>', p.stdout.decode('utf-8', 'replace'))
    if not m:
        return None
    return {(j, w): (json.loads(base64.b64decode(b).decode('utf-8')) if b else None)
            for j, w, b in json.loads(html.unescape(m.group(1)))}


def main():
    if not os.path.exists(CHROME):
        print('Chrome not found at %s' % CHROME)
        sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    R = launch(port, [['off', 1440], ['off', 375], ['on', 1440], ['on', 375]])
    M = launch(port, [['on', 1440]], ['--force-prefers-reduced-motion'])
    eq('0. both Chrome launches returned every job', (R is not None, M is not None), (True, True))
    if R is None or M is None:
        srv.shutdown(); report(); return

    # 1
    eq('1. the flag in the file is off', 'var ON = false;' in SRC and 'var ON = true;' not in SRC, True)
    for w in (1440, 375):
        r = R[('off', w)]
        eq('1. off at %dpx: one mount on the home page, empty and hidden' % w,
           (r['mounts'], r['mount']), (1, {'hidden': True, 'kids': 0, 'shown': False}))
        eq('1. off at %dpx: no ticker and no styles for it' % w, (r['root'], r['style']), (False, False))
        eq('1. off at %dpx: no script error' % w, r['errors'], [])
    # 2
    eq('2. the file lists the six providers, in order', NAMES,
       ['Zurich', 'Irish Life', 'Aviva', 'New Ireland', 'Royal London', 'Standard Life'])
    for w in (1440, 375):
        r = R[('on', w)]
        eq('2. on at %dpx: shown' % w, (r['root'], r['mount']['hidden'], r['mount']['shown']), (True, False, True))
        eq('2. on at %dpx: the label' % w, r['label'], 'Providers we hold agencies with')
        eq('2. on at %dpx: one list, labelled, of the providers in order' % w, (r['labelledby'], r['spoken']), (True, NAMES))
        eq('2. on at %dpx: the loop\'s copies are hidden from screen readers' % w, (r['clones'], r['cloneCount'] > 0), (True, True))
        eq('2. on at %dpx: every provider a box with its name' % w, r['boxes'], True)
        eq('2. on at %dpx: faded at both edges' % w, 'linear-gradient' in r['mask'], True)
        eq('2. on at %dpx: moving, in a loop that never ends' % w, (r['anim'], r['moved'], r['loop']),
           (['pbProv', 'running'], True, [True, 'Infinity']))
        eq('2. on at %dpx: Pause stops it and says so' % w, r['paused'], ['paused', 'true', 'Play'])
        eq('2. on at %dpx: Play starts it again' % w, r['played'], ['running', 'false', 'Pause'])
        eq('2. on at %dpx: hovering pauses it' % w, r['hoverRule'], True)
        eq('2. on at %dpx: nothing past the window' % w, (r['sw'] <= w, r['sw2'] <= w), (True, True))
        eq('2. on at %dpx: no script error' % w, r['errors'], [])
    # 3
    r = M[('on', 1440)]
    eq('3. reduced motion: shown', r['root'], True)
    eq('3. reduced motion: a still row, wrapped', (r['anim'][0], r['loop'], r['wrap']), ('none', None, 'wrap'))
    eq('3. reduced motion: the providers once, no copies shown', (r['spoken'], r['shownClones']), (NAMES, 0))
    eq('3. reduced motion: no fades, no Pause button', (r['mask'], r['pauseShown']), ('none', False))
    # 4
    eq('4. "partner" and "we work with" appear only in the comment that rules them out',
       [l.strip() for l in SRC.split('\n') if 'partner' in l.lower() or 'we work with' in l.lower()],
       ['The wording is "Providers we hold agencies with". Not "partners", not',
        '"we work with": an agency is the fact, a partnership is a claim.'])
    eq('4. the label is set in one place, and is the brief\'s', re.findall(r"var LABEL = '([^']*)';", SRC),
       ['Providers we hold agencies with'])
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
