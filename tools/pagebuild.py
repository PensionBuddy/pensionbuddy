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
import json
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

# Run 27: the fields assets/js/pension-finder.js FIELDS sends to Netlify Forms.
# Netlify stores only the fields a form declares in the HTML it reads at
# deploy, so the built finder must declare every one; tests/build.test.py
# reads FIELDS out of the module and holds the two lists together.
FINDER_FIELDS = ['full_name', 'other_names', 'date_of_birth', 'address', 'email', 'phone',
                 'employers', 'phone_ok', 'marketing_consent', 'signed_as', 'signed_on',
                 'letter_confirmed', 'signature_drawn', 'letter_text', 'page']

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


# The robots meta a held-back page carries, the form 404.html and thank-you.html
# already use. verify.py fails any page that links to a page carrying it.
NOINDEX = '<meta name="robots" content="noindex">'

# Run 26. Two shared components, each one string here, styled by the TRUST
# block of CSS that every page carries byte for byte. REVIEWED sits at the
# foot of the page header on every calculator, the State Pension pages, the
# director rules, the SFT and the PIA page: assemble() puts it into each
# record with reviewed=True, and the two hand-written calculators carry it by
# hand. REASON sits next to a booking call to action whose own block gives no
# reason to book; docs/STATUS.md, Run 26, lists every call to action and which
# reason it has. trust_drift(), at the end of this file, is the guard.
REVIEWED = ('<p class="pb-reviewed">Reviewed by Damian Condon, '
            'Qualified Financial Adviser (QFA) · Last reviewed September 2026</p>')
REASON = '<p class="pb-why">Free · 20 minutes · no obligation · easy to reschedule.</p>'
# Run 32: MOTION_HEAD, the script in every page's <head>, is defined after
# caveat_selector() below, because it carries the caveat list.
DEADLINE_JS = 'assets/js/pb-deadline.js'
REVIEWED_BY_HAND = ('pension-calculator.html', 'director-calculator.html')
TRUST_OPEN, TRUST_CLOSE = '/* TRUST:BEGIN', '/* TRUST:END */\n'


class Page(object):
    def __init__(self, out, parts, title, desc, modules, keep,
                 page_js='page.js', nav=None, fonts=None, checks=(), noindex=False, floor16=False, reviewed=False):
        self.out = out                # file written at the repository root
        self.parts = parts            # directory under tools/
        self.title = title            # <title>, og:title
        self.desc = desc              # meta description, og:description
        self.modules = modules        # calculation modules, in load order
        self.keep = keep              # ids the progressive disclosure keeps visible
        self.page_js = page_js        # the page script inside the parts directory
        self.nav = nav                # href of the nav item to mark current, or None
        self.fonts = fonts            # retired in Run 34 (the fonts are self-hosted); must be None
        self.checks = checks          # (needle, label) pairs particular to this page
        self.noindex = noindex        # live but held back: robots noindex, and verify.py fails any link to it
        self.floor16 = floor16        # a calculator: keeps the skeleton's 16px floor on the text in <main>
        self.reviewed = reviewed      # carries REVIEWED at the foot of its page header

    @property
    def parts_dir(self):
        return os.path.join(ROOT, 'tools', self.parts)


PAGES = {
    'compare': Page(
        out='broker-vs-autoenrolment.html',
        nav='broker-vs-autoenrolment.html',
        parts='compare-parts',
        page_js='compare-page.js',
        title='Auto-enrolment or a broker pension, Pensionbuddy',
        desc='Compare what goes into your pension under My Future Fund auto-enrolment against a personal pension through a broker. An illustration, not advice.',
        modules=['assets/js/pension-tax-relief.js', 'assets/js/autoenrolment.js'],
        # every range here is a primary control for one mode or the other; only
        # the tax-rate segment folds into "More options", as on the other calculators
        keep=['age', 'salary', 'gross', 'match', 'extra', 'tmatch'],
        floor16=True,
        reviewed=True,
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
        floor16=True,
        reviewed=True,
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
        desc='What the State Pension would pay, worked out both ways the Department does until the end of 2033, and which one is paid. An illustration, not advice.',
        # order matters: the entitlement module throws if state-pension.js is
        # not already on the page
        modules=['assets/js/state-pension.js', 'assets/js/state-pension-entitlement.js'],
        # all five controls are primary, so nothing folds into "More options"
        keep=['birth', 'entry', 'paid', 'credited', 'homecaring'],
        floor16=True,
        reviewed=True,
        # not a nav page: reached from the reality check, the footer and the sitemap
        nav='state-pension-entitlement.html',
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
        # Run 21: held back until compliance signs off the letter; to re-link,
        # drop this and put back the links listed in docs/STATUS.md, Run 21
        noindex=True,
        checks=(('id="pfForm"', 'the finder form'),
                ('name="pension-finder" method="POST" data-netlify="true" netlify-honeypot="bot-field"',
                 'the finder form is a Netlify form'),
                ('<input type="hidden" name="form-name" value="pension-finder">'
                 + ''.join('<input type="hidden" name="%s">' % f for f in FINDER_FIELDS),
                 'every field PBFinder.fields() sends, declared in the static form'),
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
        desc='What an annual management charge and a charge on each payment take out of a pension pot by retirement. An illustration, not advice.',
        modules=['assets/js/pension-fees.js'],
        keep=['pot', 'monthly', 'years', 'amcA', 'feeA', 'amcB', 'feeB'],
        floor16=True,
        reviewed=True,
        nav='pension-fees-calculator.html',
        checks=(('id="feeChart"', 'the chart'),
                ('class="pb-warn"', 'the prescribed warnings'),
                ('ccpc.ie', 'the CCPC cited'),
                ('under the Pensions Act', 'the Standard PRSA maximums sourced'),
                ('class="fee-k-gap"', 'the key for what the charges take')),
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
        # Run 21: held back until compliance has the brief on the score; to
        # re-link, drop this and put back the links listed in STATUS, Run 21
        noindex=True,
        checks=(('id="rdForm"', 'the check'),
                ('not a suitability assessment', 'information only, said on the page')),
    ),
    # Run 20 #7. The threshold for a year, the share of it used, and the
    # lump sum's bands, from assets/js/sft.js, which carries the sources.
    'sft': Page(
        out='standard-fund-threshold.html',
        parts='sft-parts',
        title='The Standard Fund Threshold, Pensionbuddy',
        desc='The Standard Fund Threshold, how much of it your pensions would use, and how a retirement lump sum is taxed. An illustration, not advice.',
        modules=['assets/js/sft.js'],
        keep=['total', 'year', 'lump'],
        floor16=True,
        reviewed=True,
        nav='standard-fund-threshold.html',
        checks=(('id="sftStrip"', 'the year-by-year strip'),
                ('Rules as at 24 September 2026', 'the date the rules were checked'),
                ('Finance Act 2024', 'the statute cited'),
                ('id="sftLim"', 'the limit bar'),
                ('id="sftLb"', 'the lump-sum bar')),
    ),
    # Run 20 #6. A dated summary of the rules that changed for directors, and
    # four questions that list topics to discuss, never a recommendation.
    'director-rules': Page(
        out='director-pension-rules.html',
        parts='director-rules-parts',
        title="Directors' pensions in 2026: what changed, Pensionbuddy",
        desc="What changed for company directors: executive pensions set up before April 2021, and a company's payments into a PRSA. Information, not advice.",
        modules=['assets/js/director-topics.js'],
        keep=[],
        nav='director-pension-rules.html',
        reviewed=True,
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
        nav='my-pensions.html',
        reviewed=True,
        checks=(('id="ptForm"', 'the list'),
                ('id="ptPrint"', 'print or save'),
                ('Nothing you type is sent or stored', 'said on the page')),
    ),
    # Run 23. The proposed Personal Investment Account: a dated guide and the
    # same take-home cost in a pension, the PIA and an ETF. The PIA's rate and
    # threshold are the reader's inputs, never defaults; docs/PIA-BUDGET-DAY.md
    # lists what changes on 6 October 2026. The tax-rate buttons are not a
    # .seg, so they stay out of More options; age and earnings fold into it.
    'pia': Page(
        out='pia.html',
        parts='pia-parts',
        title='The new Personal Investment Account (PIA), Pensionbuddy',
        desc='The proposed Personal Investment Account, and the same take-home cost in a pension, the PIA and an ETF. Not yet law. An illustration, not advice.',
        modules=['assets/js/pension-tax-relief.js', 'assets/js/sft.js', 'assets/js/pia.js'],
        keep=['amount', 'years', 'growth', 'piaRate'],
        floor16=True,
        reviewed=True,
        nav='pia.html',
        checks=(('Proposed · as at 25 September 2026', 'the date the proposal was checked'),
                ('class="pb-warn"', 'the prescribed warnings'),
                ('6 October 2026', 'Budget day named'),
                ('not yet law', 'said to be a proposal'),
                ('id="piaThreshold" inputmode="numeric" autocomplete="off" value=""', 'no threshold filled in'),
                ('id="piaRate" min="0" max="5" step="0.05" value="0"', 'the rate starts at 0%'),
                ('Roadmap for the Taxation of Retail Investment', 'the Roadmap cited')),
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
    if page.noindex:
        head, n = re.subn(r'(<meta name="description" content="[^"]*">\n)',
                          lambda m: m.group(1) + NOINDEX + '\n', head, count=1)
        assert n == 1, 'no description meta to put the robots meta after'

    # Run 21: the skeleton carries the calculators' 16px floor on the text in
    # <main>. The calculator records keep it; the other pages built on the
    # skeleton leave it out, so their text stays as designed.
    if not page.floor16:
        head, n = re.subn(r'/\* FLOOR16:BEGIN.*?FLOOR16:END \*/\n', '', head, count=1, flags=re.S)
        assert n == 1, 'no 16px floor block in the skeleton to leave out'
    assert head.count('</style>') >= 1, 'no stylesheet to extend'
    css = read(os.path.join(page.parts_dir, 'page.css')).strip()
    head = head.replace('</style>', '\n' + css + '\n</style>', 1)

    # Run 34: the fonts are the site's own (the FONTS block in SHARED_CSS);
    # a page needing another face adds it to that block, not a request here.
    assert page.fonts is None, 'no font service to extend: add the face to the FONTS block'

    # The skeleton's active pension calculator link carries aria-current AFTER
    # href, so an exact-string replace never fires. Match on the attributes,
    # not order, and not on the label, which Run 29 changed.
    head, n = re.subn(
        r'<a class="lnk active"(?=[^>]*href="pension-calculator\.html")[^>]*>',
        '<a class="lnk" href="pension-calculator.html">', head, count=1)
    assert n == 1, 'could not un-activate the pension calculator nav item'
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
    # Run 37: the related pages, last in <main> (RELATED, above)
    body = with_related(body, page.out)
    # Run 45: the block after the result, from the part's <!-- AFTER --> line (AFTER, below)
    body = with_after(body, page.out)
    # Run 47: the prescribed warnings, from pagebuild.WARN (below)
    body = with_warn(body)
    if page.reviewed:
        # the last line of the page header, whatever the part put above it
        body, n = re.subn(r'(<div class="phead"><div class="wrap">.*?)(\n</div></div>)',
                          lambda m: m.group(1) + '\n  ' + REVIEWED + m.group(2), body, count=1, flags=re.S)
        assert n == 1, 'no page header to put the review line in'
    # Run 32: the skeleton loads pb-deadline.js straight after its "Tax
    # deadline" row, inside <main>, so the tail it lends carries none. A page
    # whose own <main> has the row loads it there too; every other page gets
    # it at the foot, after the consent script, where it always was.
    if DEADLINE_JS not in body:
        # (after pb-cta.js, Run 45, which stays straight after pb-consent.js)
        consent = re.search(r'<script src="assets/js/pb-consent\.js(?:\?v=[0-9a-f]+)?"></script>\n'
                            r'(?:<script src="assets/js/pb-cta\.js(?:\?v=[0-9a-f]+)?"></script>\n)?', tail)
        assert consent, 'no consent script to put the deadline script after'
        tail = tail[:consent.end()] + '\n<script src="%s"></script>\n' % DEADLINE_JS + tail[consent.end():]
    # Run 34: the search and sharing tags (canonical, Open Graph, Twitter,
    # JSON-LD) are tools/seo.py's, from the page's own title and description
    import seo
    return seo.apply(page.out, stamp_html(head + body + tail))


def check(html, page):
    """Every invariant an assembled page must hold, as (label, ok) pairs."""
    out = []

    def want(ok, label):
        out.append((label, bool(ok)))

    want(OPEN_MAIN in html, 'main landmark')
    want(html.count('FLOOR16:BEGIN') == (1 if page.floor16 else 0),
         'the 16px floor' if page.floor16 else 'no 16px floor')
    want(html.count(NOINDEX) == (1 if page.noindex else 0),
         'held back: noindex' if page.noindex else 'indexable')
    want(html.count(REVIEWED) == (1 if page.reviewed else 0),
         'review line' if page.reviewed else 'no review line')
    want(html.count(TRUST_OPEN) == 1, 'the trust recipe')
    want(html.count(DEADLINE_JS) == 1 and ('id="deadlineText"' not in html or
         html.find('id="deadlineText"') < html.find(DEADLINE_JS) < html.find(CLOSE_MAIN)),
         'the deadline script once, and straight after the row where there is one')
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
# Run 29: blocks of CSS that are the same on every page, last in every
# page's <style>, each a (name, finding kind): the nav's own stylesheet,
# the rules that make everything clickable look clickable, (Run 32) the
# metric-matched fallback for Inter, the motion vocabulary, and how the
# floating chrome gives way, (Run 33) the first screen on a phone, and
# (Run 35) Damian's qualifications and memberships, (Run 37) the related
# pages at the end of a page, (Run 38) media popping in on scroll, and (Run
# 37's item 6, re-applied in Run 39) the long guides' "On this page", its bar
# and their next step, and (Run 37's item 10, built in Run 39) the bar a
# waiting figure shows, and (Run 45) give then ask: the block after a
# calculator's result, the quiet buttons and the phone booking bar, and
# (Run 46) the type weights.
SHARED_CSS = (('NAV', 'nav-css'), ('CLICK', 'click-css'), ('FONTS', 'fonts-css'), ('MOTION', 'motion-css'),
              ('BUDDY', 'buddy-css'), ('FIRSTSCREEN', 'firstscreen-css'), ('QUALS', 'quals-css'),
              ('RELATED', 'related-css'), ('POP', 'pop-css'), ('GUIDE', 'guide-css'),
              ('WAIT', 'wait-css'), ('CTA', 'cta-css'), ('TYPE', 'type-css'))


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


def css_span(text, name):
    """(start, end) of the shared block of CSS called name, from the start
    of its opening comment to the end of the line closing it, or None unless
    both markers occur exactly once, in that order."""
    close = '/* %s:END */\n' % name
    i, j = _once(text, '/* %s:BEGIN' % name), _once(text, close)
    if i is None or j is None or j < i:
        return None
    return i, j + len(close)


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
    (the announce bar and the skip link), regulatory, tokens, and one kind
    per shared block of CSS, byte for byte: nav-css, click-css."""
    out = {}

    def add(page, kind, detail):
        out.setdefault(page, []).append((kind, detail))

    skel = sources.get(skeleton)
    if skel is None or nav_span(skel) is None or foot_top_span(skel) is None:
        add(skeleton, 'structure', 'the skeleton is missing or has no single nav and foot-top block')
        return out
    sn, sf = nav_span(skel), foot_top_span(skel)
    skel_nav = skel[sn[0]:sn[1]]
    skel_css = {}
    for name, kind in SHARED_CSS:
        sc = css_span(skel, name)
        skel_css[name] = skel[sc[0]:sc[1]] if sc else None
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
        for name, kind in SHARED_CSS:
            c = css_span(text, name)
            if skel_css[name] is None or c is None or text[c[0]:c[1]] != skel_css[name]:
                add(page, kind, 'the %s block of CSS is missing or differs from the skeleton\'s' % name)
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
    """{page: new text} for every hand-written page whose nav, foot-top or
    shared blocks of CSS (NAV, CLICK, ...) or the head script (MOTION_HEAD) have
    to change to match the skeleton's. The skeleton and the pages assemble()
    writes are never in the result: pagebuild owns those. The foot-top is
    rewritten only when it differs beyond the whitespace between tags, so a
    page that renders the same is left byte for byte as it is. Raises, before
    anything is written, on a page whose blocks cannot be found."""
    skel = sources[skeleton]
    css = []
    for name, kind in SHARED_CSS:
        sc = css_span(skel, name)
        if sc is None:
            raise ValueError('the skeleton has no single %s block of CSS' % name)
        css.append((name, skel[sc[0]:sc[1]]))
    built = {p.out for p in PAGES.values()}
    out = {}
    for page in sorted(sources):
        if page == skeleton:
            # the skeleton's own head script comes from MOTION_HEAD, not from itself
            if len(HEAD_LINE.findall(sources[page])) != 1:
                raise ValueError('%s has no single motion script after its viewport meta' % page)
            new = HEAD_LINE.sub(lambda m: m.group(1) + MOTION_HEAD, sources[page], count=1)
            new = with_related(new, page)
            new = with_after(new, page)
            new = with_warn(new)
            if new != sources[page]:
                out[page] = new
            continue
        if page in built:
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
        for name, block in css:
            c = css_span(new, name)
            if c is None:
                raise ValueError('%s has no single %s block of CSS' % (page, name))
            if new[c[0]:c[1]] != block:
                new = new[:c[0]] + block + new[c[1]:]
        # Run 32: the head script, MOTION_HEAD, straight after the viewport meta
        heads = HEAD_LINE.findall(new)
        if len(heads) != 1:
            raise ValueError('%s has no single motion script after its viewport meta' % page)
        new = HEAD_LINE.sub(lambda m: m.group(1) + MOTION_HEAD, new, count=1)
        new = with_related(new, page)
        new = with_after(new, page)
        new = with_warn(new)
        if new != text:
            out[page] = new
    return out


# ============================================================================
# RELATED PAGES (Run 37, item 7). The end of every page that has a reader to
# send somewhere offers two or three next pages: one shared component, written
# into each page's markup (so it is there without JavaScript) between two
# comments, by tools/sync-chrome.py for the hand-written pages and by
# assemble() for the built ones; related_drift() is the guard (verify.py and
# tests/build.test.py check 39). Styled by the RELATED block of CSS.
#
# Not on: the home page (it is the map, and ends on its own call), booking and
# the thank-you page (one job each), the 404 (its own six places, item 8), the
# pages held back, and the games.
#
# Every word on a card is already on the site. CARDS says where: a title is
# the page's name in the nav, or in the home page's "Six places to begin"
# where it is one of them; a line is the one beside it there, or the first
# sentence of the page's own description, or, where that sentence carries an
# initialism a page might not have spelled out, a sentence from the page's
# own introduction. Check 39 finds each line on its page, word for word.
# ============================================================================
RELATED = {
    'starter.html': ('pension-calculator.html', 'broker-vs-autoenrolment.html', 'glossary.html'),
    'tracker.html': ('old-pension-checklist.html', 'my-pensions.html', 'pension-fees-calculator.html'),
    'director.html': ('director-calculator.html', 'director-pension-rules.html', 'director-year-end-checklist.html'),
    'pension-calculator.html': ('pension-fees-calculator.html', 'state-pension-reality-check.html', 'broker-vs-autoenrolment.html'),
    'director-calculator.html': ('director-pension-rules.html', 'director-year-end-checklist.html', 'standard-fund-threshold.html'),
    'broker-vs-autoenrolment.html': ('pension-calculator.html', 'starter.html', 'self-employed-pensions.html'),
    'pension-fees-calculator.html': ('my-pensions.html', 'old-pension-checklist.html', 'pension-calculator.html'),
    'my-pensions.html': ('pension-fees-calculator.html', 'old-pension-checklist.html', 'standard-fund-threshold.html'),
    'standard-fund-threshold.html': ('director-pension-rules.html', 'pensions-over-50.html', 'director-calculator.html'),
    'state-pension-reality-check.html': ('state-pension-entitlement.html', 'pension-calculator.html', 'uk-pensions-in-ireland.html'),
    'state-pension-entitlement.html': ('state-pension-reality-check.html', 'pension-calculator.html', 'uk-pensions-in-ireland.html'),
    'pia.html': ('broker-vs-autoenrolment.html', 'glossary.html'),
    'director-pension-rules.html': ('director-year-end-checklist.html', 'standard-fund-threshold.html'),
    'director-year-end-checklist.html': ('director-calculator.html', 'director-pension-rules.html', 'standard-fund-threshold.html'),
    'pensions-over-50.html': ('standard-fund-threshold.html', 'state-pension-reality-check.html', 'glossary.html'),
    'self-employed-pensions.html': ('broker-vs-autoenrolment.html', 'pensions-over-50.html', 'glossary.html'),
    'uk-pensions-in-ireland.html': ('state-pension-entitlement.html', 'old-pension-checklist.html', 'glossary.html'),
    'old-pension-checklist.html': ('tracker.html', 'my-pensions.html', 'pension-fees-calculator.html'),
    'glossary.html': ('pension-calculator.html', 'starter.html', 'pensions-over-50.html'),
    'privacy.html': ('terms.html', 'complaints.html'),
    'terms.html': ('privacy.html', 'complaints.html'),
    'complaints.html': ('terms.html', 'privacy.html'),
}
# page: (title, line, where the line is written, word for word)
CARDS = {
    'pension-calculator.html': ('Pension calculator', 'Pop in a few numbers and watch the projection build, including how much Revenue adds back through tax relief. Two minutes, no sign-up.', 'index.html'),
    'starter.html': ('Start a pension', 'No pension yet, or one you&rsquo;ve never looked at? We&rsquo;ll make starting simple, and it&rsquo;s never too late to begin.', 'index.html'),
    'tracker.html': ('Track down old pensions', 'Changed jobs a few times and lost the thread? We&rsquo;ll find what you&rsquo;ve built up and tell you what it&rsquo;s worth.', 'index.html'),
    'state-pension-reality-check.html': ('State Pension reality check', 'What the State Pension leaves you to find.', 'index.html'),
    'broker-vs-autoenrolment.html': ('Auto-enrolment comparison', 'My Future Fund is the auto-enrolment scheme. The comparison tool shows both, side by side, for your salary and age.', 'index.html'),
    'old-pension-checklist.html': ('The old pension hunt: a checklist', 'Ten steps for tracking down pensions from old jobs in Ireland, and what to ask once you find one.', 'old-pension-checklist.html'),
    'my-pensions.html': ('All your pensions in one view', 'List the pensions you have and see the total, how it is split, and what the annual charges come to in euro a year.', 'my-pensions.html'),
    'pension-fees-calculator.html': ('Pension charges calculator', 'What an annual management charge and a charge on each payment take out of a pension pot by retirement.', 'pension-fees-calculator.html'),
    'director-calculator.html': ('Director calculator', 'See how much your company could contribute to your pension, the corporation tax it could save, and salary versus pension compared.', 'director-calculator.html'),
    'director-pension-rules.html': ('What changed for directors in 2026', 'Here they are in plain English, with four questions to see which of them apply to you.', 'director-pension-rules.html'),
    'director-year-end-checklist.html': ('Year-end pension checklist', 'Nine things for company directors to check before the company&rsquo;s year end and the October tax deadline.', 'director-year-end-checklist.html'),
    'standard-fund-threshold.html': ('The Standard Fund Threshold', 'The Standard Fund Threshold, how much of it your pensions would use, and how a retirement lump sum is taxed.', 'standard-fund-threshold.html'),
    'state-pension-entitlement.html': ('State Pension entitlement check', 'What the State Pension would pay, worked out both ways the Department does until the end of 2033, and which one is paid.', 'state-pension-entitlement.html'),
    'pensions-over-50.html': ('Pensions after 50', 'Three things change as you pass 50: how much of what you pay in gets tax relief, when some pensions can be taken, and the choice of what to do with a pension when you take it.', 'pensions-over-50.html'),
    'self-employed-pensions.html': ('Pensions when you are self-employed', 'Auto-enrolment does not cover the self-employed.', 'self-employed-pensions.html'),
    'uk-pensions-in-ireland.html': ('A UK pension, and living in Ireland', 'Moving a UK pension to Ireland, the 25% Overseas Transfer Charge, the UK State Pension, and how Ireland taxes UK pensions.', 'uk-pensions-in-ireland.html'),
    'glossary.html': ('Pension jargon buster', 'Pensions come with a lot of acronyms. Here&rsquo;s what the common ones actually mean, in normal words.', 'glossary.html'),
    'privacy.html': ('Privacy Notice', 'How Pensionbuddy collects, uses and protects your personal information.', 'privacy.html'),
    'terms.html': ('Terms of Business', 'Who we are, what we do, and how we are paid.', 'terms.html'),
    'complaints.html': ('Complaints', 'How to make a complaint to Pensionbuddy and your right to the Financial Services and Pensions Ombudsman.', 'complaints.html'),
}
RELATED_OPEN = '<!-- RELATED:BEGIN'
RELATED_CLOSE = '<!-- RELATED:END -->\n'


def related_block(page):
    """The block for page, or '' for a page that carries none."""
    if page not in RELATED:
        return ''
    missing = [t for t in RELATED[page] if t not in CARDS]
    if missing:
        raise ValueError('no card in CARDS for %s' % ', '.join(missing))
    cards = ''.join(
        '    <li><a class="pb-related-card pb-card-link" href="%s"><span class="pb-related-t">%s</span>'
        '<span class="pb-related-d">%s</span></a></li>\n' % (t, CARDS[t][0], CARDS[t][1]) for t in RELATED[page])
    return ('<!-- RELATED:BEGIN (Run 37: tools/pagebuild.py RELATED writes this; edit the table there) -->\n'
            '<section class="pb-related" aria-labelledby="pbRelatedH"><div class="wrap">\n'
            '  <p class="pb-related-h" id="pbRelatedH">Related pages</p>\n'
            '  <ul class="pb-related-list">\n' + cards +
            '  </ul>\n</div></section>\n' + RELATED_CLOSE)


def related_span(text):
    """(start, end) of the block, None when absent; raises on a broken one."""
    i, j = text.find(RELATED_OPEN), text.find(RELATED_CLOSE)
    if i < 0 and j < 0:
        return None
    if _once(text, RELATED_OPEN) is None or _once(text, RELATED_CLOSE) is None or j < i:
        raise ValueError('a broken RELATED block')
    return i, j + len(RELATED_CLOSE)


def with_related(text, page):
    """text with the page's block in place: replaced where it is, or put last
    in <main>, before its closing tag."""
    want = related_block(page)
    span = related_span(text)
    if span:
        return text[:span[0]] + want + text[span[1]:]
    if not want:
        return text
    k = text.rindex(CLOSE_MAIN)
    return text[:k] + want + text[k:]


def related_drift(sources):
    """{page: [(kind, detail)]} where a page's block is not the table's."""
    out = {}
    for page, text in sources.items():
        try:
            span = related_span(text)
            want = related_block(page)
        except ValueError as e:
            out[page] = [('related', str(e))]
            continue
        have = text[span[0]:span[1]] if span else ''
        if have != want:
            out[page] = [('related', 'the related pages are not the table\'s: run tools/sync-chrome.py and tools/pagebuild.py')]
        elif span and text.find(CLOSE_MAIN, span[1]) < 0:
            out[page] = [('related', 'the related pages are outside <main>')]
    return out


# ============================================================================
# THE PRESCRIBED WARNINGS (Run 47). The two warnings Regulations 372 and 392
# prescribe, word for word (docs/COMPLIANCE-PACK.md question 1.4 and section
# 6.1: the Regulations' own words, which need no sign-off as copy), defined
# here once. Every box on the site is written from WARN between two comments
# on one line, <!-- WARN:BEGIN --> and <!-- WARN:END -->: by assemble() in
# the built pages (from their parts) and by tools/sync-chrome.py in the
# hand-written ones (the pension and director calculators, the starter
# page). warn_drift() is the guard (verify.py and tests/build.test.py check
# 53): each page in WARN_PAGES carries exactly that many boxes, each exactly
# WARN, and no other page carries one. The box keeps class pb-warn, so the
# copy editor keeps it locked (tools/edit-server.py) and the styling (boxed,
# bold, directly under the projected figures) is each page's own, as before.
# ============================================================================
WARN = ('<div class="pb-warn"><p><b>Warning: These figures are estimates only. They are not a reliable guide '
        'to the future performance of your investment.</b></p><p><b>Warning: The value of your investment may '
        'go down as well as up.</b></p></div>')
WARN_OPEN, WARN_CLOSE = '<!-- WARN:BEGIN (pagebuild.WARN) -->', '<!-- WARN:END -->'
WARN_PAT = re.compile(re.escape(WARN_OPEN) + r'(.*?)' + re.escape(WARN_CLOSE))
# every page with projected figures, and how many boxes it shows them under
WARN_PAGES = {
    'pension-calculator.html': 1,       # the projected pot
    'director-calculator.html': 1,      # the projected pot
    'broker-vs-autoenrolment.html': 2,  # "Everything paid in, by 66", once in each mode
    'pension-fees-calculator.html': 1,  # the pot with and without the charges
    'pia.html': 1,                      # the three take-home figures
    'starter.html': 3,                  # the cost-of-waiting chart and the two growth charts
}


def with_warn(text):
    """text with every WARN block holding WARN, byte for byte."""
    return WARN_PAT.sub(lambda m: WARN_OPEN + WARN + WARN_CLOSE, text)


def warn_drift(sources):
    """{page: [('warn', detail)]} where a page's boxes are not WARN's."""
    out = {}
    for page, text in sources.items():
        blocks = WARN_PAT.findall(text)
        boxes = text.count('class="pb-warn"')
        fs = []
        if len(blocks) != WARN_PAGES.get(page, 0):
            fs.append('%d prescribed-warning block(s), want %d' % (len(blocks), WARN_PAGES.get(page, 0)))
        if any(b != WARN for b in blocks):
            fs.append('a warning differs from pagebuild.WARN: run tools/sync-chrome.py and tools/pagebuild.py')
        if boxes != len(blocks):
            fs.append('a pb-warn box outside the WARN comments')
        if fs:
            out[page] = [('warn', f) for f in fs]
    return out


# ============================================================================
# AFTER THE RESULT (Run 45, give then ask). Under each calculator's result,
# one shared component, written into the page's markup between two comments
# so that it is there without JavaScript: by assemble() for the built pages,
# in place of the <!-- AFTER --> line in their part, and by
# tools/sync-chrome.py for the two hand-written calculators. after_drift() is
# the guard (verify.py and tests/build.test.py check 49). Styled by the CTA
# block of CSS; assets/js/pb-after.js and assets/js/pb-cta.js make it work.
#
# In this order: what the page does not show (its own words, a caveat, Run
# 43); then one block: the booking button, wording A here (pb-cta.js shows
# half the visitors wording B), and under it AFTER_WHY; then, on a page that
# sends anything at all, "Email me this result", a small link that opens a
# form: name, email, a box to tick (never ticked for the reader) and one line
# saying what is stored, why and where it goes. The result above stays on
# screen whether or not the form is used, and nothing is sent until it is.
# Without JavaScript the link and the form stay hidden (a form that cannot
# carry the figures would be a promise this page cannot keep); the button
# and its line do not.
#
# my-pensions says nothing typed leaves the page, so it has no form. The
# directors' rules page has no "doesn't show" line: its list already says
# "Topics to discuss, not advice."
# ============================================================================
AFTER = {  # page: (its name for #from= and the events, what it does not show or None, the email offer)
    'pension-calculator.html': ('pension-calculator', 'product charges, inflation, the tax on your income when you draw it.', True),
    'director-calculator.html': ('director-calculator', 'your company&rsquo;s exact funding limit, product charges, inflation.', True),
    'broker-vs-autoenrolment.html': ('broker-vs-autoenrolment', 'your old pensions, product charges, your employer&rsquo;s own scheme.', True),
    'pension-fees-calculator.html': ('pension-fees-calculator', 'policy, set-up and exit charges, the terms an older plan may carry, your tax relief.', True),
    'state-pension-reality-check.html': ('state-pension-reality-check', 'your old pensions, your tax position, your employer&rsquo;s scheme.', True),
    'state-pension-entitlement.html': ('state-pension-entitlement', 'your old pensions, your tax position, your employer&rsquo;s scheme.', True),
    'standard-fund-threshold.html': ('standard-fund-threshold', 'what your pensions are worth, your tax position, a Personal Fund Threshold you may hold.', True),
    'pia.html': ('pia', 'your old pensions, fees and charges, your employer&rsquo;s scheme.', True),
    'my-pensions.html': ('my-pensions', 'what your pensions could grow to, your tax position, the terms each one carries.', False),
    'director-pension-rules.html': ('director-pension-rules', None, True),
}
AFTER_WORDS = 'Book a free 20-minute call with Damian'   # wording A; pb-cta.js holds both
AFTER_WHY = 'Free. No obligation. No pressure.'
AFTER_OPEN = '<!-- AFTER:BEGIN'
AFTER_CLOSE = '<!-- AFTER:END -->'
AFTER_SLOT = '<!-- AFTER -->'
_ARROW = ('<svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/>'
          '<polyline points="12 5 19 12 12 19"/></svg>')
_TICK = '<svg class="ico pb-ok-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'
# the fields the shared form declares, in order: Netlify stores only these
AFTER_FIELDS = ('form-name', 'results', 'inputs', 'link', 'page', 'bot-field', 'name', 'email', 'consent')


def after_block(page, indent='    '):
    """The block for page, each line indented by indent, or '' for a page
    that carries none."""
    if page not in AFTER:
        return ''
    calc, not_line, mail = AFTER[page]
    lines = ['<!-- AFTER:BEGIN (Run 45: tools/pagebuild.py after_block() writes this; edit it there) -->']
    if not_line:
        lines.append('<p class="pb-after-not pb-caveat" id="pbAfterNot">What this doesn&rsquo;t show: %s</p>' % not_line)
    lines += [
        '<div class="pb-after" id="pbAfter" data-pb-from="%s">' % calc,
        '  <a class="btn btn-primary pb-after-btn" href="booking.html" data-pb-cta="after" data-pb-ab="cta">'
        '<span class="pb-ab-t">%s</span> %s</a>' % (AFTER_WORDS, _ARROW),
        '  <p class="pb-after-why">%s</p>' % AFTER_WHY,
    ]
    if mail:
        lines += [
            '  <button type="button" class="pb-after-more" id="ecMore" aria-expanded="false" aria-controls="ecCap" hidden>Email me this result</button>',
            '  <div class="pb-after-mail" id="ecCap" hidden>',
            '    <form id="ecForm" name="calculator-results" method="POST" data-netlify="true" netlify-honeypot="bot-field" novalidate>',
            '      <input type="hidden" name="form-name" value="calculator-results"><input type="hidden" name="results">'
            '<input type="hidden" name="inputs"><input type="hidden" name="link"><input type="hidden" name="page">',
            '      <p class="pb-hp" hidden><label>Leave this field empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>',
            '      <div class="pb-mail-fields">',
            '        <p class="pb-mail-f"><label for="ecName">Your name</label>'
            '<input type="text" id="ecName" name="name" autocomplete="name" aria-describedby="ecErr"></p>',
            '        <p class="pb-mail-f"><label for="ecEmail">Your email</label>'
            '<input type="email" id="ecEmail" name="email" autocomplete="email" inputmode="email" aria-describedby="ecErr"></p>',
            '      </div>',
            '      <label class="pb-mail-ok"><input type="checkbox" id="ecConsent" name="consent" value="yes" aria-describedby="ecWhy">'
            '<span>Yes, email me this result. It is sent to me automatically when I tick this box and send.</span></label>',
            '      <p class="pb-mail-why" id="ecWhy">We use your name, email and these figures only to email you this result. '
            'Netlify, our website host, stores them; Resend, our email service, sends the email. <a href="privacy.html">Privacy Notice</a></p>',
            '      <p class="pb-mail-err" id="ecErr" role="alert" hidden></p>',
            '      <button class="btn btn-ghost pb-mail-send" type="submit">Email me this result</button>',
            '    </form>',
            '    <p class="pb-mail-done" id="ecOk" role="status" tabindex="-1" hidden>%s<span id="ecOkText">Thanks. Because you ticked the box, '
            'this result is emailed to you automatically.</span></p>' % _TICK,
            '  </div>',
        ]
    lines += ['</div>', AFTER_CLOSE]
    return ''.join(indent + l + '\n' for l in lines)


def after_span(text):
    """(start, end, indent) of the block, whole lines, None when absent;
    raises on a broken one."""
    i, j = text.find(AFTER_OPEN), text.find(AFTER_CLOSE)
    if i < 0 and j < 0:
        return None
    if _once(text, AFTER_OPEN) is None or _once(text, AFTER_CLOSE) is None or j < i:
        raise ValueError('a broken AFTER block')
    start = text.rfind('\n', 0, i) + 1
    end = text.find('\n', j)
    end = len(text) if end < 0 else end + 1
    if text[start:i].strip():
        raise ValueError('the AFTER block does not start a line')
    return start, end, text[start:i]


def with_after(text, page):
    """text with the page's block in place: rewritten where it is, or in
    place of the part's <!-- AFTER --> line. A page outside AFTER must carry
    neither."""
    span = after_span(text)
    if page not in AFTER:
        if span or AFTER_SLOT in text:
            raise ValueError('%s carries the block after a result but is not in pagebuild.AFTER' % page)
        return text
    if span:
        s, e, ind = span
        return text[:s] + after_block(page, ind) + text[e:]
    k = _once(text, AFTER_SLOT)
    if k is None:
        raise ValueError('%s has no single %s line for the block after its result' % (page, AFTER_SLOT))
    s = text.rfind('\n', 0, k) + 1
    e = text.find('\n', k)
    e = len(text) if e < 0 else e + 1
    if text[s:k].strip() or text[k + len(AFTER_SLOT):e].strip():
        raise ValueError('%s: the %s line holds something else too' % (page, AFTER_SLOT))
    return text[:s] + after_block(page, text[s:k]) + text[e:]


def after_drift(sources):
    """{page: [('after', detail)]} where a page's block is not the table's."""
    out = {}
    for page, text in sources.items():
        try:
            span = after_span(text)
        except ValueError as e:
            out[page] = [('after', str(e))]
            continue
        if page not in AFTER:
            if span:
                out[page] = [('after', 'carries the block after a result but is not in pagebuild.AFTER')]
            continue
        if not span:
            out[page] = [('after', 'the block after the result is missing: run tools/sync-chrome.py and tools/pagebuild.py')]
            continue
        s, e, ind = span
        if text[s:e] != after_block(page, ind):
            out[page] = [('after', 'the block after the result is not after_block()\'s: run tools/sync-chrome.py and tools/pagebuild.py')]
        elif text.rfind(OPEN_MAIN, 0, s) < 0 or text.find(CLOSE_MAIN, e) < 0:
            out[page] = [('after', 'the block after the result is outside <main>')]
    return out


# ============================================================================
# THE TRUST COMPONENTS (Run 26). The review line on exactly the pages that
# should carry it and on no other; every .pb-reviewed and .pb-why written as
# the one string at the top of this file; and the TRUST block of CSS on every
# page, byte for byte the skeleton's. Like chrome_drift(), it never raises:
# {page: [(kind, detail)]}, and a clean tree is {}.
# ============================================================================
def reviewed_pages():
    return REVIEWED_BY_HAND + tuple(sorted(p.out for p in PAGES.values() if p.reviewed))


def trust_block(text):
    at = text.find(TRUST_OPEN)
    end = text.find(TRUST_CLOSE, at) if at >= 0 else -1
    return text[at:end + len(TRUST_CLOSE)] if end >= 0 else None


def trust_drift(sources, skeleton=os.path.basename(SKELETON)):
    want = trust_block(sources.get(skeleton, ''))
    carry = set(reviewed_pages())
    out = {}
    for name, text in sorted(sources.items()):
        fs = []
        if want is None or text.count(TRUST_OPEN) != 1 or trust_block(text) != want:
            fs.append(('trust-css', "the TRUST block is missing or differs from the skeleton's"))
        n = text.count(REVIEWED)
        if n != (1 if name in carry else 0):
            fs.append(('reviewed', 'the review line appears %d time(s), %s' % (n, 'want 1' if name in carry else 'want none')))
        if text.count('class="pb-reviewed') != n:
            fs.append(('reviewed', 'a review line is not pagebuild.REVIEWED'))
        if text.count('class="pb-why"') != text.count(REASON):
            fs.append(('reason', 'a reason line is not pagebuild.REASON'))
        if fs:
            out[name] = fs
    return out



# ============================================================================
# CAVEATS (Run 32, part 1a of docs/UX-MOTION-AUDIT.md). Every warning,
# disclaimer, source line, "as at" date, assumption and regulatory line is
# furniture: never revealed, delayed, faded or moved, and never inside
# anything that is. This is the one list: the caveat inventory's selector
# column. A caveat is an element with one of CAVEAT_CLASSES, one of
# CAVEAT_IDS, or a class of CAVEAT_WITHIN inside its named ancestor; new
# caveats can simply carry .pb-caveat. caveat_drift() is the static guard
# (verify.py, tests/build.test.py check 20); tests/regulator-lines.test.py
# --caveats watches them frame by frame in Chrome. Like chrome_drift() it never raises.
# ============================================================================
CAVEAT_CLASSES = ('pb-caveat', 'announce', 'pb-reg', 'pb-reviewed', 'pb-warn', 'infoadvice', 'assume',
                  'disclosure', 'pb-src', 'srcnote', 'gap-note', 'hc-note', 'qnote', 'sft-note',
                  'pb-product-cap', 'tk-who', 'pb-life-note', 'pb-sa-note', 'pb-lad-note', 'pb-my-note',
                  'pia-note', 'dr-src', 'pt-note', 'ec-note', 'pia-asat', 'sft-asat', 'dr-asat')
# (the legal notices' whole text, and thank-you's two "Illustration only."
# tool cards, carry .pb-caveat: .legal and .assure .ad also dress guides and
# plain card copy, which are not caveats)
CAVEAT_WITHIN = (('res-hero', 'foot'), ('legal', 'updated'), ('legal', 'ck-note'), ('legal', 'callbox'),
                 ('max-card', 'mnote'))
CAVEAT_IDS = ('mScale', 'mWhy', 'm1Cap')
# elements a CAVEAT_WITHIN pair would catch that are not caveats, as (the
# calculator's data-pb-calc, the id): the State Pension reality check's #spFoot
# is its result in words ("... 75% of a full record, so the rate is 75% of the
# maximum"), which its guess card blurs because it gives the answer away; as a
# caveat, rule 2's filter:none!important un-blurred it (the pre-merge review,
# Run 32). The entitlement check's own #spFoot, the basis its figure is worked
# out on, stays a caveat.
CAVEAT_NOT = (('state-pension-reality-check', 'spFoot'),)
_VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
_HELD = re.compile(r'transition-delay|animation(?:-name)?\s*:\s*(?!none\b)|opacity\s*:\s*0(?:\.0*)?\s*(?:!\s*important\s*)?(?:;|$)')


def caveat_selector():
    """The same list as one CSS selector, for the MOTION block's rule 2."""
    nots = ''.join(':not([data-pb-calc="%s"] #%s)' % n for n in CAVEAT_NOT)
    return ','.join(['.' + c for c in CAVEAT_CLASSES] +
                    ['.%s .%s%s' % (a, c, nots if a == 'res-hero' else '') for a, c in CAVEAT_WITHIN] +
                    ['#' + i for i in CAVEAT_IDS])


# Run 32: the one script in <head>, directly after the viewport meta and
# before any stylesheet, on every page, byte for byte (tests/build.test.py
# check 22; sync_blocks() writes it into the hand-written pages). Part 2a put
# a line here that set html.pb-motion; since the Lighthouse follow-up it is
# the whole motion runtime, and assets/js/pb-motion.js is gone: one request
# fewer before the first paint. It
#  - sets html.pb-js, so the markup a reader without JavaScript gets (the nav
#    chip's date, .nt-off) can step aside for the live one before any paint;
#  - sets html.pb-motion before anything paints, only when motion is allowed,
#    and keeps it true while the page is open: a reader who turns on reduced
#    motion gets it at once (html.pb-motion and html.pb-smooth come off, and
#    the 'pb:motion' event says so, detail {motion: false});
#  - adds html.pb-smooth once the page has loaded (the MOTION block makes it
#    scroll-behavior:smooth), so arrival is instant and in-page taps glide;
#  - starts the scripts a page marks type="text/pb-late" (Ask Buddy's) once
#    the first frame after DOMContentLoaded has painted, or 200ms after it
#    where no frame comes, so the first paint never waits for them;
#  - gives window.PBMotion: on(), whether motion is allowed now, and CAVEATS,
#    the caveat list as a selector, made here from caveat_selector() so the
#    floating chrome (pb-buddy.js, pb-bookbar.js) and the MOTION block's
#    rule 2 read one list.
MOTION_HEAD = (
    "<script>(function(){var r=document.documentElement,q=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;"
    "r.classList.add('pb-js');"
    "function ok(){return !(q&&q.matches)&&'IntersectionObserver' in window;}"
    "if(ok())r.classList.add('pb-motion');"
    "function sync(){var on=ok();r.classList.toggle('pb-motion',on);if(!on)r.classList.remove('pb-smooth');"
    "try{document.dispatchEvent(new CustomEvent('pb:motion',{detail:{motion:on}}));}catch(e){}}"
    "if(q){if(q.addEventListener)q.addEventListener('change',sync);else if(q.addListener)q.addListener(sync);}"
    "addEventListener('load',function(){setTimeout(function(){if(!(q&&q.matches))r.classList.add('pb-smooth');},0);});"
    "var late=0;function go(){if(late)return;late=1;[].forEach.call(document.querySelectorAll('script[type=\"text/pb-late\"]'),function(o){"
    "var n=document.createElement('script');[].forEach.call(o.attributes,function(a){if(a.name!=='type')n.setAttribute(a.name,a.value);});"
    "o.parentNode.replaceChild(n,o);});}"
    "document.addEventListener('DOMContentLoaded',function(){r.classList.add('pb-ready','pb-readying');setTimeout(function(){r.classList.remove('pb-readying');},100);if(window.requestAnimationFrame)requestAnimationFrame(function(){setTimeout(go,0);});setTimeout(go,200);});"
    "window.PBMotion={on:function(){return r.classList.contains('pb-motion');},CAVEATS:" + json.dumps(caveat_selector()) + "};})();</script>")
HEAD_LINE = re.compile(r'(<meta name="viewport" content="width=device-width, initial-scale=1\.0">\n)<script>[^\n]*pb-motion[^\n]*</script>')


def caveat_elements(text):
    """[(caveat, chain)] for every caveat in text: each item a dict with the
    start tag's offset, raw text, tag, classes, id and style, and chain its
    ancestors outermost first (the same dicts). Script and style skipped."""
    from html.parser import HTMLParser
    starts = [0]
    for line in text.split('\n'):
        starts.append(starts[-1] + len(line) + 1)
    found = []

    class P(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.stack = []

        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            line, col = self.getpos()
            el = {'at': starts[line - 1] + col, 'raw': self.get_starttag_text(), 'tag': tag,
                  'cls': (a.get('class') or '').split(), 'id': a.get('id') or '', 'style': a.get('style') or '',
                  'calc': a.get('data-pb-calc') or ''}
            if tag in _VOID:
                return
            anc = [c for x in self.stack for c in x['cls']]
            if (any(c in CAVEAT_CLASSES for c in el['cls']) or el['id'] in CAVEAT_IDS or
                    (not any((x['calc'], el['id']) in CAVEAT_NOT for x in self.stack) and
                     any(c == cls and a2 in anc for a2, cls in CAVEAT_WITHIN for c in el['cls']))):
                found.append((el, list(self.stack)))
            if tag not in ('script', 'style'):
                self.stack.append(el)

        def handle_endtag(self, tag):
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i]['tag'] == tag:
                    del self.stack[i:]
                    break

    P().feed(text)
    return found


def caveat_drift(sources):
    """{page: [('caveat', detail)]} for every caveat that is, or sits under,
    a .reveal or anything with an inline delay, animation or zero opacity."""
    out = {}
    for name, text in sorted(sources.items()):
        fs = []
        for el, chain in caveat_elements(text):
            bad = [x for x in chain + [el] if 'reveal' in x['cls'] or _HELD.search(x['style'])]
            if bad:
                what = '.'.join([el['tag']] + el['cls'][:2]) + (('#' + el['id']) if el['id'] else '')
                fs.append(('caveat', '%s is under %s' % (what, ', '.join(
                    '.'.join([b['tag']] + b['cls'][:2]) for b in bad))))
        if fs:
            out[name] = fs
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
