#!/usr/bin/env python3
"""
Extract the inline base64 <img> photos from the page markup into assets/img/
and rewrite each tag as a <picture> with a WebP source and the original JPEG
as the fallback:

    <picture><source type="image/webp" srcset="assets/img/<slug>.webp">
      <img src="assets/img/<slug>.jpg" width="W" height="H" ...original attrs...>
    </picture>

- .jpg is the original bytes, untouched; .webp is Pillow quality=80, method=6,
  and is only kept (and only referenced) when it is smaller than the original
- duplicates (same bytes in several pages) are written once, by content hash
- width/height come from Pillow so the layout is reserved before the image loads
- idempotent: a page with no base64 <img> left is not touched, and an asset
  that already exists is not rewritten
- the small `AV` avatar inside the widget JS is a JS string, not an <img>
  tag, so it is deliberately left alone

Usage:  python3 tools/extract-images.py            (the three pages below)
        python3 tools/extract-images.py foo.html   (specific pages)

Python 3.9 stdlib + Pillow (user-level install with WebP support).
"""
import base64, hashlib, io, os, re, sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit('Pillow is required: python3 -m pip install --user pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REL_DIR = 'assets/img'                        # as referenced from the pages
OUT_DIR = os.path.join(ROOT, *REL_DIR.split('/'))
DEFAULT_PAGES = ['index.html', 'pension-calculator.html', 'director-calculator.html']

# alt text -> file slug. Anything not listed falls back to a slugified alt.
SLUGS = {
    'Buddy, the Pensionbuddy dog': 'buddy-avatar',
    'Damian Condon, founder of Pensionbuddy and Gresham Wealth Management': 'damian-condon-portrait',
    'Damian and Buddy out walking in the Dublin hills': 'damian-and-buddy-dublin-hills',
    'Damian Condon': 'damian-condon',
    'Buddy the boxer dog on the beach': 'buddy-beach',
}

IMG_RE = re.compile(r'<img\b[^>]*?\bsrc="data:image/(jpeg|png);base64,([A-Za-z0-9+/=\s]+)"[^>]*>', re.I)
SRC_RE = re.compile(r'\bsrc="data:image/(?:jpeg|png);base64,[A-Za-z0-9+/=\s]+"', re.I)
ALT_RE = re.compile(r'\balt="([^"]*)"')


def slugify(text):
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return s[:48].rstrip('-')


def main(pages):
    os.makedirs(OUT_DIR, exist_ok=True)
    by_hash = {}    # sha256 -> slug (dedupe across pages)
    used = {}       # slug -> sha256 (collision guard)
    written = []
    skipped = []

    for page in pages:
        path = os.path.join(ROOT, page)
        with open(path, encoding='utf-8') as fh:
            html = fh.read()
        before = len(html.encode('utf-8'))
        count = 0

        def rewrite(m):
            nonlocal count
            tag, fmt = m.group(0), m.group(1).lower()
            raw = base64.b64decode(re.sub(r'\s+', '', m.group(2)))
            digest = hashlib.sha256(raw).hexdigest()
            alt = (ALT_RE.search(tag).group(1) if ALT_RE.search(tag) else '').strip()

            slug = by_hash.get(digest)
            if slug is None:
                slug = SLUGS.get(alt) or slugify(alt) or 'image-' + digest[:10]
                if used.get(slug, digest) != digest:        # same slug, different bytes
                    slug = '%s-%s' % (slug, digest[:6])
                by_hash[digest] = slug
                used[slug] = digest

            ext = 'jpg' if fmt == 'jpeg' else 'png'
            jpg_path = os.path.join(OUT_DIR, slug + '.' + ext)
            webp_path = os.path.join(OUT_DIR, slug + '.webp')

            im = Image.open(io.BytesIO(raw))
            w, h = im.size

            if not (os.path.exists(jpg_path) and open(jpg_path, 'rb').read() == raw):
                with open(jpg_path, 'wb') as out:
                    out.write(raw)                                # original bytes, untouched
                written.append(jpg_path)
            if os.path.exists(webp_path):
                use_webp = True
            else:
                im.load()
                if im.mode not in ('RGB', 'RGBA'):
                    im = im.convert('RGBA' if 'A' in im.mode or im.mode == 'P' else 'RGB')
                buf = io.BytesIO()
                im.save(buf, 'WEBP', quality=80, method=6)
                # only keep the WebP when it actually beats the original (a busy
                # photo can come out larger at q80, in which case the JPEG is served)
                use_webp = buf.tell() < len(raw)
                if use_webp:
                    with open(webp_path, 'wb') as out:
                        out.write(buf.getvalue())
                    written.append(webp_path)
                else:
                    skipped.append('%s.webp (%d bytes >= %d byte %s; not written, no <source>)' % (slug, buf.tell(), len(raw), ext))

            new_img = SRC_RE.sub('src="%s/%s.%s" width="%d" height="%d"' % (REL_DIR, slug, ext, w, h), tag, count=1)
            count += 1
            if not use_webp:
                return new_img
            return '<picture><source type="image/webp" srcset="%s/%s.webp">%s</picture>' % (REL_DIR, slug, new_img)

        new_html = IMG_RE.sub(rewrite, html)
        after = len(new_html.encode('utf-8'))
        if new_html != html:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(new_html)
        print('%-26s %9d -> %9d bytes  (%d image%s extracted)' % (page, before, after, count, '' if count == 1 else 's'))

    if written:
        print('\nwrote:')
        for p in written:
            print('  %s  (%d bytes)' % (os.path.relpath(p, ROOT), os.path.getsize(p)))
    else:
        print('\nno assets written (already extracted)')
    for s in skipped:
        print('  skipped ' + s)


if __name__ == '__main__':
    main(sys.argv[1:] or DEFAULT_PAGES)
