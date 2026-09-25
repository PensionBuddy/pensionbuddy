#!/usr/bin/env python3
"""The home page's gap chart on real frames: does a reader ever see a euro zero?

    python3 tests/gap-band.py            # the working tree
    python3 tests/gap-band.py <root>     # any checkout, e.g. a baseline

Run 25. Serves the site with a probe injected as the first thing in the home
page's <head> and records every state of the chart's three figures: their
text, and whether each is actually visible (the band's opacity, inside the
viewport, not clipped by its bar). Real frames, no virtual time, which would
starve IntersectionObserver (see the README in tests/render-diff for the
traps). Chrome is launched, the probe posts its record, Chrome is killed: the
page's load event is never waited on, because the font service can stall it
in a sandbox, and the served copy leaves the font links out for the same
reason. Not part of tests/run-tests.py: nine Chrome launches, about 40 s.

Scenarios: no JavaScript (every page script stripped, the probe alone left:
the markup and CSS such a reader gets), loaded with the band already in view
(#gap at two widths, a tall window, a slow page scrolled before load),
reduced motion, and scrolled to from the top, where the count-up must still
play. In every one: no euro zero in the DOM or on screen, and the finished
figures at the end. Where the band is in view on load: only the finished
figures, ever. Exit 0 or 1.
"""
import http.server
import json
import os
import re
import socketserver
import subprocess
import sys
import threading
import time
import tempfile
import urllib.parse

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = tempfile.mkdtemp(prefix='pb-gap-band-')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
REPORTS = {}

PROBE = r"""<script>
(function(){
  var q=new URLSearchParams(location.search), id=q.get('id'), t0=performance.now(), last='', rows=[], zeroDom=false, zeroSeen=false;
  function snap(tag){
    var g=document.getElementById('pbGap'); if(!g) return;
    var ns=[].slice.call(g.querySelectorAll('.pb-gap-n'));
    var op=1, el=g; while(el&&el.nodeType===1){ op*=parseFloat(getComputedStyle(el).opacity); el=el.parentElement; }
    var texts=ns.map(function(n){return n.textContent;});
    var shown=ns.map(function(n){
      var b=n.parentElement.getBoundingClientRect(), r=n.getBoundingClientRect();
      var inView=r.bottom>0&&r.top<innerHeight&&innerHeight>0;
      var inside=b.height>=1&&r.top<b.bottom&&r.bottom>b.top;   /* the bar clips the figure: overflow hidden */
      return op>0.02&&inView&&inside;
    });
    texts.forEach(function(t,i){ if(/^€0$/.test(t)){ zeroDom=true; if(shown[i]) zeroSeen=true; } });
    var key=g.className+'|'+texts.join(',')+'|'+shown.join(',')+'|'+op.toFixed(2);
    if(key!==last){ last=key; rows.push({t:Math.round(performance.now()-t0),tag:tag,cls:g.className.replace(/\s+/g,' '),op:+op.toFixed(2),texts:texts,shown:shown}); }
  }
  addEventListener('load',function(){window.__loadAt=Math.round(performance.now()-t0);});
  new MutationObserver(function(){snap('mut');}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style']});
  (function f(){ snap('raf'); if(performance.now()-t0<6000) requestAnimationFrame(f); })();
  document.addEventListener('DOMContentLoaded',function(){ snap('dcl');
    var at=q.get('scrollat'); if(at) setTimeout(function(){ snap('before-scroll'); document.getElementById('gap').scrollIntoView(); },+at);
  });
  setTimeout(function(){
    snap('end');
    var g=document.getElementById('pbGap');
    var body={id:id,innerHeight:innerHeight,reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,
      zeroInDom:zeroDom,zeroSeen:zeroSeen,final:g?[].map.call(g.querySelectorAll('.pb-gap-n'),function(n){return n.textContent;}):null,
      bars:g?[].map.call(g.querySelectorAll('.pb-gap-bar,.pb-gap-short'),function(b){return Math.round(b.getBoundingClientRect().height);}):null,
      finalShown:rows.length?rows[rows.length-1].shown:null,rows:rows,loadAt:window.__loadAt||null};
    var x=new XMLHttpRequest(); x.open('POST','/__report',false); x.send(JSON.stringify(body));
  },6400);
})();
</script>"""


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(n))
        REPORTS[body['id']] = body
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path == '/__slow.gif':
            time.sleep(int(urllib.parse.parse_qs(u.query).get('ms', ['3000'])[0]) / 1000.0)
            gif = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
            self.send_response(200)
            self.send_header('Content-Type', 'image/gif')
            self.send_header('Content-Length', str(len(gif)))
            self.end_headers()
            self.wfile.write(gif)
            return
        if u.path == '/__probe.html':
            s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
            if urllib.parse.parse_qs(u.query).get('nojs'):
                # every page script out, the probe alone left: the markup and CSS a reader without JavaScript gets
                s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S)
            s = s.replace('<head>', '<head>\n' + PROBE, 1)
            s = re.sub(r'<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>', '', s)
            hold = urllib.parse.parse_qs(u.query).get('hold', ['0'])[0]
            if hold != '0':
                s = s.replace('</body>', '<img src="/__slow.gif?ms=%s" alt="" width="1" height="1">\n</body>' % hold, 1)
            b = s.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(b)))
            self.end_headers()
            self.wfile.write(b)
            return
        return super().do_GET()


class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


srv = S(('127.0.0.1', 0), H)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = [CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
        '--disable-extensions', '--mute-audio', '--user-data-dir=' + os.path.join(OUT, 'profile')]


FINISHED, PLAYS = 'finished', 'plays'
SCEN = [
    ('no JavaScript, #gap, 1440x900', ['--window-size=1440,900'], '#gap', '&nojs=1', FINISHED),
    ('no JavaScript, #gap, 500x900', ['--window-size=500,900'], '#gap', '&nojs=1', FINISHED),
    ('in view on load: #gap, 1440x900', ['--window-size=1440,900'], '#gap', '', FINISHED),
    ('in view on load: #gap, 500x900', ['--window-size=500,900'], '#gap', '', FINISHED),
    ('in view on load: a tall window, 1440x3200', ['--window-size=1440,3200'], '', '', FINISHED),
    ('in view on load: a slow page (load held 3 s), scrolled to at 0.8 s', ['--window-size=1440,900'], '', '&scrollat=800&hold=3000', FINISHED),
    ('reduced motion, #gap', ['--window-size=1440,900', '--force-prefers-reduced-motion'], '#gap', '', FINISHED),
    ('from the top, scrolled to at 2 s', ['--window-size=1440,900'], '', '&scrollat=2000', PLAYS),
    ('a slow page (load held 3 s), scrolled to at 4 s', ['--window-size=1440,900'], '', '&scrollat=4000&hold=3000', PLAYS),
]
FIGURES = ['\u20ac40,860', '\u20ac25,296', '\u20ac15,564']
failed = 0


def check(label, ok, detail=''):
    global failed
    print('  %-4s %s%s' % ('ok' if ok else 'FAIL', label, '' if ok else '  (%s)' % detail))
    failed += 0 if ok else 1


print('the gap chart, %s' % ROOT)
for i, (name, flags, frag, extra, want) in enumerate(SCEN):
    url = 'http://127.0.0.1:%d/__probe.html?id=%d%s%s' % (port, i, extra, frag)
    proc = subprocess.Popen(BASE + flags + ['--remote-debugging-port=0', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + 30
    while str(i) not in REPORTS and time.time() < deadline:
        time.sleep(0.2)
    proc.kill(); proc.wait()
    rep = REPORTS.get(str(i))
    print(name)
    if not rep:
        check('the probe reported', False, 'no report within 30 s')
        continue
    seen = {t for row in rep['rows'] for t, sh in zip(row['texts'], row['shown']) if sh}
    check('no euro zero in the DOM, ever', not rep['zeroInDom'])
    check('no euro zero on screen, ever', not rep['zeroSeen'])
    check('the finished figures at the end', rep['final'] == FIGURES, rep['final'])
    check('every figure visible at the end, bars standing', all(rep.get('finalShown') or [False]) and all(h > 0 for h in rep.get('bars') or [0]),
          '%s %s' % (rep.get('finalShown'), rep.get('bars')))
    if want == FINISHED:
        check('a reader only ever sees the finished figures', seen == set(FIGURES), sorted(seen)[:6])
    else:
        check('the count-up plays', len(seen) > 20, '%d distinct figures' % len(seen))
    json.dump(rep, open(os.path.join(OUT, 'scenario-%d.json' % i), 'w'), indent=1)

srv.shutdown()
print('ALL PASS' if not failed else 'FAILURES  %d' % failed, ' (records in %s)' % OUT)
sys.exit(1 if failed else 0)
