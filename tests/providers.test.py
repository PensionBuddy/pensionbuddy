#!/usr/bin/env python3
"""The provider ticker, in headless Chrome (Run 29; switched on in Run 35).

    python3 tests/providers.test.py

Two Chrome launches, one with reduced motion forced on. The ticker ships
switched on with the providers' own logos; the page is also loaded once with
assets/js/pb-providers.js served with `var ON = false;` (the served bytes
only: the file on disk is never touched), so the switch is proved both ways.

What it proves:
  1. the file: switched on; the six providers in order, each with a logo in
     assets/logos/ whose stated width and height are the file's own; every
     SVG 40px tall; nothing in assets/logos/ that is not on the list (no
     brand shown that is not an agency)
  2. on, at 1440 and 375px: under the label "Providers we hold agencies
     with", one list of the providers in the file's order, each a logo with
     its name as alt text and its space kept (width and height set); the
     loop's copies hidden from screen readers, with empty alt text; every
     logo the same height (32px, 28px on a phone); grey (grayscale(1)) until
     the pointer is on it, then its own colours (the rule is in the
     stylesheet it injects); every logo file loads; the strip faded at both
     edges and moving; Pause stops it and Play starts it again, the
     button's name always holding the word shown on it (WCAG 2.5.3), with no
     aria-pressed; hovering pauses it; nothing runs past the window
  3. on, with reduced motion: a still row, wrapped, one row at 1440px, no
     copies shown, no fades, no Pause button; still grey
  4. switched off (served bytes): the home page shows nothing: the mount is
     empty and hidden, no .pb-prov, no injected style
  5. the words: "partner" and "we work with" appear only in the comment
     that rules them out; the label is set once
  6. without JavaScript: the home page's <noscript> row has the same label
     and the same providers, in the same order, with the same files, alt
     text and sizes, grey until the pointer is on a logo
"""
import base64, html, json, os, re, socket, struct, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
from harness import eq, report  # noqa: E402

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
JS = 'assets/js/pb-providers.js'
SRC = open(os.path.join(ROOT, JS), encoding='utf-8').read()
ENTRY = re.compile(r"\{ name: '([^']+)', logo: '([^']+)', w: ([\d.]+), h: ([\d.]+) \}")
ENTRIES = ENTRY.findall(SRC)
NAMES = [e[0] for e in ENTRIES]
LOGOS = 'assets/logos'

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
    R.root=!!root; R.style=[].some.call(document.querySelectorAll('style'),function(s){return s.textContent.indexOf('.pb-prov-track')>=0;});
    R.w=innerWidth; R.sw=document.documentElement.scrollWidth;
    if(!root) return done();
    var track=root.querySelector('.pb-prov-track'), strip=root.querySelector('.pb-prov-strip');
    R.label=root.querySelector('.pb-prov-label').textContent;
    R.labelledby=track.getAttribute('aria-labelledby')==='pbProvLabel';
    var first=[].slice.call(track.querySelectorAll('li:not([aria-hidden="true"])'));
    R.spoken=first.map(function(li){var i=li.querySelector('img');return i?i.alt:li.textContent;});
    R.logos=first.map(function(li){var i=li.querySelector('img');return i?[i.getAttribute('src'),i.getAttribute('width'),i.getAttribute('height')]:null;});
    R.clones=[].every.call(track.querySelectorAll('li.is-clone'),function(li){return li.getAttribute('aria-hidden')==='true';});
    R.cloneAlts=[].every.call(track.querySelectorAll('li.is-clone img'),function(i){return i.getAttribute('alt')==='';});
    R.cloneCount=track.querySelectorAll('li.is-clone').length;
    R.shownClones=[].filter.call(track.querySelectorAll('li.is-clone'),function(li){return getComputedStyle(li).display!=='none';}).length;
    var imgs=[].slice.call(track.querySelectorAll('img'));
    R.heights=imgs.map(function(i){return Math.round(i.getBoundingClientRect().height*10)/10;}).filter(function(v,k,a){return a.indexOf(v)===k;});
    R.filters=imgs.map(function(i){return getComputedStyle(i).filter;}).filter(function(v,k,a){return a.indexOf(v)===k;});
    R.rows=first.map(function(li){return Math.round(li.getBoundingClientRect().top);}).filter(function(v,k,a){return a.indexOf(v)===k;}).length;
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
    function rule(re, test){ return [].some.call(document.styleSheets,function(s){try{return [].some.call(s.cssRules,function r(x){
      if(x.cssRules&&x.cssRules.length&&!x.selectorText) return [].some.call(x.cssRules,r);
      return re.test(x.selectorText||'') && test(x.style);});}catch(e){return false;}}); }
    /* the files, fetched as images: the strip's own are lazy and off screen */
    var srcs=R.logos.filter(Boolean).map(function(l){return l[0];});
    Promise.all(srcs.map(function(s){return new Promise(function(res){var t=new Image();
      t.onload=function(){res(t.naturalWidth>0);}; t.onerror=function(){res(false);}; t.src=s;});})).then(function(ok){
      R.loads=ok;
      R.before=[pb.getAttribute('aria-label'),pb.textContent,pb.hasAttribute('aria-pressed')];
      pb.click(); R.paused=[getComputedStyle(track).animationPlayState,pb.getAttribute('aria-label'),pb.textContent,pb.hasAttribute('aria-pressed')];
      pb.click(); R.played=[getComputedStyle(track).animationPlayState,pb.getAttribute('aria-label'),pb.textContent,pb.hasAttribute('aria-pressed')];
      R.hoverRule=rule(/\.pb-prov-strip:hover \.pb-prov-track/,function(st){return st.animationPlayState==='paused';});
      R.colourRule=rule(/^\.pb-prov-item:hover img$/,function(st){return st.filter==='none'&&st.opacity==='1';});
      R.sw2=document.documentElement.scrollWidth;
      done();
    });
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
            if q.get('mode', [''])[0] == 'off':
                t = t.replace('var ON = true;', 'var ON = false;', 1)
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


def file_size(rel):
    """(width, height) a logo file declares: an SVG's width and height
    attributes, a WebP's canvas (lossless VP8L, lossy VP8 or extended VP8X)."""
    path = os.path.join(ROOT, rel)
    if rel.endswith('.svg'):
        root = re.search(r'<svg\b[^>]*>', open(path, encoding='utf-8').read()).group(0)
        return (float(re.search(r'\swidth="([\d.]+)"', root).group(1)), float(re.search(r'\sheight="([\d.]+)"', root).group(1)))
    b = open(path, 'rb').read(40)
    if b[:4] != b'RIFF' or b[8:12] != b'WEBP':
        return None
    kind = b[12:16]
    if kind == b'VP8L':
        bits = struct.unpack('<I', b[21:25])[0]
        return ((bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1)
    if kind == b'VP8X':
        return (int.from_bytes(b[24:27], 'little') + 1, int.from_bytes(b[27:30], 'little') + 1)
    if kind == b'VP8 ':
        return (struct.unpack('<H', b[26:28])[0] & 0x3FFF, struct.unpack('<H', b[28:30])[0] & 0x3FFF)
    return None


def main():
    if not os.path.exists(CHROME):
        print('Chrome not found at %s' % CHROME)
        sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    R = launch(port, [['on', 1440], ['on', 375], ['off', 1440]])
    M = launch(port, [['on', 1440], ['on', 375]], ['--force-prefers-reduced-motion'])
    eq('0. both Chrome launches returned every job', (R is not None, M is not None), (True, True))
    if R is None or M is None:
        srv.shutdown(); report(); return

    # 1
    eq('1. the flag in the file is on', ('var ON = true;' in SRC, 'var ON = false;' in SRC), (True, False))
    eq('1. the file lists the six providers, in order, each with a logo', NAMES,
       ['Zurich', 'Irish Life', 'Aviva', 'New Ireland', 'Royal London', 'Standard Life'])
    eq('1. and every entry is written the one way (no provider hidden from this test)',
       len(re.findall(r"\{ name: '", SRC)), len(ENTRIES))
    for name, logo, w, h in ENTRIES:
        eq('1. %s: its logo is an SVG or a WebP in %s/, and there' % (name, LOGOS),
           (os.path.dirname(logo), os.path.splitext(logo)[1] in ('.svg', '.webp'), os.path.isfile(os.path.join(ROOT, logo))),
           (LOGOS, True, True))
        size = file_size(logo) if os.path.isfile(os.path.join(ROOT, logo)) else None
        eq('1. %s: the width and height in the list are the file\'s own' % name,
           size and (round(size[0], 2), round(size[1], 2)), (round(float(w), 2), round(float(h), 2)))
        if logo.endswith('.svg'):
            eq('1. %s: the SVG is 40px tall, like every other' % name, size and size[1], 40.0)
    shipped = sorted(f for f in os.listdir(os.path.join(ROOT, LOGOS)) if not f.startswith('.'))
    eq('1. %s/ holds the listed logos and nothing else' % LOGOS, shipped, sorted(os.path.basename(e[1]) for e in ENTRIES))
    # 2
    for w in (1440, 375):
        r = R[('on', w)]
        eq('2. on at %dpx: shown' % w, (r['root'], r['mount']['hidden'], r['mount']['shown']), (True, False, True))
        eq('2. on at %dpx: the label' % w, r['label'], 'Providers we hold agencies with')
        eq('2. on at %dpx: one list, labelled, of the providers in order, each named by its logo\'s alt text' % w,
           (r['labelledby'], r['spoken']), (True, NAMES))
        eq('2. on at %dpx: each logo is the listed file, its space kept' % w, r['logos'],
           [[e[1], str(round(float(e[2]))), str(round(float(e[3])))] for e in ENTRIES])
        eq('2. on at %dpx: every logo file loads' % w, r['loads'], [True] * len(ENTRIES))
        eq('2. on at %dpx: the loop\'s copies are hidden from screen readers, with empty alt text' % w,
           (r['clones'], r['cloneAlts'], r['cloneCount'] > 0), (True, True, True))
        eq('2. on at %dpx: every logo the same height' % w, r['heights'], [32 if w > 600 else 28])
        eq('2. on at %dpx: grey until the pointer is on one' % w, r['filters'], ['grayscale(1)'])
        eq('2. on at %dpx: under the pointer, its own colours' % w, r['colourRule'], True)
        eq('2. on at %dpx: faded at both edges' % w, 'linear-gradient' in r['mask'], True)
        eq('2. on at %dpx: moving, in a loop that never ends' % w, (r['anim'], r['moved'], r['loop']),
           (['pbProv', 'running'], True, [True, 'Infinity']))
        eq('2. on at %dpx: the button, before a press: "Pause", named for it' % w, r['before'],
           ['Pause the provider logos', 'Pause', False])
        eq('2. on at %dpx: Pause stops it, and the button becomes "Play", named for it' % w, r['paused'],
           ['paused', 'Play the provider logos', 'Play', False])
        eq('2. on at %dpx: Play starts it again' % w, r['played'], ['running', 'Pause the provider logos', 'Pause', False])
        eq('2. on at %dpx: the name always holds the word on the button (WCAG 2.5.3)' % w,
           all(x[-3].lower().startswith(x[-2].lower()) for x in (r['before'], r['paused'], r['played'])), True)
        eq('2. on at %dpx: hovering pauses it' % w, r['hoverRule'], True)
        eq('2. on at %dpx: nothing past the window' % w, (r['sw'] <= w, r['sw2'] <= w), (True, True))
        eq('2. on at %dpx: no script error' % w, r['errors'], [])
    # 3
    for w in (1440, 375):
        r = M[('on', w)]
        eq('3. reduced motion at %dpx: shown' % w, r['root'], True)
        eq('3. reduced motion at %dpx: a still row, wrapped' % w, (r['anim'][0], r['loop'], r['wrap']), ('none', None, 'wrap'))
        eq('3. reduced motion at %dpx: the providers once, no copies shown' % w, (r['spoken'], r['shownClones']), (NAMES, 0))
        eq('3. reduced motion at %dpx: no fades, no Pause button' % w, (r['mask'], r['pauseShown']), ('none', False))
        eq('3. reduced motion at %dpx: still grey' % w, r['filters'], ['grayscale(1)'])
        eq('3. reduced motion at %dpx: nothing past the window' % w, r['sw'] <= w, True)
    eq('3. reduced motion at 1440px: one row', M[('on', 1440)]['rows'], 1)
    # 4
    r = R[('off', 1440)]
    eq('4. switched off: one mount on the home page, empty and hidden',
       (r['mounts'], r['mount']), (1, {'hidden': True, 'kids': 0, 'shown': False}))
    eq('4. switched off: no ticker and no styles for it', (r['root'], r['style']), (False, False))
    eq('4. switched off: no script error', r['errors'], [])
    # 5
    eq('5. "partner" and "we work with" appear only in the comment that rules them out',
       [l.strip() for l in SRC.split('\n') if 'partner' in l.lower() or 'we work with' in l.lower()],
       ['The wording is "Providers we hold agencies with". Not "partners", not',
        '"we work with": an agency is the fact, a partnership is a claim.'])
    eq('5. the label is set in one place, and is the brief\'s', re.findall(r"var LABEL = '([^']*)';", SRC),
       ['Providers we hold agencies with'])
    # 6
    home = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    ns = re.findall(r'<noscript><div class="pb-prov-ns">(.*?)</div></noscript>', home, re.S)
    eq('6. without JavaScript: one still row, straight after the mount', (len(ns), home.find('<noscript><div class="pb-prov-ns">')
       == home.find('<div data-pb-providers hidden></div>') + len('<div data-pb-providers hidden></div>\n')), (1, True))
    row = ns[0] if ns else ''
    eq('6. without JavaScript: the same label', re.findall(r'<p class="pb-prov-ns-label" id="([^"]+)">([^<]*)</p>\s*<ul class="pb-prov-ns-list" aria-labelledby="([^"]+)">', row),
       [('pbProvNsLabel', 'Providers we hold agencies with', 'pbProvNsLabel')])
    eq('6. without JavaScript: the same providers, files, alt text and sizes, in order',
       re.findall(r'<li><img src="([^"]+)" alt="([^"]+)" width="(\d+)" height="(\d+)"></li>', row),
       [(e[1], e[0], str(round(float(e[2]))), str(round(float(e[3])))) for e in ENTRIES])
    # and nothing else in it: an item written any other way would slip past the pattern above
    eq('6. without JavaScript: no other item and no other image in the row',
       (row.count('<li'), row.count('<img'), len(re.findall(r'<img src="assets/logos/', row))),
       (len(ENTRIES), len(ENTRIES), len(ENTRIES)))
    eq('6. without JavaScript: grey, and its own colours under the pointer',
       ('.pb-prov-ns-list img{display:block;width:auto;height:32px;filter:grayscale(1);opacity:.72}' in home,
        '.pb-prov-ns-list li:hover img{filter:none;opacity:1}' in home), (True, True))
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
