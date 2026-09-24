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

THE SHARED CHROME. The skeleton is also the one source of the nav and the
footer's link columns for every page: assemble() carries them into the three
built pages, tools/sync-chrome.py copies them into the twelve hand-written
ones, and chrome_drift(), at the end of this file, is the guard that
tools/verify.py and tests/build.test.py run over all sixteen. Edit the nav in
pension-calculator.html, then run both tools; either order reaches the same
tree.
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
    # Run 20 #1. Not a calculator: a four-step form built on the same
    # skeleton so it wears the same chrome. It has no sliders, so nothing
    # folds into "More options", and it uses none of the class names the
    # calculators' shared scripts look for (.results, .seg), so the guess
    # card, the peek bar and the share link all stand aside.
    'finder': Page(
        out='find-my-pension.html',
        parts='finder-parts',
        title='Find an old pension, Pensionbuddy',
        desc=('Lost track of a pension from an old job? Tell us where you worked, sign a letter '
              'that lets us ask the providers, and we do the chasing. Nothing is moved, and '
              'there is no obligation.'),
        modules=['assets/js/pension-finder.js'],
        keep=[],
        nav=None,
        checks=(('id="pfForm"', 'the finder form'),
                ('data-issue="R20-1a"', 'the draft letter flagged for compliance'),
                ('id="pfPhoneOk"', 'phone consent is its own box'),
                ('id="pfOptin"', 'email consent is its own box')),
    ),
    # Run 20 #3. A calculator like the other five: panel, results, the
    # shared runtime, the share row and the saved report. Growth folds under
    # More options; the pot, the payments, the years and both plans' charges
    # stay out.
    'fees': Page(
        out='pension-fees-calculator.html',
        parts='fees-parts',
        title='What your pension charges cost, Pensionbuddy',
        desc=('What an annual management charge and a charge on each payment take out of a '
              'pension pot by retirement, next to another plan\'s charges. An illustration, not advice.'),
        modules=['assets/js/pension-fees.js'],
        keep=['pot', 'monthly', 'years', 'amcA', 'feeA', 'amcB', 'feeB'],
        nav=None,
        checks=(('id="feeChart"', 'the chart'),
                ('class="pb-warn"', 'the prescribed warnings'),
                ('ccpc.ie', 'the CCPC cited'),
                ('under the Pensions Act', 'the Standard PRSA maximums sourced')),
    ),
    # Run 20 #4. A short form and a result, like the finder: no sliders, and
    # none of the class names the calculators' shared scripts look for.
    'readiness': Page(
        out='pension-readiness-check.html',
        parts='readiness-parts',
        title='How ready is your pension? A 60-second check, Pensionbuddy',
        desc=('Six questions about what you know and what you have done, a score out of 100, '
              'and a next step for every point you did not get. Information only; nothing you '
              'answer leaves the page.'),
        modules=['assets/js/readiness.js'],
        keep=[],
        nav=None,
        checks=(('id="rdForm"', 'the check'),
                ('not a suitability assessment', 'information only, said on the page')),
    ),
    # Run 20 #7. The threshold for a year, the share of it used, and the
    # lump sum's bands, from assets/js/sft.js, which carries the sources.
    'sft': Page(
        out='standard-fund-threshold.html',
        parts='sft-parts',
        title='The Standard Fund Threshold, and how much of it you would use, Pensionbuddy',
        desc=('The Standard Fund Threshold from 2026 to 2029 and after, how much of it your pensions '
              'would use in the year you take them, and how a retirement lump sum is taxed. '
              'Rules as at September 2026. An illustration, not advice.'),
        modules=['assets/js/sft.js'],
        keep=['total', 'year', 'lump'],
        nav=None,
        checks=(('id="sftStrip"', 'the year-by-year strip'),
                ('Rules as at 24 September 2026', 'the date the rules were checked'),
                ('Finance Act 2024', 'the statute cited')),
    ),
    # Run 20 #6. A dated summary of the rules that changed for directors, and
    # four questions that list topics to discuss, never a recommendation.
    'director-rules': Page(
        out='director-pension-rules.html',
        parts='director-rules-parts',
        title="Directors' pensions in 2026: what changed, Pensionbuddy",
        desc=('What changed for company directors: executive pensions set up before April 2021, a '
              "company's payments into a PRSA, the October window and the Standard Fund Threshold. "
              'Rules as at September 2026. Information, not advice.'),
        modules=['assets/js/director-topics.js'],
        keep=[],
        nav=None,
        checks=(('id="drForm"', 'the four questions'),
                ('Rules as at 24 September 2026', 'the date the rules were checked'),
                ('Topics to discuss, not advice', 'the list says what it is')),
    ),
    # Run 20 #12. A list the reader fills in and a summary that follows it,
    # like the finder: no sliders, none of the calculators' class names.
    'pots': Page(
        out='my-pensions.html',
        parts='pots-parts',
        title='All your pensions in one view, Pensionbuddy',
        desc=('List the pensions you have and see the total, how it is split, and what the annual '
              'charges come to in euro a year. Nothing you type leaves the page.'),
        modules=['assets/js/pots.js'],
        keep=[],
        nav=None,
        checks=(('id="ptForm"', 'the list'),
                ('id="ptPrint"', 'print or save'),
                ('Nothing you type is sent or stored', 'said on the page')),
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


# ============================================================================
# THE SHARED CHROME. The nav and the footer's link columns are the same on
# every page and have one owner, the skeleton. tools/sync-chrome.py copies
# them to the hand-written pages and assemble() to the built ones, and
# chrome_drift() is the guard both tools/verify.py and tests/build.test.py
# run over every page: a page whose chrome differs from the skeleton's beyond
# the two rules below is a FAIL.
#
# The two rules. The nav item for the page itself carries class="lnk active"
# and aria-current="page"; only pages that are plain nav targets mark
# themselves, so index.html, which the nav reaches by fragment, marks none.
# And on index.html the nav's own-page fragments are same-page anchors, so
# the countdown chip and About scroll instead of reloading whichever URL the
# home page was served as. The footer keeps the absolute index.html#story on
# every page, index included: that is today's behaviour, and changing it would
# turn a reload into a scroll.
#
# Not owned: the disclosure paragraphs under the link columns, which carry
# different legal wording on the legal pages on purpose, and the stylesheet,
# which is three different families across the sixteen pages with no shared
# subset a tool could pick (the ten marketing and legal pages share three
# lines of the skeleton's 1,455). Two things in those regions ARE identical
# on every page, and are guarded here but never synced: the paragraph naming
# the Central Bank regulation, and the :root design tokens.
# ============================================================================
NAV_OPEN, NAV_CLOSE = '<nav id="nav">', '</nav>'
FOOT_OPEN, DISCLOSURE = '<div class="foot-top">', '<div class="disclosure">'
ANNOUNCE_OPEN = '<div class="announce">'
SKIP_LINK = '<a class="skip" href="#main">'
HOME = 'index.html'
PLAIN = '<a class="lnk" href="%s">'
ACTIVE = '<a class="lnk active" href="%s" aria-current="page">'
LNK_PAT = re.compile(r'<a class="lnk[^"]*"[^>]*>')
ACTIVE_PAT = re.compile(r'<a class="lnk active"(?=[^>]*href="([^"]+)")[^>]*>')
CURRENT_PAT = re.compile(r'<a class="lnk"(?=[^>]*aria-current="page")(?=[^>]*href="([^"]+)")[^>]*>')
HREF_PAT = re.compile(r'href="([^"]+)"')


def _once(text, marker):
    """Offset of the one occurrence of marker, or None unless it occurs exactly once."""
    i = text.find(marker)
    if i < 0 or text.find(marker, i + len(marker)) >= 0:
        return None
    return i


def nav_span(text):
    """(start, end) of the nav element, or None unless there is exactly one.
    Found by index, never by a regex: the logo line inside is 200 characters
    of SVG and a lazy `.*?` across it is a hazard that index arithmetic does
    not have."""
    i, j = _once(text, NAV_OPEN), _once(text, NAV_CLOSE)
    if i is None or j is None or j < i:
        return None
    return i, j + len(NAV_CLOSE)


def foot_top_span(text):
    """(start, end) of the footer's link columns: from the start of the line
    holding <div class="foot-top"> to the start of the line holding the
    disclosure. None unless both occur exactly once, in that order."""
    i, j = _once(text, FOOT_OPEN), _once(text, DISCLOSURE)
    if i is None or j is None or j < i:
        return None
    return text.rfind('\n', 0, i) + 1, text.rfind('\n', 0, j) + 1


def nav_items(nav):
    """(href, tag) for every nav link, in order."""
    out = []
    for m in LNK_PAT.finditer(nav):
        h = HREF_PAT.search(m.group(0))
        out.append((h.group(1) if h else '', m.group(0)))
    return out


def nav_targets(nav):
    """The pages that mark themselves current: every nav link to a page,
    fragments excluded. Derived from the nav, so a new item makes its page
    mark itself with no list to remember. tests/build.test.py pins the derived
    set to the six names it is today, so a rule that quietly stopped matching
    an item fails there rather than silently un-marking a page."""
    return {h for h, tag in nav_items(nav) if '#' not in h}


def active_hrefs(nav):
    """The hrefs of the items carrying either half of the current marker."""
    return [h for h, tag in nav_items(nav) if 'lnk active' in tag or 'aria-current="page"' in tag]


def marker_whole(nav):
    """True when every item carrying one half of the marker carries both."""
    return all(('lnk active' in tag) == ('aria-current="page"' in tag) for h, tag in nav_items(nav))


def neutral_nav(nav, page):
    """The nav with the current marker removed from whichever item carries it,
    whichever order its attributes are in, and, on the home page, the same-
    page anchors written the way every other page writes them. Two navs that
    differ only by the two rules compare equal after this."""
    nav = ACTIVE_PAT.sub(lambda m: PLAIN % m.group(1), nav)
    nav = CURRENT_PAT.sub(lambda m: PLAIN % m.group(1), nav)
    if page == HOME:
        nav = nav.replace('href="#', 'href="%s#' % HOME)
    return nav


def set_active(nav, href):
    """The skeleton's nav with exactly one item marked current, or none. The
    marker is moved, not the tag rebuilt, and every nav anchor is assumed to
    carry exactly class and href; a skeleton whose marker cannot be found or
    whose target is missing raises, because the skeleton is broken, not the
    page."""
    nav, n = ACTIVE_PAT.subn(lambda m: PLAIN % m.group(1), nav)
    if n != 1:
        raise ValueError('the skeleton nav marks %d items current, not one' % n)
    if href:
        if nav.count(PLAIN % href) != 1:
            raise ValueError('no nav item for %s' % href)
        nav = nav.replace(PLAIN % href, ACTIVE % href, 1)
    return nav


def localise(nav, page):
    """On the home page the nav's own-page fragments are same-page anchors."""
    return nav.replace('href="%s#' % HOME, 'href="#') if page == HOME else nav


def chrome_for(skeleton, page):
    """(nav, foot-top) the page should carry, from the skeleton's."""
    i, j = nav_span(skeleton)
    fi, fj = foot_top_span(skeleton)
    nav = skeleton[i:j]
    return localise(set_active(nav, page if page in nav_targets(nav) else None), page), skeleton[fi:fj]


def _squash(s):
    """Markup with the whitespace between tags removed, which is what the
    renderer sees inside a grid: index.html's foot-brand is written over
    four lines where every other page has one, and that is not a difference."""
    return re.sub(r'>\s+<', '><', s)


def _line_holding(text, marker):
    i = text.find(marker)
    if i < 0:
        return None
    return text[text.rfind('\n', 0, i) + 1:text.find('\n', i)].strip()


def regulatory_line(text):
    """The disclosure's first paragraph, whitespace collapsed: the sentence
    naming the Central Bank regulation, identical on every page."""
    i = text.find(DISCLOSURE)
    m = re.search(r'<p>(.*?)</p>', text[i:], re.S) if i >= 0 else None
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else None


def root_tokens(text):
    """The :root declarations, comments stripped, sorted: the design tokens."""
    m = re.search(r':root\{(.*?)\}', text, re.S)
    if not m:
        return None
    body = re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S)
    return tuple(sorted(d.strip() for d in body.split(';') if d.strip()))


def _describe(got, want):
    """Why two blocks differ, readable: hrefs, then labels, then the first line."""
    gh, wh = HREF_PAT.findall(got), HREF_PAT.findall(want)
    if gh != wh:
        return 'hrefs %s, expected %s' % ([h for h in gh if h not in wh] or gh[:4], [h for h in wh if h not in gh] or wh[:4])
    gl, wl = re.findall(r'>([^<>]+)</a>', got), re.findall(r'>([^<>]+)</a>', want)
    if gl != wl:
        return 'labels %s, expected %s' % ([l for l in gl if l not in wl], [l for l in wl if l not in gl])
    for a, b in zip(got.split('\n'), want.split('\n')):
        if a != b:
            return 'differs in markup only, first at: %s' % a.strip()[:80]
    return 'differs in markup only'


def chrome_drift(sources, skeleton=os.path.basename(SKELETON)):
    """{page: [(kind, detail), ...]} for every page whose shared chrome differs
    from the skeleton's. `sources` is {filename: text}: nothing is read or
    written, so tests/build.test.py hands it a mutant as a dict with one
    string changed. Never raises. A page whose blocks cannot be found is a
    'structure' finding, because tools/verify.py writes its report after this
    runs and a traceback here would leave the previous report standing.

    Kinds: structure, nav (the block, marker neutralised), active (which item
    is current), active-markup (both halves of the marker), foot-top, banner
    (the announce bar and the skip link), regulatory, tokens."""
    out = {}

    def add(page, kind, detail):
        out.setdefault(page, []).append((kind, detail))

    skel = sources.get(skeleton)
    if skel is None or nav_span(skel) is None or foot_top_span(skel) is None:
        add(skeleton, 'structure', 'the skeleton is missing or has no single nav and foot-top block')
        return out
    sn, sf = nav_span(skel), foot_top_span(skel)
    skel_nav = skel[sn[0]:sn[1]]
    targets = nav_targets(skel_nav)
    want = {
        'banner: announce': _line_holding(skel, ANNOUNCE_OPEN),
        'banner: skip link': _line_holding(skel, SKIP_LINK),
        'regulatory': regulatory_line(skel),
        'tokens': root_tokens(skel),
    }
    for page in sorted(sources):
        text = sources[page]
        n, f = nav_span(text), foot_top_span(text)
        if n is None:
            add(page, 'structure', 'no single <nav id="nav"> block')
            continue
        if f is None:
            add(page, 'structure', 'no single foot-top block ahead of the disclosure')
            continue
        nav = text[n[0]:n[1]]
        if neutral_nav(nav, page) != neutral_nav(skel_nav, skeleton):
            add(page, 'nav', _describe(neutral_nav(nav, page), neutral_nav(skel_nav, skeleton)))
        want_active = [page] if page in targets else []
        if active_hrefs(nav) != want_active:
            add(page, 'active', 'marked current: %s, expected %s' % (active_hrefs(nav) or 'none', want_active or 'none'))
        if not marker_whole(nav):
            add(page, 'active-markup', 'a current item carries both class="lnk active" and aria-current="page"')
        if page == HOME and ('href="%s#' % HOME in nav or 'href="#story"' not in nav):
            add(page, 'nav', 'the home page nav links its own sections as same-page anchors, #deadline and #story')
        if _squash(text[f[0]:f[1]]) != _squash(skel[sf[0]:sf[1]]):
            add(page, 'foot-top', _describe(text[f[0]:f[1]], skel[sf[0]:sf[1]]))
        got = {
            'banner: announce': _line_holding(text, ANNOUNCE_OPEN),
            'banner: skip link': _line_holding(text, SKIP_LINK),
            'regulatory': regulatory_line(text),
            'tokens': root_tokens(text),
        }
        for key in want:
            if got[key] != want[key]:
                add(page, key.split(':')[0], '%s differs from the skeleton' % key)
    return out


def sync_blocks(sources, skeleton=os.path.basename(SKELETON)):
    """{page: new text} for every hand-written page whose nav or foot-top has
    to change to match the skeleton's. The skeleton and the pages assemble()
    writes are never in the result: pagebuild owns those. The foot-top is
    rewritten only when it differs beyond the whitespace between tags, so a
    page that renders the same is left byte for byte as it is. Raises, before
    anything is written, on a page whose blocks cannot be found."""
    skel = sources[skeleton]
    built = {p.out for p in PAGES.values()}
    out = {}
    for page in sorted(sources):
        if page == skeleton or page in built:
            continue
        text = sources[page]
        n, f = nav_span(text), foot_top_span(text)
        if n is None or f is None:
            raise ValueError('%s has no single nav and foot-top block' % page)
        nav, foot = chrome_for(skel, page)
        new = text
        if text[n[0]:n[1]] != nav:
            new = new[:n[0]] + nav + new[n[1]:]
        f = foot_top_span(new)
        if _squash(new[f[0]:f[1]]) != _squash(foot):
            new = new[:f[0]] + foot + new[f[1]:]
        if new != text:
            out[page] = new
    return out


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
