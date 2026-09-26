#!/usr/bin/env python3
"""The nav and its dropdowns, in headless Chrome (Run 29).

    python3 tests/nav.test.py

ONE Chrome launch. A parent page opens each job in a same-origin iframe of
the width the job names, and a probe injected at the foot of the page drives
the nav and reports what it finds. Keyboard and pointer input are synthetic
events, so this proves the script's handlers and the stylesheet's states,
not a browser's own key handling: a click stands in for Enter, Space and a
tap alike, which is what a <button> turns all three into.

What it proves:
  1. every root page at 1440px: one nav; the row does not run past the
     window; 17px items at weight 600; four dropdown buttons, each
     type="button", collapsed, controlling the list that follows it, every
     panel closed; no control in the nav filled, the booking button an
     aqua outline (R29-3, Run 30);
     the page's own link marked current, once, and its dropdown underlined;
     no script error
  2. on every page, every page a reader can reach is in its nav (or is the
     booking button, or a legal page in the footer); no held page is linked
  3. at 1440px: a click opens a panel and a second closes it; opening one
     closes another; ArrowDown opens and walks the links, ArrowUp walks back
     to the button; Escape closes and returns focus; Tab leaving closes; a
     click outside closes; hovering opens, leaving closes after a grace, and a
     click on a hovered panel keeps it open
  4. without the script's class: keyboard focus inside a dropdown shows its
     panel (the no-JavaScript fallback)
  5. at 1200px and 375px, the drawer: the toggle opens it; a dropdown opens
     in place, below its button, inside the drawer; the drawer fits under
     the header and scrolls; Escape closes the dropdown first and the drawer
     second; the page never scrolls sideways
  6. at 1301px (the narrowest row) the row fits on the longest pages
"""
import base64, glob, html, json, os, re, socket, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from harness import eq, report  # noqa: E402
import pagebuild  # noqa: E402

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
HELD = sorted({p.out for p in pagebuild.PAGES.values() if p.noindex} | {'how-we-work.html'})
# reached some other way: the booking button, the footer's legal column, or
# never linked at all (the 404 and the page after a booking)
ELSEWHERE = {'booking.html', 'privacy.html', 'terms.html', 'complaints.html', '404.html', 'thank-you.html', 'index.html'}

PROBE = r"""<script>
(function(){
  var R={errors:[]}, q=new URLSearchParams(location.search), job=q.get('__nav');
  window.addEventListener('error',function(e){ if(e.message) R.errors.push(String(e.message)); },true);
  var L=document.getElementById('navLinks'), nav=document.getElementById('nav');
  function dds(){ return [].slice.call(document.querySelectorAll('#navLinks .nav-dd')); }
  function btn(n){ return document.querySelector('#navLinks [aria-controls="'+n+'"]'); }
  function shown(el){ return !!el && getComputedStyle(el).display!=='none' && el.getBoundingClientRect().height>0; }
  function exp(n){ return btn(n).getAttribute('aria-expanded'); }
  function panel(n){ return document.getElementById(n); }
  function key(el,k){ el.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true})); }
  function act(){ var a=document.activeElement; return a ? (a.getAttribute('href')||a.id||a.getAttribute('aria-controls')||a.tagName) : null; }
  function done(){ var p=document.createElement('pre'); p.id='__nav';
    p.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(R)))); document.body.appendChild(p); }
  function wait(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function underlined(el){ var t=getComputedStyle(el,'::after').transform; return !!t && t!=='none' && t.indexOf('matrix(1,')===0; }
  (async function(){
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    R.w=innerWidth; R.sw=document.documentElement.scrollWidth;
    R.navs=document.querySelectorAll('nav#nav').length;
    var kids=[].slice.call(document.querySelector('.nav-in').children).filter(function(k){return getComputedStyle(k).display!=='none';});
    R.right=Math.round(Math.max.apply(null,kids.map(function(k){return k.getBoundingClientRect().right;})));
    R.drawer=getComputedStyle(document.getElementById('navToggle')).display!=='none';
    if(job==='load'){
      var first=L.querySelector(':scope > a.lnk');
      R.font=[getComputedStyle(first).fontSize,getComputedStyle(first).fontWeight];
      R.hrefs=[].map.call(L.querySelectorAll('a'),function(a){return a.getAttribute('href');});
      R.dd=dds().map(function(d){ var b=d.querySelector('.nav-dd-btn'), id=b.getAttribute('aria-controls'), p=document.getElementById(id);
        return {name:b.textContent.trim(), type:b.getAttribute('type'), exp:b.getAttribute('aria-expanded'),
                next:!!p && b.nextElementSibling===p, list:p?p.tagName:null, links:p?p.querySelectorAll(':scope > li > a.lnk').length:0,
                open:shown(p), underline:underlined(b), js:L.classList.contains('dd-js')}; });
      R.current=[].map.call(L.querySelectorAll('a[aria-current="page"]'),function(a){return a.getAttribute('href');});
      /* the controls in the row or the drawer; the current page's pale wash
         inside a panel is a highlight on a link, not a button */
      R.filled=[].slice.call(L.querySelectorAll(':scope > a, .nav-dd-btn')).filter(function(e){ var bg=getComputedStyle(e).backgroundColor;
        return bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'; }).map(function(e){return e.className;});
      var bk=L.querySelector(':scope > a.btn-primary'), bs=bk?getComputedStyle(bk):null;
      R.booking=bs?[bs.backgroundColor,bs.borderTopStyle,parseFloat(bs.borderTopWidth)>=1,bs.borderTopColor]:null;  /* 1.5px computes as 1px at a scale of 1 */
      return done();
    }
    if(job==='keys'){
      var T=btn('navTools'), G=btn('navGuides');
      T.click(); R.click1=[exp('navTools'),shown(panel('navTools'))];
      T.click(); R.click2=[exp('navTools'),shown(panel('navTools'))];
      T.click(); G.click(); R.other=[exp('navTools'),exp('navGuides'),shown(panel('navTools')),shown(panel('navGuides'))];
      G.click();
      T.focus(); key(T,'ArrowDown'); R.down1=[exp('navTools'),act()];
      key(document.activeElement,'ArrowDown'); R.down2=act();
      key(document.activeElement,'ArrowUp'); key(document.activeElement,'ArrowUp'); R.up=act();
      key(document.activeElement,'ArrowDown'); key(document.activeElement,'Escape'); R.esc=[exp('navTools'),shown(panel('navTools')),act()];
      T.click(); var links=panel('navTools').querySelectorAll('a'); links[links.length-1].focus();
      L.querySelector(':scope > a.lnk').focus(); R.tabOut=[exp('navTools'),shown(panel('navTools'))];
      T.click(); document.body.click(); R.outside=exp('navTools');
      var d=T.parentNode;
      R.mouse=matchMedia('(hover: hover) and (pointer: fine)').matches;
      d.dispatchEvent(new MouseEvent('mouseenter')); R.hover=[exp('navTools'),shown(panel('navTools'))];
      d.dispatchEvent(new MouseEvent('mouseleave')); await wait(80); R.leaveAtOnce=exp('navTools');
      await wait(400); R.leaveLater=exp('navTools');
      d.dispatchEvent(new MouseEvent('mouseenter')); T.click(); d.dispatchEvent(new MouseEvent('mouseleave'));
      await wait(400); R.pinned=exp('navTools');
      T.click(); R.unpinned=exp('navTools');
      return done();
    }
    if(job==='nojs'){
      L.classList.remove('dd-js');
      btn('navDirectors').focus(); R.focusShows=shown(panel('navDirectors'));
      panel('navDirectors').querySelector('a').focus(); R.focusInside=shown(panel('navDirectors'));
      L.querySelector(':scope > a.lnk').focus(); R.focusGone=shown(panel('navDirectors'));
      return done();
    }
    if(job==='drawer'){
      var tg=document.getElementById('navToggle'); tg.click(); await wait(50);
      R.open=[L.classList.contains('open'),shown(L),tg.getAttribute('aria-expanded')];
      var D=btn('navDirectors'); D.click();
      var p=panel('navDirectors'), pb=p.getBoundingClientRect(), bb=D.getBoundingClientRect(), lb=L.getBoundingClientRect();
      R.inPlace=[exp('navDirectors'),shown(p),getComputedStyle(p).position,Math.round(pb.top-bb.bottom)>=0 && Math.round(pb.top-bb.bottom)<=2,
                 pb.left>=lb.left-1 && pb.right<=lb.right+1];
      var nb=nav.getBoundingClientRect();
      R.fits=Math.round(lb.bottom)<=innerHeight+1; R.scrolls=getComputedStyle(L).overflowY;
      R.allLinks=[].slice.call(L.querySelectorAll('a')).length;
      R.sw2=document.documentElement.scrollWidth;
      D.focus(); key(D,'Escape'); R.esc1=[exp('navDirectors'),L.classList.contains('open')];
      key(D,'Escape'); R.esc2=[L.classList.contains('open'),act()];
      return done();
    }
  })().catch(function(e){ R.errors.push('probe: '+(e&&e.stack||e)); done(); });
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
        if u.path == '/__nav':
            body = ('<!doctype html><meta charset="utf-8"><body style="margin:0"><script>'
                    'var JOBS=%s,OUT=[];'
                    'function next(){var j=JOBS.shift();if(!j){var p=document.createElement("pre");p.id="__all";'
                    'p.textContent=JSON.stringify(OUT);document.body.appendChild(p);return;}'
                    'localStorage.setItem("pb-consent","rejected");'
                    'var f=document.createElement("iframe");f.style.cssText="border:0;width:"+j[2]+"px;height:900px";'
                    'f.src="/"+j[0]+"?__nav="+j[1];document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=f.contentDocument.getElementById("__nav");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],j[2],p.textContent]);f.remove();next();return;}'
                    'if(n>1200){OUT.push([j[0],j[1],j[2],null]);f.remove();next();return;}setTimeout(poll,25);})();}'
                    'next();</script></body>') % q['jobs'][0]
            return self._send(body.encode('utf-8'))
        path = u.path.lstrip('/')
        fs = os.path.join(ROOT, path)
        if path.endswith('.html') and os.path.isfile(fs) and '__nav' in q:
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


def main():
    if not os.path.exists(CHROME):
        print('Chrome not found at %s' % CHROME)
        sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    pages = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, '*.html')))
    jobs = [[p, 'load', 1440] for p in pages]
    jobs += [['index.html', 'keys', 1440], ['director-calculator.html', 'keys', 1440], ['index.html', 'nojs', 1440]]
    jobs += [[p, 'drawer', w] for p in ('index.html', 'director.html', 'glossary.html') for w in (1200, 375)]
    jobs += [[p, 'load', 1301] for p in ('index.html', 'pension-calculator.html', 'state-pension-entitlement.html')]
    url = 'http://127.0.0.1:%d/__nav?jobs=%s' % (port, json.dumps(jobs).replace(' ', ''))
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
                        '--disable-extensions', '--mute-audio', '--hide-scrollbars', '--window-size=1500,1000',
                        '--host-resolver-rules=MAP www.googletagmanager.com ~NOTFOUND',
                        '--virtual-time-budget=240000', '--dump-dom', url],
                       capture_output=True, timeout=300)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'<pre id="__all">([^<]*)</pre>', dom)
    eq('0. one Chrome launch returned every job', bool(m), True)
    if not m:
        srv.shutdown()
        report(); return
    R = {}
    for page, job, w, b64 in json.loads(html.unescape(m.group(1))):
        R[(page, job, w)] = json.loads(base64.b64decode(b64).decode('utf-8')) if b64 else None

    skel = open(os.path.join(ROOT, 'pension-calculator.html'), encoding='utf-8').read()
    i, j = pagebuild.nav_span(skel)
    targets = pagebuild.nav_targets(skel[i:j])
    # 1
    for page in pages:
        r = R.get((page, 'load', 1440))
        eq('1. %s: reported' % page, r is not None, True)
        if not r:
            continue
        eq('1. %s: one nav, the row, not past the window' % page,
           (r['navs'], r['drawer'], r['right'] <= r['w'], r['sw'] <= r['w']), (1, False, True, True))
        eq('1. %s: items at 17px, weight 600' % page, r['font'], ['17px', '600'])
        eq('1. %s: four dropdowns, named' % page, [d['name'] for d in r['dd']],
           ['Directors', 'Tools', 'State Pension', 'Guides'])
        eq('1. %s: each a collapsed type="button" controlling the list after it, closed' % page,
           [(d['type'], d['exp'], d['next'], d['list'], d['links'] > 0, d['open'], d['js']) for d in r['dd']],
           [('button', 'false', True, 'UL', True, False, True)] * 4)
        eq('1. %s: no control in the nav is filled' % page, r['filled'], [])
        eq('1. %s: the booking button is an aqua outline' % page, r['booking'],
           ['rgba(0, 0, 0, 0)', 'solid', True, 'rgb(22, 201, 176)'])
        want = [page] if page in targets else []
        eq('1. %s: its own link marked current, once' % page, r['current'], want)
        # the two plain links carry their own underline; a page inside a
        # dropdown underlines the dropdown's button, and only that one
        under = [d['name'] for d in r['dd'] if d['underline']]
        eq('1. %s: and only its own dropdown underlined' % page, len(under),
           1 if want and page not in ('tracker.html', 'starter.html') else 0)
        eq('1. %s: no script error' % page, r['errors'], [])
        R[(page, 'reached')] = {h.split('#')[0] or page for h in r['hrefs']}
    # 2, page by page: a nav that lost a link on one page is caught on that page
    public = set(pages) - set(HELD) - ELSEWHERE
    for page in pages:
        reached = R.get((page, 'reached'))
        if reached is None:
            continue
        eq('2. %s: every page a reader can reach is in its nav' % page, sorted(public - reached), [])
        eq('2. %s: no held page is linked from it' % page, sorted(reached & set(HELD)), [])
        eq('2. %s: the others it links are the booking page and the home page\'s story' % page,
           sorted(reached & ELSEWHERE), ['booking.html', 'index.html'])
    # 3
    for page in ('index.html', 'director-calculator.html'):
        r = R.get((page, 'keys', 1440))
        eq('3. %s: reported' % page, r is not None, True)
        if not r:
            continue
        eq('3. %s: a click opens a panel' % page, r['click1'], ['true', True])
        eq('3. %s: a second click closes it' % page, r['click2'], ['false', False])
        eq('3. %s: opening one closes another' % page, r['other'], ['false', 'true', False, True])
        eq('3. %s: ArrowDown opens and moves to the first link' % page, r['down1'], ['true', 'pension-calculator.html'])
        eq('3. %s: and on to the next' % page, r['down2'], 'pension-fees-calculator.html')
        eq('3. %s: ArrowUp walks back to the button' % page, r['up'], 'navTools')
        eq('3. %s: Escape closes, focus back on the button' % page, r['esc'], ['false', False, 'navTools'])
        eq('3. %s: Tab leaving the panel closes it' % page, r['tabOut'], ['false', False])
        eq('3. %s: a click outside closes it' % page, r['outside'], 'false')
        eq('3. %s: the window reports a mouse' % page, r['mouse'], True)
        eq('3. %s: hovering opens' % page, r['hover'], ['true', True])
        eq('3. %s: leaving keeps it a moment, then closes' % page, (r['leaveAtOnce'], r['leaveLater']), ('true', 'false'))
        eq('3. %s: a click on a hovered panel keeps it open' % page, r['pinned'], 'true')
        eq('3. %s: and the next click closes it' % page, r['unpinned'], 'false')
        eq('3. %s: no script error' % page, r['errors'], [])
    # 4
    r = R.get(('index.html', 'nojs', 1440)) or {}
    eq('4. without the script, focus on a dropdown shows its panel', r.get('focusShows'), True)
    eq('4. and focus inside keeps it', r.get('focusInside'), True)
    eq('4. and focus leaving hides it', r.get('focusGone'), False)
    # 5
    for page in ('index.html', 'director.html', 'glossary.html'):
        for w in (1200, 375):
            r = R.get((page, 'drawer', w))
            eq('5. %s at %dpx: reported' % (page, w), r is not None, True)
            if not r:
                continue
            eq('5. %s at %dpx: the drawer, not the row' % (page, w), r['drawer'], True)
            eq('5. %s at %dpx: the toggle opens it' % (page, w), r['open'], [True, True, 'true'])
            eq('5. %s at %dpx: a dropdown opens in place, below its button, inside the drawer' % (page, w),
               r['inPlace'], ['true', True, 'static', True, True])
            eq('5. %s at %dpx: the drawer fits under the header and scrolls' % (page, w), (r['fits'], r['scrolls']), (True, 'auto'))
            eq('5. %s at %dpx: Escape closes the dropdown first' % (page, w), r['esc1'], ['false', True])
            eq('5. %s at %dpx: and the drawer second, focus on the toggle' % (page, w), r['esc2'], [False, 'navToggle'])
            eq('5. %s at %dpx: never sideways' % (page, w), (r['sw'] <= w, r['sw2'] <= w), (True, True))
            eq('5. %s at %dpx: no script error' % (page, w), r['errors'], [])
    # 6
    for page in ('index.html', 'pension-calculator.html', 'state-pension-entitlement.html'):
        r = R.get((page, 'load', 1301))
        eq('6. %s at 1301px: the row, inside the window' % page,
           r and (r['drawer'], r['right'] <= r['w'], r['sw'] <= r['w']), (False, True, True))
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
