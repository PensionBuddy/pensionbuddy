#!/usr/bin/env python3
"""Assemble a calculator page from pension-calculator.html's skeleton.

    python3 tools/pagebuild.py                 # every page
    python3 tools/pagebuild.py state-pension   # one page

The head, CSS, nav, skip link, footer, Ask Buddy widget, consent bar and every
shared runtime script are taken verbatim from the skeleton, so an assembled
page inherits the same chrome and accessibility scaffolding and cannot drift
from it. pension-calculator.html itself is never modified. Re-runnable, and a
rebuild with no source change rewrites the same bytes.

Each page is a record in PAGES. Everything that differs between pages lives
there; everything that does not lives in assemble() exactly once. Adding a
page means adding a record and a parts directory, not another copy of this
file.

    tools/<parts>/main.html   the whole <main> element
    tools/<parts>/page.css    the page's own CSS, injected before </style>
    tools/<parts>/page.js     the page's own script, inlined after the modules

THE MAIN SLOT. The skeleton is cut either side of its one <main> element and
the part supplies that element whole, opening tag and closing tag both. The
earlier scripts cut the head before the opening tag but the tail *at* the
closing tag, so the slot was "opening tag plus contents" while every part was
a whole element: the closing tag arrived twice. Two of the three scripts later
stripped a trailing </main> from the part to compensate;
broker-vs-autoenrolment.html shipped with two of them. Cutting symmetrically
removes the mismatch rather than compensating for it, and check() asserts the
count so the mistake cannot return silently.

CONTENT STAMPS are applied here, as the last step of assembly, so a built page
is complete when it is written and needs no follow-up pass. Images and local
script tags both get one: assets/js/calc-page.js is the shared UI runtime every
calculator loads, and the skeleton carries its tag with no ?v= at all so that
the hash is never typed by hand anywhere. tools/stamp-images.py imports the
same functions for the hand-written pages, the skeleton among them.
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKELETON = os.path.join(ROOT, 'pension-calculator.html')

OPEN_MAIN = '<main id="main" tabindex="-1">'
CLOSE_MAIN = '</main>'

# assets/img/name.ext, optionally already stamped
IMG_PAT = re.compile(r'(assets/img/[A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|webp|svg))(\?v=[0-9a-f]+)?')

# <script src="assets/js/name.js">, optionally already stamped. Anchored to the
# tag, unlike IMG_PAT, because every page script also names its modules in
# prose: "Maths lives in assets/js/autoenrolment.js" is a sentence, not a URL,
# and an unanchored pattern would stamp it.
JS_PAT = re.compile(r'(<script src=")(assets/js/[A-Za-z0-9_.-]+\.js)(\?v=[0-9a-f]+)?(")')

# The shared UI runtime. It is in no page's `modules`: the skeleton carries the
# one tag and assembly inherits it, so every page gets it without a record
# having to remember to ask. check() asserts that below.
SHARED_RUNTIME = 'assets/js/calc-page.js'

_img_hash = {}


def content_hash(rel):
    """First eight hex of the sha1 of a file in the repository, or None."""
    if rel not in _img_hash:
        path = os.path.join(ROOT, rel)
        if not os.path.isfile(path):
            _img_hash[rel] = None
        else:
            with open(path, 'rb') as f:
                _img_hash[rel] = hashlib.sha1(f.read()).hexdigest()[:8]
    return _img_hash[rel]


def stamp_html(text, missing=None):
    """Rewrite every local image and script URL as path?v=<content hash>.

    A replaced photo keeps its filename, so without this a browser that already
    holds the old bytes carries on showing them. The same is true of a script,
    which is why the calculation modules have carried a hash from the start.
    This is how the shared runtime gets one too: the tag in the skeleton is
    written with no query at all and stamped from here, so there is no hand
    typed hash anywhere to go stale. Files that are not on disk are left alone
    and collected in `missing` when one is passed.
    """
    def image(m):
        rel = m.group(1)
        h = content_hash(rel)
        if h is None:
            if missing is not None:
                missing.add(rel)
            return m.group(0)
        return '%s?v=%s' % (rel, h)

    def script(m):
        rel = m.group(2)
        h = content_hash(rel)
        if h is None:
            if missing is not None:
                missing.add(rel)
            return m.group(0)
        return '%s%s?v=%s%s' % (m.group(1), rel, h, m.group(4))

    return JS_PAT.sub(script, IMG_PAT.sub(image, text))


def versioned(rel):
    """A module URL carrying its own content hash, so a changed module can
    never be served from a stale cache under the old URL."""
    h = content_hash(rel)
    # without this a missing file becomes the literal URL 'x.js?v=None', which
    # 404s in the browser and passes every check that only counts tags
    assert h is not None, 'module not on disk: %s' % rel
    return '%s?v=%s' % (rel, h)


class Page(object):
    def __init__(self, out, parts, title, desc, modules, keep,
                 page_js='page.js', nav=None, fonts=None, checks=()):
        self.out = out                # file written at the repository root
        self.parts = parts            # directory under tools/
        self.title = title            # <title>, og:title
        self.desc = desc              # meta description, og:description
        self.modules = modules        # calculation modules, in load order
        self.keep = keep              # ids the progressive disclosure keeps visible
        self.page_js = page_js        # the page script inside the parts directory
        self.nav = nav                # href of the nav item to mark current, or None
        self.fonts = fonts            # extra Google Fonts family parameter, or None
        self.checks = checks          # (needle, label) pairs particular to this page

    @property
    def parts_dir(self):
        return os.path.join(ROOT, 'tools', self.parts)


PAGES = {
    'compare': Page(
        out='broker-vs-autoenrolment.html',
        parts='compare-parts',
        page_js='compare-page.js',
        title='Auto-enrolment or a broker pension, Pensionbuddy',
        desc=('Compare what goes into your pension under My Future Fund auto-enrolment '
              'against a personal pension arranged through a broker, for your own salary '
              'and age. An illustration, not advice.'),
        modules=['assets/js/pension-tax-relief.js', 'assets/js/autoenrolment.js'],
        # every range here is a primary control for one mode or the other; only
        # the tax-rate segment folds into "More options", as on the other calculators
        keep=['age', 'salary', 'gross', 'match', 'extra', 'tmatch'],
        # the headline face this page alone uses, added to the one existing request
        fonts='family=Bricolage+Grotesque:opsz,wght@12..96,600..800&',
        checks=(('vs-card', 'comparison component'),),
    ),
    'state-pension': Page(
        out='state-pension-reality-check.html',
        parts='state-pension-parts',
        title='The State Pension reality check, Pensionbuddy',
        desc=('What the State Pension actually pays, next to what retirement in Ireland '
              'costs according to the Pensions Council. An illustration, not advice.'),
        modules=['assets/js/state-pension.js'],
        # both controls are primary, so nothing folds into "More options"
        keep=['contribs', 'age'],
        nav='state-pension-reality-check.html',
        checks=(('id="contribs"', 'contributions slider'),
                ('id="lsRows"', 'living standards bars'),
                ('pensionscouncil.ie', 'Pensions Council cited'),
                ('citizensinformation.ie', 'Citizens Information cited')),
    ),
    'state-pension-entitlement': Page(
        out='state-pension-entitlement.html',
        parts='state-pension-entitlement-parts',
        title='The State Pension entitlement check, Pensionbuddy',
        desc=('What the State Pension (Contributory) would actually pay, worked out both ways '
              'the Department does until the end of 2033, and which one is paid. An illustration, not advice.'),
        # order matters: the entitlement module throws if state-pension.js is
        # not already on the page
        modules=['assets/js/state-pension.js', 'assets/js/state-pension-entitlement.js'],
        # all five controls are primary, so nothing folds into "More options"
        keep=['birth', 'entry', 'paid', 'credited', 'homecaring'],
        # not a nav page: reached from the reality check, the footer and the sitemap
        nav=None,
        checks=(('id="birth"', 'birth year slider'),
                ('id="entry"', 'entry year slider'),
                ('id="paid"', 'paid slider'),
                ('id="credited"', 'credited slider'),
                ('id="homecaring"', 'HomeCaring slider'),
                ('SW19', 'SW19 cited'),
                ('citizensinformation.ie', 'Citizens Information cited'),
                ('mywelfare.ie', 'MyWelfare cited')),
    ),
}


def read(path):
    return open(path, encoding='utf-8', errors='replace').read()


def assemble(page):
    """The finished page, as a string. Writes nothing."""
    src = read(SKELETON)
    head = src[:src.index(OPEN_MAIN)]
    # cut past the closing tag: the part supplies the whole <main> element
    tail = src[src.index(CLOSE_MAIN) + len(CLOSE_MAIN):]

    # --- head: title, description, this page's CSS, fonts, nav -------------
    head = re.sub(r'<title>.*?</title>', '<title>%s</title>' % page.title,
                  head, count=1, flags=re.S)
    for prop in ('name="description"', 'property="og:description"'):
        head = re.sub(r'(<meta %s content=")[^"]*(")' % re.escape(prop),
                      lambda m: m.group(1) + page.desc + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  lambda m: m.group(1) + page.title + m.group(2), head, count=1)

    assert head.count('</style>') >= 1, 'no stylesheet to extend'
    css = read(os.path.join(page.parts_dir, 'page.css')).strip()
    head = head.replace('</style>', '\n' + css + '\n</style>', 1)

    if page.fonts:
        m = re.search(r'(<link href="https://fonts\.googleapis\.com/css2\?)([^"]*)(")', head)
        assert m, 'could not find the Google Fonts request'
        if page.fonts not in m.group(2):
            head = head[:m.start(2)] + page.fonts + head[m.start(2):]

    # The skeleton's active Calculator link carries aria-current AFTER href, so
    # an exact-string replace never fires. Match on the attributes, not order.
    head, n = re.subn(
        r'<a class="lnk active"(?=[^>]*href="pension-calculator\.html")[^>]*>Calculator</a>',
        '<a class="lnk" href="pension-calculator.html">Calculator</a>', head, count=1)
    assert n == 1, 'could not un-activate the Calculator nav item'
    if page.nav:
        assert head.count('href="%s"' % page.nav) >= 1, \
            'nav link missing: run the nav update before building'
        head = head.replace('<a class="lnk" href="%s">' % page.nav,
                            '<a class="lnk active" aria-current="page" href="%s">' % page.nav, 1)

    # --- tail: swap the skeleton's calculator script for this page's -------
    m = re.search(r'<script>\s*const REDUCE=', tail)
    assert m, 'could not find the page-specific calculator script'
    end = tail.index('</script>', m.start()) + len('</script>')
    scripts = ''.join('<script src="%s"></script>\n' % versioned(rel) for rel in page.modules)
    scripts += '<script>\n' + read(os.path.join(page.parts_dir, page.page_js)).strip() + '\n</script>'
    tail = tail[:m.start()] + scripts + tail[end:]

    tail = re.sub(r"KEEP = \[[^\]]*\]",
                  "KEEP = [%s]" % ','.join("'%s'" % k for k in page.keep), tail, count=1)

    body = read(os.path.join(page.parts_dir, 'main.html')).strip()
    return stamp_html(head + body + tail)


def check(html, page):
    """Every invariant an assembled page must hold, as (label, ok) pairs."""
    out = []

    def want(ok, label):
        out.append((label, bool(ok)))

    want(OPEN_MAIN in html, 'main landmark')
    want(len(re.findall(r'<main\b', html)) == 1, 'one <main>')
    want(html.count(CLOSE_MAIN) == 1, 'one </main>')
    want('class="skip"' in html, 'skip link')
    want('foot-top' in html, 'footer')

    # Every module present once, in the declared order, and the page's own
    # script after all of them: a module that loads late throws on first render.
    where = []
    for rel in page.modules:
        marker = '<script src="%s?v=' % rel
        want(html.count(marker) == 1, 'module %s' % os.path.basename(rel))
        where.append(html.find(marker))
    want(all(w >= 0 for w in where) and all(a < b for a, b in zip(where, where[1:])),
         'module order')

    # The shared runtime is inherited from the skeleton, so no record lists it
    # and the module checks above cannot see it. It has to be there once, and
    # ahead of everything else: each page script reads window.PBPage as it
    # loads, and a runtime that arrived later would leave that undefined.
    shared = '<script src="%s?v=' % SHARED_RUNTIME
    want(html.count(shared) == 1, 'shared runtime once')
    at = html.find(shared)
    want(at >= 0 and all(at < w for w in where if w >= 0), 'shared runtime first')
    if where and min(where) >= 0:
        after_last = html.index('</script>', max(where)) + len('</script>')
        want(html[after_last:after_last + 10] == '\n<script>\n', 'page script after modules')

    current = [a for a in re.findall(r'<a class="lnk[^>]*>', html)
               if 'aria-current' in a or 'active' in a]
    if page.nav:
        want(len(current) == 1 and page.nav in current[0], 'nav marked current')
    else:
        want(not current, 'no nav item current')

    for bad, label in (('—', 'no em dash'),
                       ('&mdash;', 'no em dash entity'),
                       ('owns their home outright', 'no withdrawn housing claim'),
                       ('outright home ownership', 'no withdrawn ownership claim')):
        want(bad not in html, label)

    want(not [m for m in IMG_PAT.finditer(html) if not m.group(2)], 'images stamped')
    want(not [m for m in JS_PAT.finditer(html) if not m.group(3)], 'scripts stamped')

    for needle, label in page.checks:
        want(needle in html, label)

    return out


def build(page):
    html = assemble(page)
    results = check(html, page)
    open(os.path.join(ROOT, page.out), 'w', encoding='utf-8').write(html)
    print('wrote %s  (%d bytes)' % (page.out, len(html.encode('utf-8'))))
    for label, good in results:
        print('  %-28s %s' % (label, 'ok' if good else 'FAIL'))
    return all(good for _, good in results)


def main():
    names = [a for a in sys.argv[1:] if not a.startswith('-')] or sorted(PAGES)
    unknown = [n for n in names if n not in PAGES]
    if unknown:
        sys.exit('unknown page(s): %s\nknown: %s' % (', '.join(unknown), ', '.join(sorted(PAGES))))
    ok = True
    for i, name in enumerate(names):
        if i:
            print('')
        ok = build(PAGES[name]) and ok
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
