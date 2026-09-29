#!/usr/bin/env python3
"""Put a provider's logo into assets/logos/, trimmed and optimised, and prove
the artwork is the provider's own, unchanged.

    python3 tools/logos.py <folder> <name>=<file> [<name>=<file> ...]
    python3 tools/logos.py ~/Downloads/PensionBuddy_Provider_Logos/originals \\
        zurich=zurich.png irish-life=irish-life.svg aviva=aviva.svg \\
        new-ireland=new-ireland.png royal-london=royal-london.svg \\
        standard-life=standard-life.svg

Run 35 made the six logos on the home page's provider ticker with this. Each
file is the provider's own artwork; nothing is redrawn, recoloured or traced.

  SVG     the XML declaration, comments, DOCTYPE, title, editor attributes and
          unreferenced ids removed; path and polygon numbers rounded to three
          decimals; the viewBox trimmed to the artwork's bounding box, as
          Chrome measures it (getBBox); height="40" and the width that keeps
          its proportions, so every logo is the same height.
  raster  trimmed to its visible pixels and written as lossless WebP, 120px
          tall (three times the 40px it is drawn at) when the source has the
          pixels. A smaller source is never enlarged: it is kept at its own
          size and reported as low resolution.

The proof, for every SVG: the numbers in each path of the output against the
original's, and both drawn by Chrome through the same viewBox at four times
the size, compared pixel by pixel. It fails (exit 1) if a path's commands or
its count of numbers changed, if any number moved by more than 0.0005, or if
more than 0.1% of the drawn pixels differ by more than an eighth.

pb-providers.js lists the files, with each one's width and height.
"""
import base64
import json
import math
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'logos')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
H = 40            # every logo is drawn this many CSS pixels tall
RASTER_H = 120    # a raster is written at three times that, when the source has the pixels

NUM = re.compile(r'-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?')


def fmt(v):
    s = ('%.3f' % v).rstrip('0').rstrip('.')
    if s in ('-0', ''):
        s = '0'
    if s.startswith('0.'):
        s = s[1:]
    elif s.startswith('-0.'):
        s = '-' + s[2:]
    return s


def round_numbers(s):
    """Every number in a path rounded, the commands and separators kept. Two
    numbers written with nothing between them ("1.5.5") get a space, because
    a rounded first number can lose its point and swallow the second."""
    out, last, prev = [], 0, ''
    for m in NUM.finditer(s):
        gap = s[last:m.start()]
        r = fmt(float(m.group(0)))
        if not gap and prev and (prev[-1].isdigit() or prev[-1] == '.') and (r[0].isdigit() or r[0] == '.'):
            gap = ' '
        out.append(gap + r)
        prev, last = r, m.end()
    out.append(s[last:])
    return ''.join(out)


def clean_svg(text):
    """(root attributes kept, body, uses xlink, original root attributes)."""
    t = re.sub(r'<\?xml[^>]*\?>', '', text)
    t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    t = re.sub(r'<!DOCTYPE[^>]*>', '', t)
    for tag in ('title', 'desc', 'metadata'):
        t = re.sub(r'<%s\b[^>]*>.*?</%s>' % (tag, tag), '', t, flags=re.S)
    # a fill given twice, as a class in a <style> and again inline (Aviva's file)
    t = re.sub(r'<defs[^>]*>\s*<style[^>]*>\s*\.cls-1\{[^}]*\}\s*</style>\s*</defs>', '', t)
    t = re.sub(r'\s+class="cls-1"', '', t)
    t = re.sub(r'\sstyle="fill:(#[0-9a-fA-F]{3,6});stroke-width:0"', r' fill="\1"', t)
    root = re.search(r'<svg\b[^>]*>', t)
    body = t[root.end():t.rindex('</svg>')]
    attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', root.group(0)))
    keep = {k: v for k, v in attrs.items() if k in ('fill', 'fill-rule', 'clip-rule', 'stroke')}
    if re.search(r'\sclass="|<style\b|\sstyle="', body):
        raise ValueError('a class or a style is left in the artwork; add a rule for it before trusting the output')
    if re.search(r'\s(?:d)="[^"]*[aA]', body):
        raise ValueError('an arc command: its flags can be written without separators, and rounding would merge them')
    refs = set(re.findall(r'url\(#([^)]+)\)', body)) | set(re.findall(r'href="#([^"]+)"', body))
    body = re.sub(r'\sid="([^"]*)"', lambda m: m.group(0) if m.group(1) in refs else '', body)
    body = re.sub(r'\s(?:enable-background|xml:space|data-name)="[^"]*"', '', body)
    for attr in ('d', 'points', 'transform'):
        body = re.sub(r'(\s%s=")([^"]*)(")' % attr, lambda m: m.group(1) + round_numbers(m.group(2)) + m.group(3), body)
    body = re.sub(r'>\s+<', '><', body).strip()
    body = re.sub(r'\s{2,}', ' ', body)
    body = re.sub(r'\stransform="translate\(0,? ?0\)"', '', body)
    return keep, body, 'xlink:' in body, attrs


def chrome(args, timeout=90):
    return subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
                           '--no-first-run', '--virtual-time-budget=3000'] + args, capture_output=True, timeout=timeout)


def page_file(html_text, tmp, name='p.html'):
    path = os.path.join(tmp, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html_text)
    return 'file://' + path


def original_viewbox(attrs):
    if attrs.get('viewBox'):
        return [float(v) for v in attrs['viewBox'].replace(',', ' ').split()]
    return [0.0, 0.0, float(attrs['width'].rstrip('px')), float(attrs['height'].rstrip('px'))]


def bboxes(svgs, tmp):
    """{name: [x, y, w, h]}: each SVG's drawn content, as Chrome's getBBox() measures it."""
    parts = []
    for name, (keep, body, xlink, attrs) in svgs.items():
        vb = ' '.join(repr(v) for v in original_viewbox(attrs))
        a = ''.join(' %s="%s"' % kv for kv in keep.items())
        parts.append('<svg xmlns="http://www.w3.org/2000/svg"%s viewBox="%s" width="800" height="400"%s><g id="all-%s">%s</g></svg>'
                     % (' xmlns:xlink="http://www.w3.org/1999/xlink"' if xlink else '', vb, a, name, body))
    page = ('<!doctype html><body>%s<script>var o={};%s.forEach(function(n){var b=document.getElementById("all-"+n).getBBox();'
            'o[n]=[b.x,b.y,b.width,b.height];});var p=document.createElement("pre");p.id="out";'
            'p.textContent=JSON.stringify(o);document.body.appendChild(p);</script></body>') % (''.join(parts), json.dumps(list(svgs)))
    dom = chrome(['--window-size=1600,1200', '--dump-dom', page_file(page, tmp)]).stdout.decode('utf-8', 'replace')
    return json.loads(re.search(r'<pre id="out">([^<]*)</pre>', dom).group(1))


def write_svg(name, keep, body, xlink, box):
    x, y, w, h = box
    # outward to two decimals, so nothing drawn is cut
    x0, y0 = math.floor(x * 100) / 100, math.floor(y * 100) / 100
    vw, vh = math.ceil((x + w) * 100) / 100 - x0, math.ceil((y + h) * 100) / 100 - y0
    a = ''.join(' %s="%s"' % kv for kv in keep.items())
    svg = ('<svg xmlns="http://www.w3.org/2000/svg"%s viewBox="%s %s %s %s" width="%s" height="%d"%s>%s</svg>\n'
           % (' xmlns:xlink="http://www.w3.org/1999/xlink"' if xlink else '', fmt(x0), fmt(y0),
              fmt(vw), fmt(vh), fmt(H * vw / vh), H, a, body))
    with open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)
    return [x0, y0, vw, vh], [round(H * vw / vh, 2), H]


def write_raster(name, src):
    from PIL import Image
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    im = im.crop(box)
    low = im.size[1] < RASTER_H
    if not low:
        im = im.resize((round(im.size[0] * RASTER_H / im.size[1]), RASTER_H), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', lossless=True, method=6)
    return list(box), list(im.size), low


def prove(name, orig_text, attrs, new_path, vbox, tmp):
    """None, or why the output is not the original's artwork."""
    from PIL import Image, ImageChops
    new_text = open(new_path, encoding='utf-8').read()
    od = re.findall(r'\s(?:d|points)="([^"]*)"', orig_text)
    nd = re.findall(r'\s(?:d|points)="([^"]*)"', new_text)
    if len(od) != len(nd):
        return '%d paths, the original has %d' % (len(nd), len(od))
    worst = 0.0
    for a, b in zip(od, nd):
        A, B = [float(v) for v in NUM.findall(a)], [float(v) for v in NUM.findall(b)]
        if len(A) != len(B) or re.sub(r'[\s,]', '', NUM.sub('', a)) != re.sub(r'[\s,]', '', NUM.sub('', b)):
            return 'a path lost or merged a number, or changed a command'
        worst = max([worst] + [abs(x - y) for x, y in zip(A, B)])
    if worst > 0.0005 + 1e-9:
        return 'a number moved by %.4f' % worst
    x0, y0, vw, vh = vbox
    w4, h4 = int(round(4 * H * vw / vh)), 4 * H

    def frame(text, x, y, w, h):
        b64 = base64.b64encode(text.encode('utf-8')).decode()
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%r %r %r %r" width="%d" height="%d" preserveAspectRatio="none" '
                'style="display:block"><image href="data:image/svg+xml;base64,%s" x="%r" y="%r" width="%r" height="%r" '
                'preserveAspectRatio="none"/></svg>' % (x0, y0, vw, vh, w4, h4, b64, x, y, w, h))
    ov = original_viewbox(attrs)
    page = ('<!doctype html><body style="margin:0;background:#fff">' + frame(orig_text, *ov) +
            frame(new_text, x0, y0, vw, vh) + '</body>')
    png = os.path.join(tmp, 'proof-%s.png' % name)
    chrome(['--window-size=%d,%d' % (max(w4, 600), 2 * h4 + 40), '--screenshot=' + png, page_file(page, tmp, 'proof.html')])
    im = Image.open(png).convert('RGB')
    d = ImageChops.difference(im.crop((0, 0, w4, h4)), im.crop((0, h4, w4, 2 * h4))).convert('L')
    over = sum(d.histogram()[33:])
    if over > 0.001 * w4 * h4:
        return '%d of %d pixels differ by more than an eighth' % (over, w4 * h4)
    return None


def main():
    if len(sys.argv) < 3 or not all('=' in a for a in sys.argv[2:]):
        sys.exit(__doc__.split('\n\n')[1])
    src_dir = os.path.expanduser(sys.argv[1])
    jobs = [a.split('=', 1) for a in sys.argv[2:]]
    os.makedirs(OUT, exist_ok=True)
    failed = False
    with tempfile.TemporaryDirectory() as tmp:
        svgs = {n: clean_svg(open(os.path.join(src_dir, f), encoding='utf-8').read())
                for n, f in jobs if f.lower().endswith('.svg')}
        boxes = bboxes(svgs, tmp) if svgs else {}
        for name, f in jobs:
            src = os.path.join(src_dir, f)
            if f.lower().endswith('.svg'):
                keep, body, xlink, attrs = svgs[name]
                vbox, drawn = write_svg(name, keep, body, xlink, boxes[name])
                why = prove(name, open(src, encoding='utf-8').read(), attrs, os.path.join(OUT, name + '.svg'), vbox, tmp)
                failed = failed or bool(why)
                print('%-14s %-18s %6d -> %6d bytes  viewBox %s  drawn %sx%s  %s'
                      % (name, f, os.path.getsize(src), os.path.getsize(os.path.join(OUT, name + '.svg')),
                         ' '.join(fmt(v) for v in vbox), drawn[0], drawn[1], 'PROOF FAIL: ' + why if why else 'proof ok'))
            else:
                box, size, low = write_raster(name, src)
                print('%-14s %-18s %6d -> %6d bytes  trimmed to %s, written %dx%d%s'
                      % (name, f, os.path.getsize(src), os.path.getsize(os.path.join(OUT, name + '.webp')), box,
                         size[0], size[1], '  LOW RESOLUTION: %dpx tall, drawn at %d (x%.2f on a 2x screen)'
                         % (size[1], H, 2.0 * H / size[1]) if low else ''))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
