#!/usr/bin/env python3
"""Run 43, item 4: the interactive proposals built, on real frames in real Chrome.

    python3 tests/interactive-43.test.py            # the working tree
    python3 tests/interactive-43.test.py <root>     # any checkout

The pattern of tests/gap-band.py. The site is served with a probe injected as
the first thing in each page's <head> (the font links left out, since the font
service can stall a sandbox). The probe registers a layout-shift observer
first, then from DOMContentLoaded + 600 ms reads the page, moves its controls
the way a reader would (a value set, an input event), reads it again, and
POSTs what it saw to /__result. Chrome is then killed. No-JavaScript scenarios
strip every page <script> but the probe: the markup and CSS such a reader
gets. Reduced-motion scenarios add --force-prefers-reduced-motion.

C4a (INTERACTIVE-PROPOSALS-42 ranks 7, 2, 4 and 1):
  my-pensions.html             the known charges' euro figure in red (P1-P8)
  standard-fund-threshold.html the limit bar (S1-S9), the lump-sum bar (L1-L10)
  pension-fees-calculator.html the coral area for the difference between the two plans (F1-F9;
                               plan against plan since the 13 October review, never against no charges)

C4b (INTERACTIVE-PROPOSALS-42 rank 14), index.html:
  (rank 3, the hero figures as toggles, H1-H14, went with the old gap chart
  on 11 October 2026)
  the phone slider in "Key dates for your pension." picking the relief step (T1-T8)
  (13 October 2026: the line under it gives the step's age and its plain first sentence)

C4c (INTERACTIVE-PROPOSALS-42 ranks 6, 15 and 9):
  starter.html, pensions-over-50.html, self-employed-pensions.html
                               the age slider over the relief ladder (LD1-LD5)
                               (director.html's went in Run 54: the new page shows the
                               reader's own limit in its calculator instead)
  starter.html                 the auto-enrolment phases, one button each, and their caveat (A1-A7);
                               since 13 October 2026 over what the reader puts in a month, with the
                               personal pension beside it and the note past the most (A8, A9);
                               since the 13 October review, the buttons named ("Rates in"), and past
                               the most the rest: what stays in your pay, that rest into a personal
                               pension, both together, and links that carry the amount (A8, A10)

Not part of tests/run-tests.py: one Chrome launch per scenario. Exit 0 or 1.
"""
import http.server
import json
import math
import os
import re
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import eq, report  # noqa: E402

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = tempfile.mkdtemp(prefix='pb-interactive-43-')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
REPORTS = {}

PAGES = {
    'pots': 'my-pensions.html',
    'sft': 'standard-fund-threshold.html',
    'fees': 'pension-fees-calculator.html',
    'home': 'index.html',
    'starter': 'starter.html',
    'director': 'director.html',
    'over50': 'pensions-over-50.html',
    'selfemp': 'self-employed-pensions.html',
}

PROBE = r"""<script>
(function(){
  var q=new URLSearchParams(location.search), id=q.get('id'), kind=q.get('kind'), nojs=!!q.get('nojs');
  var shifts=[], errors=[];
  function path(n){
    var out=[];
    while(n&&n.nodeType===1&&out.length<6){
      var cls=typeof n.className==='string'&&n.className.trim()?'.'+n.className.trim().split(/\s+/).join('.'):'';
      out.unshift(n.id?'#'+n.id:n.tagName.toLowerCase()+cls);
      if(n.id) break;
      n=n.parentElement;
    }
    return out.join('>');
  }
  try{
    new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){
      shifts.push({value:+e.value.toFixed(5),recent:!!e.hadRecentInput,t:Math.round(e.startTime),
        sources:(e.sources||[]).map(function(s){return path(s.node);})});
    }); }).observe({type:'layout-shift',buffered:true});
  }catch(e){ shifts.push({error:String(e)}); }
  addEventListener('error',function(e){ if(e instanceof ErrorEvent) errors.push(String(e.message)); },true);  /* script errors, not a resource that failed */

  function $(i){ return document.getElementById(i); }
  function wait(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function frames(){ return new Promise(function(r){ requestAnimationFrame(function(){ requestAnimationFrame(r); }); }); }
  function cs(el){ return getComputedStyle(el); }
  function txt(el){ return el?el.textContent:null; }
  function seen(el){ return el?(el.innerText||'').replace(/\s+/g,' ').trim():null; }
  function w(el){ return el.getBoundingClientRect().width; }
  function setv(i,v){ var el=$(i); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); }
  function tok(name){
    var d=document.createElement('div'); d.style.color='var('+name+')'; document.body.appendChild(d);
    var c=cs(d).color; d.remove(); return c;
  }
  /* every colour token named red, aqua, teal, mint or ring, resolved */
  function forbidden(){
    var names={}, out={};
    [].forEach.call(document.styleSheets,function(sh){ var rules; try{ rules=sh.cssRules; }catch(e){ return; }
      [].forEach.call(rules||[],function(r){ if(r.selectorText===':root'&&r.style){ for(var i=0;i<r.style.length;i++){ var p=r.style[i]; if(/^--(red|aqua|teal|mint|ring)/.test(p)) names[p]=1; } } }); });
    Object.keys(names).forEach(function(n){ var c=tok(n); if(/^rgb/.test(c)) out[n]=c; });
    return out;
  }
  function paints(root){
    var all=[root].concat([].slice.call(root.querySelectorAll('*'))), bad=[], f=forbidden();
    all.forEach(function(el){ var s=cs(el);
      ['color','backgroundColor','backgroundImage','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','boxShadow','outlineColor','fill','stroke'].forEach(function(p){
        var v=s[p]||''; Object.keys(f).forEach(function(n){ if(v.indexOf(f[n])>=0) bad.push(path(el)+' '+p+' '+n); });
      });
    });
    return bad;
  }
  function focusables(root){ return root.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[contenteditable]').length; }
  /* the markup as rendered: tag, attributes (style as the browser reads it), text, children */
  function norm(el){
    if(el.nodeType===3) return el.nodeValue;
    if(el.nodeType!==1) return '';
    var a=[].map.call(el.attributes,function(x){ return x.name+'='+(x.name==='style'?el.style.cssText:x.value); }).sort().join(' ');
    return '<'+el.tagName.toLowerCase()+' '+a+'>'+[].map.call(el.childNodes,norm).join('')+'</>';
  }
  function trans(el){ var s=cs(el); return [s.transitionDuration,s.animationName]; }

  /* ---- my-pensions.html (rank 7) ---- */
  async function pots(){
    var r={}, out=$('ptCharges');
    r.P1=out.innerHTML;
    if(nojs) return r;
    setv('ptValue0','40,000'); setv('ptAmc0','1'); await frames();
    var bs=out.querySelectorAll('b');
    r.P2=txt(out); r.P3=[bs.length,bs.length?txt(bs[0]):null];
    r.P4=bs.length?[cs(bs[0]).color,cs(bs[0]).fontWeight]:null;
    $('ptAdd').click(); setv('ptValue1','10,000'); await frames();
    r.P5=txt(out);
    setv('ptAmc0',''); await frames();
    r.P6=[txt(out),out.querySelectorAll('b').length];
    await wait(800);
    r.P7=txt($('ptSr'));
    return r;
  }

  /* ---- standard-fund-threshold.html (ranks 2 and 4) ---- */
  function lim(){
    var t=document.querySelector('.sft-lim-track'), tr=t.getBoundingClientRect(), tw=tr.width;
    var f=$('sftLimFill'), o=$('sftLimOver'), m=$('sftLimMark');
    return {
      fillW:f.style.getPropertyValue('--w'), overFrom:o.style.getPropertyValue('--from'), overW:o.style.getPropertyValue('--w'),
      markAt:m.style.getPropertyValue('--at'),
      fill:w(f)/tw, overLeft:(o.getBoundingClientRect().left-tr.left)/tw, over:w(o)/tw,
      mark:(m.getBoundingClientRect().left+1-tr.left)/tw,
      ovHidden:$('sftLimOvK').hidden, ovShown:$('sftLimOvK').getClientRects().length>0,
      key:seen(document.querySelector('.sft-lim-k')),
      thrL:txt($('thrL')), thr:txt($('thr')), ov:txt($('sftLimOv')), you:txt($('sftLimYou')),
      trans:[trans(f),trans(o)]
    };
  }
  function lb(){
    var t=document.querySelector('.sft-lb-track'), tw=w(t), parts=['sftLbFree','sftLbStd','sftLbInc'].map($);
    return {
      grow:parts.map(function(p){ return p.style.flexGrow; }),
      hidden:parts.map(function(p){ return p.hidden; }),
      drawn:parts.map(function(p){ return p.getClientRects().length>0; }),
      widths:parts.map(function(p){ return +w(p).toFixed(2); }), track:+tw.toFixed(2),
      key:seen(document.querySelector('.sft-lb-k')), incN:txt($('sftLbIncN')), incKHidden:$('sftLbIncK').hidden,
      trans:parts.map(trans)
    };
  }
  async function sft(){
    var r={}, L=$('sftLim'), B=$('sftLb');
    r.S1=[L.getAttribute('aria-hidden'),focusables(L)];
    r.L8=[B.getAttribute('aria-hidden'),focusables(B)];
    r.S2=lim(); r.L1=lb();
    r.S3=norm(L); r.L7=norm(B);
    r.S9=parseFloat(cs(document.querySelector('.sft-lim-k')).fontSize);
    r.L9=parseFloat(cs(document.querySelector('.sft-lb-k')).fontSize);
    var keyB=[].map.call(document.querySelectorAll('.sft-lim-k span,.sft-lim-k b,.sft-lb-k span,.sft-lb-k b'),function(e){ return parseFloat(cs(e).fontSize); });
    r.keyMin=Math.min.apply(null,keyB);
    var prev=B.previousElementSibling;
    r.L10=[prev?prev.tagName.toLowerCase()+'.'+prev.className:null,!!(prev&&prev.closest('.sft-card')===B.closest('.sft-card')&&B.closest('.sft-card'))];
    r.slate=tok('--slate');
    r.S8=[cs($('sftLimFill')).backgroundColor,cs($('sftLimMark')).borderLeftColor,paints(L)];
    if(nojs) return r;
    setv('total',2750000); await frames(); r.S4=lim();
    setv('year',2030); setv('total',3000000); await frames(); r.S5=lim();
    setv('year',2026); setv('total',0); await frames(); r.S6=lim();
    setv('total',4000000); await frames(); r.S7=lim();
    setv('total',1650000);
    setv('lump',1000000); await frames(); r.L2=lb();
    var fr=$('sftLbFree'), sd=$('sftLbStd'), ic=$('sftLbInc');
    r.L5=[cs(fr).backgroundColor,cs(fr).boxShadow,cs(sd).backgroundImage,cs(ic).backgroundColor,paints(B),cs(document.querySelector('.sft-lb-track')).columnGap];
    setv('lump',0); await frames(); r.L3=lb();
    setv('lump',150000); await frames(); r.L4=lb();
    return r;
  }

  /* ---- pension-fees-calculator.html (rank 1) ---- */
  function pts(s){ return s.trim().split(/\s+/).map(function(p){ return p.split(',').map(Number); }); }
  function area(ps){ var a=0; for(var i=0;i<ps.length;i++){ var j=(i+1)%ps.length; a+=ps[i][0]*ps[j][1]-ps[j][0]*ps[i][1]; } return Math.abs(a)/2; }
  async function fees(){
    var r={}, box=$('feeChart');
    r.F9=box.innerHTML;
    if(nojs) return r;
    var svg=box.querySelector('svg'), kids=[].slice.call(svg.children), polys=box.querySelectorAll('polygon.fee-gap');
    var g=polys[0], firstLine=kids.findIndex(function(k){ return k.tagName==='polyline'; });
    r.F1=[polys.length,kids.indexOf(g)<firstLine,g?cs(g).fill:null];
    /* 13 October 2026 review: plan against plan; no no-charge line on the chart */
    var bp=box.querySelector('.fee-l-b').getAttribute('points'), a=box.querySelector('.fee-l-a').getAttribute('points');
    r.F2=[g.getAttribute('points')===bp+' '+a.split(' ').reverse().join(' '),box.querySelectorAll('.fee-l-none').length];
    var e=box.querySelector('.fee-l-b-edge'), b=box.querySelector('.fee-l-b');
    r.F3=[!!e&&e.nextElementSibling===b,!!e&&e.getAttribute('points')===b.getAttribute('points'),e?cs(e).stroke:null,e?cs(e).strokeWidth:null];
    r.F4=[box.getAttribute('aria-label'),txt($('costA'))];
    var li=document.querySelectorAll('.fee-key li');
    r.F6=[li.length,li[2]?seen(li[2]):null,li[2]&&li[2].querySelector('i.fee-k-gap')?cs(li[2].querySelector('i')).backgroundColor:null];
    r.F7=trans(g);
    /* the plot is the viewBox's 250 less its top and bottom margins (26 and 28) */
    var bb=svg.getBoundingClientRect();
    r.F8=[box.querySelectorAll('polygon.fee-gap').length,+bb.height.toFixed(1),+(bb.width*250/600).toFixed(1),+(bb.height*196/250).toFixed(1)];
    setv('amcA',0.4); setv('feeA',0); await frames();
    var g2=box.querySelector('polygon.fee-gap');
    r.F5=[g2?area(pts(g2.getAttribute('points'))):null,box.getAttribute('aria-label'),txt($('pbSay'))];
    return r;
  }

  /* ---- index.html (ranks 3 and 14) ---- */
  function rect(el){ if(!el) return null; var b=el.getBoundingClientRect(); return [b.left,b.top,b.width,b.height].map(function(v){ return +v.toFixed(2); }); }
  function tl(){
    var p=$('pbTlPick'), r=$('pbTlAgeS'), on=[].slice.call(document.querySelectorAll('#pbTl .pb-tl-picked'));
    return {shown:p?p.getClientRects().length>0&&cs(p).display!=='none':null, display:p?cs(p).display:null,
      value:r?r.value:null, valuetext:r?r.getAttribute('aria-valuetext'):null, fill:r?r.style.getPropertyValue('--fill'):null,
      v:txt($('pbTlAgeSV')), now:txt($('pbTlNow')), nowHidden:$('pbTlNow')?$('pbTlNow').getAttribute('aria-hidden'):null,
      picked:on.map(function(li){ return li.getAttribute('data-age'); }),
      pickedBg:on.length?cs(on[0]).backgroundColor:null, pickedDot:on.length?getComputedStyle(on[0],'::after').backgroundColor:null, pickedRing:on.length?getComputedStyle(on[0],'::after').borderTopColor:null,
      card:txt($('pbTlAge')), cardWhat:txt($('pbTlWhat'))};
  }
  function liRects(){ return [].map.call(document.querySelectorAll('#pbTl .pb-tl-step'),rect); }
  async function home(){
    /* 11 October 2026: the hero's figure buttons (H1-H14) went with the old gap chart; the timeline stays */
    var r={};
    r.T1=tl(); r.T8=[].map.call(document.querySelectorAll('#pbTl .pb-tl-step'),function(li){ return cs(li).transitionDuration; });
    r.surface2=tok('--surface-2'); r.slate=tok('--slate');
    if(nojs) return r;
    /* the phone slider */
    var li0=liRects();
    setv('pbTlAgeS',62); await frames(); r.T2=tl(); r.T2.li=liRects();
    setv('pbTlAgeS',18); await frames(); r.T3=tl();
    setv('pbTlAgeS',61); await frames(); r.T4=tl();
    setv('pbTlAgeS',75); await frames(); r.T5=tl();
    setv('pbTlAgeS',40); await frames(); r.T1b=[li0,liRects(),tl()];
    return r;
  }

  /* ---- the age-only relief ladders (ranks 6 and 15) and the starter's phases (rank 9) ---- */
  function lad(){
    var root=document.querySelector('.pb-lad[data-pb-age]'), ctl=root?root.querySelector('.pb-lad-ctl'):null, r=$('ladAge');
    var you=[].slice.call(root.querySelectorAll('.pb-lad-you')).filter(function(y){ return y.getClientRects().length>0; });
    var prev=root.previousElementSibling;
    return {ctlShown:!!ctl&&ctl.getClientRects().length>0&&cs(ctl).display!=='none',
      value:r?r.value:null, valuetext:r?r.getAttribute('aria-valuetext'):null, fill:r?r.style.getPropertyValue('--fill'):null,
      v:txt($('ladAgeV')), out:root.querySelectorAll('.pb-lad-out').length,
      you:you.map(function(y){ return y.closest('.pb-lad-row').getAttribute('data-from'); }),
      pct:[].map.call(root.querySelectorAll('.pb-lad-pct'),function(e){ return txt(e); }),
      cap:txt(root.querySelector('.pb-lad-cap')), note:txt(root.querySelector('.pb-lad-note')),
      prev:prev?[prev.tagName.toLowerCase(),seen(prev)]:null, ladders:document.querySelectorAll('.pb-lad').length,
      rows:[].map.call(root.querySelectorAll('.pb-lad-row'),rect)};
  }
  function ae(){
    var ph=$('aePh'), note=$('aePhNote'), box=$('pbAe'), max=$('aeMax'), amt=$('aeAmt'), a=max?max.querySelector('a'):null;
    return {shown:!!ph&&ph.getClientRects().length>0, hidden:ph?ph.hidden:null,
      pressed:ph?[].map.call(ph.querySelectorAll('button'),function(b){ return b.getAttribute('aria-pressed'); }):null,
      labels:ph?[].map.call(ph.querySelectorAll('button'),function(b){ return txt(b); }):null,
      figs:['aeYou','aeEmp','aeState'].map(function(i){ return txt($(i)); }),
      sums:['aeAll','aeMost','aePp','aePp40'].map(function(i){ return txt($(i)); }),
      widths:[].map.call(document.querySelectorAll('.pb-ae .pb-ae-fill'),function(f){ return f.style.width; }),
      amt:amt?[amt.value,amt.getAttribute('aria-valuetext'),txt($('aeAmtV')),amt.getClientRects().length>0&&cs(amt).visibility==='visible']:null,
      over:box?box.classList.contains('pb-ae-over'):null,
      max:max?[cs(max).visibility,txt(max).replace(/\s+/g,' ').trim(),a?a.getAttribute('href'):null]:null,
      years:txt($('aeYears')), rates:txt($('aeRates')),
      hint:seen($('aeHint')), who:txt($('aePpWho')),
      both:$('aeBothP')?[cs($('aeBothP')).visibility,txt($('aeBoth'))]:null,
      cmp:box&&box.nextElementSibling&&box.nextElementSibling.tagName==='A'?box.nextElementSibling.getAttribute('href'):null,
      phl:$('aePhL')?[$('aePhL').getClientRects().length>0&&cs($('aePhL')).display!=='none',txt($('aePhL'))]:null,
      trans:ph?[].map.call(ph.querySelectorAll('button'),function(b){ return cs(b).transitionDuration; }):null,
      note:note?[note.getClientRects().length>0&&cs(note).display!=='none',note.previousElementSibling?note.previousElementSibling.id:null,seen(note)]:null,
      chips:note?note.querySelectorAll('.pb-chip,.pb-term').length:null};
  }
  async function ladder(){
    var r={}, root=document.querySelector('.pb-lad[data-pb-age]');
    /* the starter page has no ladder since 12 October 2026: its phases alone;
       since 13 October 2026 over what the reader puts in a month (#aeAmt) */
    if(!root){
      if($('aePh')) r.A1=ae();
      if(nojs||!$('aePh')) return r;
      $('aePh2').click(); await frames(); r.A2=ae();
      $('aePh4').click(); setv('aeAmt',450); await frames(); r.A3=ae();
      $('aePh1').click(); setv('aeAmt',150); await frames(); await wait(700); r.A8=ae();
      setv('aeAmt',100); await frames(); await wait(700); r.A9=ae();
      return r;
    }
    r.LD1=lad();
    if($('aePh')) r.A1=ae();
    if(nojs) return r;
    var d=$('ladAge').value;
    setv('ladAge',62); await frames(); r.LD2=lad();
    setv('ladAge',18); await frames(); r.LD3=lad();
    setv('ladAge',d); await frames(); r.LDback=lad();
    if($('aePh')){
      $('aePh2').click(); await frames(); r.A2=ae();
      $('aePh4').click(); setv('aeAmt',450); await frames(); r.A3=ae();
    }
    return r;
  }

  document.addEventListener('DOMContentLoaded',function(){
    setTimeout(async function(){
      /* the probe's own input events are not a reader's (hadRecentInput stays false), so
         only the shifts before it starts acting are the page's own */
      var body={id:id,kind:kind,nojs:nojs,width:innerWidth,reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,actAt:Math.round(performance.now())};
      try{ body.r=await ({pots:pots,sft:sft,fees:fees,home:home,starter:ladder,director:ladder,over50:ladder,selfemp:ladder})[kind](); }catch(e){ body.crash=String(e&&e.stack||e); }
      await wait(100);
      body.shifts=shifts; body.errors=errors;
      var x=new XMLHttpRequest(); x.open('POST','/__result?id='+encodeURIComponent(id),false); x.send(JSON.stringify(body));
    },600);
  });
})();
</script>"""


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        n = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(n))
        REPORTS[urllib.parse.parse_qs(u.query)['id'][0]] = body
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(u.query)
        if qs.get('probe') and qs.get('kind'):
            # the page at its own address, so its relative links resolve as on the site
            s = open(os.path.join(ROOT, PAGES[qs['kind'][0]]), encoding='utf-8').read()
            if qs.get('nojs'):
                s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S)
            s = s.replace('<head>', '<head>\n' + PROBE, 1)
            s = re.sub(r'<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>', '', s)
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


REDUCE = '--force-prefers-reduced-motion'
# id: (kind, width, no JavaScript, extra flags)
SCEN = {
    'pots-1440': ('pots', 1440, False, []),
    'pots-nojs-1440': ('pots', 1440, True, []),
    'sft-1440': ('sft', 1440, False, []),
    'sft-500': ('sft', 500, False, []),
    'sft-reduce-1440': ('sft', 1440, False, [REDUCE]),
    'sft-nojs-1440': ('sft', 1440, True, []),
    'fees-1440': ('fees', 1440, False, []),
    'fees-500': ('fees', 500, False, []),
    'fees-nojs-1440': ('fees', 1440, True, []),
    'home-1440': ('home', 1440, False, []),
    'home-500': ('home', 500, False, []),
    'home-reduce-1440': ('home', 1440, False, [REDUCE]),
    'home-reduce-500': ('home', 500, False, [REDUCE]),
    'home-nojs-1440': ('home', 1440, True, []),
    'home-nojs-500': ('home', 500, True, []),
    'starter-1440': ('starter', 1440, False, []),
    'starter-500': ('starter', 500, False, []),
    'starter-nojs-1440': ('starter', 1440, True, []),
    'over50-1440': ('over50', 1440, False, []),
    'over50-nojs-1440': ('over50', 1440, True, []),
    'selfemp-1440': ('selfemp', 1440, False, []),
    'selfemp-nojs-1440': ('selfemp', 1440, True, []),
}
EXPECTED = list(SCEN)


def run_all():
    srv = S(('127.0.0.1', 0), H)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    for sid, (kind, width, nojs, flags) in SCEN.items():
        prof = os.path.join(OUT, 'profile-' + sid)
        cmd = [CHROME, '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
               '--disable-extensions', '--mute-audio', '--window-size=%d,900' % width, '--user-data-dir=' + prof,
               '--remote-debugging-port=0'] + flags
        url = 'http://127.0.0.1:%d/%s?probe=1&id=%s&kind=%s%s' % (port, PAGES[kind], sid, kind, '&nojs=1' if nojs else '')
        proc = subprocess.Popen(cmd + [url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        deadline = time.time() + 40
        while sid not in REPORTS and time.time() < deadline:
            time.sleep(0.2)
        proc.kill()
        proc.wait()
        if sid in REPORTS:
            json.dump(REPORTS[sid], open(os.path.join(OUT, sid + '.json'), 'w'), indent=1)
    srv.shutdown()


run_all()

GAP, INK, WHITE, SLATE = 'rgb(250, 220, 211)', 'rgb(11, 31, 28)', 'rgb(255, 255, 255)', 'rgb(88, 107, 133)'
NEW_PARTS = re.compile(r'sftLim|sft-lim|sftLb|sft-lb|fee-gap|fee-l-b-edge|fee-k-gap|ptCharges|pbGapWhy|pb-gap-why|pbTl|pb-tl|pb-lad|ladAge|aePh|pbAe|pb-ae')


def near(a, b, tol):
    return a is not None and abs(a - b) <= tol


def common(sid, rep):
    eq('%s: the probe ran without a crash' % sid, rep.get('crash'), None)
    eq('%s: no script error' % sid, rep.get('errors'), [])
    eq('%s: reduced motion as asked' % sid, rep.get('reduce'), REDUCE in SCEN[sid][3])
    bad = [s for s in rep.get('shifts', []) if not s.get('recent') and s.get('t', 0) < rep.get('actAt', 0)
           and any(NEW_PARTS.search(p) for p in s.get('sources', []))]
    eq('%s: no layout shift from a new part before the probe acts' % sid, bad, [])
    eq('%s: the layout-shift observer ran' % sid, [s for s in rep.get('shifts', []) if 'error' in s], [])


# ---------------------------------------------------------------- my pensions
def check_pots(sid, r, nojs):
    if nojs:
        eq('P8 %s: no JavaScript, #ptCharges is empty' % sid, r['P1'], '')
        return
    # 2026-10-15 (Marketing Bible A7): until the reader types, the two example
    # pensions fill the summary, the fee line with them
    eq('P1 %s: at load #ptCharges is the example\'s line' % sid, r['P1'], 'Fees take about <b>€472</b> a year.')
    eq('P2 %s: the charges sentence, word for word' % sid, r['P2'],
       'Fees take about €400 a year.')
    eq('P3 %s: one <b>, the euro figure' % sid, r['P3'], [1, '€400'])
    eq('P4 %s: the figure is dark ink, weight 700' % sid, r['P4'], [INK, '700'])
    eq('P5 %s: a second pension, its charge not known' % sid, r['P5'],
       'Fees take about €400 a year (1 fee not known).')
    eq('P6 %s: no charge known: the prompt, no <b>' % sid, r['P6'],
       ['Add a yearly fee to see what fees cost you.', 0])
    eq('P7 %s: the spoken summary carries the same words' % sid, r['P7'],
       'Total €50,000 across 2 pensions. Add a yearly fee to see what fees cost you.')


# ---------------------------------------------------------------- the threshold
# 13 October 2026 (review calc-other-13): the headline names the year's
# threshold, so the key marks it without saying it again; S5 reads the words
# from the headline
LOAD_KEY = 'Your pensions €1,650,000 Threshold'


def check_s2(sid, s):
    eq('S2 %s: at load the fill, over and mark as the markup says' % sid,
       [s['fillW'], s['overFrom'], s['overW'], s['markAt']], ['75.00%', '100.00%', '0.00%', '100.00%'])
    eq('S2 %s: the fill is 0.75 of the track' % sid, near(s['fill'], 0.75, 0.005), True)
    eq('S2 %s: "over" hidden' % sid, [s['ovHidden'], s['ovShown']], [True, False])
    eq('S2 %s: the key' % sid, s['key'], LOAD_KEY)


def check_l1(sid, l):
    eq('L1 %s: at load tax-free and the 20%% band at 200000 each, both drawn' % sid,
       [l['grow'][:2], l['drawn'][:2]], [['200000', '200000'], [True, True]])
    eq('L1 %s: "taxed as income" not drawn' % sid, [l['hidden'][2], l['drawn'][2]], [True, False])
    eq('L1 %s: the two parts equal within 1px' % sid, abs(l['widths'][0] - l['widths'][1]) <= 1, True)
    eq('L1 %s: the key' % sid, l['key'], 'Tax-free €200,000 In the 20% band €200,000')


def check_sft(sid, r, nojs, reduce):
    eq('S1 %s: the limit bar is aria-hidden, nothing focusable' % sid, r['S1'], ['true', 0])
    eq('L8 %s: the lump-sum bar is aria-hidden, nothing focusable' % sid, r['L8'], ['true', 0])
    check_s2(sid, r['S2'])
    check_l1(sid, r['L1'])
    if nojs or reduce:
        if reduce:
            check_s4(sid, r['S4'])
        return
    eq('S8 %s: the fill is the slate token, the mark ink, nothing red, aqua or teal' % sid,
       r['S8'], [r['slate'], INK, []])
    eq('S8 %s: the slate token is #586B85' % sid, r['slate'], SLATE)
    eq('S9 %s: the limit key is 16px or more' % sid, r['S9'] >= 16, True)
    eq('L9 %s: the lump-sum key is 16px or more' % sid, r['L9'] >= 16, True)
    eq('S9/L9 %s: every span and figure in both keys 16px or more' % sid, r['keyMin'] >= 16, True)
    eq('L10 %s: the bar follows the qualifier, in the same card' % sid, r['L10'], ['p.sft-small', True])
    check_s4(sid, r['S4'])
    s = r['S5']
    # (13 October 2026 review, SP-13: "at least" moved from the figure to its
    # label, so the figure keeps the width of every other year's)
    eq('S5 %s: 2030 and 3,000,000: the words' % sid, [s['thrL'], s['thr'], s['ov']],
       ['The threshold from 2030, at least', '€2,800,000', 'Up to €200,000'])
    eq('S5 %s: the mark at 0.9333' % sid, near(s['mark'], 2.8 / 3, 0.005), True)
    s = r['S6']
    eq('S6 %s: total 0: no fill, "€0", over hidden' % sid,
       [near(s['fill'], 0, 0.001), s['you'], s['ovHidden'], s['key']],
       [True, '€0', True, 'Your pensions €0 Threshold'])
    s = r['S7']
    eq('S7 %s: 4,000,000 in 2026: mark 0.55, over 0.45, "€1,800,000"' % sid,
       [near(s['mark'], 0.55, 0.005), near(s['over'], 0.45, 0.005), s['ov']], [True, True, '€1,800,000'])
    l = r['L2']
    eq('L2 %s: 1,000,000: flex-grow 200000/300000/500000, all drawn' % sid,
       [l['grow'], l['drawn']], [['200000', '300000', '500000'], [True, True, True]])
    tot = sum(l['widths'])
    eq('L2 %s: widths 2:3:5' % sid, [near(x / tot, f, 0.01) for x, f in zip(l['widths'], (0.2, 0.3, 0.5))], [True] * 3)
    eq('L2 %s: taxed as income "€500,000"' % sid, [l['incN'], l['incKHidden']], ['€500,000', False])
    l = r['L3']
    eq('L3 %s: lump 0: nothing drawn' % sid, [l['hidden'], l['drawn']], [[True] * 3, [False] * 3])
    eq('L3 %s: lump 0: the key' % sid, l['key'], 'Tax-free €0 In the 20% band €0')
    l = r['L4']
    eq('L4 %s: 150,000: only the tax-free part, the full width' % sid,
       [l['drawn'], abs(l['widths'][0] - l['track']) <= 1], [[True, False, False], True])
    p = r['L5']
    eq('L5 %s: tax-free an outline (white, a slate edge)' % sid, [p[0], SLATE in p[1]], [WHITE, True])
    eq('L5 %s: the 20%% band hatched' % sid, 'repeating-linear-gradient' in p[2], True)
    eq('L5 %s: taxed as income solid slate' % sid, p[3], SLATE)
    eq('L5 %s: nothing red, aqua or teal; 3px gaps' % sid, [p[4], p[5]], [[], '3px'])
    eq('L6 %s: no transition, no animation on any part' % sid, r['L2']['trans'], [['0s', 'none']] * 3)


def check_s4(sid, s):
    eq('S4 %s: 2,750,000: fill, mark and over at 0.8, over 0.2 wide' % sid,
       [near(s['fill'], 0.8, 0.005), near(s['mark'], 0.8, 0.005), near(s['overLeft'], 0.8, 0.005), near(s['over'], 0.2, 0.005)],
       [True] * 4)
    eq('S4 %s: no transition on the fill or over' % sid, s['trans'], [['0s', 'none'], ['0s', 'none']])
    eq('S4 %s: "€550,000" over, shown' % sid, [s['ov'], s['ovShown']], ['€550,000', True])


# ---------------------------------------------------------------- the charges chart
def check_fees(sid, r, nojs):
    if nojs:
        eq('F9 %s: no JavaScript, #feeChart is empty' % sid, r['F9'], '')
        return
    eq('F1 %s: one blush-coral area, before every line' % sid, r['F1'], [1, True, GAP])
    eq('F2 %s: its points: the other plan\'s line, then yours reversed; no no-charge line' % sid, r['F2'], [True, 0])
    eq('F3 %s: the white edge right before the other plan\'s line, same points' % sid, r['F3'], [True, True, WHITE, '7.5px'])
    if SCEN[sid][1] == 1440:
        label, cost = r['F4']
        eq('F4 %s: the spoken label names the shaded area, the difference between the two plans' % sid,
           label.endswith(' The shaded area between them is the difference: €22,948.'), True)   # at 6% since 2026-10-15 (was €18,455 at 5%)
        eq('F4 %s: what your plan\'s charges cost against none stays in the workings, #costA' % sid, cost, '€51,451')   # at 6% (was €41,364 at 5%)
    # (13 October 2026: nothing on the page is in today's money, so no fifth item)
    eq('F6 %s: the key\'s third item, a blush-coral swatch' % sid, r['F6'], [3, 'The difference', GAP])
    eq('F7 %s: no transition, no animation' % sid, r['F7'], ['0s', 'none'])
    if SCEN[sid][1] == 500:
        # the plan said "the chart under 140px tall"; at 500 the whole chart is 600:250 of its
        # ~410px width (~171px), unchanged by the area, so the plot inside its margins is held
        # under 140px and the chart's height to its viewBox: the area adds no height
        n, h, want, plot = r['F8']
        eq('F8 %s: the area present, the plot under 140px, the chart no taller than its viewBox' % sid,
           [n, plot < 140, abs(h - want) <= 1], [1, True, True])
    a, label, say = r['F5']
    eq('F5 %s: the same charges on both: the area is nothing' % sid, a is not None and a < 1, True)
    eq('F5 %s: the same charges on both: no "shaded area" sentence' % sid, 'shaded area' in label, False)
    eq('F5 %s: the same charges on both: the sentence says so' % sid, say, 'Both leave you the same.')


# ---------------------------------------------------------------- the home page
STATE_TAIL = ' at the maximum personal rate: €299.30 a week from January 2026, 52 weekly payments. Rates change, usually at each Budget.'


def fmt(v):
    return '€{:,}'.format(int(round(v)))


def check_home(sid, rep, r, nojs, reduce):
    width = SCEN[sid][1]
    if nojs:
        eq('T7 %s: no JavaScript: the slider is not drawn, no step picked' % sid,
           [r['T1']['shown'], r['T1']['picked']], [False, []])
        return
    if reduce:
        if width == 500:
            check_t1(sid, r)
        return
    if width == 500:
        check_t1(sid, r)
        t = r['T2']
        eq('T2 %s: 62 picks From 60, not From 61' % sid,
           [t['picked'], t['now'], t['valuetext'], t['v'], t['fill']],
           [['60'], 'From 60: Tax relief on up to 40% of your pay, the most there is.', '62: From 60, tax relief on up to 40% of your pay, the most there is.', '62', '77.19%'])
        eq('T3 %s: 18 picks Under 30' % sid, [r['T3']['picked'], r['T3']['now']], [['18'], 'Under 30: Tax relief on up to 15% of your pay.'])
        eq('T4 %s: 61 picks From 60' % sid, [r['T4']['picked'], r['T4']['now']], [['60'], 'From 60: Tax relief on up to 40% of your pay, the most there is.'])
        eq('T5 %s: 75 picks From 60' % sid, [r['T5']['picked'], r['T5']['now']], [['60'], 'From 60: Tax relief on up to 40% of your pay, the most there is.'])
        li0, li1, back = r['T1b']
        eq('T1 %s: no step moves when the slider does (62, then 40)' % sid, [r['T2']['li'], li1], [li0, li0])
        eq('T1 %s: back at 40, as at load' % sid, back, r['T1'])
    else:
        eq('T6 %s: wide: the slider not drawn, the card at "15%%" as on main' % sid,
           [r['T1']['shown'], r['T1']['card'], r['T1']['cardWhat']], [False, '15%', 'Under 30'])
    eq('T8 %s: no transition on any step' % sid, sorted(set(r['T8'])), ['0s'])


def check_t1(sid, r):
    t = r['T1']
    eq('T1 %s: the slider drawn, at 40, From 40 picked alone' % sid,
       [t['shown'], t['value'], t['picked'], t['now'], t['valuetext'], t['nowHidden']],
       [True, '40', ['40'], 'From 40: Tax relief on up to 25% of your pay.', '40: From 40, tax relief on up to 25% of your pay.', 'true'])
    eq('T1 %s: the picked step on --surface-2, its dot and ring slate' % sid, [t['pickedBg'], t['pickedDot'], t['pickedRing']], [r['surface2'], r['slate'], r['slate']])
    bad = [x for x in r_shifts(sid) if any('pbTl' in p or 'pb-tl' in p for p in x.get('sources', []))]
    eq('T1 %s: no layout shift has a source in the timeline' % sid, bad, [])


# ---------------------------------------------------------------- the age-only ladders and the phases
# page kind: (default age, the default row's data-from, caption, note) -- the guides' caption and note
# are the plan's words; the starter's and director's are the pages' own, unchanged
LAD = {
    'over50': (50, '50', "Revenue's limit on the contributions that get tax relief, as a share of earnings.",
               'Earnings count up to €115,000.'),
    'selfemp': (40, '40', "Revenue's limit on the contributions that get tax relief, as a share of net relevant earnings.",
                'Net relevant earnings count up to €115,000.'),
}
BANDS = {
    'over50': 'The share of your earnings that can get tax relief rises with age: 30% from 50 to 54',
    'selfemp': 'What you pay in gets income tax relief up to a share of your net relevant earnings',
}
PCT = ['15%', '20%', '25%', '30%', '35%', '40%']
FROMS = ['0', '30', '40', '50', '55', '60']


def band_of(age):
    return PCT[max(i for i, f in enumerate(FROMS) if age >= int(f))]


def fill_of(age):
    return '%.2f%%' % ((age - 18) / (70 - 18) * 100)


AE_NOTE = 'Rates from 2029 come from summaries, not the law itself. Check gov.ie before relying on them.'
AE_LABELS = ['2026 to 2028', '2029 to 2031', '2032 to 2034', '2035 onward']
AE_RATES = [(0.015, 0.005), (0.03, 0.01), (0.045, 0.015), (0.06, 0.02)]


def ae_phase_now():
    # the page's own sum: scheme year 1 is 2026, held to 1-12; phases from scheme years 1, 4, 7 and 10
    y = min(12, max(1, time.localtime().tm_year - 2025))
    return 0 if y <= 3 else 1 if y <= 6 else 2 if y <= 9 else 3


def check_ladder(sid, kind, r, nojs):
    age, row, cap, note = LAD[kind]
    l = r['LD1']
    eq('LD1 %s: one ladder named for the age slider, no euro line' % sid, [l['ladders'] >= 1, l['out']], [True, 0])
    if kind in BANDS:
        eq('LD5 %s: the six steps read 15%% to 40%%' % sid, l['pct'], PCT)
        eq('LD5 %s: the caption and the note' % sid, [l['cap'], l['note']], [cap, note])
        eq('LD5 %s: the ladder directly follows the paragraph stating the bands' % sid,
           [l['prev'][0], l['prev'][1].startswith(BANDS[kind])], ['p', True])
    if nojs:
        eq('LD4 %s: no JavaScript: the slider is not drawn, no "You" shown' % sid, [l['ctlShown'], l['you']], [False, []])
        return
    eq('LD1 %s: the slider drawn, at its default, "You" in the default row alone' % sid,
       [l['ctlShown'], l['value'], l['v'], l['you']], [True, str(age), str(age), [row]])
    eq('LD1 %s: its spoken value and fill, as pb-ladder.js writes them last' % sid,
       [l['valuetext'], l['fill']], ['%d, %s' % (age, band_of(age)), fill_of(age)])
    l2 = r['LD2']
    eq('LD2 %s: 62: "You" in "60 and over" alone, "62", "62, 40%%", fill 84.62%%' % sid,
       [l2['you'], l2['v'], l2['valuetext'], l2['fill']], [['60'], '62', '62, 40%', '84.62%'])
    l3 = r['LD3']
    eq('LD3 %s: 18: "You" in "Under 30" alone, "18, 15%%"' % sid, [l3['you'], l3['v'], l3['valuetext']], [['0'], '18', '18, 15%'])
    lb = r['LDback']
    eq('LD1 %s: back at the default, as at load' % sid, [lb['you'], lb['v'], lb['valuetext'], lb['fill']],
       [l['you'], l['v'], l['valuetext'], l['fill']])
    eq('LD1 %s: no row moves when the slider does (62, 18, then back)' % sid, [l2['rows'], l3['rows'], lb['rows']], [l['rows']] * 3)
    bad = [x for x in r_shifts(sid) if any('pb-lad' in p or 'ladAge' in p for p in x.get('sources', []))]
    eq('LD1 %s: no layout shift has a source in the ladder' % sid, bad, [])


def ae_euro(v):
    # the page's euro(): Math.round, which takes a half up (Python's round() would take it to even)
    return '€{:,}'.format(int(math.floor(v + 0.5)))


def ae_figs(i, amount):
    # 13 October 2026: a month, from what the reader puts in. The scheme takes
    # it up to its rate on the €80,000 pay cap; the employer the same, the State a third
    e, st = AE_RATES[i]
    you = min(amount, e * 80000 / 12)
    return [ae_euro(you), ae_euro(you), ae_euro(you * st / e)]


def ae_sums(i, amount):
    # in all; the most it takes; into a personal pension at 20% and at 40%: up to the
    # most the same amount instead, past it (the 13 October review) the rest beside it
    e, st = AE_RATES[i]
    most = e * 80000 / 12
    you = min(amount, most)
    pp = amount - most if amount > most else amount
    return [ae_euro(2 * you + you * st / e), ae_euro(most), ae_euro(pp / (1 - 0.2)), ae_euro(pp / (1 - 0.4))]


AE_MAX = 'Auto-enrolment stops at €100 a month. A personal pension can take the rest, with tax relief. Compare the two'


def check_ae(sid, r, nojs):
    a = r['A1']
    eq('A7 %s: the caveat displayed, directly after #aeNote, word for word' % sid, a['note'], [True, 'aeNote', AE_NOTE])
    eq('A7 %s: no jargon chip or term in the caveat (the authority\'s name stays whole)' % sid, a['chips'], 0)
    if nojs:
        eq('A5 %s: no JavaScript: the phase buttons and the slider hidden, the rows at the markup\'s €50 a month' % sid,
           [a['shown'], a['hidden'], a['amt'][3], a['figs'], a['sums']], [False, True, False, ae_figs(0, 50), ae_sums(0, 50)])
        eq('A9 %s: no JavaScript: the note past the most not shown' % sid, [a['over'], a['max'][0]], [False, 'hidden'])
        eq('A10 %s: no JavaScript: no "Rates in" without its buttons, both together shut, the links plain' % sid,
           [a['phl'], a['both'][0], a['max'][2], a['cmp']], [[False, 'Rates in'], 'hidden', 'broker-vs-autoenrolment.html', 'broker-vs-autoenrolment.html'])
        return
    now = ae_phase_now()
    eq('A1 %s: the buttons shown, named "Rates in", the current phase pressed alone' % sid,
       [a['shown'], a['phl'], a['labels'], a['pressed']], [True, [True, 'Rates in'], AE_LABELS, ['true' if i == now else 'false' for i in range(4)]])
    eq('A1 %s: the slider, €50 a month, and the rows at this phase\'s rates' % sid,
       [a['amt'], a['figs'], a['sums'], a['years']], [['50', '€50 a month', '€50', True], ae_figs(now, 50), ae_sums(now, 50), AE_LABELS[now]])
    a2 = r['A2']
    eq('A2 %s: 2029 to 2031 pressed alone: the same €50, the most €200, the years and the rates' % sid,
       [a2['figs'], a2['sums'], a2['years'], a2['rates'], a2['pressed']],
       [['€50', '€50', '€17'], ['€117', '€200', '€63', '€83'], '2029 to 2031',
        '3% of pay from you, the same from your employer and 1% from the State', ['false', 'true', 'false', 'false']])
    a3 = r['A3']
    eq('A3 %s: 2035 onward at €450 a month: the scheme takes its most, €400; the other €50 into a personal pension' % sid,
       [a3['figs'], a3['sums'], a3['years'], a3['pressed'], a3['over'], a3['who'], a3['both']],
       [['€400', '€400', '€133'], ['€933', '€400', '€63', '€83'], '2035 onward', ['false', 'false', 'false', 'true'], True, 'The other', ['visible', '€996']])
    # the script writes (v / 500 * 100).toFixed(4) + '%' on the slider's €500 scale; the browser reads "10.0000%" back as "10%"
    eq('A4 %s: the widths on the slider\'s scale, 3 : 3 : 1' % sid, [a['widths'], a2['widths'], a3['widths']],
       [['10%', '10%', '3.3333%'], ['10%', '10%', '3.3333%'], ['80%', '80%', '26.6667%']])
    eq('A6 %s: no transition on the buttons' % sid, sorted(set(a['trans'])), ['0s'])
    eq('A7 %s: the caveat still there after the presses' % sid, a3['note'], [True, 'aeNote', AE_NOTE])
    a8, a9 = r['A8'], r['A9']
    eq('A8 %s: under the most, no note; past it (2026 to 2028, €150) the note, word for word, to the comparison at €150' % sid,
       [a['over'], a['max'][0], a8['over'], a8['max'], a8['figs'], a8['sums']],
       [False, 'hidden', True, ['visible', AE_MAX, 'broker-vs-autoenrolment.html#you=150'], ['€100', '€100', '€33'], ['€233', '€100', '€63', '€83']])
    eq('A8 %s: past the most, the rest: it stays in your pay, the card holds it, both together €296, the button carries the amount' % sid,
       [a8['hint'], a8['who'], a8['both'], a8['cmp']],
       ['Auto-enrolment takes €100 of your €150. The other €50 stays in your pay.', 'The other', ['visible', '€296'],
        'broker-vs-autoenrolment.html#you=150'])
    eq('A1 %s: under the most, the whole amount: the line says the most, the card "Your", both together shut' % sid,
       [a['hint'], a['who'], a['both'][0]], ['Auto-enrolment takes up to €100 a month from you.' if now == 0 else a['hint'], 'Your', 'hidden'])
    eq('A9 %s: at the most exactly (€100) the note goes again, and the rest with it' % sid,
       [a9['over'], a9['max'][0], a9['figs'], a9['hint'], a9['who'], a9['both'][0], a9['cmp']],
       [False, 'hidden', ['€100', '€100', '€33'], 'Auto-enrolment takes up to €100 a month from you.', 'Your', 'hidden',
        'broker-vs-autoenrolment.html#you=100'])


def r_shifts(sid):
    return REPORTS[sid].get('shifts', [])


for sid in EXPECTED:
    rep = REPORTS.get(sid)
    if not rep:
        eq('%s: the probe reported' % sid, False, True)
        continue
    common(sid, rep)
    if rep.get('crash'):
        continue
    kind, width, nojs, flags = SCEN[sid]
    r = rep['r']
    if kind == 'pots':
        check_pots(sid, r, nojs)
    elif kind == 'sft':
        check_sft(sid, r, nojs, REDUCE in flags)
    elif kind == 'home':
        check_home(sid, rep, r, nojs, REDUCE in flags)
    elif kind == 'starter':
        # 12 October 2026: the starter's ladder went; its phases stay
        check_ae(sid, r, nojs)
    elif kind in LAD:
        check_ladder(sid, kind, r, nojs)
    else:
        check_fees(sid, r, nojs)

if 'sft-1440' in REPORTS and 'sft-nojs-1440' in REPORTS:
    a, b = REPORTS['sft-1440'].get('r') or {}, REPORTS['sft-nojs-1440'].get('r') or {}
    eq('S3: the limit bar at load is the markup a reader without JavaScript gets', a.get('S3'), b.get('S3'))
    eq('L7: the lump-sum bar at load is the markup a reader without JavaScript gets', a.get('L7'), b.get('L7'))

print('records in ' + OUT)
eq('every scenario reported', sorted(REPORTS), sorted(EXPECTED))
report()
