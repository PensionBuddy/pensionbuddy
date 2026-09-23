#!/usr/bin/env python3
"""Photograph the product: a real calculator, as it ships, for the marketing pages.

    python3 tools/shoot-product.py                    # every shot
    python3 tools/shoot-product.py pension-calculator # one

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
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
OUT_DIR = os.path.join(ROOT, 'assets', 'img')
WIDTH, SCALE = 1200, 2

SHOTS = {
    'pension-calculator': {'page': 'pension-calculator.html', 'target': '.calc-wrap', 'hide': ''},
    # the director page stacks five cards under its headline figure; the shot
    # keeps the sliders, the headline and the salary-versus-pension comparison
    'director-calculator': {'page': 'director-calculator.html', 'target': '.calc-wrap',
                            'hide': '.waitcard,.chart-card,.max-card{display:none!important}'},
    # #13, the home page's product tabs: the other three calculators, each
    # cropped to its sliders and the part of its result that says the most
    'broker-vs-autoenrolment': {'page': 'broker-vs-autoenrolment.html', 'target': '.calc-wrap',
                                'hide': '.chart-card,#pbMyCard,#riskCard,.cta-card,.waitcard.lead .phaseline{display:none!important}'},
    'state-pension-reality-check': {'page': 'state-pension-reality-check.html', 'target': '.calc-wrap', 'hide': ''},
    'state-pension-entitlement': {'page': 'state-pension-entitlement.html', 'target': '.calc-wrap', 'hide': ''},
}

HIDE = ('nav,footer,.announce,.skip,.phead,.deadline,#deadlineBand,.assume,section,'
        '.pb-b-btn,.pb-b-panel,.pb-consent,.email-cap,.pb-guess,.pb-guess-card,.nav-tick,.sft-note,'
        '.boost-card,.pb-badges,'
        # run 19's additions below the headline: the relief limit card, the
        # workings and the share link, left out like the boost card to keep
        # the pictures close to square
        '.chart-card:has(.pb-lad),.pb-work,.pb-share,.pb-peek'
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
<iframe id="f" src="/__product-%(page)s" style="width:%(w)dpx;height:1800px;border:0;display:block"></iframe>
<script>
var f=document.getElementById('f');
f.addEventListener('load',function(){
  var d=f.contentDocument, s=d.createElement('style'); s.textContent=%(css)s; d.head.appendChild(s);
  d.documentElement.classList.remove('pb-preveil');
  (d.fonts?d.fonts.ready:Promise.resolve()).then(function(){ setTimeout(function(){
    var el=d.querySelector(%(target)s); var r=el.getBoundingClientRect();
    var pre=document.createElement('pre'); pre.id='__box';
    pre.textContent=JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height});
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
            body = WRAP % {'page': shot['page'], 'w': WIDTH,
                           'css': json.dumps(HIDE + SETTLE + shot.get('hide', '')), 'target': json.dumps(shot['target'])}
            return self._send(body.encode('utf-8'))
        m = re.match(r'/__product-([A-Za-z0-9.-]+\.html)$', path)
        if m:
            t = open(os.path.join(ROOT, m.group(1)), encoding='utf-8').read()
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
    print('%-22s %dx%d  jpg %dKB  webp %dKB' % (name, im.width, im.height,
          os.path.getsize(stem + '.jpg') // 1024, os.path.getsize(stem + '.webp') // 1024))


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
