#!/usr/bin/env python3
"""
Turn the phone screenshots in "PensionBuddy Photos/" into web assets.

The source files are iPhone Photos screenshots, so each one is a photo sitting
inside black letterboxing with app chrome above and below (a date/back bar at
the top, an action bar and sometimes a thumbnail filmstrip at the bottom).
This finds the photo band, crops to it, resizes for its job, and writes a
WebP plus the JPEG fallback the site's <picture> pattern expects.

  python3 tools/prepare-photos.py            # write assets/img/
  python3 tools/prepare-photos.py --preview  # write crops to the scratchpad only

Python 3.9 stdlib + Pillow (user-level install, with WebP).
"""
import argparse, os, sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit('Pillow is required: python3 -m pip install --user pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/Users/adamjamescondon/PensionBuddy Photos'
OUT = os.path.join(ROOT, 'assets', 'img')

# source file -> (slug, alt text). Alt is specific per photo, as asked.
PHOTOS = [
    ('IMG_1023.PNG', 'strip-cycling-pink-kit',
     'Damian and Adam in matching pink cycling kit after a charity cycle'),
    ('IMG_1027.PNG', 'strip-cycling-blue-kit',
     'Damian and Adam in blue cycling kit at a post-ride event'),
    ('IMG_1028.PNG', 'strip-gig-bucket-hats',
     'Adam and Damian in bucket hats at an outdoor gig'),
    ('IMG_1026.PNG', 'strip-train-platform',
     'Adam and Damian waiting on a train platform on a trip abroad'),
    ('IMG_1032.PNG', 'strip-adam-rocky-park',
     'Adam crouched beside Buddy on the grass in St Anne’s Park'),
    ('IMG_1033.PNG', 'strip-adam-rocky-sitting',
     'Adam sitting with Buddy in the park on a sunny afternoon'),
    ('IMG_1025.PNG', 'strip-rocky-helmet',
     'Buddy wearing a cycling helmet in front of an armchair'),
    ('IMG_1029.PNG', 'strip-rocky-grinning',
     'Buddy grinning on his lead out for a walk'),
    ('IMG_1030.PNG', 'strip-rocky-head-tilt',
     'Buddy tilting his head at the camera indoors'),
    ('IMG_1034.PNG', 'strip-rocky-blanket',
     'Buddy sitting to attention on a blanket at home'),
    ('IMG_1035.PNG', 'strip-rocky-sofa',
     'Buddy stretched out on the sofa refusing to move'),
    ('IMG_1031.PNG', 'strip-rocky-closeup',
     'A close-up of Buddy looking unimpressed'),
]

# The strip is decorative and scrolls, so it never needs full-size images.
# 430px tall covers a ~215px display height at 2x.
STRIP_H = 430
STRIP_Q = 72

# Adam's team-card headshot. The source is already 4:5, the same ratio as
# damian-condon.jpg, so it only needs resizing. 'box' is None for a straight
# resize; give it a crop box if a future source needs squaring up first.
HEADSHOT = {
    'source': 'Headshot.JPG',
    'raw': True,                   # a real photo, not a phone screenshot to de-chrome
    'box': None,
    'slug': 'adam-condon',
    'size': (600, 750),            # 2x of Damian's declared 300x375
    'quality': 82,
}

# The same photo again at portrait size for Adam's own profile section, matching
# damian-condon-portrait.jpg. The small card crop is a narrow 132px column, so
# the headshot only reads properly at this size.
PORTRAIT = dict(HEADSHOT, slug='adam-condon-portrait', size=(620, 775), quality=84)


def photo_band(im):
    """Rows of the screenshot that hold the photo rather than black bars or UI.

    Photo rows are both bright and varied; letterboxing is flat black and the
    app chrome is near-black with a little white text. Taking the longest
    qualifying run also skips the thumbnail filmstrip some screenshots carry.
    """
    g = im.convert('L')
    w, h = g.size
    px = g.load()
    step = max(1, w // 160)          # sample columns, full scan is not needed
    ok = []
    for y in range(h):
        vals = [px[x, y] for x in range(0, w, step)]
        n = len(vals)
        mean = sum(vals) / n
        var = sum((v - mean) ** 2 for v in vals) / n
        ok.append(mean > 40 and var > 225)   # var > 15^2
    best = cur = None
    for y, good in enumerate(ok + [False]):
        if good and cur is None:
            cur = y
        elif not good and cur is not None:
            if best is None or (y - cur) > (best[1] - best[0]):
                best = (cur, y)
            cur = None
    return best or (0, h)


def load_cropped(name):
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    top, bot = photo_band(im)
    inset = 2                                   # shave any half-lit edge row
    return im.crop((0, min(top + inset, bot), im.width, max(bot - inset, top)))


def save_pair(im, slug, out_dir, quality):
    """Write slug.webp + slug.jpg, keeping WebP only when it actually wins."""
    os.makedirs(out_dir, exist_ok=True)
    jpg = os.path.join(out_dir, slug + '.jpg')
    webp = os.path.join(out_dir, slug + '.webp')
    im.save(jpg, 'JPEG', quality=quality + 6, optimize=True, progressive=True)
    im.save(webp, 'WEBP', quality=quality, method=6)
    jb, wb = os.path.getsize(jpg), os.path.getsize(webp)
    if wb >= jb:                                # a bigger WebP helps nobody
        os.remove(webp)
        return jpg, None, jb, None
    return jpg, webp, jb, wb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', action='store_true',
                    help='write crops to the scratchpad instead of assets/img')
    args = ap.parse_args()
    out_dir = os.environ.get('PREVIEW_DIR', '/tmp/photo-preview') if args.preview else OUT

    total_w = total_j = 0
    print('%-30s %-11s %-16s %9s %9s' % ('source', 'band', 'slug', 'jpg', 'webp'))
    for name, slug, _alt in PHOTOS:
        im = Image.open(os.path.join(SRC, name)).convert('RGB')
        top, bot = photo_band(im)
        crop = load_cropped(name)
        h = STRIP_H
        w = max(1, round(crop.width * h / crop.height))
        resized = crop.resize((w, h), Image.LANCZOS)
        jpg, webp, jb, wb = save_pair(resized, slug, out_dir, STRIP_Q)
        total_j += jb
        total_w += wb if wb else jb
        print('%-30s %-11s %-16s %9d %9s' % (name, '%d-%d' % (top, bot), slug, jb,
                                             wb if wb else 'skipped'))
    print('\n%d photos  |  jpg total %.0f KB  |  webp total %.0f KB (what browsers fetch)'
          % (len(PHOTOS), total_j / 1024, total_w / 1024))

    for h in (HEADSHOT, PORTRAIT):
        if h.get('raw'):
            head = Image.open(os.path.join(SRC, h['source'])).convert('RGB')
        else:
            head = load_cropped(h['source'])
        if h.get('box'):
            head = head.crop(h['box'])
        head = head.resize(h['size'], Image.LANCZOS)
        jpg, webp, jb, wb = save_pair(head, h['slug'], out_dir, h['quality'])
        print('headshot %-24s %9d %9s  (from %s, %dx%d, %s)'
              % (h['slug'], jb, wb if wb else 'skipped', h['source'],
                 h['size'][0], h['size'][1],
                 'cropped' if h.get('box') else 'already 4:5, resized only'))


if __name__ == '__main__':
    main()
