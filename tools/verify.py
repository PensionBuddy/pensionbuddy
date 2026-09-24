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
  python3 tools/verify.py --shot-widths 375,1200,1440   # screenshots at these widths

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
# tools/ is a scripts directory, so it goes after the stdlib imports above;
# stamp-images.py imports pagebuild the same way
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pagebuild  # noqa: E402
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

  // fonts (F2): v3 is one text face. Inter must be REQUESTED, LOADED and carrying
  // every heading at 800, no dropped family may be requested or resolve anywhere,
  // and the one heading recipe means at most three distinct heading sizes at a
  // given width. v4 dropped IBM Plex Mono too: the numerals and the labels are
  // Inter with tabular figures, so Plex joins the dropped list.
  try{
    /* a stalled font fetch must not stall the audit: eight seconds, then read what has loaded */
    await Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,8000)})]);
    const famOf=el=>el?getComputedStyle(el).fontFamily:'';
    const first=s=>String(s).split(',')[0].replace(/['"]/g,'').trim();
    const DROPPED=/Fraunces|Hanken|Bricolage|Sora|Plex/i;
    const hs=$$('h1,h2,h3,h4');
    R.fonts={
      /* fonts.check() reports true for families that fall back, so ask the FontFace set directly */
      interLoaded:[...document.fonts].some(f=>/Inter/i.test(f.family)&&f.status==='loaded'),
      interFaces:[...document.fonts].filter(f=>/Inter/i.test(f.family)).length,
      linkRequestsInter:$$('link[rel=stylesheet]').some(l=>/Inter/i.test(l.href)),
      linkRequestsDropped:$$('link[rel=stylesheet]').filter(l=>DROPPED.test(l.href)).map(l=>l.href.slice(0,90)),
      h1:first(famOf(document.querySelector('h1'))),
      h2:first(famOf(document.querySelector('h2'))),
      body:first(famOf(document.body)),
      /* the footer column labels are h2s by markup (h4s until Run 21, which
         skipped a level) and labels by job: sentence
         case, small, semibold. They are excluded from the one-recipe
         expectations by where they sit, not by face (v4: there is one face),
         rather than the expectations being loosened for every heading. */
      headingCount:hs.length,
      headingsOffInter:hs.filter(h=>!/Inter/i.test(famOf(h))).map(h=>h.tagName+':'+first(famOf(h))).slice(0,4),
      headingWeights:[...new Set(hs.filter(h=>!h.closest('.foot-col')).map(h=>getComputedStyle(h).fontWeight))].sort(),
      headingSizes:[...new Set(hs.filter(h=>!h.closest('.foot-col')).map(h=>getComputedStyle(h).fontSize))].sort(),
      droppedAtRuntime:[...new Set($$('body *').map(e=>first(famOf(e))).filter(f=>DROPPED.test(f)))].slice(0,4)
    };
  }catch(e){R.fonts={error:String(e)}}

  // case (v4): the caps-mono label system is gone. No element may render with
  // text-transform:uppercase, no text may be tracked out (positive
  // letter-spacing), and no text may resolve to a monospace family. Measured
  // on every element that carries its own text, so a rule that creeps back in
  // through any of the stylesheet's layers is caught where it lands. A future
  // <pre>, <code> or <kbd> would fail this on the browser's default face: that
  // is the point, not a gap. Monospace is out of the project; a code sample
  // would have to be set in the body face or this ban relaxed on purpose.
  try{
    const own=e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    const texty=$$('body *').filter(e=>own(e)&&getComputedStyle(e).display!=='none');
    const first=s=>String(s).split(',')[0].replace(/['"]/g,'').trim();
    const name=e=>e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')+':'+e.textContent.trim().slice(0,18);
    const caps=texty.filter(e=>getComputedStyle(e).textTransform==='uppercase');
    const tracked=texty.filter(e=>parseFloat(getComputedStyle(e).letterSpacing)>0);
    const mono=texty.filter(e=>/mono|plex|courier|menlo|consolas/i.test(first(getComputedStyle(e).fontFamily)));
    const faces=[...new Set(texty.map(e=>first(getComputedStyle(e).fontFamily)))];
    R.case={caps:caps.length,capsFirst:caps.slice(0,4).map(name),tracked:tracked.length,trackedFirst:tracked.slice(0,4).map(name),
            mono:mono.length,monoFirst:mono.slice(0,4).map(name),faces:faces.slice(0,6)};
  }catch(e){R.case={error:String(e)}}

  // nav + footer link inventory (F5: "About" must reach the story section from every page)
  R.navHrefs=$$('.nav-links a').map(a=>a.getAttribute('href'));
  R.footHrefs=$$('.foot-col a').map(a=>a.getAttribute('href'));

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

  // B3: every page carries the shared 4-column footer. Reported independently of the
  // Calendly block — F4 defers widget creation until submit, so keying this off
  // #calWidget silently retired the check.
  R.footTop=!!document.querySelector('.foot-top');

  // booking calendly (must stay correct). Absent at load once F4 gates the embed.
  const cw=document.getElementById('calWidget');
  if(cw){R.calendly={dataUrl:cw.getAttribute('data-url'),widgetHeight:Math.round(cw.getBoundingClientRect().height),scriptInjected:!!document.querySelector('script[src*="calendly"]'),cssInjected:!!document.querySelector('link[href*="calendly"]'),fallbackDisplay:getComputedStyle(document.getElementById('calFallback')||cw).display,footTop:!!document.querySelector('.foot-top')}}

  // ---- interaction checks last (they mutate the page) ----
  // F4: the qualifying form must gate the Calendly embed, and reveal it once completed
  if(/booking/.test(location.pathname)){
    const form=document.getElementById('qualForm');
    const embedWrap=document.getElementById('calStage')||document.getElementById('calEmbed');
    const vis=el=>{if(!el)return false;const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&el.getBoundingClientRect().height>0};
    const g={formExists:!!form,embedVisibleBeforeSubmit:vis(embedWrap)};
    if(form){
      const fields=$$('#qualForm input,#qualForm select,#qualForm textarea').filter(i=>i.type!=='hidden');
      g.fields=fields.map(i=>i.id||i.name||i.type);
      g.unlabelled=fields.filter(i=>!(i.labels&&i.labels.length)&&!i.getAttribute('aria-label')&&!i.getAttribute('aria-labelledby')).map(i=>i.id||i.type);
      g.smallTargets=fields.filter(i=>i.getBoundingClientRect().height<44).map(i=>i.id||i.type);
      g.hasLiveError=!!form.querySelector('[aria-live]')||!!document.querySelector('#qualErr[aria-live]');
      // submit empty -> must NOT reveal
      form.requestSubmit?form.requestSubmit():form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      await new Promise(r=>setTimeout(r,250));
      g.revealsWhenEmpty=vis(embedWrap);
      // fill and submit properly
      const set=(el,v)=>{if(!el)return;const p=Object.getPrototypeOf(el);const d=Object.getOwnPropertyDescriptor(p,'value');d&&d.set?d.set.call(el,v):el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
      fields.forEach(f=>{
        if(f.tagName==='SELECT'){const opt=[...f.options].find(o=>o.value&&o.value!=='');if(opt)set(f,opt.value);}
        else if(f.type==='radio'){if(/director/i.test(f.value||f.id||''))f.click();}
        else if(f.type==='email')set(f,'test@example.com');
        else set(f,'Test Person');
      });
      if(!$$('#qualForm input[type=radio]:checked').length){const r0=document.querySelector('#qualForm input[type=radio]');r0&&r0.click();}
      form.requestSubmit?form.requestSubmit():form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      await new Promise(r=>setTimeout(r,900));
      g.revealsWhenComplete=vis(embedWrap);
      const w=document.getElementById('calWidget');
      g.urlAfterSubmit=w?(w.getAttribute('data-url')||'').slice(0,190):null;
      g.fallbackLinkPresent=!!document.getElementById('calOpenBtn');
      // the B2/Calendly assertions the load-time block used to make, now made post-reveal
      g.widgetCreated=!!w;
      g.scriptInjectedAfter=!!document.querySelector('script[src*="calendly"]');
      g.cssInjectedAfter=!!document.querySelector('link[href*="calendly"]');
      g.widgetHeightAfter=w?Math.round(w.getBoundingClientRect().height):0;
      g.openBtnHref=(document.getElementById('calOpenBtn')||{}).href||null;
    }
    R.bookingGate=g;
  }
  // deep-link offset (C4): glossary terms + any page's first in-page anchor target
  const term=document.getElementById('tax-relief')||document.getElementById('deadline')||document.getElementById('about');
  const nav=document.querySelector('nav');
  /* C4: what matters is where the target lands relative to the VIEWPORT — scroll-padding-top
     should park it just clear of the header. Measuring against nav.getBoundingClientRect()
     is unreliable: the sticky header shrinks on scroll and then auto-hides, so "gap below
     header" drifts with the header's own behaviour rather than the anchor offset. */
  if(term&&nav){
    de.style.scrollBehavior='auto';
    term.scrollIntoView({behavior:'instant',block:'start'});
    await new Promise(r=>setTimeout(r,350));
    const headerH=Math.round(nav.getBoundingClientRect().height);
    R.deepLinkGap={id:term.id,termTopFromViewport:Math.round(term.getBoundingClientRect().top),headerHeightPx:headerH,gapBelowHeaderPx:Math.round(term.getBoundingClientRect().top-nav.getBoundingClientRect().bottom),scrollY:Math.round(scrollY)};
    scrollTo(0,0);de.style.scrollBehavior='';
  }
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
    """One headless Chrome run. A launch that stalls past the timeout is
    killed and tried again, twice: an 18-page run of 54 audits and 54 shots
    was lost twice to a single stalled load (once at an audit, once at a
    screenshot, different pages each time), and a traceback loses the report
    for the 17 pages that were fine. Three stalls in a row give up and hand
    back nothing, which the audit reports as an error for that page."""
    base = [CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run', '--disable-extensions', '--mute-audio']
    for attempt in range(3):
        try:
            p = subprocess.run(base + args, capture_output=True, timeout=timeout)
            return p.stdout.decode('utf-8', 'replace')
        except subprocess.TimeoutExpired:
            print('(chrome stalled, retry %d)' % (attempt + 1), end=' ', flush=True)
    return ''

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

    Taken with prefers-reduced-motion forced on, so anything that animates on
    entry (the reveals, the home page's count-up and growing bars, the jar's
    spill) is captured settled at its final state rather than mid-flight. A
    capture is proof of what the page says, and a figure caught halfway through
    a tween says the wrong number.

    Headless Chrome enforces a ~500px minimum window width, so a direct
    --screenshot at 375px is really a 500px layout cropped to 375. Instead the
    page is rendered inside a fixed-width iframe (same wrapper the audits use)
    in a window at least 500px wide, then cropped to the iframe with sips."""
    os.makedirs(SHOTS, exist_ok=True)
    # 16000 rather than 9000: the home page passed 11,000px once the offering
    # list and the product band arrived, and a capped shot proves nothing about
    # the closing band it cuts off
    h = max(812, min(int(doc_height or 900) + 40, 16000))
    # a page in a subfolder ("games/buddys-run.html") flattens to one filename
    out = os.path.join(SHOTS, '%s-%d.png' % (page.replace('.html', '').replace('/', '-'), width))
    win_w = max(width, 500)
    if (win_w - width) % 2: win_w += 1          # even side margins so the centre crop lands exactly on the iframe
    chrome(['--force-prefers-reduced-motion', '--window-size=%d,%d' % (win_w, h), '--virtual-time-budget=4000', '--screenshot=%s' % out,
            'http://127.0.0.1:%d/__frame?page=%s&w=%d&h=%d&mode=shot' % (port, page, width, h)])
    if os.path.exists(out) and win_w != width:
        # the iframe is centred in the wrapper, and sips -c crops about the centre
        subprocess.run(['sips', '-c', str(h), str(width), out, '--out', out], capture_output=True)
    return out if os.path.exists(out) else None

# ----------------------------------------------------------------------------
# Static checks
# ----------------------------------------------------------------------------

SRC_PLACEHOLDERS = [r'\[LIABILITY_CAP_EUR\]', r'Template (document|notice|process)\.', r'Draft for legal review', r'<!--\s*DEVELOPER: replace', r'PLACEHOLDER=\'CALENDLY_URL\'']

# Every page the site ships, as ROOT-relative paths: the root pages, plus the
# arcade pages in games/ (Buddy's Run and Jargon Battle), which are real pages
# a visitor can land on and so get audited exactly like the rest.
PAGE_GLOBS = ('*.html', 'games/*.html')


def all_pages():
    return sorted(os.path.relpath(p, ROOT).replace(os.sep, '/')
                  for pat in PAGE_GLOBS
                  for p in glob.glob(os.path.join(ROOT, pat)))


def is_root_page(page):
    """False for a page that lives in a subfolder (games/*.html).

    The game pages are deliberately chromeless: they are also shown inside the
    iframe on glossary.html, so they carry no skip link, no site nav drawer, no
    announcement bar and no four-column footer. Expectations about that chrome
    are scoped to root pages rather than relaxed for everyone."""
    return '/' not in page


def static_checks(pages):
    ids = {}
    src = {}
    for f in pages:
        t = open(os.path.join(ROOT, f), encoding='utf-8', errors='replace').read(); src[f] = t
        ids[f] = set(re.findall(r'\bid\s*=\s*"([^"]+)"', t))
    # the shared chrome, nav and footer link columns, against the skeleton on
    # every page at once: src holds all sixteen whatever --pages asked for.
    # Root pages only, which is exactly what tools/sync-chrome.py owns: the two
    # game pages under games/ are deliberately chromeless, because each also
    # runs inside the iframe on glossary.html, so they have no nav or foot-top
    # to drift and asking would report every one of them as a structure fault.
    drift = pagebuild.chrome_drift({f: t for f, t in src.items() if is_root_page(f)})
    # Held back (Run 21): a page carrying pagebuild.NOINDEX is live but kept out
    # of reach until it is signed off, so no other page may link to it. Signing
    # a page off means removing that meta, which lifts this check by itself.
    held = {f for f, t in src.items() if pagebuild.NOINDEX in t}
    res = {}
    for f in pages:
        t = src[f]; broken = []; held_links = []
        # a relative href resolves against the page's own folder, so "../booking.html"
        # from games/buddys-run.html is the site's booking.html
        base = os.path.dirname(f)
        for attr, val in re.findall(r'\b(href|src)\s*=\s*"([^"]*)"', t, flags=re.I):
            v = val.strip()
            if not v or v.startswith(('http://', 'https://', '//', 'mailto:', 'tel:', 'data:', 'javascript:')) or "'+" in v or '${' in v: continue
            if v.startswith('#'):
                if v[1:] and v[1:] not in ids[f] and v[1:] != 'main': broken.append(v + ' (missing id on page)')
                continue
            path, _, frag = v.partition('#')
            path = path.split('?')[0]          # cache-busting query strings are not part of the file name
            if not path:
                continue
            target = os.path.normpath(os.path.join(base, path.lstrip('/'))).replace(os.sep, '/')
            if attr.lower() == 'href' and target in held and target != f: held_links.append(v)
            if target.startswith('..'): broken.append(v + ' (resolves outside the site root)')
            elif not os.path.isfile(os.path.join(ROOT, target)): broken.append(v + ' (file not found)')
            elif frag and target.endswith('.html') and frag not in ids.get(target, set()): broken.append(v + ' (missing #id in target)')
        dup = [i for i in re.findall(r'\bid\s*=\s*"([^"]+)"', t) if t.count('id="%s"' % i) > 1]
        res[f] = {
            'brokenLinks': broken,
            'heldLinks': held_links,
            'duplicateIdsStatic': sorted(set(dup)),
            'sourcePlaceholders': [p for p in SRC_PLACEHOLDERS if re.search(p, t)],
            'mainInSource': bool(re.search(r'<main\b', t)),
            'skipInSource': bool(re.search(r'<a[^>]+class="skip"', t)),
            'droppedFamilies': sorted({m for m in re.findall(r'Fraunces|Hanken Grotesk|Bricolage Grotesque|Sora|IBM Plex Mono', t)}),
            'uppercaseRules': len(re.findall(r'text-transform\s*:\s*uppercase', t)),
            'requestsInter': bool(re.search(r'fonts\.googleapis\.com[^"\']*Inter', t)),
            'base64Images': len(re.findall(r'data:image/[a-z]+;base64,', t)),
            'editorLeak': sorted(set(re.findall(r'data-pbe[a-z-]*|pbe-(?:bar|css|js|data|pop)|edit-server\.py|edit-mode/editor', t))),
            'chromeDrift': ['%s: %s' % d for d in drift.get(f, [])],
            'bytes': len(t.encode('utf-8')),
        }
    return res

# ----------------------------------------------------------------------------
# Evaluate → list of (severity, code, message)
# ----------------------------------------------------------------------------

def evaluate(page, st, audits):
    F, W = [], []
    # The local copy editor (tools/edit-server.py) injects its markers and its UI
    # into the copy of a page it serves, never into the file. If any of it shows
    # up in a file on disk, something has written the editor into the real site
    # and it would ship. That is a launch blocker, not a warning.
    if st.get('editorLeak'):
        F.append(('EDITOR-LEAK', 'local copy-editor markup is in the source file: %s'
                  % ', '.join(st['editorLeak'][:6])))
    # The nav and the footer's link columns are owned by pension-calculator.html
    # and copied to every page (tools/sync-chrome.py, tools/pagebuild.py). A
    # page whose copy differs, beyond its own current-item marker, is a page
    # that missed an edit, and that is exactly the omission the guard exists
    # to catch: a FAIL, not a warning.
    if st.get('chromeDrift'):
        F.append(('chrome', 'shared chrome differs from pension-calculator.html: %s'
                  % '; '.join(st['chromeDrift'][:3])))
    a375 = audits.get(375, {}); a1440 = audits.get(1440, {}); a1360 = audits.get(1360, {})
    if st['brokenLinks']: F.append(('links', '%d broken: %s' % (len(st['brokenLinks']), st['brokenLinks'][:4])))
    if st.get('heldLinks'): F.append(('held', 'links to a page held back with noindex: %s' % st['heldLinks'][:4]))
    if st['duplicateIdsStatic']: F.append(('ids', 'duplicate ids in source: %s' % st['duplicateIdsStatic'][:5]))
    if st['sourcePlaceholders']: F.append(('A1/A2/A4/E5', 'placeholder/template tokens in source: %s' % st['sourcePlaceholders']))
    root_page = is_root_page(page)
    if not st['mainInSource']: W.append(('D3', 'no <main> in source'))
    # chrome-only expectation: the game pages ship deliberately chromeless
    if root_page and not st['skipInSource']: W.append(('D2', 'skip link not in source HTML (JS-injected)'))
    # F2: v3 dropped Fraunces, Hanken Grotesk and Bricolage Grotesque for one face.
    # Naming any of them in the source now is the defect, and so is a page that
    # never asks the font service for Inter.
    if st['droppedFamilies']: F.append(('F2', 'a dropped family is still named in source: %s' % ', '.join(st['droppedFamilies'])))
    # CASE (v4): sentence case everywhere, one face. The rule may not be in the
    # source, and the runtime check below catches it arriving any other way.
    if st.get('uppercaseRules'): F.append(('CASE', '%d text-transform:uppercase rule(s) in source' % st['uppercaseRules']))
    if not st['requestsInter']: F.append(('F2', 'source does not request Inter from the font service'))
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
        # chrome-only: only a root page is expected to carry a skip link at all
        if root_page and sk and not sk.get('targetExists'): F.append(('D3', '@%d skip link target missing' % w))
    # width-invariant checks: evaluate once, on the first successful audit
    a = next((x for x in audits.values() if 'auditError' not in x), {})
    if a.get('needsInput'): W.append(('NEEDS-INPUT', ', '.join(a['needsInput'])))
    # F2 — one face: Inter requested, loaded, carrying every heading at 800,
    # in at most the three sizes the one heading recipe allows at a given width
    fo = a.get('fonts') or {}
    if fo and not fo.get('error'):
        if not fo.get('linkRequestsInter'): F.append(('F2', 'stylesheet does not request Inter'))
        elif not fo.get('interLoaded'): F.append(('F2', 'Inter requested but did not load'))
        if fo.get('linkRequestsDropped'): F.append(('F2', 'a dropped family is still requested: %s' % fo['linkRequestsDropped'][0]))
        if fo.get('headingsOffInter'): F.append(('F2', 'headings not on Inter: %s' % fo['headingsOffInter']))
        if fo.get('droppedAtRuntime'): F.append(('F2', 'a dropped family resolves at runtime: %s' % fo['droppedAtRuntime']))
        bad_w = [w for w in (fo.get('headingWeights') or []) if str(w) != '800']
        if bad_w: W.append(('F2', 'headings render at weights other than 800: %s' % bad_w))
        sizes = fo.get('headingSizes') or []
        if len(sizes) > 3: W.append(('F2', '%d distinct heading sizes, the one recipe allows 3: %s' % (len(sizes), sizes)))
    # CASE (v4) at runtime: nothing in caps, nothing tracked out, nothing monospace
    cs = a.get('case') or {}
    if cs and not cs.get('error'):
        if cs.get('caps'): F.append(('CASE', '%d element(s) render uppercase: %s' % (cs['caps'], cs['capsFirst'])))
        if cs.get('tracked'): F.append(('CASE', '%d element(s) render with positive letter-spacing: %s' % (cs['tracked'], cs['trackedFirst'])))
        if cs.get('mono'): F.append(('CASE', '%d element(s) render on a monospace face: %s' % (cs['mono'], cs['monoFirst'])))
    # F5 — About must be reachable from the nav of every page
    nav = a.get('navHrefs') if root_page else None       # chrome-only: the games have no site nav or footer
    if nav is not None and not any('#story' in (h or '') for h in nav + (a.get('footHrefs') or [])):
        W.append(('F5', 'no link to the story section in nav or footer'))
    # F4 — the qualifying form must gate the embed
    g = a.get('bookingGate')
    if g is not None:
        if not g.get('formExists'): W.append(('F4', 'no qualifying form ahead of the calendar'))
        else:
            if g.get('embedVisibleBeforeSubmit'): F.append(('F4', 'calendar is visible before the form is completed'))
            if g.get('revealsWhenEmpty'): F.append(('F4', 'empty form submit reveals the calendar'))
            if not g.get('revealsWhenComplete'): F.append(('F4', 'completed form does not reveal the calendar'))
            if not g.get('fallbackLinkPresent'): F.append(('F4', 'B2 regression: Calendly fallback link gone'))
            if g.get('revealsWhenComplete'):
                if not g.get('widgetCreated'): F.append(('F4', 'reveal happened but no Calendly widget was created'))
                if not (g.get('scriptInjectedAfter') and g.get('cssInjectedAfter')): F.append(('F4', 'Calendly script/CSS not injected after reveal'))
                if (g.get('widgetHeightAfter') or 0) < 300: W.append(('F4', 'revealed widget is only %spx tall' % g.get('widgetHeightAfter')))
                oh = g.get('openBtnHref') or ''
                if oh and not ('email=' in oh and 'utm_' in oh): W.append(('F4', 'fallback link is not prefilled/tagged like the embed'))
            if g.get('unlabelled'): F.append(('F4', 'unlabelled field(s): %s' % g['unlabelled']))
            if g.get('smallTargets'): W.append(('F4', 'field(s) under 44px: %s' % g['smallTargets']))
            if not g.get('hasLiveError'): W.append(('F4', 'no aria-live error region on the form'))
            u = g.get('urlAfterSubmit') or ''
            if u and not ('email=' in u and ('utm_' in u or 'a1=' in u)): W.append(('F4', 'Calendly URL carries no prefill/persona tag: %s' % u[:90]))
    # chrome-only: the shared four-column footer belongs to the root pages
    if root_page and a.get('footTop') is False: F.append(('B3', 'page has no .foot-top footer'))
    if a.get('faqIconVariants') and len(a['faqIconVariants']) > 1: W.append(('C5', 'mixed FAQ icons %s' % a['faqIconVariants']))
    if a.get('countdownYears') and len(a['countdownYears']) > 1: W.append(('E1', 'countdown band mixes years %s' % a['countdownYears']))
    if a.get('main') == 0: W.append(('D3', 'no <main> landmark at runtime'))
    sk = a.get('skipLink') or {}
    if sk.get('targetExists') and sk.get('targetTabindex') != '-1': W.append(('D3', 'skip target has no tabindex=-1'))
    fr = a.get('focusRing') or {}
    if fr.get('onWhite') is not None and fr['onWhite'] < 3: W.append(('D1', 'focus ring %s:1 on white (<3:1)' % fr['onWhite']))
    if a.get('slidersMissingValuetext'): W.append(('D4', 'sliders without aria-valuetext %s' % a['slidersMissingValuetext']))
    if page in ('pension-calculator.html', 'director-calculator.html') and not a.get('ariaLiveRegions'): W.append(('D4', 'no aria-live region for results'))
    # width-specific
    # chrome-only: the sticky site header, and with it the wordmark, exists on root pages
    lw = a375.get('logoWordmark') if root_page else None
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
    if g:
        top = g.get('termTopFromViewport')
        if top is not None:
            if top < g.get('headerHeightPx', 0): W.append(('C4', 'deep link #%s lands %dpx from the top, under the %dpx header' % (g['id'], top, g['headerHeightPx'])))
            elif top > g.get('headerHeightPx', 0) + 90: W.append(('C4', 'deep link #%s lands %dpx from the top, far below the %dpx header' % (g['id'], top, g['headerHeightPx'])))
    n = a1360.get('navOverrun')
    if n and n['overrun'] > 0: W.append(('C6', '@1360 nav overruns viewport by %dpx' % n['overrun']))
    return F, W

# ----------------------------------------------------------------------------

def site_checks():
    """Site-level expectations that are not about one page in isolation."""
    out = []
    for page, why in (('thank-you.html', 'F6 post-booking page'),):
        if not os.path.isfile(os.path.join(ROOT, page)):
            out.append(('MISSING-PAGE', '%s does not exist (%s)' % (page, why)))
    # about.html was folded into the home page. The story, the three profiles and
    # the regulatory detail it carried have to still be somewhere.
    ix = os.path.join(ROOT, 'index.html')
    if os.path.isfile(ix):
        t = open(ix, encoding='utf-8', errors='replace').read()
        for anchor, why in (('id="story"', 'the story section'), ('id="damian"', "Damian's profile"),
                            ('id="adam"', "Adam's profile"), ('id="buddy"', "Buddy's profile"),
                            ('registers.centralbank.ie', 'the Central Bank register reference')):
            if anchor not in t:
                out.append(('F5', 'index.html is missing %s (%s)' % (anchor, why)))
    if os.path.isfile(os.path.join(ROOT, 'about.html')):
        out.append(('F5', 'about.html is back, but every link now points at index.html#story'))
    bk = os.path.join(ROOT, 'booking.html')
    if os.path.isfile(bk) and os.path.isfile(os.path.join(ROOT, 'thank-you.html')):
        t = open(bk, encoding='utf-8', errors='replace').read()
        if 'thank-you' not in t:
            out.append(('F6', 'booking.html never references thank-you.html — redirect not wired in the page'))
    sm = os.path.join(ROOT, 'sitemap.xml')
    if os.path.isfile(sm):
        s = open(sm, encoding='utf-8', errors='replace').read()
        for page in ('thank-you.html',):
            if os.path.isfile(os.path.join(ROOT, page)) and page not in s and page != 'thank-you.html':
                out.append(('sitemap', '%s exists but is not in sitemap.xml' % page))
        # a page held back with noindex has no place in the sitemap either
        for page in all_pages():
            t = open(os.path.join(ROOT, page), encoding='utf-8', errors='replace').read()
            if pagebuild.NOINDEX in t and '/%s<' % page in s:
                out.append(('held', '%s is held back with noindex but listed in sitemap.xml' % page))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pages', nargs='*'); ap.add_argument('--no-shots', action='store_true'); ap.add_argument('--widths', default=','.join(map(str, AUDIT_WIDTHS)))
    ap.add_argument('--shot-widths', default=','.join(map(str, SHOT_WIDTHS)), help='screenshot widths, e.g. 375,1200,1440')
    args = ap.parse_args()
    shot_widths = [int(x) for x in args.shot_widths.split(',')]
    if not os.path.exists(CHROME): sys.exit('Chrome not found at %s (set CHROME=...)' % CHROME)
    pages = args.pages or all_pages()
    widths = [int(x) for x in args.widths.split(',')]
    os.makedirs(OUT, exist_ok=True)
    srv, port = start_server()
    t0 = time.time()
    st_all = static_checks(all_pages())
    report = {'generated': time.strftime('%Y-%m-%d %H:%M:%S'), 'pages': {}}
    total_f = 0
    for page in pages:
        print('•', page, end=' ', flush=True)
        audits = {}
        for w in widths:
            audits[w] = run_audit(port, page, w); print('@%d' % w, end=' ', flush=True)
        shots = {}
        if not args.no_shots:
            for w in shot_widths:
                dh = audits.get(w, {}).get('docHeight') or max([a.get('docHeight') or 0 for a in audits.values()] or [0])
                shots[w] = screenshot(port, page, w, dh); print('📷%d' % w, end=' ', flush=True)
        F, W = evaluate(page, st_all[page], audits)
        total_f += len(F)
        report['pages'][page] = {'static': st_all[page], 'audits': audits, 'shots': shots, 'FAIL': F, 'WARN': W}
        print('→ %d FAIL, %d WARN' % (len(F), len(W)))
    srv.shutdown()
    site = site_checks()
    report['site'] = site
    json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
    lines = ['# Verification report', '', 'Generated %s · %d pages · %.0fs' % (report['generated'], len(pages), time.time() - t0), '', '| Page | FAIL | WARN | Notes |', '|---|---|---|---|']
    for p, r in report['pages'].items():
        notes = '; '.join('**%s** %s' % x for x in r['FAIL']) + ('; ' if r['FAIL'] and r['WARN'] else '') + '; '.join('%s %s' % x for x in r['WARN'])
        lines.append('| %s | %d | %d | %s |' % (p, len(r['FAIL']), len(r['WARN']), notes.replace('|', '\\|')[:600]))
    lines += ['', '## Site-level', '']
    lines += (['- **%s** %s' % s for s in site] or ['- all site-level checks pass'])
    lines += ['', 'Screenshots: `verify-out/shots/<page>-<width>.png`', '', 'FAIL = must be zero before launch. WARN = open backlog item, tracked by code in docs/ISSUES.md. Site-level rows do not affect the exit code — judge them at the final gate.']
    open(os.path.join(OUT, 'report.md'), 'w').write('\n'.join(lines) + '\n')
    for s in site: print('  site: %-14s %s' % s)
    print('\n%s\nTOTAL FAIL: %d  → %s' % ('-' * 60, total_f, os.path.join(OUT, 'report.md')))
    sys.exit(1 if total_f else 0)

if __name__ == '__main__':
    main()
