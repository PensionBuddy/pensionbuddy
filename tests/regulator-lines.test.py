#!/usr/bin/env python3
"""The regulator line and the QFA line, on real frames: are they ever faded in?

    python3 tests/regulator-lines.test.py            # the working tree
    python3 tests/regulator-lines.test.py <root>     # any checkout, e.g. main

Run 32. Every page (the 29 at the root and the two games) is served with a
probe injected as the first thing in its <head>. From the first animation
frame, for 1.5 seconds, the probe finds every element whose own text names
the Central Bank of Ireland, a Qualified Financial Adviser or QFA (not the
glossary's term cards, which define those words), and records on every frame
the least effective opacity among them (their own and every ancestor's,
multiplied) and whether any of them, or an ancestor, is moved by a
transform. Real frames, no virtual time; Chrome is launched, the probe posts
its record, Chrome is killed (the pattern tests/gap-band.py uses). The font
links are left out of the served copy, as there, so the font service cannot
stall a run.

Every page must show the lines at full opacity on every frame from the
first, and move none of them. On main before Run 32 this fails on 29 pages:
the page faded itself in from blank. tests/build.test.py check 19 is the
static guard; this is the one that sees CSS rules and scripts. Not part of
tests/run-tests.py: 31 Chrome launches, about a minute. Exit 0 or 1.
"""
import http.server
import json
import os
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
REPORTS = {}

PROBE = r"""<script>
(function(){
  var REG=/Central\s+Bank\s+of\s+Ireland|Qualified\s+Financial\s+Adviser|\bQFA\b/, t0=performance.now();
  var out={frames:0, first:null, min:1, worst:null, moved:0, targets:0}, els=null;
  function collect(){
    els=[];
    var w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while((n=w.nextNode())){
      var p=n.parentElement;
      if(!p||!REG.test(n.nodeValue.replace(/ /g,' '))||p.closest('script,style,.gterm')) continue;
      if(els.indexOf(p)<0) els.push(p);
    }
    out.targets=els.length;
  }
  function eff(el){ var o=1; for(var e=el;e&&e.nodeType===1;e=e.parentElement) o*=parseFloat(getComputedStyle(e).opacity); return o; }
  function moved(el){
    for(var e=el;e&&e.nodeType===1;e=e.parentElement){
      var t=getComputedStyle(e).transform, m=t&&t.match(/matrix\(([^)]+)\)/);
      if(m){ var v=m[1].split(',').map(Number); if(Math.abs(v[4])>0.5||Math.abs(v[5])>0.5) return true; }
    }
    return false;
  }
  function frame(){
    if(!document.body){ requestAnimationFrame(frame); return; }
    if(!els||document.readyState==='loading') collect();
    var m=1, mv=0, worst=null;
    els.forEach(function(el){
      if(!el.getClientRects().length||el.closest('[hidden]')) return;
      var o=eff(el); if(o<m){ m=o; worst=(el.className||el.tagName)+': '+el.textContent.trim().slice(0,40); }
      if(moved(el)) mv++;
    });
    out.frames++;
    if(out.first===null&&els.length) out.first=+m.toFixed(3);
    if(m<out.min){ out.min=+m.toFixed(3); out.worst=worst; }
    out.moved=Math.max(out.moved,mv);
    if(performance.now()-t0<1500) requestAnimationFrame(frame);
    else { var x=new XMLHttpRequest(); x.open('POST','/__report?id='+encodeURIComponent(new URLSearchParams(location.search).get('id')),false); x.send(JSON.stringify(out)); }
  }
  requestAnimationFrame(frame);
})();
</script>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_POST(self):
        q = urllib.parse.unquote(self.path.split('id=', 1)[-1])
        n = int(self.headers.get('Content-Length', 0))
        REPORTS[q] = json.loads(self.rfile.read(n).decode())
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path.endswith('.html'):
            f = os.path.join(ROOT, path.lstrip('/'))
            if os.path.isfile(f):
                s = open(f, encoding='utf-8').read()
                s = '\n'.join(l for l in s.split('\n') if 'fonts.googleapis.com' not in l and 'fonts.gstatic.com' not in l)
                i = s.lower().find('<head>')
                s = s[:i + 6] + PROBE + s[i + 6:] if i >= 0 else PROBE + s
                b = s.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(b)))
                self.end_headers()
                self.wfile.write(b)
                return
        return super().do_GET()


def pages():
    ls = subprocess.run(['git', 'ls-files', '*.html'], cwd=ROOT, capture_output=True, text=True).stdout.split()
    if not ls:   # a copy that is not a checkout, e.g. from git archive
        ls = [n for n in os.listdir(ROOT) if n.endswith('.html') and not n.startswith('__')]
    root = sorted(n for n in ls if '/' not in n)
    return root + ['games/buddys-run.html', 'games/jargon-battle.html']


def main():
    class TS(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
    srv = TS(('127.0.0.1', 0), Handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    fails = passes = 0
    for pg in pages():
        prof = tempfile.mkdtemp(prefix='pb-reg-')
        url = 'http://127.0.0.1:%d/%s?id=%s' % (port, pg, urllib.parse.quote(pg, safe=''))
        proc = subprocess.Popen([CHROME, '--headless=new', '--no-first-run', '--no-default-browser-check',
                                 '--user-data-dir=' + prof, '--window-size=1440,900', '--hide-scrollbars',
                                 '--remote-debugging-port=0', url],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        t = time.time()
        while pg not in REPORTS and time.time() - t < 25:
            time.sleep(0.1)
        proc.kill()
        proc.wait()
        r = REPORTS.get(pg)
        if not r:
            ok, why = False, 'no report from the probe'
        else:
            ok = r['targets'] > 0 and r['min'] >= 0.999 and r['moved'] == 0
            why = '%d line(s), first frame %s, least %s over %d frames, %d moved%s' % (
                r['targets'], r['first'], r['min'], r['frames'], r['moved'],
                '' if ok or not r.get('worst') else '; worst: ' + r['worst'])
        print('  %s %-36s %s' % ('ok  ' if ok else 'FAIL', pg, why))
        passes += ok
        fails += not ok
    srv.shutdown()
    print('\n%s  %d passed, %d failed' % ('ALL PASS' if not fails else 'FAILURES', passes, fails))
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
