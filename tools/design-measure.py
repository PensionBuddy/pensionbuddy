#!/usr/bin/env python3
"""What every page actually renders, against docs/DESIGN-RUBRIC.md (Run 41).

    python3 tools/design-measure.py                       # every page, 375 and 1440
    python3 tools/design-measure.py --pages index.html starter.html
    python3 tools/design-measure.py --json verify-out/design.json   # and keep the raw figures

ONE Chrome launch. Each page is opened in a frame the size of a screen
(375 x 812 and 1440 x 900, the rubric's screens), with JavaScript on,
reduced motion forced and the cookie choice made, and every visible
element is read: its font size and weight, its margins, paddings and gaps,
its text, background and border colours; which colour families each screen
shows and how many filled aqua buttons; the sections (<main>'s children),
the buttons, the pictures, and where the footer starts. The nav, the top
strip, the footer and the cookie bar are left out of the counts: they are
the same on every page.

It prints, per page and width, the rubric's measurable checks:

    R1  text elements off the five type roles, as a share
    R2  font weights other than 300, 400, 600 and 800
    R3  margins, paddings and gaps off the spacing steps, as a share
    R5  screens with two filled aqua elements; screens with amber or red beside aqua
        (a chart's amber or red passes: read those screens before calling one)
    R6  top-level sections (<main>'s children; a guide wrapped in one
        container shows few, so count by heading there)
    R7  screens above the footer, at 375

and the site's totals: distinct sizes, weights, spacing values and colours.
It reports; it judges nothing and fails nothing. The roles, steps and
colours are the rubric's, below: change them there first, then here.

Nothing is written into the repository unless --json names a file.
"""
import argparse, glob, html, json, os, re, socket, subprocess, sys, threading
from collections import Counter
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
WIDTHS = {375: 812, 1440: 900}          # width: screen height
# docs/DESIGN-RUBRIC.md, sections 1 and 2 (16.5 is 1rem: the pages set html{font-size:103%})
ROLES = {375: (13, 16.5, 20, 28, 34), 1440: (13, 16.5, 20, 46, 68)}
WEIGHTS = {'300', '400', '600', '800'}
STEPS = {4, 8, 12, 16, 24, 32, 48, 64, 88}

PROBE = r'''
function measure(d, w, VH){
  var R={type:{},space:{},colours:{text:{},bg:{},border:{}},screens:[],sections:[],images:[],ctas:[],height:0,footTop:null};
  var vis=function(e){var r=e.getBoundingClientRect();if(r.width<1||r.height<1)return false;var cs=w.getComputedStyle(e);return cs.visibility!=='hidden'&&cs.display!=='none'&&parseFloat(cs.opacity)>0.05;};
  function rgb(c){var m=c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);if(!m)return null;return [+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]];}
  function hex(a){return '#'+a.slice(0,3).map(function(x){return ('0'+Math.round(x).toString(16)).slice(-2)}).join('').toUpperCase();}
  function hsl(a){var r=a[0]/255,g=a[1]/255,b=a[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=0,h=0;if(mx!==mn){var dd=mx-mn;s=l>.5?dd/(2-mx-mn):dd/(mx+mn);h=mx===r?(g-b)/dd+(g<b?6:0):mx===g?(b-r)/dd+2:(r-g)/dd+4;h*=60;}return [h,s,l];}
  // the colour family of a chromatic colour; neutrals, near-black and near-white are none
  function family(a){if(!a||a[3]<0.3)return null;var x=hsl(a);if(x[1]<0.25||x[2]<0.12||x[2]>0.93)return null;var h=x[0];
    if(h>=150&&h<200)return x[2]<0.3?'teal-dark':'aqua';if(h>=25&&h<60)return 'amber';if(h<25||h>=330)return 'red';if(h>=200&&h<260)return 'blue';if(h>=60&&h<150)return 'green';return 'violet';}
  var H=d.documentElement.scrollHeight,sy=w.scrollY;R.height=H;
  var foot=d.querySelector('footer');if(foot)R.footTop=Math.round(foot.getBoundingClientRect().top+sy);
  var n=Math.ceil(H/VH);for(var i=0;i<n;i++)R.screens.push({acc:{},filled:0});
  [].forEach.call(d.body.querySelectorAll('*'),function(e){
    if(e.closest('svg')&&e.tagName.toLowerCase()!=='svg')return;
    if(e.closest('#nav,.announce,header,footer,.foot,.pb-consent,[role=dialog]'))return;
    if(!vis(e))return;
    var cs=w.getComputedStyle(e),r=e.getBoundingClientRect(),top=r.top+sy,s=Math.min(n-1,Math.max(0,Math.floor(top/VH)));
    var hasText=[].some.call(e.childNodes,function(t){return t.nodeType===3&&t.textContent.trim().length>1;});
    if(hasText){
      var k=(Math.round(parseFloat(cs.fontSize)*10)/10)+'/'+cs.fontWeight;R.type[k]=(R.type[k]||0)+1;
      var tc=rgb(cs.color);if(tc){var hx=hex(tc);R.colours.text[hx]=(R.colours.text[hx]||0)+1;var f=family(tc);if(f)R.screens[s].acc[f]=1;}
    }
    var bg=rgb(cs.backgroundColor);
    if(bg&&bg[3]>0.3){var hb=hex(bg);R.colours.bg[hb]=(R.colours.bg[hb]||0)+1;var fb=family(bg);
      if(fb&&r.width*r.height>600)R.screens[s].acc[fb]=1;
      if(fb==='aqua'&&(e.matches('a,button')||e.classList.contains('btn')))R.screens[s].filled++;}
    if(parseFloat(cs.borderTopWidth)>0||parseFloat(cs.borderLeftWidth)>0){var bc=rgb(parseFloat(cs.borderTopWidth)>0?cs.borderTopColor:cs.borderLeftColor);if(bc){var hc=hex(bc);R.colours.border[hc]=(R.colours.border[hc]||0)+1;}}
    ['marginTop','marginBottom','paddingTop','paddingBottom','rowGap','columnGap'].forEach(function(p){var v=parseFloat(cs[p]);if(v>0&&isFinite(v)){v=Math.round(v);R.space[v]=(R.space[v]||0)+1;}});
    var tg=e.tagName.toLowerCase();
    if((tg==='img'||tg==='video'||tg==='canvas'||tg==='svg'||tg==='iframe')&&r.width>=40&&r.height>=40)
      R.images.push({tag:tg,src:(e.currentSrc||e.getAttribute('src')||'').replace(/^.*\//,'').replace(/\?.*$/,'').slice(0,60),w:Math.round(r.width),h:Math.round(r.height),top:Math.round(top)});
    if(e.matches('a.btn,button.btn,a[class*="btn"],button[class*="btn"]')&&r.width>40)
      R.ctas.push({t:(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,60),top:Math.round(top),filled:family(bg)==='aqua'});
  });
  [].forEach.call((d.querySelector('main')||d.body).children,function(c){if(!vis(c))return;var r=c.getBoundingClientRect();if(r.height<60)return;
    var h=c.querySelector('h1,h2');R.sections.push({id:c.id||'',head:h?h.innerText.trim().replace(/\s+/g,' ').slice(0,80):'',top:Math.round(r.top+sy),h:Math.round(r.height)});});
  R.screens=R.screens.map(function(x,i){return {screen:i+1,families:Object.keys(x.acc),filled:x.filled};});
  return R;
}'''


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path.startswith('/__measure'):
            b = self.server.doc.encode('utf-8')
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
            return
        return super().do_GET()


def pages_all():
    names = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, '*.html')))
    return names + ['games/' + os.path.basename(p) for p in sorted(glob.glob(os.path.join(ROOT, 'games', '*.html')))]


def run(pages):
    jobs = [[p, w, WIDTHS[w]] for p in pages for w in sorted(WIDTHS)]
    doc = ('<!doctype html><body style="margin:0"><script>%s\n'
           'try{localStorage.setItem("pb-consent","rejected")}catch(e){}\n'
           'var J=%s,O=[];function nx(){var j=J.shift();if(!j){var p=document.createElement("pre");p.id="o";'
           'p.textContent=JSON.stringify(O);document.body.appendChild(p);return;}'
           'var f=document.createElement("iframe");f.style.cssText="border:0;width:"+j[1]+"px;height:"+j[2]+"px";f.src="/"+j[0];'
           'document.body.appendChild(f);var done=0;f.onload=function(){setTimeout(function(){if(done)return;done=1;var R;'
           'try{R=measure(f.contentDocument,f.contentWindow,j[2]);}catch(e){R={error:String(e)}}O.push([j[0],j[1],R]);f.remove();nx();},1500)}}'
           'nx();</script>') % (PROBE, json.dumps(jobs))
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler); srv.doc = doc
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        out = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox', '--window-size=1600,1000',
                              '--force-prefers-reduced-motion', '--virtual-time-budget=%d' % (4000 * len(jobs) + 10000),
                              '--dump-dom', 'http://127.0.0.1:%d/__measure' % port],
                             capture_output=True, timeout=120 + 10 * len(jobs)).stdout.decode('utf-8', 'replace')
    finally:
        srv.shutdown()
    m = re.search(r'<pre id="o">(.*?)</pre>', out, re.S)
    if not m:
        sys.exit('Chrome returned no measurements')
    return json.loads(html.unescape(m.group(1)))


def share(counter, ok):
    total = sum(counter.values())
    return (100.0 * sum(v for k, v in counter.items() if not ok(k)) / total) if total else 0.0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--pages', nargs='*')
    ap.add_argument('--json', help='also write the raw figures to this file')
    a = ap.parse_args()
    if not os.path.exists(CHROME):
        sys.exit('Chrome not found at %s (set CHROME=...)' % CHROME)
    data = run(a.pages or pages_all())
    if a.json:
        with open(a.json, 'w') as f:
            json.dump(data, f, indent=1)

    def on_role(w):
        return lambda k: any(abs(float(k.split('/')[0]) - r) < 0.25 for r in ROLES[w])

    print('%-34s %5s %6s %7s %6s %6s %7s %8s %8s %8s' % ('page', 'width', 'R1 off', 'R2 wts', 'R3 off', 'R6', 'R7 375', 'R5 2xaq', 'R5 amber', 'R5 red'))
    site = {w: {'type': Counter(), 'space': Counter(), 'text': Counter(), 'bg': Counter(), 'border': Counter()} for w in WIDTHS}
    for page, w, R in data:
        if 'error' in R:
            print('%-34s %5d  error: %s' % (page, w, R['error'])); continue
        T = Counter(R['type']); S = Counter({int(k): v for k, v in R['space'].items()})
        st = site[w]; st['type'].update(T); st['space'].update(S)
        for c in ('text', 'bg', 'border'):
            st[c].update(R['colours'][c])
        weights = sorted({k.split('/')[1] for k in T} - WEIGHTS)
        above = (R['footTop'] or R['height']) / float(WIDTHS[w])
        two = [x['screen'] for x in R['screens'] if x['filled'] > 1]
        amber = [x['screen'] for x in R['screens'] if 'amber' in x['families'] and 'aqua' in x['families']]
        red = [x['screen'] for x in R['screens'] if 'red' in x['families'] and 'aqua' in x['families']]
        print('%-34s %5d %5.0f%% %7s %5.0f%% %6d %7s %8s %8s %8s' % (
            page, w, share(T, on_role(w)), ','.join(weights) or '-', share(S, lambda k: k in STEPS or k < 4),
            len(R['sections']), '%.1f' % above if w == 375 else '', ','.join(map(str, two)) or '-', ','.join(map(str, amber)) or '-', ','.join(map(str, red)) or '-'))
    print()
    for w in sorted(WIDTHS):
        st = site[w]
        sizes = {float(k.split('/')[0]) for k in st['type']}
        weights = {k.split('/')[1] for k in st['type']}
        print('site at %d: %d type sizes, %d weights, %d spacing values (%.0f%% off the steps), %d text, %d background, %d border colours' % (
            w, len(sizes), len(weights), len(st['space']), share(st['space'], lambda k: k in STEPS or k < 4),
            len(st['text']), len(st['bg']), len(st['border'])))


if __name__ == '__main__':
    main()
