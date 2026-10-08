#!/usr/bin/env python3
"""The share pictures: one 1200x630 card for the home page and each page
for an audience, drawn in the local headless Chrome from the page's own
words.

    python3 tools/og-images.py            # every card
    python3 tools/og-images.py starter    # one

Run 34, item 3. Each card carries the brand lockup, the page's eyebrow and
its headline, word for word as the page has them (the headline's teal
words stay teal), the site's address and "Regulated by the Central Bank
of Ireland", as the announcement bar says it. No figures: nothing a reader
could take for a rate, an amount or a result, which would also go stale.

The words are read from the pages themselves each time, so a card cannot
say what its page no longer does; a page whose headline has changed needs
this re-run, then tools/seo.py (the og:image:alt is the card's words).
Writes assets/brand/og/og-<name>.png.
"""
import html
import os
import re
import socket
import subprocess
import sys
import tempfile
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import functools

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
OUT = os.path.join(ROOT, 'assets', 'brand', 'og')
W, H = 1200, 630

# name -> (page, eyebrow). The eyebrow is the page's own hero eyebrow; the
# three guides have none, so theirs is the footer's "Who we help" label.
CARDS = {
    'home': ('index.html', None),
    'starter': ('starter.html', None),
    'tracker': ('tracker.html', None),
    'director': ('director.html', None),
    'over-50': ('pensions-over-50.html', 'Over 50'),
    'self-employed': ('self-employed-pensions.html', 'Self-employed'),
    'uk': ('uk-pensions-in-ireland.html', 'Worked in the UK'),
}

PAW = ('<ellipse cx="23.2" cy="17.6" rx="6.1" ry="8.3" transform="rotate(-9 23.2 17.6)"/>'
       '<ellipse cx="40.8" cy="17.6" rx="6.1" ry="8.3" transform="rotate(9 40.8 17.6)"/>'
       '<ellipse cx="9.8" cy="28.6" rx="5.5" ry="7.4" transform="rotate(-31 9.8 28.6)"/>'
       '<ellipse cx="54.2" cy="28.6" rx="5.5" ry="7.4" transform="rotate(31 54.2 28.6)"/>'
       '<path d="M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1'
       'C48.2 37.6 41.8 31 32 31Z"/>')


def words(page, eyebrow):
    """The page's eyebrow and headline, as the page has them."""
    src = open(os.path.join(ROOT, page), encoding='utf-8').read()
    body = src[src.index('<main'):]
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S).group(1)
    h1 = re.sub(r'\s+', ' ', h1).strip()
    # keep only the teal spans and line breaks the headline carries
    h1 = re.sub(r'<(?!/?span\b|br\b)[^>]+>', '', h1)
    h1 = re.sub(r'<span class="hl">', '<span class="hl">', h1)
    if eyebrow is None:
        i = body.index('<h1')
        m = re.findall(r'class="eyebrow[^"]*"><span class="pip"></span>([^<]+)</span>', body[max(0, i - 1500):i])
        assert m, '%s: no hero eyebrow above the headline' % page
        eyebrow = html.unescape(m[-1]).strip()
    plain = html.unescape(re.sub(r'<[^>]+>', ' ', h1))
    plain = re.sub(r'\s+', ' ', plain).replace(' .', '.').strip()
    assert not re.search(r'[€%]|\d[\d,.]*\s*(?:a year|a month|a week)', plain), '%s: the headline carries a figure' % page
    return eyebrow, h1, plain


def card_html(eyebrow, h1):
    fonts = ''.join(
        "@font-face{font-family:'%s';font-weight:%s;src:url(/assets/fonts/%s.woff2) format('woff2')}" % f
        for f in (('Figtree', '300 900', 'figtree-latin'),
                  ('Figtree', '300 900', 'figtree-latin-ext')))
    return """<!DOCTYPE html><html lang="en-IE"><head><meta charset="utf-8"><style>%s
html,body{margin:0;width:%dpx;height:%dpx;background:#0B1F1C;overflow:hidden}
body{font-family:'Figtree',sans-serif;color:#fff;display:flex;flex-direction:column;justify-content:space-between;
  box-sizing:border-box;padding:64px 80px 58px}
.lock{display:flex;align-items:center;gap:17px}
.mark{width:64px;height:64px;border-radius:17px;background:#14CBB1;display:flex;align-items:center;justify-content:center}
.mark svg{width:37px;height:37px;fill:#0F1F1C}
.word{font-family:'Figtree',sans-serif;font-weight:800;font-size:41px;letter-spacing:-.035em;line-height:1}
.eb{font-size:28px;font-weight:600;color:#14CBB1;margin:0 0 18px}
h1{margin:0;font-weight:800;letter-spacing:-.025em;line-height:1.06;font-size:68px;max-width:1040px}
h1 .hl{color:#14CBB1}
.foot{display:flex;justify-content:space-between;align-items:baseline;font-size:24px;color:rgba(255,255,255,.78)}
.foot b{font-weight:600;color:#fff}
</style></head><body>
<div class="lock"><span class="mark"><svg viewBox="0 0 64 64">%s</svg></span><span class="word">Pensionbuddy</span></div>
<div><p class="eb">%s</p><h1 id="h">%s</h1></div>
<div class="foot"><b>pensionbuddy.ie</b><span>Regulated by the Central Bank of Ireland</span></div>
<script>
/* the headline shrinks until it fits in three lines */
var h = document.getElementById('h'), s = 68;
function lines() { return Math.round(h.getBoundingClientRect().height / (parseFloat(getComputedStyle(h).fontSize) * 1.06)); }
document.fonts.ready.then(function () { while (lines() > 3 && s > 40) { s -= 2; h.style.fontSize = s + 'px'; } document.body.setAttribute('data-ready', s); });
</script></body></html>""" % (fonts, W, H, PAW, html.escape(eyebrow), h1)


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    only = sys.argv[1:]
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix='pb-og-', dir=ROOT)
    srv = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    try:
        from PIL import Image
        for name, (page, eb) in CARDS.items():
            if only and name not in only:
                continue
            eyebrow, h1, plain = words(page, eb)
            f = os.path.join(tmp, name + '.html')
            open(f, 'w', encoding='utf-8').write(card_html(eyebrow, h1))
            png = os.path.join(OUT, 'og-%s.png' % name)
            url = 'http://127.0.0.1:%d/%s/%s.html' % (port, os.path.basename(tmp), name)
            for attempt in (1, 2, 3):   # the command-line screenshot now and then exits early or hangs
                if os.path.exists(png):
                    os.remove(png)
                try:
                    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
                                    '--no-first-run', '--disable-extensions', '--mute-audio',
                                    '--force-device-scale-factor=1', '--window-size=%d,%d' % (W, H),
                                    '--virtual-time-budget=5000', '--screenshot=%s' % png, url],
                                   capture_output=True, timeout=60)
                except subprocess.TimeoutExpired:
                    pass
                if os.path.exists(png) and os.path.getsize(png) > 10000:
                    break
            assert os.path.exists(png), '%s: no picture after three tries' % name
            im = Image.open(png)
            assert im.size == (W, H), (name, im.size)
            im.convert('RGB').save(png, optimize=True)
            print('%-14s %s  "%s: %s"  %d bytes' % (name, os.path.relpath(png, ROOT), eyebrow, plain, os.path.getsize(png)))
    finally:
        srv.shutdown()
        for x in os.listdir(tmp):
            os.remove(os.path.join(tmp, x))
        os.rmdir(tmp)


if __name__ == '__main__':
    main()
