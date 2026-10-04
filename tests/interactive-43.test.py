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
  pension-fees-calculator.html the red area for what your plan's charges take (F1-F9)

Not part of tests/run-tests.py: one Chrome launch per scenario. Exit 0 or 1.
"""
import http.server
import json
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
      thrL:txt($('sftLimThrL')), thr:txt($('sftLimThr')), ov:txt($('sftLimOv')), you:txt($('sftLimYou')),
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
    var none=box.querySelector('.fee-l-none').getAttribute('points'), a=box.querySelector('.fee-l-a').getAttribute('points');
    r.F2=g.getAttribute('points')===none+' '+a.split(' ').reverse().join(' ');
    var e=box.querySelector('.fee-l-b-edge'), b=box.querySelector('.fee-l-b');
    r.F3=[!!e&&e.nextElementSibling===b,!!e&&e.getAttribute('points')===b.getAttribute('points'),e?cs(e).stroke:null,e?cs(e).strokeWidth:null];
    r.F4=[box.getAttribute('aria-label'),txt($('costA'))];
    var li=document.querySelectorAll('.fee-key li');
    r.F6=[li.length,li[3]?seen(li[3]):null,li[3]&&li[3].querySelector('i.fee-k-gap')?cs(li[3].querySelector('i')).backgroundColor:null];
    r.F7=trans(g);
    /* the plot is the viewBox's 250 less its top and bottom margins (26 and 28) */
    var bb=svg.getBoundingClientRect();
    r.F8=[box.querySelectorAll('polygon.fee-gap').length,+bb.height.toFixed(1),+(bb.width*250/600).toFixed(1),+(bb.height*196/250).toFixed(1)];
    setv('amcA',0); setv('feeA',0); await frames();
    var g2=box.querySelector('polygon.fee-gap');
    r.F5=[g2?area(pts(g2.getAttribute('points'))):null,box.getAttribute('aria-label'),txt($('pbSay'))];
    return r;
  }

  document.addEventListener('DOMContentLoaded',function(){
    setTimeout(async function(){
      /* the probe's own input events are not a reader's (hadRecentInput stays false), so
         only the shifts before it starts acting are the page's own */
      var body={id:id,kind:kind,nojs:nojs,width:innerWidth,reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,actAt:Math.round(performance.now())};
      try{ body.r=await ({pots:pots,sft:sft,fees:fees})[kind](); }catch(e){ body.crash=String(e&&e.stack||e); }
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

RED, INK, WHITE, SLATE = 'rgb(164, 41, 29)', 'rgb(11, 31, 28)', 'rgb(255, 255, 255)', 'rgb(88, 107, 133)'
NEW_PARTS = re.compile(r'sftLim|sft-lim|sftLb|sft-lb|fee-gap|fee-l-b-edge|fee-k-gap|ptCharges')


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
    eq('P1 %s: at load #ptCharges is empty' % sid, r['P1'], '')
    eq('P2 %s: the charges sentence, word for word' % sid, r['P2'],
       'The annual charges you know of come to about €400 a year at today’s values.')
    eq('P3 %s: one <b>, the euro figure' % sid, r['P3'], [1, '€400'])
    eq('P4 %s: the figure is red, weight 700' % sid, r['P4'], [RED, '700'])
    eq('P5 %s: a second pension, its charge not known' % sid, r['P5'],
       'The annual charges you know of come to about €400 a year at today’s values, with 1 charge not known.')
    eq('P6 %s: no charge known: the prompt, no <b>' % sid, r['P6'],
       ['Add an annual charge to see what the charges come to in euro a year.', 0])
    eq('P7 %s: the spoken summary carries the same words' % sid, r['P7'],
       'Total €50,000 across 2 pensions. Add an annual charge to see what the charges come to in euro a year.')


# ---------------------------------------------------------------- the threshold
LOAD_KEY = 'Your pensions €1,650,000 The threshold for 2026 €2,200,000'


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
    eq('S5 %s: 2030 and 3,000,000: the words' % sid, [s['thrL'], s['thr'], s['ov']],
       ['The threshold for 2030 or later', 'At least €2,800,000', 'Up to €200,000'])
    eq('S5 %s: the mark at 0.9333' % sid, near(s['mark'], 2.8 / 3, 0.005), True)
    s = r['S6']
    eq('S6 %s: total 0: no fill, "€0", over hidden' % sid,
       [near(s['fill'], 0, 0.001), s['you'], s['ovHidden'], s['key']],
       [True, '€0', True, 'Your pensions €0 The threshold for 2026 €2,200,000'])
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
    eq('F1 %s: one red area, before every line' % sid, r['F1'], [1, True, RED])
    eq('F2 %s: its points: the no-charge line, then your plan\'s reversed' % sid, r['F2'], True)
    eq('F3 %s: the white edge right before the other plan\'s line, same points' % sid, r['F3'], [True, True, WHITE, '7.5px'])
    if SCEN[sid][1] == 1440:
        label, cost = r['F4']
        eq('F4 %s: the spoken label names the red area' % sid,
           label.endswith(' The red area is what your plan’s charges take: €58,754 by retirement.'), True)
        eq('F4 %s: its figure is #costA' % sid, cost, '€58,754')
    eq('F6 %s: the key\'s fourth item, a red swatch' % sid, r['F6'], [4, 'What your plan’s charges take', RED])
    eq('F7 %s: no transition, no animation' % sid, r['F7'], ['0s', 'none'])
    if SCEN[sid][1] == 500:
        # the plan said "the chart under 140px tall"; at 500 the whole chart is 600:250 of its
        # ~410px width (~171px), unchanged by the area, so the plot inside its margins is held
        # under 140px and the chart's height to its viewBox: the area adds no height
        n, h, want, plot = r['F8']
        eq('F8 %s: the area present, the plot under 140px, the chart no taller than its viewBox' % sid,
           [n, plot < 140, abs(h - want) <= 1], [1, True, True])
    a, label, say = r['F5']
    eq('F5 %s: no charges: the area is nothing' % sid, a is not None and a < 1, True)
    eq('F5 %s: no charges: no "red area" sentence' % sid, 'red area' in label, False)
    eq('F5 %s: no charges: the sentence says so' % sid, say.startswith('Over 25 years, with no charges on your plan'), True)


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
    else:
        check_fees(sid, r, nojs)

if 'sft-1440' in REPORTS and 'sft-nojs-1440' in REPORTS:
    a, b = REPORTS['sft-1440'].get('r') or {}, REPORTS['sft-nojs-1440'].get('r') or {}
    eq('S3: the limit bar at load is the markup a reader without JavaScript gets', a.get('S3'), b.get('S3'))
    eq('L7: the lump-sum bar at load is the markup a reader without JavaScript gets', a.get('L7'), b.get('L7'))

print('records in ' + OUT)
eq('every scenario reported', sorted(REPORTS), sorted(EXPECTED))
report()
