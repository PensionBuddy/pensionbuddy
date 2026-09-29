#!/usr/bin/env python3
"""Photograph the product: a real calculator, as it ships, for the marketing pages.

    python3 tools/shoot-product.py                    # every shot
    python3 tools/shoot-product.py pension-calculator # one
    python3 tools/shoot-product.py director-calculator --clock=2026-10-01T12:00:00
                                  # as the page will be at that moment (Run 36:
                                  # PRSI's rise on 1 October, shot two days early)

The reference sites this design follows (Stripe, Ramp, Revolut, Plaid) show
their real interface on the marketing pages rather than a card that describes
it. This is the same move for Pensionbuddy: the tool is rendered in the local
headless Chrome, exactly as it ships and with its own scripts drawing the
chart, and the tool alone is cropped out. Nothing is mocked up.

Each shot loads the page at 1200 CSS pixels at a device scale of 2, hides the
chrome around the calculator (nav, header block, deadline row, footer, the
lead-capture and the Ask Buddy button), settles the reveal animations, and
crops to the calculator grid: the sliders and the result, the cost of
waiting, the chart and, on the pension calculator, the relief card. The
lead-capture row, the boost card and the paw-badge strip below them are left
out, which is what keeps the picture close to square. The sticky sliders
panel is made static for the shot, or sticky would hold it 96px down from
the top even at scroll zero. The page is served under a different filename,
which is what keeps the guess-your-number card out of the picture: that card
keys on the filename it is served under.

Writes assets/img/product-<name>.jpg and .webp (Pillow). Re-run after any
change to a calculator's interface, then tools/stamp-images.py so the URLs
that reference the files pick up the new bytes.

THE CLOCK (Run 36). A page that states a dated figure (PRSI, from
assets/js/pb-prsi.js) shows the figure for the day it is photographed.
--clock=<ISO local time> sets the page's clock to that moment for the
shot, running on from there, so a picture can be taken ahead of a change
it must show on the day.

THE GAMES (Run 35), for the home page's "Just here to learn?" cards, are
shot the same way: the real page, at 1200 CSS pixels and a device scale of
2, cropped to the game. In a frame the games take the layout the glossary's
arcade shows (their embedded mode), so the frame is 1200x675, the arcade's
16:9. A game has to be mid-game, so each shot has a `prepare` script, run
in the page once its fonts have loaded, that plays it through the game's
own API and buttons with a fixed random seed, so every run draws the same
frame: Buddy's Run is played by a simple autopilot (jump when an excuse is
close) until Buddy is at the top of a jump over an excuse, with all three
lives, a score on the board and the two Poolbeg stacks on the far shore
(found by their red, #C1502E, in the canvas); Jargon Battle answers three
terms, two right and one wrong, and stops on the fourth question. If a game
never reaches its frame (after a change to the game, say), the shot fails
rather than photograph something else: the home page's alt text for each
picture describes that frame (the score, the lives, the term), so check it
after a re-shoot. Nothing is drawn by this tool: the frames are the games'
own. Re-run after any change to a game's look.
"""
import io
import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLOCK = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--clock=')), None)
# the page's Date, moved to CLOCK and running on; new Date(y, m, d) still works
CLOCK_JS = ('<script>(function(){var F=new Date(%s).getTime(),D=Date,t0=D.now();function N(){return F+(D.now()-t0);}'
            'function X(){var a=[].slice.call(arguments);if(!(this instanceof X))return new D(N()).toString();'
            'return a.length?new (Function.prototype.bind.apply(D,[null].concat(a)))():new D(N());}'
            'X.prototype=D.prototype;X.now=N;X.UTC=D.UTC;X.parse=D.parse;window.Date=X;})();</script>')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
OUT_DIR = os.path.join(ROOT, 'assets', 'img')
WIDTH, SCALE = 1200, 2

SHOTS = {
    # the State Pension line under the headline (#pbSpTop, b3febf2) is left
    # out, like the other secondary lines: the home page's annotation arrow
    # label sits where it would be, and was placed before it existed
    'pension-calculator': {'page': 'pension-calculator.html', 'target': '.calc-wrap',
                           'hide': '#pbSpTop{display:none!important}'},
    # the director page stacks five cards under its headline figure; the shot
    # keeps the sliders, the headline and the salary-versus-pension comparison.
    # The Pensions Manual's words under the retirement slider (#retNote, Run
    # 30) are left out like the pension page's State Pension line: a legal
    # sentence too small to read in the picture, which would make it taller
    'director-calculator': {'page': 'director-calculator.html', 'target': '.calc-wrap',
                            'hide': '.waitcard,.chart-card,.max-card,#retNote{display:none!important}'},
    # #13, the home page's product tabs: the other three calculators, each
    # cropped to its sliders and the part of its result that says the most
    'broker-vs-autoenrolment': {'page': 'broker-vs-autoenrolment.html', 'target': '.calc-wrap',
                                'hide': '.chart-card,#pbMyCard,#riskCard,.cta-card,.waitcard.lead .phaseline{display:none!important}'},
    'state-pension-reality-check': {'page': 'state-pension-reality-check.html', 'target': '.calc-wrap', 'hide': ''},
    'state-pension-entitlement': {'page': 'state-pension-entitlement.html', 'target': '.calc-wrap', 'hide': ''},
    # Run 35: the two games, mid-game (see THE GAMES above). The stage keeps
    # the Jump button a player sees in its corner; the game's own header and
    # footer are outside the crop.
    'buddys-run': {'page': 'games/buddys-run.html', 'target': '#stage', 'hide': '', 'prepare': 'RUN', 'frame': 675},
    'jargon-battle': {'page': 'games/jargon-battle.html', 'target': '#game', 'hide': '', 'prepare': 'BATTLE', 'frame': 675},
}

# A seeded random source for the games (mulberry32), so a shot is the same
# frame every time it is taken.
SEEDED = ('function pbSeed(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);'
          't=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}')

PREPARE = {
    # Buddy's Run: play from the start button with a simple autopilot, at the
    # game's own fixed step, until the frame has an excuse and a benefit on
    # screen, Buddy in the air, and the Poolbeg stacks on the far shore; then
    # draw it, and let the game's own pause and resume write the scoreboard.
    'RUN': SEEDED + r'''
(function(){
  var B=window.BuddysRun, W=640, cv=document.getElementById('game');
  B.setRng(pbSeed(20260929));
  document.getElementById('startBtn').click();
  function stacks(){
    B._render();
    var k=cv.width/W, c=cv.getContext('2d'), y0=Math.round(130*k), h=Math.round(55*k);
    var d=c.getImageData(0,y0,cv.width,h).data, on={}, p, x;
    for(p=0;p<d.length;p+=4){ if(Math.abs(d[p]-193)<8&&Math.abs(d[p+1]-80)<8&&Math.abs(d[p+2]-46)<8){ on[Math.floor(((p/4)%cv.width)/k)]=1; } }
    var xs=Object.keys(on).map(Number).sort(function(a,b){return a-b;}), runs=[], s=null, q=null;
    xs.forEach(function(v){ if(s===null||v>q+2){ if(s!==null)runs.push([s,q]); s=v; } q=v; });
    if(s!==null)runs.push([s,q]);
    return runs.filter(function(r){return r[0]>2&&r[1]<W-3&&r[1]-r[0]>=5;}).length>=2;
  }
  var held=false, n, st, hb, over;
  for(n=0;n<9000;n++){
    st=B.state(); if(st.phase==='paused'){ B.resume(); st=B.state(); }
    if(st.phase!=='running') break;
    hb=B.buddyHit();
    var threat=st.labels.some(function(l){ var gap=l.x-(hb.x+hb.w);
      return l.kind==='bad' && !l.spent && gap>0 && gap<st.speed*0.068+10; });
    if(threat&&st.buddy.onGround){ B.jump(); held=true; }
    if(held&&st.buddy.onGround&&st.buddy.vy===0&&!threat){ B.releaseJump(); held=false; }
    B.tick(1/120);
    if(n<900) continue;
    /* the frame: at the top of a jump, over an excuse that is whole on
       screen, all three lives, a score on the board, and the stacks there */
    st=B.state(); hb=B.buddyHit();
    over=st.labels.some(function(l){ var cx=hb.x+hb.w/2;
      return l.kind==='bad' && l.x>8 && l.x+l.w<W-8 && l.x<cx && l.x+l.w>cx; });
    if(over&&!st.buddy.onGround&&st.buddy.vy>=0&&st.lives===3&&st.score>=30&&stacks()){ var found=true; break; }
  }
  B.releaseJump();
  document.getElementById('pauseBtn').click();
  document.getElementById('resumeBtn').click();
  B._render();
  if(document.activeElement&&document.activeElement.blur) document.activeElement.blur();
  st=B.state();
  return {ok:!!found, steps:n, seconds:Math.round(n/120*10)/10, score:st.score, lives:st.lives, stacks:stacks(),
          labels:st.labels.map(function(l){return l.kind+':'+l.text;})};
})()''',
    # Jargon Battle: start, then answer three terms through the page's own
    # buttons, right, right and wrong, let the paper ball land, and stop on
    # the fourth question with its four answers showing.
    'BATTLE': SEEDED + r'''
(function(){
  var J=window.JargonBattle, opts=document.querySelectorAll('#menu .opt');
  J.setRng(pbSeed(20260929));
  document.getElementById('startBtn').click();
  document.getElementById('nextBtn').click();
  [true,true,false].forEach(function(right){
    var ci=J.state().current.correctIndex;
    opts[right?ci:(ci+1)%4].click();
    for(var t=0;t<40;t++) J.tick(0.05);
    document.getElementById('nextBtn').click();
  });
  for(var t=0;t<40;t++) J.tick(0.05);
  window.dispatchEvent(new Event('resize'));
  if(document.activeElement&&document.activeElement.blur) document.activeElement.blur();
  var s=J.state();
  return {ok:s.phase==='question'&&s.index===3&&s.blobHp===6&&s.hearts===2, question:s.index+1, of:s.total,
          blobHp:s.blobHp, hearts:s.hearts, term:s.current&&s.current.term};
})()''',
}

HIDE = ('nav,footer,.announce,.skip,.phead,.deadline,#deadlineBand,.assume,section,'
        '.pb-b-btn,.pb-b-panel,.pb-consent,.email-cap,.pb-guess,.pb-guess-card,.nav-tick,.sft-note,'
        '.boost-card,.pb-badges,'
        # run 19's additions below the headline: the relief limit card, the
        # workings and the share link, left out like the boost card to keep
        # the pictures close to square
        '.chart-card:has(.pb-lad),.pb-work,.pb-share,.pb-peek,'
        # run 25: the reason to book under a booking link, a line about the
        # call rather than the tool
        '.pb-why'
        '{display:none!important}')
SETTLE = ('html{scroll-behavior:auto}'
          '.reveal,.js-reveal .reveal{opacity:1!important;transform:none!important}'
          '*{transition:none!important;animation:none!important}'
          'html.pb-preveil *{visibility:visible!important}'
          'body{background:#FAFAF9!important}main{padding:0!important}'
          '.calc-wrap{padding:0!important;margin:0!important}'
          '.panel{position:static!important;top:auto!important}')

WRAP = """<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#FAFAF9">
<iframe id="f" src="/%(served)s" style="width:%(w)dpx;height:%(frame)dpx;border:0;display:block"></iframe>
<script>
var f=document.getElementById('f');
f.addEventListener('load',function(){
  var d=f.contentDocument, s=d.createElement('style'); s.textContent=%(css)s; d.head.appendChild(s);
  d.documentElement.classList.remove('pb-preveil');
  (d.fonts?d.fonts.ready:Promise.resolve()).then(function(){
    var info=null, prep=%(prepare)s;
    if(prep){ try{ info=f.contentWindow.eval(prep); }catch(e){ info={error:String(e)}; } }
    /* a game focuses its own buttons as it is played, and a focused
       button scrolls this page to it: put the page back at the top */
    window.scrollTo(0,0);
    setTimeout(function(){
    window.scrollTo(0,0);
    var el=d.querySelector(%(target)s); var r=el.getBoundingClientRect();
    var pre=document.createElement('pre'); pre.id='__box';
    pre.textContent=JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height,info:info});
    document.body.appendChild(pre);
  },900); });
});
</script></body></html>"""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_GET(self):
        path, _, query = self.path.partition('?')
        if path == '/__shot':
            q = dict(p.split('=', 1) for p in query.split('&') if '=' in p)
            shot = SHOTS[q['name']]
            # served under another name in the page's own folder, so a game's
            # relative URLs (../assets, buddy-sprites.js) still resolve
            folder, _, base = shot['page'].rpartition('/')
            body = WRAP % {'served': (folder + '/' if folder else '') + '__product-' + base, 'w': WIDTH,
                           'frame': shot.get('frame', 1800),
                           'css': json.dumps(HIDE + SETTLE + shot.get('hide', '')), 'target': json.dumps(shot['target']),
                           'prepare': json.dumps(PREPARE[shot['prepare']] if shot.get('prepare') else '')}
            return self._send(body.encode('utf-8'))
        m = re.match(r'/((?:games/)?)__product-([A-Za-z0-9.-]+\.html)$', path)
        if m:
            t = open(os.path.join(ROOT, m.group(1) + m.group(2)), encoding='utf-8').read()
            if CLOCK:
                t = t.replace('<head>', '<head>' + CLOCK_JS % json.dumps(CLOCK), 1)
            if m.group(1):
                # A game keeps its own clock running from load (Buddy's Run's
                # world scrolls even before the start button), and the frames
                # that run before `prepare` differ between the two Chrome
                # launches below, so the frame measured and the frame shot
                # were not the same. With no animation frames the game moves
                # only as `prepare` plays it, and draws only when told to.
                t = t.replace('<head>', '<head><script>window.requestAnimationFrame=function(){return 0;};</script>', 1)
            return self._send(t.encode('utf-8'))
        return super().do_GET()

    def _send(self, b):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(b)


def start_server():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port


def chrome(args, timeout=90):
    base = [CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
            '--no-first-run', '--disable-extensions', '--mute-audio']
    return subprocess.run(base + args, capture_output=True, timeout=timeout)


def shoot(name, port):
    from PIL import Image
    url = 'http://127.0.0.1:%d/__shot?name=%s' % (port, name)
    dom = chrome(['--window-size=%d,1900' % WIDTH, '--virtual-time-budget=8000', '--dump-dom', url]).stdout.decode('utf-8', 'replace')
    m = re.search(r'<pre id="__box">([^<]*)</pre>', dom)
    if not m:
        raise SystemExit('%s: the page never reported the calculator box' % name)
    box = json.loads(m.group(1))
    info = box.get('info')
    if info is not None and not info.get('ok'):
        # the frame the game was played to was never reached: shooting it
        # anyway would put a picture on the home page its alt text misdescribes
        raise SystemExit('%s: the game never reached the frame it is played to: %s' % (name, json.dumps(info)))
    height = int(box['y'] + box['h'] + 24)
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, 'shot.png')
        chrome(['--window-size=%d,%d' % (WIDTH, height), '--force-device-scale-factor=%d' % SCALE,
                '--virtual-time-budget=8000', '--screenshot=%s' % png, url])
        im = Image.open(png).convert('RGB')
        crop = (int(box['x'] * SCALE), int(box['y'] * SCALE),
                int((box['x'] + box['w']) * SCALE), int((box['y'] + box['h']) * SCALE))
        im = im.crop(crop)
    os.makedirs(OUT_DIR, exist_ok=True)
    stem = os.path.join(OUT_DIR, 'product-' + name)
    im.save(stem + '.jpg', 'JPEG', quality=82, optimize=True, progressive=True)
    im.save(stem + '.webp', 'WEBP', quality=76, method=6)
    print('%-22s %dx%d  jpg %dKB  webp %dKB%s' % (name, im.width, im.height,
          os.path.getsize(stem + '.jpg') // 1024, os.path.getsize(stem + '.webp') // 1024,
          '  ' + json.dumps(box['info']) if box.get('info') else ''))
    if box.get('info'):
        print('%-22s the home page describes this picture in its alt text: check it still says what the frame shows' % '')


def main():
    names = [a for a in sys.argv[1:] if not a.startswith('-')] or sorted(SHOTS)
    if not os.path.exists(CHROME):
        sys.exit('Chrome not found at %s (set CHROME=...)' % CHROME)
    srv, port = start_server()
    try:
        for n in names:
            shoot(n, port)
    finally:
        srv.shutdown()


if __name__ == '__main__':
    main()
