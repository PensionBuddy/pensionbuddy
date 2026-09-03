#!/usr/bin/env python3
"""
PensionBuddy verification loop.

Pure Python stdlib + the locally installed Google Chrome (headless). No Node,
no npm, no Playwright.

For every HTML page it:
  * statically resolves every internal href/src and every #anchor
  * scans the source for placeholder / template tokens
  * loads the page in headless Chrome at 375px, 1360px and 1440px and runs an
    in-page audit: runtime errors, horizontal overflow, duplicate ids,
    heading + landmark structure, WCAG text contrast (gradient-aware),
    unnamed controls, unlabelled inputs, image decode, focus-ring contrast,
    clipped grid children, nav drawer behaviour, deep-link offset, and a set
    of page-specific expectations tied to backlog codes in docs/ISSUES.md
  * takes a full-page screenshot at 375px and 1440px

Usage:
  python3 tools/verify.py                 # everything
  python3 tools/verify.py --pages index.html booking.html
  python3 tools/verify.py --no-shots      # skip screenshots (faster)
  python3 tools/verify.py --widths 375    # audit only these widths

Output:
  verify-out/report.json      machine-readable
  verify-out/report.md        human-readable summary
  verify-out/shots/*.png      full-page screenshots
Exit code 1 if any FAIL-severity check fails.
"""
import argparse, base64, glob, html, json, os, re, socket, subprocess, sys, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'verify-out')
SHOTS = os.path.join(OUT, 'shots')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

AUDIT_WIDTHS = [375, 1360, 1440]
SHOT_WIDTHS = [375, 1440]

# ----------------------------------------------------------------------------
# In-page scripts
# ----------------------------------------------------------------------------

# Injected at the very top of <head>: capture everything that could count as a
# console error before any page script runs. Capture-phase listener also sees
# resource load failures (<script src>, <link>, <img>).
HEAD_JS = r"""
<script>
window.__errs=[];
window.addEventListener('error',function(e){
  var t=e.target;
  if(t&&t!==window&&t.tagName){__errs.push('resource failed: <'+t.tagName.toLowerCase()+'> '+(t.src||t.href||'').slice(0,120));return;}
  __errs.push('error: '+(e.message||e.type)+(e.filename?' @'+e.filename.split('/').pop()+':'+e.lineno:''));
},true);
window.addEventListener('unhandledrejection',function(e){__errs.push('unhandledrejection: '+String(e.reason&&e.reason.message||e.reason).slice(0,160));});
(function(){var ce=console.error.bind(console);console.error=function(){__errs.push('console.error: '+[].map.call(arguments,String).join(' ').slice(0,160));ce.apply(console,arguments);};})();
</script>
"""

# For screenshots only: settle reveal animations so below-the-fold content is
# painted, and freeze animations for deterministic captures.
SHOT_CSS = r"""
<style id="__shotcss">
.js-reveal .reveal:not(.settled),.reveal{opacity:1!important;transform:none!important;transition:none!important}
/* jump every animation straight to its end state (keeps fill-mode:forwards results) instead of pausing at frame 0 */
*,*::before,*::after{animation-duration:0.001s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important}
</style>
"""

AUDIT_JS = r"""
<script>
(async function(){
  const R={};
  const $$=s=>[...document.querySelectorAll(s)];
  const de=document.documentElement;
  R.width=innerWidth; R.docHeight=de.scrollHeight;
  R.errors=(window.__errs||[]).slice(0,20);
  R.overflowX=de.scrollWidth-de.clientWidth;
  R.lang=de.lang; R.title=document.title;
  R.viewport=(document.querySelector('meta[name=viewport]')||{}).content||null;
  R.h1=$$('h1').length; R.main=$$('main').length;
  const ids={};$$('[id]').forEach(e=>{ids[e.id]=(ids[e.id]||0)+1});
  R.duplicateIds=Object.keys(ids).filter(k=>ids[k]>1);
  const hs=$$('h1,h2,h3,h4,h5,h6').map(h=>+h.tagName[1]);
  R.headingSkips=[];for(let i=1;i<hs.length;i++)if(hs[i]-hs[i-1]>1)R.headingSkips.push(hs[i-1]+'>'+hs[i]);

  // skip link (D2/D3)
  const skip=document.querySelector('a.skip,a[href="#main"]');
  const skipTarget=skip?document.querySelector(skip.getAttribute('href')):null;
  R.skipLink={present:!!skip,inSource:!!document.querySelector('a.skip[data-source],a.skip:not([data-injected])')&&!!skip&&!skip.__injected,targetExists:!!skipTarget,targetTag:skipTarget?skipTarget.tagName:null,targetTabindex:skipTarget?skipTarget.getAttribute('tabindex'):null};

  // ---- contrast (gradient aware) ----
  function lum(c){const[r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b}
  function parse(s){const m=s&&s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(parseFloat);return{rgb:p.slice(0,3),a:p.length>3?p[3]:1}}
  function stops(img){const o=[],re=/rgba?\([^)]+\)/g;let m;while(m=re.exec(img)){const c=parse(m[0]);if(c&&c.a>.9)o.push(c.rgb)}return o}
  function bgOf(el){let e=el;while(e){const cs=getComputedStyle(e),gi=cs.backgroundImage;if(gi&&gi!=='none'){const s=stops(gi);if(s.length)return s}const c=parse(cs.backgroundColor);if(c&&c.a>.95)return[c.rgb];e=e.parentElement}return[[255,255,255]]}
  function ratio(f,b){const a=lum(f),c=lum(b);return(Math.max(a,c)+.05)/(Math.min(a,c)+.05)}
  function over(fg,a,bg){return fg.map((v,i)=>Math.round(v*a+bg[i]*(1-a)))}
  const seen={},cf=[];
  $$('p,span,a,li,h1,h2,h3,h4,h5,h6,div,small,label,button,summary,strong,em,b,td,th,dt,dd,legend,figcaption').forEach(el=>{
    if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)<.15)return;
    const rc=el.getBoundingClientRect();if(!rc.width||!rc.height)return;
    const fg=parse(cs.color);if(!fg||fg.a<.9)return;
    let w=99,wb=null;bgOf(el).forEach(b=>{const r=ratio(fg.rgb,b);if(r<w){w=r;wb=b}});
    const sz=parseFloat(cs.fontSize),wt=parseInt(cs.fontWeight)||400;
    const need=(sz>=24||(sz>=18.66&&wt>=700))?3:4.5;
    if(w<need){const k=cs.color+'|'+wb+'|'+Math.round(sz)+'|'+wt;if(seen[k])return;seen[k]=1;
      cf.push({ratio:+w.toFixed(2),need,fg:cs.color,bg:'rgb('+wb.join(',')+')',size:Math.round(sz),text:el.textContent.trim().replace(/\s+/g,' ').slice(0,40),sel:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/)[0]:'')})}
  });
  R.contrastFails=cf;

  // focus ring token contrast (D1)
  const ring=getComputedStyle(de).getPropertyValue('--ring').trim();
  const rp=parse(ring);
  if(rp){const comp=over(rp.rgb,rp.a,[255,255,255]);R.focusRing={token:ring,onWhite:+ratio(comp,[255,255,255]).toFixed(2)}}else R.focusRing={token:ring||null,onWhite:null};

  // accessible names / labels
  function accName(el){if(el.getAttribute('aria-label'))return el.getAttribute('aria-label');const lb=el.getAttribute('aria-labelledby');if(lb){const t=document.getElementById(lb);if(t)return t.textContent.trim()}const txt=el.textContent.replace(/\s+/g,' ').trim();if(txt)return txt;const ttl=el.querySelector('svg title');if(ttl)return ttl.textContent.trim();const img=el.querySelector('img[alt]');if(img&&img.alt)return img.alt;return el.getAttribute('title')||''}
  R.namelessControls=$$('a,button').filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&!accName(el)}).map(el=>el.outerHTML.replace(/\s+/g,' ').slice(0,80));
  R.unlabelledInputs=$$('input:not([type=hidden]),select,textarea').filter(i=>!(i.labels&&i.labels.length)&&!i.getAttribute('aria-label')&&!i.getAttribute('aria-labelledby')).map(i=>(i.id||i.name||i.type));
  R.slidersMissingValuetext=$$('input[type=range]').filter(i=>!i.getAttribute('aria-valuetext')).map(i=>i.id);
  R.rangesInClosedDetails=$$('details:not([open]) input[type=range]').map(i=>i.id);
  R.ariaLiveRegions=$$('[aria-live]').map(e=>e.id||e.className||e.tagName);
  R.svgUnhidden=$$('svg').filter(s=>!s.hasAttribute('aria-hidden')&&!s.closest('a,button,summary')&&!s.querySelector('title')).length;

  // rendered placeholder / template text (A1, A2, E5, F1)
  const body=document.body.innerText;
  const pats=[/\[LIABILITY_CAP_EUR\]/,/\[ANALYTICS_SCRIPT_URL\]/,/Template (document|notice|process)\./,/Draft for legal review/,/CALENDLY_URL/,/once the Calendly link is connected/,/\[[A-Z_]{6,}\]/];
  R.renderedPlaceholders=pats.map(p=>{const m=body.match(p);return m?m[0]:null}).filter(Boolean);
  R.lastUpdatedCount=(body.match(/Last updated:/g)||[]).length;
  // deliberate, clearly-marked business-input placeholders (tracked, not a failure)
  R.needsInput=$$('.needs-input').map(e=>(e.getAttribute('data-issue')||'?')+': '+e.textContent.trim().slice(0,40));

  // images decode
  const imgs=$$('img');R.images={total:imgs.length,missingAlt:imgs.filter(i=>!i.hasAttribute('alt')).length,failed:[]};
  await Promise.all(imgs.map(i=>new Promise(res=>{const t=new Image();t.onload=()=>res();t.onerror=()=>{R.images.failed.push((i.getAttribute('alt')||i.src.slice(0,40)));res()};t.src=i.src;setTimeout(res,3000)})));

  // fonts (F2)
  try{await document.fonts.ready;R.fonts={sora:document.fonts.check('700 20px Sora'),fraunces:$$('*').some(e=>/Fraunces/i.test(getComputedStyle(e).fontFamily))}}catch(e){R.fonts={error:String(e)}}

  // clipped grid children (C1): any grid with >=2 columns whose children run past the grid's own box
  R.clippedGrids=[];
  $$('*').forEach(el=>{const cs=getComputedStyle(el);if(cs.display!=='grid')return;const cols=cs.gridTemplateColumns.split(' ').filter(x=>x&&x!=='none').length;if(cols<2)return;const pr=el.getBoundingClientRect();const kids=[...el.children];const clipped=kids.filter(k=>k.getBoundingClientRect().right>pr.right+2);if(clipped.length)R.clippedGrids.push({sel:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\s+/)[0]:''),cols,gridWidth:Math.round(pr.width),clippedChildren:clipped.length,scrollWidth:el.scrollWidth})});

  // footer column links sharing a line (C7): consecutive anchors in a .foot-col must stack
  R.footerInlineLinks=$$('.foot-col').reduce((n,col)=>{const as=[...col.querySelectorAll('a')];for(let i=1;i<as.length;i++){if(Math.abs(as[i].getBoundingClientRect().top-as[i-1].getBoundingClientRect().top)<4)n++}return n},0);

  // header wordmark visible (C3)
  const logo=document.querySelector('.logo');
  R.logoWordmark=logo?{fontSize:getComputedStyle(logo).fontSize,textWidth:Math.round([...logo.childNodes].filter(n=>n.nodeType===3||(n.tagName&&n.tagName!=='SVG'&&!n.classList.contains('logo-mark'))).reduce((w,n)=>{const r=(n.nodeType===3?(()=>{const rg=document.createRange();rg.selectNode(n);return rg.getBoundingClientRect()})():n.getBoundingClientRect());return w+r.width},0))}:null;

  // FAQ icon consistency (C5)
  const pms=$$('summary .pm');R.faqIconVariants=[...new Set(pms.map(p=>p.querySelector('svg')?'svg':'text'))];

  // nav overrun (C6)
  const navIn=document.querySelector('.nav-in');
  if(navIn){const kids=[...navIn.children].filter(k=>getComputedStyle(k).display!=='none');const right=Math.max(...kids.map(k=>k.getBoundingClientRect().right));R.navOverrun={viewport:innerWidth,rightmostPx:Math.round(right),overrun:Math.round(right-innerWidth)}}

  // countdown year consistency (E1)
  const tick=document.querySelector('.tickband,.tick');if(tick){const yrs=[...new Set((tick.innerText.match(/20\d\d/g)||[]))];R.countdownYears=yrs}

  // calculator maths sanity (must stay correct)
  if(typeof project==='function'){const mR=Math.pow(1.03,1/12)-1,n=420;const exp=10000*Math.pow(1+mR,n)+100*((Math.pow(1+mR,n)-1)/mR);const got=project(n,10000,100,mR);R.calcMaths={expected:Math.round(exp),got:Math.round(got),ok:Math.abs(exp-got)<1}}

  // booking calendly (must stay correct)
  const cw=document.getElementById('calWidget');
  if(cw){R.calendly={dataUrl:cw.getAttribute('data-url'),widgetHeight:Math.round(cw.getBoundingClientRect().height),scriptInjected:!!document.querySelector('script[src*="calendly"]'),cssInjected:!!document.querySelector('link[href*="calendly"]'),fallbackDisplay:getComputedStyle(document.getElementById('calFallback')||cw).display,footTop:!!document.querySelector('.foot-top')}}

  // ---- interaction checks last (they mutate the page) ----
  // deep-link offset (C4): glossary terms + any page's first in-page anchor target
  const term=document.getElementById('tax-relief')||document.getElementById('deadline')||document.getElementById('about');
  const nav=document.querySelector('nav');
  if(term&&nav){de.style.scrollBehavior='auto';term.scrollIntoView({behavior:'instant',block:'start'});await new Promise(r=>setTimeout(r,120));const gap=Math.round(term.getBoundingClientRect().top-nav.getBoundingClientRect().bottom);R.deepLinkGap={id:term.id,gapBelowHeaderPx:gap,scrollY:Math.round(scrollY)};scrollTo(0,0);de.style.scrollBehavior=''}
  // mobile drawer (C2, E3)
  const toggle=document.getElementById('navToggle'),links=document.querySelector('.nav-links');
  if(toggle&&links&&innerWidth<=920&&getComputedStyle(toggle).display!=='none'){
    nav.classList.add('scrolled');toggle.click();await new Promise(r=>setTimeout(r,450));
    const gap=Math.round(links.getBoundingClientRect().top-nav.getBoundingClientRect().bottom);
    const label=toggle.getAttribute('aria-label');
    const heights=[...new Set([...links.querySelectorAll('a')].map(a=>Math.round(a.getBoundingClientRect().height)))];
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await new Promise(r=>setTimeout(r,150));
    R.drawer={opened:links.classList.contains('open')||heights.some(h=>h>0),gapWhenScrolledPx:gap,ariaLabelWhileOpen:label,escapeCloses:!links.classList.contains('open'),linkHeights:heights};
    if(links.classList.contains('open'))toggle.click();nav.classList.remove('scrolled');
  }

  const pre=document.createElement('pre');pre.id='__audit';pre.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(R))));document.body.appendChild(pre);
})().catch(e=>{const pre=document.createElement('pre');pre.id='__audit';pre.textContent=btoa(unescape(encodeURIComponent(JSON.stringify({auditError:String(e&&e.stack||e)}))));document.body.appendChild(pre);});
</script>
"""

# ----------------------------------------------------------------------------
# Local server that injects the scripts on the fly
# ----------------------------------------------------------------------------

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def do_GET(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        path = u.path.lstrip('/') or 'index.html'
        if u.path == '/__frame':
            page = q.get('page', ['index.html'])[0]; w = int(q.get('w', ['375'])[0]); h = int(q.get('h', ['900'])[0])
            mode = q.get('mode', ['audit'])[0]
            body = ('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#888}</style></head><body>'
                    '<iframe id="f" src="/%s?%s=1" style="width:%dpx;height:%dpx;border:0;display:block;margin:0 auto"></iframe>'
                    '<script>(function(){var f=document.getElementById("f");var tries=0;function poll(){tries++;try{var d=f.contentDocument;var p=d&&d.getElementById("__audit");if(p){var o=document.createElement("pre");o.id="__audit";o.textContent=p.textContent;document.body.appendChild(o);return;}}catch(e){}if(tries<400)setTimeout(poll,25);else{var o=document.createElement("pre");o.id="__audit";o.textContent=btoa(JSON.stringify({auditError:"timeout waiting for iframe audit"}));document.body.appendChild(o);}}f.addEventListener("load",poll);setTimeout(poll,500);})();</script>'
                    '</body></html>') % (page, mode, w, h)
            return self._send(body.encode('utf-8'))
        fs = os.path.join(ROOT, path)
        if path.endswith('.html') and os.path.isfile(fs):
            t = open(fs, encoding='utf-8', errors='replace').read()
            # NB: str.replace / lambda-based re.sub so backslashes inside the JS regexes survive untouched
            t = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + HEAD_JS, t, count=1, flags=re.I)
            if 'shot' in q:
                t = t.replace('</head>', SHOT_CSS + '</head>', 1)
            if 'audit' in q:
                t = t.replace('</body>', AUDIT_JS + '</body>', 1) if '</body>' in t else t + AUDIT_JS
            return self._send(t.encode('utf-8'))
        return super().do_GET()
    def _send(self, b):
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(b))); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(b)

def start_server():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port

# ----------------------------------------------------------------------------
# Chrome
# ----------------------------------------------------------------------------

def chrome(args, timeout=90):
    base = [CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run', '--disable-extensions', '--mute-audio']
    p = subprocess.run(base + args, capture_output=True, timeout=timeout)
    return p.stdout.decode('utf-8', 'replace')

def run_audit(port, page, width, height=900):
    url = 'http://127.0.0.1:%d/__frame?page=%s&w=%d&h=%d' % (port, page, width, height)
    for budget in (6000, 15000):
        dom = chrome(['--window-size=%d,%d' % (max(width, 500) + 20, height + 20), '--virtual-time-budget=%d' % budget, '--dump-dom', url])
        m = re.search(r'<pre id="__audit">([^<]*)</pre>', dom)
        if m:
            try:
                return json.loads(base64.b64decode(html.unescape(m.group(1))).decode('utf-8'))
            except Exception as e:
                return {'auditError': 'decode: %s' % e}
    return {'auditError': 'no audit block returned'}

def screenshot(port, page, width, doc_height):
    """Full-page screenshot at an exact CSS width.

    Headless Chrome enforces a ~500px minimum window width, so a direct
    --screenshot at 375px is really a 500px layout cropped to 375. Instead the
    page is rendered inside a fixed-width iframe (same wrapper the audits use)
    in a window at least 500px wide, then cropped to the iframe with sips."""
    os.makedirs(SHOTS, exist_ok=True)
    h = max(812, min(int(doc_height or 900) + 40, 9000))
    out = os.path.join(SHOTS, '%s-%d.png' % (page.replace('.html', ''), width))
    win_w = max(width, 500)
    if (win_w - width) % 2: win_w += 1          # even side margins so the centre crop lands exactly on the iframe
    chrome(['--window-size=%d,%d' % (win_w, h), '--virtual-time-budget=4000', '--screenshot=%s' % out,
            'http://127.0.0.1:%d/__frame?page=%s&w=%d&h=%d&mode=shot' % (port, page, width, h)])
    if os.path.exists(out) and win_w != width:
        # the iframe is centred in the wrapper, and sips -c crops about the centre
        subprocess.run(['sips', '-c', str(h), str(width), out, '--out', out], capture_output=True)
    return out if os.path.exists(out) else None

# ----------------------------------------------------------------------------
# Static checks
# ----------------------------------------------------------------------------

SRC_PLACEHOLDERS = [r'\[LIABILITY_CAP_EUR\]', r'Template (document|notice|process)\.', r'Draft for legal review', r'<!--\s*DEVELOPER: replace', r'PLACEHOLDER=\'CALENDLY_URL\'']

def static_checks(pages):
    existing = set(os.listdir(ROOT))
    ids = {}
    src = {}
    for f in pages:
        t = open(os.path.join(ROOT, f), encoding='utf-8', errors='replace').read(); src[f] = t
        ids[f] = set(re.findall(r'\bid\s*=\s*"([^"]+)"', t))
    res = {}
    for f in pages:
        t = src[f]; broken = []
        for attr, val in re.findall(r'\b(href|src)\s*=\s*"([^"]*)"', t, flags=re.I):
            v = val.strip()
            if not v or v.startswith(('http://', 'https://', '//', 'mailto:', 'tel:', 'data:', 'javascript:')) or "'+" in v or '${' in v: continue
            if v.startswith('#'):
                if v[1:] and v[1:] not in ids[f] and v[1:] != 'main': broken.append(v + ' (missing id on page)')
                continue
            path, _, frag = v.partition('#')
            if not os.path.isfile(os.path.join(ROOT, path)): broken.append(v + ' (file not found)')
            elif frag and path.endswith('.html') and frag not in ids.get(path, set()): broken.append(v + ' (missing #id in target)')
        dup = [i for i in re.findall(r'\bid\s*=\s*"([^"]+)"', t) if t.count('id="%s"' % i) > 1]
        res[f] = {
            'brokenLinks': broken,
            'duplicateIdsStatic': sorted(set(dup)),
            'sourcePlaceholders': [p for p in SRC_PLACEHOLDERS if re.search(p, t)],
            'mainInSource': bool(re.search(r'<main\b', t)),
            'skipInSource': bool(re.search(r'<a[^>]+class="skip"', t)),
            'fraunces': 'Fraunces' in t,
            'base64Images': len(re.findall(r'data:image/[a-z]+;base64,', t)),
            'bytes': len(t.encode('utf-8')),
        }
    return res

# ----------------------------------------------------------------------------
# Evaluate → list of (severity, code, message)
# ----------------------------------------------------------------------------

def evaluate(page, st, audits):
    F, W = [], []
    a375 = audits.get(375, {}); a1440 = audits.get(1440, {}); a1360 = audits.get(1360, {})
    if st['brokenLinks']: F.append(('links', '%d broken: %s' % (len(st['brokenLinks']), st['brokenLinks'][:4])))
    if st['duplicateIdsStatic']: F.append(('ids', 'duplicate ids in source: %s' % st['duplicateIdsStatic'][:5]))
    if st['sourcePlaceholders']: F.append(('A1/A2/A4/E5', 'placeholder/template tokens in source: %s' % st['sourcePlaceholders']))
    if not st['mainInSource']: W.append(('D3', 'no <main> in source'))
    if not st['skipInSource']: W.append(('D2', 'skip link not in source HTML (JS-injected)'))
    if st['fraunces']: W.append(('F2', 'Fraunces referenced but never loaded'))
    if st['bytes'] > 250_000: W.append(('F3', '%dKB source, %d base64 images' % (st['bytes'] // 1024, st['base64Images'])))
    for w, a in audits.items():
        if 'auditError' in a: F.append(('tool', 'audit failed @%d: %s' % (w, a['auditError'][:120]))); continue
        if a.get('errors'): F.append(('console', '@%d %s' % (w, a['errors'][:3])))
        if a.get('overflowX', 0) > 0: F.append(('overflow', '@%d horizontal overflow %dpx' % (w, a['overflowX'])))
        if a.get('duplicateIds'): F.append(('ids', '@%d duplicate ids %s' % (w, a['duplicateIds'][:5])))
        if a.get('h1') != 1: F.append(('structure', '@%d h1 count = %s' % (w, a.get('h1'))))
        if a.get('contrastFails'): F.append(('contrast', '@%d %d pairs: %s' % (w, len(a['contrastFails']), [(c['ratio'], c['text'][:24]) for c in a['contrastFails'][:3]])))
        if a.get('namelessControls'): F.append(('a11y-name', '@%d %s' % (w, a['namelessControls'][:2])))
        if a.get('unlabelledInputs'): F.append(('a11y-label', '@%d %s' % (w, a['unlabelledInputs'])))
        if a.get('renderedPlaceholders'): F.append(('A1/A2/E5/F1', '@%d rendered: %s' % (w, a['renderedPlaceholders'])))
        if a.get('lastUpdatedCount', 0) > 1: F.append(('A3', '@%d %d "Last updated" lines' % (w, a['lastUpdatedCount'])))
        if a.get('images', {}).get('failed'): F.append(('images', '@%d failed decode: %s' % (w, a['images']['failed'])))
        if a.get('images', {}).get('missingAlt'): F.append(('a11y-alt', '@%d %d img without alt' % (w, a['images']['missingAlt'])))
        if a.get('clippedGrids'): F.append(('C1', '@%d clipped grid children: %s' % (w, a['clippedGrids'][:2])))
        if a.get('footerInlineLinks'): F.append(('C7', '@%d %d footer links share a line with their neighbour' % (w, a['footerInlineLinks'])))
        if a.get('calcMaths') and not a['calcMaths']['ok']: F.append(('calc', '@%d maths drift: %s' % (w, a['calcMaths'])))
        if a.get('calendly'):
            c = a['calendly']
            if not (c['scriptInjected'] and c['cssInjected'] and c['fallbackDisplay'] == 'none' and c['widgetHeight'] > 300): F.append(('calendly', '@%d %s' % (w, c)))
        if page == 'director-calculator.html' and 'sal' in (a.get('rangesInClosedDetails') or []): F.append(('B1', '@%d salary slider hidden inside closed <details>' % w))
        sk = a.get('skipLink') or {}
        if sk and not sk.get('targetExists'): F.append(('D3', '@%d skip link target missing' % w))
    # width-invariant checks: evaluate once, on the first successful audit
    a = next((x for x in audits.values() if 'auditError' not in x), {})
    if a.get('needsInput'): W.append(('NEEDS-INPUT', ', '.join(a['needsInput'])))
    if a.get('calendly') and not a['calendly'].get('footTop'): W.append(('B3', 'no .foot-top footer on booking'))
    if a.get('faqIconVariants') and len(a['faqIconVariants']) > 1: W.append(('C5', 'mixed FAQ icons %s' % a['faqIconVariants']))
    if a.get('countdownYears') and len(a['countdownYears']) > 1: W.append(('E1', 'countdown band mixes years %s' % a['countdownYears']))
    if a.get('fonts', {}).get('fraunces'): W.append(('F2', 'an element resolves to Fraunces at runtime'))
    if a.get('main') == 0: W.append(('D3', 'no <main> landmark at runtime'))
    sk = a.get('skipLink') or {}
    if sk.get('targetExists') and sk.get('targetTabindex') != '-1': W.append(('D3', 'skip target has no tabindex=-1'))
    fr = a.get('focusRing') or {}
    if fr.get('onWhite') is not None and fr['onWhite'] < 3: W.append(('D1', 'focus ring %s:1 on white (<3:1)' % fr['onWhite']))
    if a.get('slidersMissingValuetext'): W.append(('D4', 'sliders without aria-valuetext %s' % a['slidersMissingValuetext']))
    if page in ('pension-calculator.html', 'director-calculator.html') and not a.get('ariaLiveRegions'): W.append(('D4', 'no aria-live region for results'))
    # width-specific
    lw = a375.get('logoWordmark')
    if lw and (lw['fontSize'] == '0px' or lw['textWidth'] < 20): W.append(('C3', '@375 header wordmark hidden (font-size %s, width %s)' % (lw['fontSize'], lw['textWidth'])))
    d = a375.get('drawer')
    if d and d.get('opened'):
        if d['gapWhenScrolledPx'] > 2: W.append(('C2', '@375 drawer sits %dpx below scrolled header' % d['gapWhenScrolledPx']))
        if not d['escapeCloses']: W.append(('E3', '@375 Escape does not close the drawer'))
        if d['ariaLabelWhileOpen'] == 'Open menu': W.append(('E3', '@375 toggle aria-label stays "Open menu" while open'))
        hs = [h for h in d['linkHeights'] if h > 0]
        if hs and min(hs) < 44: W.append(('a11y-target', '@375 drawer links %spx (<44)' % hs))
    elif d: W.append(('tool', '@375 drawer did not open during audit'))
    g = a375.get('deepLinkGap') or a1440.get('deepLinkGap')
    if g and g['gapBelowHeaderPx'] > 60: W.append(('C4', 'deep link #%s lands %dpx below header' % (g['id'], g['gapBelowHeaderPx'])))
    n = a1360.get('navOverrun')
    if n and n['overrun'] > 0: W.append(('C6', '@1360 nav overruns viewport by %dpx' % n['overrun']))
    return F, W

# ----------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pages', nargs='*'); ap.add_argument('--no-shots', action='store_true'); ap.add_argument('--widths', default=','.join(map(str, AUDIT_WIDTHS)))
    args = ap.parse_args()
    if not os.path.exists(CHROME): sys.exit('Chrome not found at %s (set CHROME=...)' % CHROME)
    pages = args.pages or sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, '*.html')))
    widths = [int(x) for x in args.widths.split(',')]
    os.makedirs(OUT, exist_ok=True)
    srv, port = start_server()
    t0 = time.time()
    st_all = static_checks(sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, '*.html'))))
    report = {'generated': time.strftime('%Y-%m-%d %H:%M:%S'), 'pages': {}}
    total_f = 0
    for page in pages:
        print('•', page, end=' ', flush=True)
        audits = {}
        for w in widths:
            audits[w] = run_audit(port, page, w); print('@%d' % w, end=' ', flush=True)
        shots = {}
        if not args.no_shots:
            for w in SHOT_WIDTHS:
                dh = audits.get(w, {}).get('docHeight') or max([a.get('docHeight') or 0 for a in audits.values()] or [0])
                shots[w] = screenshot(port, page, w, dh); print('📷%d' % w, end=' ', flush=True)
        F, W = evaluate(page, st_all[page], audits)
        total_f += len(F)
        report['pages'][page] = {'static': st_all[page], 'audits': audits, 'shots': shots, 'FAIL': F, 'WARN': W}
        print('→ %d FAIL, %d WARN' % (len(F), len(W)))
    srv.shutdown()
    json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
    lines = ['# Verification report', '', 'Generated %s · %d pages · %.0fs' % (report['generated'], len(pages), time.time() - t0), '', '| Page | FAIL | WARN | Notes |', '|---|---|---|---|']
    for p, r in report['pages'].items():
        notes = '; '.join('**%s** %s' % x for x in r['FAIL']) + ('; ' if r['FAIL'] and r['WARN'] else '') + '; '.join('%s %s' % x for x in r['WARN'])
        lines.append('| %s | %d | %d | %s |' % (p, len(r['FAIL']), len(r['WARN']), notes.replace('|', '\\|')[:600]))
    lines += ['', 'Screenshots: `verify-out/shots/<page>-<width>.png`', '', 'FAIL = must be zero before launch. WARN = open backlog item, tracked by code in docs/ISSUES.md.']
    open(os.path.join(OUT, 'report.md'), 'w').write('\n'.join(lines) + '\n')
    print('\n%s\nTOTAL FAIL: %d  → %s' % ('-' * 60, total_f, os.path.join(OUT, 'report.md')))
    sys.exit(1 if total_f else 0)

if __name__ == '__main__':
    main()
