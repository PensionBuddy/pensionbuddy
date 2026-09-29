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
original's, and both drawn by Chrome at four times the size over the whole
of the original's viewBox (so anything the trim cut off shows), compared
pixel by pixel in each of red, green and blue (so a change of colour shows,
not only of lightness). It fails (exit 1) if a path's commands or its count
of numbers changed, if any number moved by more than 0.0005, or if more
than 0.1% of the drawn pixels differ by more than an eighth in any channel.
Strokes, markers and filters are refused rather than trimmed: the bounding
box the trim uses does not include them.

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
    # Class fills, as an editor exports them (Aviva's file gives each path its
    # fill twice, in a class and inline): each becomes a fill attribute, with
    # CSS's order kept (inline style over the class, the class over a fill
    # attribute). A rule that is not a plain fill is refused.
    fills = {}
    style = re.search(r'<defs[^>]*>\s*<style[^>]*>(.*?)</style>\s*</defs>', t, re.S)
    if style:
        for m in re.finditer(r'\.([\w-]+)\s*\{([^}]*)\}', style.group(1)):
            decl = dict(x.split(':', 1) for x in re.sub(r'\s', '', m.group(2)).split(';') if x)
            if set(decl) - {'fill', 'stroke-width'} or decl.get('stroke-width', '0') not in ('0', '0px') or 'fill' not in decl:
                raise ValueError('a class rule that is not a plain fill: .%s{%s}' % (m.group(1), m.group(2).strip()))
            fills[m.group(1)] = decl['fill']
        if re.sub(r'\.([\w-]+)\s*\{([^}]*)\}', '', style.group(1)).strip():
            raise ValueError('a <style> rule that is not a class fill')
        t = t[:style.start()] + t[style.end():]

    def one_tag(m):
        tag = m.group(0)
        cm = re.search(r'\sclass="([^"]*)"', tag)
        sm = re.search(r'\sstyle="fill:(#[0-9a-fA-F]{3,6});stroke-width:0"', tag)
        fill = sm.group(1) if sm else None
        if cm:
            if cm.group(1) not in fills:
                raise ValueError('an element whose class has no fill rule: %s' % cm.group(1))
            fill = fill or fills[cm.group(1)]
            tag = tag.replace(cm.group(0), '', 1)
        if sm:
            tag = tag.replace(sm.group(0), '', 1)
        if fill:
            tag = re.sub(r'\sfill="[^"]*"', '', tag)
            tag = re.sub(r'\s*(/?>)$', lambda e: ' fill="%s"%s' % (fill, e.group(1)), tag)
        return tag
    t = re.sub(r'<(?![/!?])[a-zA-Z][^>]*>', one_tag, t)
    root = re.search(r'<svg\b[^>]*>', t)
    body = t[root.end():t.rindex('</svg>')]
    attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', root.group(0)))
    keep = {k: v for k, v in attrs.items() if k in ('fill', 'fill-rule', 'clip-rule', 'stroke')}
    if re.search(r'\sclass="|<style\b|\sstyle="', body):
        raise ValueError('a class or a style is left in the artwork; add a rule for it before trusting the output')
    if re.search(r'\sstroke="(?!none")|<marker\b|<filter\b|\sfilter="|\smarker-', body):
        raise ValueError('a stroke, marker or filter: the bounding box does not include it, so the trim could cut it')
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
    ov = original_viewbox(attrs)
    # the frame covers the original's viewBox and the trimmed box both, at the
    # scale that draws the trimmed box 4 x 40px tall
    fx0, fy0 = min(ov[0], x0), min(ov[1], y0)
    fx1, fy1 = max(ov[0] + ov[2], x0 + vw), max(ov[1] + ov[3], y0 + vh)
    k = 4.0 * H / vh
    w4, h4 = int(round((fx1 - fx0) * k)), int(round((fy1 - fy0) * k))

    def frame(text, x, y, w, h):
        b64 = base64.b64encode(text.encode('utf-8')).decode()
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%r %r %r %r" width="%d" height="%d" preserveAspectRatio="none" '
                'style="display:block"><image href="data:image/svg+xml;base64,%s" x="%r" y="%r" width="%r" height="%r" '
                'preserveAspectRatio="none"/></svg>' % (fx0, fy0, fx1 - fx0, fy1 - fy0, w4, h4, b64, x, y, w, h))
    page = ('<!doctype html><body style="margin:0;background:#fff">' + frame(orig_text, *ov) +
            frame(new_text, x0, y0, vw, vh) + '</body>')
    png = os.path.join(tmp, 'proof-%s.png' % name)
    chrome(['--window-size=%d,%d' % (max(w4, 600), 2 * h4 + 40), '--screenshot=' + png, page_file(page, tmp, 'proof.html')])
    im = Image.open(png).convert('RGB')
    d = ImageChops.difference(im.crop((0, 0, w4, h4)), im.crop((0, h4, w4, 2 * h4)))
    r, g, b = d.split()
    d = ImageChops.lighter(ImageChops.lighter(r, g), b)   # the largest of the three channels' differences
    over = sum(d.histogram()[33:])
    if over > 0.001 * w4 * h4:
        return '%d of %d pixels differ by more than an eighth' % (over, w4 * h4)
    prove.last = '%d of %d pixels differ by more than an eighth, largest difference %d' % (over, w4 * h4, d.getextrema()[1])
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
                         ' '.join(fmt(v) for v in vbox), drawn[0], drawn[1],
                         'PROOF FAIL: ' + why if why else 'proof ok (%s)' % prove.last))
            else:
                box, size, low = write_raster(name, src)
                print('%-14s %-18s %6d -> %6d bytes  trimmed to %s, written %dx%d%s'
                      % (name, f, os.path.getsize(src), os.path.getsize(os.path.join(OUT, name + '.webp')), box,
                         size[0], size[1], '  LOW RESOLUTION: %dpx tall, under the %dpx every logo is made at, and not enlarged'
                         % (size[1], H) if low else ''))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
