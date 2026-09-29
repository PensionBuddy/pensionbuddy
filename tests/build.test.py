#!/usr/bin/env python3
"""Acceptance tests for the built pages, the assembly that produces them, and
the shared chrome every page takes from the skeleton.

    python3 tests/build.test.py

The three calculator pages are not written by hand: each is assembled by
tools/pagebuild.py from pension-calculator.html's skeleton plus its own parts.
These tests assert the invariants that assembly must hold, against the pages
as they actually ship, so a page that is broken in the repository fails here
whether or not the build has been re-run.

Same report as the JavaScript suites, from tests/harness.py: one line per
assertion, ALL PASS or FAILURES at the end, exit 0 or 1.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
sys.path.insert(0, os.path.join(ROOT, 'tests'))

import pagebuild  # noqa: E402
from harness import eq, report  # noqa: E402


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def all_sources():
    """Every html page at the root that git tracks, as {filename: text}."""
    import subprocess
    ls = subprocess.run(['git', 'ls-files', '*.html'], cwd=ROOT, capture_output=True, text=True)
    return {n: read(n) for n in ls.stdout.split('\n') if n.endswith('.html') and '/' not in n}


def read_at(root, name):
    with open(os.path.join(root, name), encoding='utf-8') as f:
        return f.read()


def findings(drift):
    return sorted((page, kind) for page, fs in drift.items() for kind, _ in fs)


def run():
    pages = [(name, pagebuild.PAGES[name]) for name in sorted(pagebuild.PAGES)]

    # ------------------------------------------------------------------ 1
    # Exactly one main landmark, opened once and closed once. A second
    # </main> closes nothing and leaves every following element outside the
    # landmark, which breaks the skip link and assistive-technology
    # navigation on a page that still looks correct. This is what the old
    # asymmetric slot produced, and broker-vs-autoenrolment.html shipped
    # with it.
    for name, page in pages:
        html = read(page.out)
        eq('1. %s opens <main> once' % page.out, len(re.findall(r'<main\b', html)), 1)
        eq('1. %s closes </main> once' % page.out, html.count('</main>'), 1)

    # ------------------------------------------------------------------ 2
    # The calculation modules load in the declared order, each exactly once,
    # and the page's own script comes after all of them. state-pension.js
    # must precede state-pension-entitlement.js, which throws at load
    # without it, and both must precede the page script that calls them.
    for name, page in pages:
        html = read(page.out)
        where = []
        for rel in page.modules:
            marker = '<script src="%s?v=' % rel
            eq('2. %s loads %s once' % (page.out, os.path.basename(rel)),
               html.count(marker), 1)
            where.append(html.find(marker))
        eq('2. %s loads its modules in order' % page.out,
           where, sorted(where))
        after_last = html.index('</script>', max(where)) + len('</script>')
        eq('2. %s puts its page script after the modules' % page.out,
           html[after_last:after_last + 10], '\n<script>\n')

    # ------------------------------------------------------------------ 3
    # No em dash. The house style uses commas and full stops; an em dash
    # reaching a page means copy arrived from somewhere that was not edited
    # to it.
    for name, page in pages:
        html = read(page.out)
        eq('3. %s has no em dash' % page.out, html.count('—'), 0)
        eq('3. %s has no em dash entity' % page.out, html.count('&mdash;'), 0)

    # ------------------------------------------------------------------ 4
    # Every local image URL carries its content hash. Stamping happens
    # inside assembly, so a page is complete when it is written: before
    # this, a rebuild silently dropped the stamps until stamp-images.py was
    # run by hand, and a replaced photo went on showing the old bytes.
    for name, page in pages:
        html = read(page.out)
        unstamped = sorted({m.group(1) for m in pagebuild.IMG_PAT.finditer(html) if not m.group(2)})
        eq('4. %s stamps every image reference' % page.out, unstamped, [])

    # ------------------------------------------------------------------ 5
    # The page that ships is the page the parts currently produce. This
    # fails if a built page was edited by hand instead of its part, or if a
    # part changed and the build was not re-run. It is the test that makes
    # the parts, not the artefacts, the source of truth.
    for name, page in pages:
        eq('5. %s is what its parts assemble to' % page.out,
           pagebuild.assemble(page) == read(page.out), True)

    # ------------------------------------------------------------------ 6
    # Assembly is deterministic: same sources, same bytes. A build that
    # varied run to run would make finding 5 unusable as a drift guard.
    for name, page in pages:
        eq('6. %s assembles identically twice' % page.out,
           pagebuild.assemble(page) == pagebuild.assemble(page), True)

    # ------------------------------------------------------------------ 7
    # Every invariant pagebuild enforces at build time still holds on the
    # page as it sits in the repository, not only at the moment it was
    # written.
    for name, page in pages:
        bad = [label for label, ok in pagebuild.check(read(page.out), page) if not ok]
        eq('7. %s passes every build check' % page.out, bad, [])

    # ------------------------------------------------------------------ 8
    # The shared chrome, nav and footer link columns, is the skeleton's on
    # every page. The same claim as check 5, for the source the other
    # fifteen pages share. chrome_drift() takes {filename: text}, so every
    # mutant below is a dict with one string changed, and each is a permanent
    # assertion that the guard can see that particular mistake rather than a
    # demonstration in a transcript.
    sources = all_sources()
    eq('8. the shared chrome matches the skeleton on every page', findings(pagebuild.chrome_drift(sources)), [])
    skel_nav = pagebuild.chrome_for(sources['pension-calculator.html'], 'terms.html')[0]
    # Run 29: the dropdowns put every page a reader can reach in the nav, so
    # every one of them marks itself; the three held pages stay out of it
    eq('8. the pages that mark themselves current are derived from the nav, and are these nineteen',
       sorted(pagebuild.nav_targets(skel_nav)),
       ['broker-vs-autoenrolment.html', 'director-calculator.html', 'director-pension-rules.html',
        'director-year-end-checklist.html', 'director.html', 'glossary.html', 'my-pensions.html',
        'old-pension-checklist.html', 'pension-calculator.html', 'pension-fees-calculator.html',
        'pensions-over-50.html', 'pia.html', 'self-employed-pensions.html', 'standard-fund-threshold.html',
        'starter.html', 'state-pension-entitlement.html', 'state-pension-reality-check.html', 'tracker.html',
        'uk-pensions-in-ireland.html'])
    eq('8. and none of them is a held page',
       sorted(pagebuild.nav_targets(skel_nav) &
              ({p.out for p in pagebuild.PAGES.values() if p.noindex} | {'how-we-work.html'})), [])

    # ------------------------------------------------------------------ 9
    # Mutants. Each is caught as the kind named, on the page mutated. The two
    # that a guard comparing only hrefs would miss are the relabel and the
    # heading; the marker ones are what neutralising the marker for the block
    # comparison would otherwise let through.
    def nav_only(page, find, repl):
        text = sources[page]
        i, j = pagebuild.nav_span(text)
        assert find in text[i:j], '%s: %r not in its nav' % (page, find)
        return text[:i] + text[i:j].replace(find, repl, 1) + text[j:]

    def foot_only(page, find, repl):
        text = sources[page]
        i, j = pagebuild.foot_top_span(text)
        assert find in text[i:j], '%s: %r not in its foot-top' % (page, find)
        return text[:i] + text[i:j].replace(find, repl, 1) + text[j:]

    def after(page, marker, find, repl):
        text = sources[page]
        i = text.index(marker)
        assert find in text[i:], '%s: %r not after %r' % (page, find, marker)
        return text[:i] + text[i:].replace(find, repl, 1)

    MUTANTS = [
        ('an extra nav item', 'terms.html', 'nav',
         nav_only('terms.html', '<li><a class="lnk" href="glossary.html">Pension jargon buster</a></li>',
                  '<li><a class="lnk" href="glossary.html">Pension jargon buster</a></li>\n        <li><a class="lnk" href="glossary.html#tax-relief">Tax relief</a></li>')),
        ('a relabelled nav item', 'privacy.html', 'nav',
         nav_only('privacy.html', '>Pension jargon buster</a>', '>Jargon</a>')),
        ('a dropdown relabelled', 'complaints.html', 'nav',
         nav_only('complaints.html', '>Guides<svg', '>Reading<svg')),
        ('the current marker on the wrong item', 'tracker.html', 'active',
         nav_only('tracker.html', '<a class="lnk active" href="tracker.html" aria-current="page">Find a pension</a>',
                  '<a class="lnk" href="tracker.html">Find a pension</a>').replace(
             '<a class="lnk" href="glossary.html">Pension jargon buster</a>',
             '<a class="lnk active" href="glossary.html" aria-current="page">Pension jargon buster</a>', 1)),
        ('aria-current dropped from the current item', 'director.html', 'active-markup',
         nav_only('director.html', ' aria-current="page"', '')),
        ('the active class dropped but aria-current kept', 'starter.html', 'active-markup',
         nav_only('starter.html', 'class="lnk active" href="starter.html"', 'class="lnk" href="starter.html"')),
        ('the home page nav reverting to absolute anchors', 'index.html', 'nav',
         nav_only('index.html', 'href="#story"', 'href="index.html#story"')),
        ('two footer links swapped', 'booking.html', 'foot-top',
         foot_only('booking.html', '<a href="tracker.html">Track old pensions</a><a href="starter.html">Start a pension</a>',
                   '<a href="starter.html">Start a pension</a><a href="tracker.html">Track old pensions</a>')),
        ('a footer column heading changed', '404.html', 'foot-top',
         foot_only('404.html', '<h2>Tools</h2>', '<h2>Calculators</h2>')),
        ('the Central Bank sentence changed', 'complaints.html', 'regulatory',
         after('complaints.html', '<div class="disclosure">', 'regulated by the Central Bank of Ireland', 'regulated in Ireland')),
        ('a design token changed', 'glossary.html', 'tokens',
         sources['glossary.html'].replace('--teal:#0C8175', '--teal:#0C8176', 1)),
        ('the announce bar changed', 'tracker.html', 'banner',
         sources['tracker.html'].replace('<b>Free</b> first consultation', 'Free first consultation', 1)),
        ('the NAV block of CSS changed', 'pensions-over-50.html', 'nav-css',
         after('pensions-over-50.html', '/* NAV:BEGIN', 'font-size:17px;font-weight:600', 'font-size:15px;font-weight:600')),
        ('the NAV block of CSS missing', 'uk-pensions-in-ireland.html', 'nav-css',
         sources['uk-pensions-in-ireland.html'].replace('/* NAV:BEGIN', '/* NAV-BEGIN', 1)),
        ('the CLICK block of CSS changed', 'director.html', 'click-css',
         after('director.html', '/* CLICK:BEGIN', 'text-underline-offset:3px', 'text-underline-offset:1px')),
        ('the CLICK block of CSS missing', 'booking.html', 'click-css',
         sources['booking.html'].replace('/* CLICK:END */', '/* CLICK-END */', 1)),
        ('the FONTS block of CSS changed', 'terms.html', 'fonts-css',
         after('terms.html', '/* FONTS:BEGIN', 'size-adjust:103.7%', 'size-adjust:110.0%')),
        ('the FONTS block of CSS missing', 'glossary.html', 'fonts-css',
         sources['glossary.html'].replace('/* FONTS:END */', '/* FONTS-END */', 1)),
        ('the MOTION block of CSS changed', 'privacy.html', 'motion-css',
         after('privacy.html', '/* MOTION:BEGIN', '--pb-d-2:200ms', '--pb-d-2:250ms')),
        ('the MOTION block of CSS missing', 'starter.html', 'motion-css',
         sources['starter.html'].replace('/* MOTION:END */', '/* MOTION-END */', 1)),
        ('the BUDDY block of CSS changed', 'how-we-work.html', 'buddy-css',
         after('how-we-work.html', '/* BUDDY:BEGIN', 'direction:rtl;flex-direction:row-reverse', 'flex-direction:row')),
        ('the BUDDY block of CSS missing', 'pia.html', 'buddy-css',
         sources['pia.html'].replace('/* BUDDY:END */', '/* BUDDY-END */', 1)),
        ('the FIRSTSCREEN block of CSS changed', 'glossary.html', 'firstscreen-css',
         after('glossary.html', '/* FIRSTSCREEN:BEGIN', '.pb-hero-copy > .pb-reg-top{display:flex}', '.pb-hero-copy > .pb-reg-top{display:block}')),
        ('the FIRSTSCREEN block of CSS missing', 'booking.html', 'firstscreen-css',
         sources['booking.html'].replace('/* FIRSTSCREEN:END */', '/* FIRSTSCREEN-END */', 1)),
        ('a second nav', 'thank-you.html', 'structure',
         sources['thank-you.html'].replace('</footer>', '</footer><nav id="nav"></nav>', 1)),
    ]
    for what, page, kind, text in MUTANTS:
        mutant = dict(sources)
        mutant[page] = text
        eq('9. %s on %s is caught as %s' % (what, page, kind),
           (page, kind) in findings(pagebuild.chrome_drift(mutant)), True)
    # the guard never raises: verify.py writes its report after it runs
    eq('9. a structurally broken page is a finding, not an exception',
       findings(pagebuild.chrome_drift({'pension-calculator.html': sources['pension-calculator.html'], 'x.html': '<html></html>'})),
       [('x.html', 'structure')])

    # ----------------------------------------------------------------- 10
    # The sync. A no-op on the tree as it ships, byte for byte; repairs a
    # mutated page to the byte; idempotent; and never touches the skeleton or
    # the pages pagebuild owns, even when the skeleton has changed.
    eq('10. the sync changes nothing on the tree as it ships', pagebuild.sync_blocks(sources), {})
    broken = dict(sources)
    broken['terms.html'] = MUTANTS[0][3]
    fixed = pagebuild.sync_blocks(broken)
    eq('10. the sync repairs a page that gained a nav item, byte for byte',
       fixed.get('terms.html') == sources['terms.html'], True)
    eq('10. and touches only that page', sorted(fixed), ['terms.html'])
    moved = dict(sources)
    moved['pension-calculator.html'] = nav_only('pension-calculator.html',
        '<li><a class="lnk" href="glossary.html">Pension jargon buster</a></li>',
        '<li><a class="lnk" href="glossary.html">Pension jargon buster</a></li>\n        <li><a class="lnk" href="complaints.html">Complaints</a></li>')
    out = pagebuild.sync_blocks(moved)
    eq('10. a new item in the skeleton reaches every hand-written page',
       sorted(out), sorted(p for p in sources if p != 'pension-calculator.html' and p not in {q.out for q in pagebuild.PAGES.values()}))
    eq('10. and never the skeleton or the built pages',
       [p for p in out if p == 'pension-calculator.html' or p in {q.out for q in pagebuild.PAGES.values()}], [])
    eq('10. the new item lands on the page that marks itself current, still marked',
       '<a class="lnk active" href="tracker.html" aria-current="page">' in out['tracker.html'] and
       'href="complaints.html">Complaints</a></li>' in out['tracker.html'][pagebuild.nav_span(out['tracker.html'])[0]:pagebuild.nav_span(out['tracker.html'])[1]], True)
    eq('10. and on the home page with its same-page anchors kept',
       'href="#story"' in out['index.html'] and 'href="index.html#story"' not in
       out['index.html'][pagebuild.nav_span(out['index.html'])[0]:pagebuild.nav_span(out['index.html'])[1]], True)
    synced = dict(moved)
    synced.update(out)
    eq('10. the sync is idempotent', pagebuild.sync_blocks(synced), {})
    eq('10. after it, the guard reports only the built pages as behind the skeleton',
       sorted(pagebuild.chrome_drift(synced)), sorted(q.out for q in pagebuild.PAGES.values()))
    eq('10. index.html keeps its foot-top as written: the difference is whitespace between tags',
       'index.html' in pagebuild.sync_blocks(sources), False)

    # ----------------------------------------------------------------- 11
    # tools/sync-chrome.py end to end, on a copy of the pages so the
    # repository is never written by a test: --check is clean on the tree as
    # it ships, names a page that drifted and exits 1, and a plain run
    # repairs that page byte for byte and then has nothing left to do.
    import shutil
    import subprocess
    import tempfile
    tool = os.path.join(ROOT, 'tools', 'sync-chrome.py')
    p = subprocess.run([sys.executable, tool, '--check'], capture_output=True, text=True, cwd=ROOT)
    eq('11. --check exits 0 on the tree as it ships', p.returncode, 0)
    eq('11. and reports nothing to update', '0 updated' in p.stdout, True)
    tmp = tempfile.mkdtemp(prefix='pb-sync-test-')
    for name in sources:
        shutil.copy(os.path.join(ROOT, name), tmp)
    with open(os.path.join(tmp, 'terms.html'), 'w', encoding='utf-8') as f:
        f.write(MUTANTS[0][3])
    p = subprocess.run([sys.executable, tool, '--check', '--root', tmp], capture_output=True, text=True, cwd=ROOT)
    eq('11. --check exits 1 on a copy where terms.html gained a nav item', p.returncode, 1)
    eq('11. naming the page', 'terms.html' in p.stdout, True)
    eq('11. without writing', read_at(tmp, 'terms.html') == MUTANTS[0][3], True)
    p = subprocess.run([sys.executable, tool, '--root', tmp], capture_output=True, text=True, cwd=ROOT)
    eq('11. a plain run exits 0', p.returncode, 0)
    eq('11. and repairs the page to the byte', read_at(tmp, 'terms.html') == sources['terms.html'], True)
    eq('11. every other page in the copy is untouched',
       all(read_at(tmp, n) == sources[n] for n in sources if n != 'terms.html'), True)
    p = subprocess.run([sys.executable, tool, '--check', '--root', tmp], capture_output=True, text=True, cwd=ROOT)
    eq('11. after which --check is clean again', p.returncode, 0)
    shutil.rmtree(tmp, ignore_errors=True)

    # ----------------------------------------------------------------- 12
    # Run 26. The review line and the reason to book are one string each in
    # pagebuild, and their CSS is one block every page carries. The guard is
    # clean on the tree as it ships, and each mutant below is one way a page
    # could drift: every one must be named, and only on the page it touched.
    eq('12. the trust components are clean on the tree as it ships', pagebuild.trust_drift(sources), {})
    eq('12. the review line is on the ten pages the brief names',
       sorted(pagebuild.reviewed_pages()),
       sorted(['pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html',
               'pension-fees-calculator.html', 'my-pensions.html', 'state-pension-reality-check.html',
               'state-pension-entitlement.html', 'director-pension-rules.html', 'standard-fund-threshold.html',
               'pia.html']))
    eq('12. and on neither held page', [p for p in ('find-my-pension.html', 'pension-readiness-check.html')
                                        if pagebuild.REVIEWED in sources[p]], [])
    trust_mutants = [
        ('a built page lost its review line', 'pia.html', pagebuild.REVIEWED, '', 'reviewed'),
        ('a hand-written calculator changed the date', 'director-calculator.html',
         'Last reviewed September 2026', 'Last reviewed October 2026', 'reviewed'),
        ('a page that should not carry it gained it', 'terms.html', '<main', pagebuild.REVIEWED + '<main', 'reviewed'),
        ('a reason line reworded', 'index.html', 'Free, 20 minutes, no obligation.', 'Free, 30 minutes, no obligation.', 'reason'),
        ('the recipe edited on one page', 'glossary.html', 'body p.pb-why{margin:10px 0 0', 'body p.pb-why{margin:12px 0 0', 'trust-css'),
        ('the recipe missing from one page', 'booking.html', pagebuild.TRUST_OPEN, '/* TRUST-GONE', 'trust-css'),
    ]
    for label, page, find, repl, kind in trust_mutants:
        m = dict(sources)
        assert find in m[page], label
        m[page] = m[page].replace(find, repl, 1)
        eq('12. %s: named, on that page only' % label, sorted(set(findings(pagebuild.trust_drift(m)))), [(page, kind)])

    # ----------------------------------------------------------------- 13
    # Run 26. The home page's gap chart: its markup is the finished chart, so
    # a reader without JavaScript sees the real figures, and the script never
    # writes a euro zero. tests/gap-band.py proves the rest on real frames.
    home = sources['index.html']
    chart = home[home.index('id="pbGap"'):home.index('class="pb-src', home.index('id="pbGap"'))]
    eq('13. the gap chart carries its three figures in the markup',
       re.findall(r'data-pb-count="(\d+)">&euro;([\d,]+)<', chart),
       [('40860', '40,860'), ('25296', '25,296'), ('15564', '15,564')])
    script = home[home.index('/* the gap: bars grow'):home.index('/* the gap, your own')]
    eq('13. the count-up script never writes a zero figure', 'fmt(0)' in script, False)
    eq('13. and arms the bars without a transition', "classList.add('pb-still','pb-armed')" in script, True)

    # ----------------------------------------------------------------- 14
    # Run 27: the lead forms, as Netlify reads them at deploy. Netlify finds a
    # form by name in the static HTML and stores only the fields that form
    # declares, so each must be in the source, not built by script, with a
    # hidden form-name and the honeypot, under a name no other page uses.
    # These names are the ones Damian sets notifications on in Netlify.
    from html.parser import HTMLParser

    class Forms(HTMLParser):
        def __init__(self):
            super().__init__()
            self.forms, self.cur = [], None

        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            if tag == 'form':
                self.cur = {'attrs': a, 'fields': []}
                self.forms.append(self.cur)
            elif self.cur is not None and tag in ('input', 'textarea', 'select') and a.get('name'):
                self.cur['fields'].append((a.get('type', tag), a['name'], a.get('value')))

        def handle_endtag(self, tag):
            if tag == 'form':
                self.cur = None

    netlify = {}
    for name, text in sources.items():
        parser = Forms()
        parser.feed(text)
        for form in parser.forms:
            if form['attrs'].get('data-netlify') == 'true':
                netlify.setdefault(form['attrs'].get('name'), []).append((name, form))
    eq('14. the seven lead forms, each on its page', sorted((n, [p for p, _ in v]) for n, v in netlify.items()),
       sorted((n, [p]) for p, n in LEAD_FORMS.items()))
    for form_name, where in sorted(netlify.items()):
        page, form = where[0]
        names = [f[1] for f in form['fields']]
        eq('14. %s: posts to Netlify with the honeypot' % form_name,
           (form['attrs'].get('method'), form['attrs'].get('netlify-honeypot')), ('POST', 'bot-field'))
        eq('14. %s: a hidden form-name carrying its own name' % form_name,
           [f for f in form['fields'] if f[1] == 'form-name'], [('hidden', 'form-name', form_name)])
        eq('14. %s: one honeypot field, not hidden by type' % form_name,
           [f[0] for f in form['fields'] if f[1] == 'bot-field'], ['input'])
        eq('14. %s: an email field' % form_name, 'email' in names, True)
        single = [f[1] for f in form['fields'] if f[0] != 'radio']   # a radio group shares its name
        eq('14. %s: no field declared twice' % form_name, len(single), len(set(single)))
    finder = read('assets/js/pension-finder.js')
    m = re.search(r"var FIELDS = \[([^\]]*)\]", finder)
    eq('14. the finder declares exactly what PBFinder.fields() sends',
       re.findall(r"'([a-z_]+)'", m.group(1)) if m else None, pagebuild.FINDER_FIELDS)

    # ----------------------------------------------------------------- 15
    # Run 28. sitemap.xml lists exactly the live, indexable pages: none held
    # back with noindex, no about.html, nothing missing. Dates are left to
    # verify.py's site rows: a stale lastmod only shows after the commit that
    # made it stale, one run too late for a gate. Mutants: an extra entry, a
    # dropped entry, a held page listed.
    import sitemap
    members = lambda: [p for p in sitemap.problems() if not p.startswith('stale')]
    eq('15. the sitemap lists exactly the live, indexable pages', members(), [])
    live = sitemap.pages()
    eq('15. none of them held back or the 404', [p for p in ('404.html', 'thank-you.html', 'how-we-work.html',
       'find-my-pension.html', 'pension-readiness-check.html') if p in live], [])
    real = sitemap.current
    for label, rows, want in (
            ('an about.html entry', lambda: real() + [('https://pensionbuddy.ie/about.html', '2026-09-25', '0.5')],
             'listed but not a live, indexable page: https://pensionbuddy.ie/about.html'),
            ('a dropped page', lambda: [r for r in real() if not r[0].endswith('/pia.html')],
             'missing: https://pensionbuddy.ie/pia.html'),
            ('a held page listed', lambda: real() + [('https://pensionbuddy.ie/how-we-work.html', '2026-09-25', '0.5')],
             'listed but not a live, indexable page: https://pensionbuddy.ie/how-we-work.html')):
        sitemap.current = rows
        eq('15. %s is named' % label, members(), [want])
    sitemap.current = real

    # ----------------------------------------------------------------- 16
    # Run 30, R29-7: the 20% test for a director is stated in one wording
    # everywhere, the words of Revenue's Pensions Manual, Chapter 9.6 (the
    # early retirement chapter): "a director with at least 20% interest in a
    # company". Every sentence a reader can see on any page, or in any
    # page's parts, that puts a 20% beside a director, shares or a company
    # must be that wording. Mutants: Run 29's "20% or more of the company",
    # the manual's glossary's "more than 20%", and a 20% that is not about
    # directors at all, which must not be flagged.
    import html as htmllib
    TEST = 'a director with at least 20% interest in a company'
    def text_of(src):
        src = re.sub(r'(?is)<(script|style)\b.*?</\1>|<!--.*?-->', ' ', src)
        return ' '.join(htmllib.unescape(re.sub(r'<[^>]+>', ' ', src)).split())
    def off_wording(docs):
        out = []
        for name, src in sorted(docs.items()):
            for sent in re.split(r'(?<=[.!?”])\s+', text_of(src)):
                if not re.search(r'20\s?%|20 per ?cent|twenty per ?cent', sent, re.I):
                    continue
                # "share" alone is not ownership: "the share rises with age"
                if not re.search(r'director|shareholder|shareholding|\bshares\b|voting|'
                                 r'20\s?%[^.]{0,40}\b(company|business)\b', sent, re.I):
                    continue
                rest = sent.replace(TEST, '')
                if re.search(r'20\s?%|20 per ?cent|twenty per ?cent', rest, re.I):
                    out.append((name, sent[:120]))
        return out
    docs = dict(sources)
    for d in ('tools/director-rules-parts', 'tools/compare-parts', 'tools/pia-parts'):
        for f in sorted(os.listdir(os.path.join(ROOT, d))):
            if f.endswith('.html'):
                docs[d + '/' + f] = read(d + '/' + f)
    eq('16. every 20% beside a director is the manual\'s wording', off_wording(docs), [])
    eq('16. the wording is on the over-50s guide and under the director calculator\'s slider',
       sorted(n for n, src in docs.items() if TEST in text_of(src)),
       ['director-calculator.html', 'pensions-over-50.html'])
    for label, page, find, repl, flagged in (
            ('Run 29\'s "20% or more of the company"', 'pensions-over-50.html', TEST,
             'a director with 20% or more of the company', True),
            ('the glossary\'s "more than 20%"', 'director-calculator.html', TEST,
             'a director who owned or controlled more than 20% of the voting rights', True),
            ('a 20% that is not about directors', 'pensions-over-50.html', 'Early access is a trade, not a bonus.',
             'Early access is a trade, not a bonus. Tax at 20% is the standard rate.', False)):
        m = dict(docs); m[page] = m[page].replace(find, repl, 1)
        eq('16. %s is %s' % (label, 'flagged' if flagged else 'left alone'),
           [n for n, _ in off_wording(m)], [page] if flagged else [])

    # ----------------------------------------------------------------- 17
    # Run 32 (N1): PRSI is stated from one dated table, assets/js/pb-prsi.js.
    # The two director pages' scripts read it and hold no rate or date of
    # their own; their markup carries the table's LATEST rate, so a reader
    # without JavaScript sees the rate that applies from its date: the
    # calculator's key (bar width and label) and director.html's "€1,000 of
    # profit" line, with the euro figure the page's own arithmetic gives and
    # the date the rate applies from, and the calculator's "€20,000 as salary"
    # line at that rate. Both pages load the table before the
    # script that reads it. Mutants: each piece of markup at the old rate,
    # and a script that brings back its own rate.
    prsi_js = read('assets/js/pb-prsi.js')
    rates = [dict(pct=m.group(4), rate=float(m.group(3)), said=m.group(5))
             for m in re.finditer(r"\{ from: \[(\d+), (\d+), \d+\], rate: ([0-9.]+), pct: '([^']+)', said: '([^']+)' \}", prsi_js)]
    eq('17. the PRSI table has its rates', [r['pct'] for r in rates], ['4.2%', '4.35%'])
    latest = rates[-1]
    keep = round(round(1000 * (1 - (0.40 + 0.08 + latest['rate'])) * 100) / 100 + 1e-9)

    def prsi_findings(docs):
        out = []
        calc, dire = docs['director-calculator.html'], docs['director.html']
        if 'id="pbCutPrsi" style="width:%s"' % latest['pct'] not in calc:
            out.append(('director-calculator.html', 'key bar'))
        if '<b id="pbCutPrsiN">%s</b> PRSI' % latest['pct'] not in calc:
            out.append(('director-calculator.html', 'key label'))
        split = round(20000 * (1 - (0.40 + 0.08 + latest['rate'])) + 1e-9)
        if '<p class="vs-split-out" id="splitOut">€20,000 as salary is <b>€{:,}</b> in your pocket.'.format(split) not in calc:
            out.append(('director-calculator.html', 'split line'))
        m = re.search(r'<p class="pb-two-out" id="pbTwoOut">(.*?)</p>', dire)
        want = ('is about <b>&euro;%d</b> in your pocket, after 40%% income tax, 8%% USC and %s PRSI '
                '(the rate from %s).' % (keep, latest['pct'], latest['said']))
        if not m or want not in m.group(1):
            out.append(('director.html', 'profit line'))
        for name in ('director.html', 'director-calculator.html'):
            src = docs[name]
            scripts = ' '.join(re.findall(r'(?is)<script>(.*?)</script>', src))
            if re.search(r'0\.042\b|0\.0435\b|new Date\(\s*2026\s*,\s*9\s*,\s*1\s*\)|Math\.round\(\s*\w*PRSI\w*\s*\*\s*1000', scripts, re.I):
                out.append((name, 'a rate in the script'))
            tag = src.find('<script src="assets/js/pb-prsi.js')
            use = src.find('PBPrsi.at(')
            if tag < 0 or use < 0 or tag > use:
                out.append((name, 'the table is not loaded first'))
        return out

    eq('17. the director pages state PRSI from the table, and their markup carries %s' % latest['pct'],
       prsi_findings(sources), [])
    for label, page, find, repl, want in (
            ('the key bar at the old rate', 'director-calculator.html', 'style="width:%s"' % latest['pct'], 'style="width:4.2%"', 'key bar'),
            ('the key label at the old rate', 'director-calculator.html', '<b id="pbCutPrsiN">%s</b>' % latest['pct'], '<b id="pbCutPrsiN">4.2%</b>', 'key label'),
            ('the split line at the old figure', 'director-calculator.html', 'is <b>€9,530</b> in your pocket', 'is <b>€9,560</b> in your pocket', 'split line'),
            ('the profit line at the old figure', 'director.html', '<b>&euro;%d</b> in your pocket' % keep, '<b>&euro;478</b> in your pocket', 'profit line'),
            ('a script with its own rate', 'director-calculator.html', 'var PRSI = PRSI_NOW.rate;', 'var PRSI = new Date() < new Date(2026, 9, 1) ? 0.042 : 0.0435;', 'a rate in the script'),
            ('the old one-decimal formatting', 'director.html', 'var pct=p.pct;', "var pct=(Math.round(prsi*1000)/10)+'%';", 'a rate in the script')):
        m = dict(sources); m[page] = m[page].replace(find, repl, 1)
        eq('17. %s is caught' % label, [k for n, k in prsi_findings(m) if n == page], [want])

    # ----------------------------------------------------------------- 18
    from html.parser import HTMLParser as HTMLParser18
    VOID18 = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
    # Run 32: the comparison page shows its warning box in both modes. The
    # first mode's sits under its "Everything paid in, by 66" projection; the
    # second mode hides that panel, so it carries the same box under its own
    # figures. Mutants: either copy removed.
    WARN = ('<div class="pb-warn"><p><b>Warning: These figures are estimates only. They are not a '
            'reliable guide to the future performance of your investment.</b></p><p><b>Warning: The '
            'value of your investment may go down as well as up.</b></p></div>')

    def modes_warned(src):
        a, b = src.find('id="mode1Results"'), src.find('id="mode2Results"')
        c = src.find('<!-- ============ SHARED', b)
        if min(a, b, c) < 0:
            return None
        return [WARN in src[a:b], WARN in src[b:c]]

    class Boxes(HTMLParser18):
        """every .pb-warn: the mode panel it is in, and whether anything
        between that panel and the box (the box included) is hidden or
        belongs to the other mode"""
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.stack, self.out = [], []

        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            if tag in VOID18:
                return
            self.stack.append((tag, a))
            if 'pb-warn' in (a.get('class') or '').split():
                ids = [x.get('id') for _, x in self.stack]
                panel = next((i for i in reversed(ids) if i in ('mode1Results', 'mode2Results')), None)
                n = str(panel[4]) if panel else None
                below = self.stack[ids.index(panel) + 1:] if panel else self.stack
                bad = [t for t, x in below if 'hidden' in x or x.get('data-mode') not in (None, n)]
                self.out.append((panel, bad))

        def handle_endtag(self, tag):
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]
                    break

    def boxes(src):
        p = Boxes(); p.feed(src)
        return sorted((panel, bool(bad)) for panel, bad in p.out)

    cmp_src = sources['broker-vs-autoenrolment.html']
    eq('18. the comparison shows its warning in both modes', modes_warned(cmp_src), [True, True])
    eq('18. one box in each mode panel, and nothing between panel and box hides it or ties it to the other mode',
       boxes(cmp_src), [('mode1Results', False), ('mode2Results', False)])
    m2 = cmp_src.find(WARN, cmp_src.find('id="mode2Results"'))
    for label, repl in (('the second mode\'s box hidden', '<div class="pb-warn" hidden>'),
                        ('the second mode\'s box tied to the first mode', '<div class="pb-warn" data-mode="1">')):
        mut = cmp_src[:m2] + WARN.replace('<div class="pb-warn">', repl, 1) + cmp_src[m2 + len(WARN):]
        eq('18. %s is caught' % label, boxes(mut), [('mode1Results', False), ('mode2Results', True)])
    eq('18. and the parts it is built from say the same',
       modes_warned(read('tools/compare-parts/main.html') + '<!-- ============ SHARED'), [True, True])
    first, second = cmp_src.find(WARN), cmp_src.find(WARN, cmp_src.find('id="mode2Results"'))
    for label, cut, want in (('the second mode\'s copy removed', second, [True, False]),
                             ('the first mode\'s copy removed', first, [False, True])):
        eq('18. %s is caught' % label, modes_warned(cmp_src[:cut] + cmp_src[cut + len(WARN):]), want)

    # ----------------------------------------------------------------- 19
    # Run 32: the regulator line and the QFA line are there from the first
    # frame, on every page (the old body{animation:pageIn .4s} faded the
    # "Regulated by the Central Bank of Ireland" strip and the footer's
    # disclosure from blank on every load). Static, on every page's markup
    # and CSS: no @keyframes that starts at opacity 0 (from or 0%, in any
    # order in its selector list) is used by a rule on html, body, main, the
    # footer, the strip, the lockup, the review line, the legal text or the
    # disclosure; and no element whose joined text (a name split by a tag or
    # written with &nbsp; is still whole) names the Central Bank of Ireland,
    # a Qualified Financial Adviser, QFA or Q.F.A. is, or sits under, a
    # .reveal or anything with an inline delay, animation (not none), zero
    # opacity (!important too) or delayed transition. The glossary's term
    # cards define those words and are left out. What markup cannot show
    # (a rule on a class, a script) is tests/regulator-lines.test.py's job.
    from html.parser import HTMLParser
    REG = re.compile(r'Central\s+Bank\s+of\s+Ireland|Qualified\s+Financial\s+Adviser|\bQFA\b|\bQ\.\s*F\.\s*A\b')
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
    BAD_STYLE = re.compile(r'transition-delay|animation(?:-name)?\s*:\s*(?!none\b)|opacity\s*:\s*0(?:\.0*)?\s*(?:!\s*important\s*)?(?:;|$)'
                           r'|transition\s*:[^;]*\d(?:\.\d+)?m?s[^;,]*\s\d*\.?\d+m?s')

    class RegLines(HTMLParser):
        """The text of each element, its descendants' included but the
        glossary's term cards left out, so a name split by a tag or written
        with &nbsp; is still whole; an element whose text names the regulator
        or the credential must not be, or sit under, a .reveal or anything
        with an inline delay, animation or zero opacity."""
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.stack, self.skip, self.bad = [], 0, []

        def handle_starttag(self, tag, attrs):
            if tag in ('script', 'style'):
                self.skip += 1
            if tag not in VOID:
                a = dict(attrs)
                cls = a.get('class') or ''
                self.stack.append([tag, cls, a.get('style') or '', [], 'gterm' in cls.split()])

        def handle_endtag(self, tag):
            if tag in ('script', 'style'):
                self.skip -= 1
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    for e in reversed(self.stack[i:]):
                        self.close(e)
                    del self.stack[i:]
                    break

        def close(self, e):
            text = ' '.join(''.join(e[3]).split())
            if not REG.search(text):
                return
            chain = [x for x in self.stack if x is not e] + [e]
            if any(re.search(r'(^|\s)reveal(\s|$)', c) or BAD_STYLE.search(st) for _, c, st, _, _ in chain):
                self.bad.append(text[:50])

        def handle_data(self, d):
            if self.skip:
                return
            d = d.replace('\xa0', ' ')
            for e in self.stack:
                if e[4]:
                    return
            for e in self.stack:
                e[3].append(d)

    KEY = r'(?:html|body|main|footer|\.announce|\.pb-reg|\.pb-reviewed|\.legal|\.disclosure)'

    def page_fades(src):
        css = ' '.join(re.findall(r'(?is)<style[^>]*>(.*?)</style>', src))
        css = re.sub(r'(?s)/\*.*?\*/', ' ', css)
        names = set()
        for name, frames in re.findall(r'@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}', css):
            for sel, body in re.findall(r'([^{}]+)\{([^{}]*)\}', frames):
                if re.search(r'(?:^|,)\s*(?:from|0%)\s*(?:,|$)', sel.strip()) and \
                        re.search(r'opacity\s*:\s*0(?:\.0*)?\s*(?:!\s*important\s*)?(?:;|$)', body.strip()):
                    names.add(name)
        for sel, body in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
            if not re.search(r'(?:^|[\s,>+~(])' + KEY + r'(?=$|[\s,:.#\[>+~)])', sel.strip()):
                continue
            for m in re.finditer(r'animation(?:-name)?\s*:\s*([^;]+)', body):
                if any(w in names for w in re.findall(r'[\w-]+', m.group(1))):
                    return True
        return False

    def reg_findings(docs):
        out = []
        for name, src in sorted(docs.items()):
            if page_fades(src):
                out.append((name, 'the page fades in'))
            p = RegLines()
            p.feed(src)
            out += [(name, 'in a reveal: ' + t) for t in p.bad]
        return out

    games = {g: read('games/' + g) for g in ('buddys-run.html', 'jargon-battle.html')}
    eq('19. no page fades in, and no regulator or QFA line is revealed or delayed',
       reg_findings(dict(sources, **games)), [])
    FADE_KF = '@keyframes pbUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}\n'
    for label, page, find, repl, want in (
            ('the page fade put back', 'privacy.html', '</style>',
             '@keyframes pageIn{from{opacity:0}to{opacity:1}}\nbody{animation:pageIn .4s ease both}\n</style>',
             'the page fades in'),
            ('a fade on main, the footer and the strip', 'privacy.html', '</style>',
             '@keyframes fadeIn{0%{opacity:0}to{opacity:1}}\nmain,footer,.announce{animation:fadeIn .4s ease both}\n</style>',
             'the page fades in'),
            ('the page fade by animation-name', 'terms.html', '</style>',
             '@keyframes fadeIn{from{opacity:0}to{opacity:1}}\nbody{animation-name:fadeIn;animation-duration:.4s}\n</style>',
             'the page fades in'),
            ('the lockup animated by a CSS rule', 'index.html', '</style>',
             FADE_KF + '.pb-reg{animation:pbUp .5s .3s both}\n</style>', 'the page fades in'),
            ('the hero lockup delayed again', 'index.html', '<div class="pb-reg">',
             '<div class="pb-reg reveal" style="transition-delay:.24s">', 'in a reveal'),
            ('the lockup at zero opacity inline', 'index.html', '<div class="pb-reg">',
             '<div class="pb-reg" style="opacity:0">', 'in a reveal'),
            ('the review line delayed again', 'pia.html', '<p class="pb-reviewed">',
             '<p class="pb-reviewed reveal" style="transition-delay:.16s">', 'in a reveal'),
            ('the review line with a delay in its transition', 'pia.html', '<p class="pb-reviewed">',
             '<p class="pb-reviewed" style="opacity:.5;transition:opacity .5s ease .16s">', 'in a reveal'),
            ('a legal page revealed whole', 'terms.html', '<div class="legal pb-caveat">',
             '<div class="legal pb-caveat reveal">', 'in a reveal'),
            ('a fade whose 0% shares its selector list', 'terms.html', '</style>',
             '@keyframes f{0%,20%{opacity:0}to{opacity:1}}\nbody{animation:f .4s}\n</style>', 'the page fades in'),
            ('a fade written to-then-from', 'terms.html', '</style>',
             '@keyframes f{to{opacity:1}from{opacity:0}}\nbody{animation:f .4s}\n</style>', 'the page fades in'),
            ('the lockup at zero opacity, !important', 'index.html', '<div class="pb-reg">',
             '<div class="pb-reg" style="opacity:0!important">', 'in a reveal'),
            ('the Q.F.A. badge in a reveal again', 'index.html', '<div class="about-port">\n    <picture>',
             '<div class="about-port reveal">\n    <picture>', 'in a reveal'),
            ('the strip in a reveal, its name split by a line break', 'booking.html',
             'Regulated by the Central Bank of Ireland</span>',
             'Regulated by the Central Bank<br> of Ireland</span>', None),
            ('the strip in a reveal, with a no-break space', 'complaints.html',
             'Regulated by the Central Bank of Ireland</span>',
             'Regulated by the Central&nbsp;Bank of Ireland</span>', None)):
        m = dict(sources)
        if want is None:   # the split name, inside a reveal: put the strip in one
            m[page] = m[page].replace(find, repl, 1).replace('<div class="announce"', '<div class="announce reveal"', 1)
            want = 'in a reveal'
        else:
            m[page] = m[page].replace(find, repl, 1)
        assert m[page] != sources[page], label
        eq('19. %s is caught' % label,
           sorted({k.split(':')[0] for n, k in reg_findings(m) if n == page}), [want])
    for label, page, find, repl in (
            ('an inline animation:none is not a fade', 'index.html', '<div class="pb-reg">',
             '<div class="pb-reg" style="animation:none">'),
            ('a reduced-motion body{animation:none} is not a fade', 'privacy.html', '</style>',
             'body{transition:none;animation:none}\n</style>')):
        m = dict(sources); m[page] = m[page].replace(find, repl, 1)
        eq('19. %s' % label, [k for n, k in reg_findings(m) if n == page], [])

    # ----------------------------------------------------------------- 20
    # Run 32, part 1a: every caveat in pagebuild's list (warnings, sources,
    # "information, not advice", assumptions, "as at" dates, the legal
    # notices) is furniture: not a .reveal, not inside one, no inline delay,
    # animation or zero opacity. In the pages and in the built pages' parts.
    parts = {'tools/%s/main.html' % p.parts: read('tools/%s/main.html' % p.parts) for _, p in pages}
    eq('20. no caveat is revealed, delayed or faded', pagebuild.caveat_drift(dict(sources, **parts)), {})
    eq('20. the list finds the caveats', sum(len(pagebuild.caveat_elements(t)) for t in sources.values()) > 150, True)
    for label, page, find, repl in (
            ('a warning box in a reveal', 'starter.html', '<div class="pb-sa">', '<div class="pb-sa reveal">'),
            ('the result caveat under a revealed hero', 'pension-calculator.html', '<div class="res-hero"',
             '<div class="res-hero reveal"'),
            ('"information, not advice" delayed', 'index.html', '<div class="infoadvice">',
             '<div class="infoadvice" style="transition-delay:.1s">'),
            ('a guide\'s "Rules as at" under a revealed article', 'pensions-over-50.html', '<div class="legal">',
             '<div class="legal reveal">'),
            ('a legal notice revealed whole', 'terms.html', '<div class="legal pb-caveat">',
             '<div class="legal pb-caveat reveal">'),
            ('the hero caveat in a revealed phone', 'index.html', '<div class="hero-phone"', '<div class="hero-phone reveal"')):
        m = dict(sources)
        assert find in m[page], (label, find)
        m[page] = m[page].replace(find, repl, 1)
        eq('20. %s is caught' % label, sorted(pagebuild.caveat_drift(m)), [page])

    # ----------------------------------------------------------------- 21
    # Run 32, part 1c: booking's not-advice and privacy note is outside the
    # form, so it stays on screen when the form gives way to the
    # confirmation and the calendar (the submit handler hides the form).
    def note_outside(src):
        f_open, f_close = src.find('<form id="qualForm"'), src.find('</form>')
        note, stage = src.find('<p class="qnote">That is the lot.'), src.find('<div id="calStage"')
        return 0 <= f_open < f_close < note < stage
    bk = sources['booking.html']
    eq('21. booking\'s note sits after the form and before the calendar', note_outside(bk), True)
    i = bk.find('<p class="qnote">That is the lot.'); j = bk.find('</p>', i) + 4
    back = bk[:i] + bk[j:]
    back = back.replace('</form>', bk[i:j] + '\n      </form>', 1)
    eq('21. the note put back inside the form is caught', note_outside(back), False)

    # ----------------------------------------------------------------- 22
    # Run 32, part 2a: the motion vocabulary's plumbing. The MOTION block's
    # rule 2 selector is pagebuild.caveat_selector(), so the caveat list and
    # the rule cannot drift; every root page carries the one head script,
    # pagebuild.MOTION_HEAD (the whole motion runtime since the Lighthouse
    # follow-up), directly after the viewport meta and before any stylesheet;
    # and no page loads assets/js/pb-motion.js, which it replaced: one
    # request fewer before the first paint.
    VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    def plumbing(src):
        out = []
        blk = src[src.find('/* MOTION:BEGIN'):src.find('/* MOTION:END */')]
        m = re.search(r':is\((.*?)\)\{\s*opacity:1!important', blk, re.S)
        norm = lambda x: re.sub(r'\s*,\s*', ',', ' '.join(x.split()))
        if not m or norm(m.group(1)) != norm(pagebuild.caveat_selector()):
            out.append('rule 2')
        if src.count(pagebuild.MOTION_HEAD) != 1 or VIEWPORT + '\n' + pagebuild.MOTION_HEAD not in src:
            out.append('head line')
        # before every stylesheet, or it would wait for them: the font link
        # puts href first, so find any <link ... rel="stylesheet"> and <style>
        sheets = [m.start() for m in re.finditer(r'<link\b[^>]*\brel="stylesheet"|<style\b', src)]
        if not sheets or not 0 <= src.find(pagebuild.MOTION_HEAD) < min(sheets):
            out.append('head order')
        if re.search(r'<script[^>]*assets/js/pb-motion\.js', src):
            out.append('script')
        return out
    eq('22. every page: rule 2 is the caveat list, the head script, no pb-motion.js',
       {n: plumbing(t) for n, t in sources.items() if plumbing(t)}, {})
    ix = sources['index.html']
    k = ix.index('/* MOTION:BEGIN')
    eq('22. a caveat dropped from rule 2 is caught',
       'rule 2' in plumbing(ix[:k] + ix[k:].replace(',.pb-warn,', ',', 1)), True)
    for label, page, find, repl, want in (
            ('the head script dropped from its place', 'booking.html', VIEWPORT + '\n' + pagebuild.MOTION_HEAD,
             VIEWPORT, 'head line'),
            ('a caveat dropped from the head script', 'pia.html', pagebuild.MOTION_HEAD,
             pagebuild.MOTION_HEAD.replace('.pb-warn,', '', 1), 'head line'),
            ('pb-motion.js loaded again', 'terms.html', '</body>',
             '<script src="assets/js/pb-motion.js"></script>\n</body>', 'script')):
        m = sources[page].replace(find, repl, 1)
        assert m != sources[page], label
        eq('22. %s is caught' % label, want in plumbing(m), True)
    # the viewport meta and the head script, together, moved below the font stylesheet
    bk = sources['booking.html']
    pair = VIEWPORT + '\n' + pagebuild.MOTION_HEAD + '\n'
    link = re.search(r'<link\b[^>]*\brel="stylesheet"[^>]*>\n', bk)
    assert pair in bk and link and bk.find(pair) < link.start()
    moved = bk.replace(pair, '', 1)
    link = re.search(r'<link\b[^>]*\brel="stylesheet"[^>]*>\n', moved)
    moved = moved[:link.end()] + pair + moved[link.end():]
    eq('22. the head script moved below the stylesheet is caught', plumbing(moved), ['head order'])

    # ----------------------------------------------------------------- 23
    # Run 32, part 2b: the reveal system is gone and stays gone. Words never
    # wait: no element carries .reveal, no CSS selects it, no script looks for
    # it or hands off from it; the nav keeps its height when the page scrolls;
    # no page's own html rule scrolls smoothly on arrival (MOTION's
    # html.pb-smooth does, for in-page taps once the page has loaded); and the
    # Buddy chat has no play-out (D25).
    def leftovers(src):
        out = []
        noscript = re.sub(r'(?is)<script\b.*?</script>|<style\b.*?</style>', '', src)
        if re.search(r'class="[^"]*\breveal\b', noscript):
            out.append('reveal class')
        css = ' '.join(re.findall(r'(?is)<style[^>]*>(.*?)</style>', src))
        css = re.sub(r'(?s)/\*.*?\*/', '', css)
        if re.search(r'\.(?:js-)?reveal\b', css):
            out.append('reveal css')
        if re.search(r"querySelectorAll\(['\"]\.reveal['\"]\)|classList\.add\(['\"]js-reveal", src):
            out.append('reveal script')
        if re.search(r'nav\.scrolled \.nav-in\{height:', css):
            out.append('nav hop')
        if re.search(r'(?<![\w.-])html\{[^}]*scroll-behavior:smooth', css):
            out.append('smooth arrival')
        if 'pb-chat-play' in src:
            out.append('chat play-out')
        return out
    eq('23. no reveal, no nav hop, no smooth arrival, no chat play-out, on any page',
       {n: leftovers(t) for n, t in sources.items() if leftovers(t)}, {})
    for label, page, find, repl, want in (
            ('a reveal class put back', 'index.html', '<div class="pb-reg">', '<div class="pb-reg reveal">', 'reveal class'),
            ('a reveal rule put back', 'privacy.html', '</style>', '.js-reveal .reveal:not(.settled){opacity:0}\n</style>', 'reveal css'),
            ('the nav hop put back', 'glossary.html', '</style>', 'nav.scrolled .nav-in{height:62px}\n</style>', 'nav hop'),
            ('smooth arrival put back', 'terms.html', 'html{-webkit-text-size-adjust:100%}',
             'html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}', 'smooth arrival')):
        m = sources[page].replace(find, repl, 1)
        assert m != sources[page], label
        eq('23. %s is caught' % label, want in leftovers(m), True)

    # ----------------------------------------------------------------- 24
    # Run 32, part 3a: Ask Buddy is one file, assets/js/pb-buddy.js, loaded
    # once by every root page, with no inline copy left to drift; the six
    # pages that carried the shorter first shared answer ask for it with
    # data-first-answer="short", and no other page does. Since the Lighthouse
    # follow-up the tag is type="text/pb-late": the head script starts it
    # after the first frame, so the first paint never waits for it.
    SHORT_FIRST = ['booking.html', 'director.html', 'index.html', 'starter.html', 'thank-you.html', 'tracker.html']
    def buddy(src):
        out = []
        tags = re.findall(r'<script src="assets/js/pb-buddy\.js(?:\?v=[0-9a-f]+)?"([^>]*)></script>', src)
        if len(tags) != 1:
            out.append('loaded %d times' % len(tags))
        elif 'type="text/pb-late"' not in tags[0]:
            out.append('loaded before the first paint')
        if re.search(r"btn\.id='pbBuddyBtn'|Ask Buddy: quick answers", ' '.join(re.findall(r'(?is)<script>(.*?)</script>', src))):
            out.append('inline copy')
        return out, bool(tags and 'data-first-answer="short"' in tags[0])
    eq('24. every page loads pb-buddy.js once and carries no inline copy',
       {n: buddy(t)[0] for n, t in sources.items() if buddy(t)[0]}, {})
    eq('24. the short first answer on exactly the six pages that had it',
       sorted(n for n, t in sources.items() if buddy(t)[1]), SHORT_FIRST)
    tag_i = sources['privacy.html'].find('<script src="assets/js/pb-buddy.js')
    for label, page, mut, want in (
            ('an inline copy put back', 'terms.html',
             sources['terms.html'].replace('</body>', "<script>(function(){btn.id='pbBuddyBtn';})();</script>\n</body>", 1), 'inline copy'),
            ('the script dropped', 'privacy.html',
             sources['privacy.html'][:tag_i] + sources['privacy.html'][sources['privacy.html'].find('</script>', tag_i) + 9:], 'loaded 0 times'),
            ('the script loaded before the first paint again', 'glossary.html',
             sources['glossary.html'].replace(' type="text/pb-late"', '', 1), 'loaded before the first paint')):
        eq('24. %s is caught' % label, want in buddy(mut)[0], True)

    # ----------------------------------------------------------------- 25
    # Run 32, part 3b: floating chrome gives way to caveats. The scripts that
    # step aside (pb-buddy.js, pb-bookbar.js, pb-peek.js) read the caveat list
    # from PBMotion.CAVEATS, which the head script makes from
    # pagebuild.caveat_selector() (a page's copy drifting is check 22); Ask Buddy moves only by translate (the BUDDY block), so no page
    # lifts it by `bottom` over the analytics choice or a bar, or transitions
    # its `bottom`, which would shift what is behind it and leave it on a
    # caveat.
    def caveats_js(js):
        m = re.search(r'CAVEATS:("(?:[^"\\]|\\.)*")', js)
        return json.loads(m.group(1)) if m else None
    eq('25. PBMotion.CAVEATS, in the head script, is the caveat list', caveats_js(pagebuild.MOTION_HEAD), pagebuild.caveat_selector())
    # the reality check's #spFoot is its result in words, which its guess card
    # blurs: a caveat, rule 2 would un-blur it (the pre-merge review)
    feet = {n: sorted(e['id'] or '-' for e, _ in pagebuild.caveat_elements(sources[n]) if 'foot' in e['cls'])
            for n in ('state-pension-reality-check.html', 'state-pension-entitlement.html')}
    eq('25. the reality check\'s result sentence (#spFoot) is not a caveat; the entitlement check\'s #spFoot, its basis, is',
       ('spFoot' in feet['state-pension-reality-check.html'], 'spFoot' in feet['state-pension-entitlement.html']), (False, True))
    readers = {f: open(os.path.join(ROOT, 'assets/js', f)).read() for f in ('pb-buddy.js', 'pb-bookbar.js', 'pb-peek.js')}
    eq('25. Ask Buddy and the booking bar read PBMotion.CAVEATS',
       sorted(f for f in ('pb-buddy.js', 'pb-bookbar.js') if 'PBMotion.CAVEATS' not in readers[f]), [])
    # the results bar steps down for the warning boxes only: any caveat would
    # hide it for a fifth to over half of a calculator's length (Run 32)
    eq('25. the results bar steps down for the warning boxes, a caveat on the list',
       ("all('.pb-warn').forEach(function (el) { yieldIO.observe(el); });" in readers['pb-peek.js'],
        '.pb-warn' in pagebuild.caveat_selector().split(',')), (True, True))
    # tucked, Ask Buddy's name stays in the flow at no width: absolutely
    # positioned inside the fixed button it stopped Chrome's scroll anchoring
    # for the whole page (the starter story card pushed the page, 0.03 CLS)
    def name_in_flow(src):
        blk = src[src.find('/* BUDDY:BEGIN'):src.find('/* BUDDY:END */')]
        blk = re.sub(r'(?s)/\*.*?\*/', '', blk)
        rules = [b for sel, b in re.findall(r'([^{}]*)\{([^{}]*)\}', blk) if '.pb-b-label' in sel]
        return bool(rules) and not any(re.search(r'position\s*:\s*(?:absolute|fixed)', b) for b in rules)
    eq('25. tucked, Ask Buddy\'s name stays in the flow', name_in_flow(sources['pension-calculator.html']), True)
    eq('25. an absolutely positioned name is caught',
       name_in_flow(sources['pension-calculator.html'].replace('.pb-b-label{width:0;overflow:hidden}',
                                                               '.pb-b-label{position:absolute;width:1px;overflow:hidden}', 1)), False)
    def lifts(src):
        css = re.sub(r'(?s)/\*.*?\*/', '', ' '.join(re.findall(r'(?is)<style[^>]*>(.*?)</style>', src)))
        out = []
        for sel, body in re.findall(r'([^{}]*)\{([^{}]*)\}', css):
            if '.pb-b-btn' not in sel:
                continue
            sel = ' '.join(sel.split())
            if re.search(r'(?:^|[;\s])bottom\s*:', body) and sel != '.pb-b-btn':
                out.append('lift: ' + sel)
            if re.search(r'transition[^;]*\bbottom\b', body):
                out.append('bottom transition: ' + sel)
        return out
    eq('25. no page lifts Ask Buddy by bottom, or transitions its bottom',
       {n: lifts(t) for n, t in sources.items() if lifts(t)}, {})
    for label, page, find, repl in (
            ('the lift over the analytics choice put back', 'privacy.html', '</style>',
             'body.pb-banner-open .pb-b-btn{bottom:calc(var(--pb-consent-h,0px) + 18px)}\n</style>'),
            ('the lift over the booking bar put back', 'index.html', '</style>',
             '@media(max-width:920px){html.pb-bookbar-on .pb-b-btn{bottom:86px}}\n</style>'),
            ('a bottom transition put back', 'glossary.html', '</style>',
             '@media (prefers-reduced-motion:no-preference){.pb-b-btn{transition:bottom .2s ease}}\n</style>')):
        m = sources[page].replace(find, repl, 1)
        assert m != sources[page], label
        eq('25. %s is caught' % label, bool(lifts(m)), True)

    # ----------------------------------------------------------------- 26
    # Run 32, part 5a: a full record is simply a full jar. No celebration
    # rises onto the jar's rim when the State Pension reality check's slider
    # reaches 2,080, and no dots rest there after (D15): no page carries the
    # spill's markup, its rules or its keyframes.
    def spill(src):
        css = re.sub(r'(?s)/\*.*?\*/', '', ' '.join(re.findall(r'(?is)<style[^>]*>(.*?)</style>', src)))
        return bool(re.search(r'class="[^"]*\bpb-jar-spill\b', src) or re.search(r'\.pb-jar-spill\b|@keyframes\s+pb-jar-lift', css))
    eq('26. no page celebrates a full record on the jar', sorted(n for n, t in sources.items() if spill(t)), [])
    sp = sources['state-pension-reality-check.html']
    for label, mut in (
            ('the rim dots put back', sp.replace('<div class="pb-jar-body">', '<div class="pb-jar-spill"><i></i></div>\n        <div class="pb-jar-body">', 1)),
            ('the lift put back', sp.replace('</style>', '@keyframes pb-jar-lift{0%{opacity:0}100%{opacity:1}}\n</style>', 1))):
        assert mut != sp, label
        eq('26. %s is caught' % label, spill(mut), True)

    # ----------------------------------------------------------------- 27
    # Run 32, part 5a: the director calculator's safe is a still picture, the
    # same for every figure (Damian: "neutral reveal, no reward"). Nothing
    # drives it from the relief figure, and nothing on it moves or fills:
    # no --pb-t level, no data-pb-state, no amber, no rotation or transition
    # beyond the dial's fixed cross, and no script that writes #pbSafe.
    def safe(src):
        out = []
        css = re.sub(r'(?s)/\*.*?\*/', '', ' '.join(re.findall(r'(?is)<style[^>]*>(.*?)</style>', src)))
        rules = [(' '.join(sel.split()), b) for sel, b in re.findall(r'([^{}]*)\{([^{}]*)\}', css) if 'pb-safe' in sel]
        if not rules:
            out.append('no safe')
        for sel, b in rules:
            if re.search(r'var\(--pb-t\b(?!-)|--amber|transition|animation|rotateY|perspective', b):
                out.append('moves: ' + sel)
            if 'rotate(' in b and sel != '.pb-safe-dial::after':
                out.append('turns: ' + sel)
        if 'data-pb-state' in src or re.search(r"--pb-t['\"]", src):
            out.append('driven')
        if re.search(r"getElementById\(['\"]pbSafe['\"]\)", src):
            out.append('scripted')
        return out
    dc = sources['director-calculator.html']
    eq('27. the director safe is still, the same for every figure', safe(dc), [])
    for label, find, repl, want in (
            ('the door swing put back', '.pb-safe-door{position:absolute;', '.pb-safe-door{transform:rotateY(calc(var(--pb-t,0)*74deg));position:absolute;', 'moves: .pb-safe-door'),
            ('the amber fill put back', '</style>', '.pb-safe-fill{background:var(--amber)}\n</style>', 'moves: .pb-safe-fill'),
            ('the driver put back', '</body>', "<script>var el=document.getElementById('pbSafe');el.style.setProperty('--pb-t','0.5');</script>\n</body>", 'scripted')):
        m = dc.replace(find, repl, 1)
        assert m != dc, label
        eq('27. %s is caught' % label, want in safe(m), True)

    # ----------------------------------------------------------------- 28
    # Run 33: on a phone the cookie bar must never cover the regulator and
    # QFA line on the first screen. The bar's words are the one line Damian
    # approved (docs/COMPLIANCE-PACK.md 1.17 has them for sign-off: a change
    # goes there too); the four heroes that end with the lockup mark their
    # container .pb-hero-copy, which the FIRSTSCREEN block reorders on a
    # phone, and keep the lockup last in the markup, so screen readers meet
    # it where they did. tests/consent.test.py check 9 measures the layouts.
    consent_js = open(os.path.join(ROOT, 'assets/js/pb-consent.js')).read()
    WORDS = '<p>May we use a little analytics? <a href="privacy.html">Privacy Notice</a></p>'
    eq('28. the cookie bar says the approved line, and only it', (consent_js.count(WORDS), 'never sold' in consent_js), (1, False))
    HEROES = ('index.html', 'director.html', 'starter.html', 'tracker.html')
    def lockups(src):
        # the hero's container, its two copies, where each sits, and whether they say the same
        i = src.find('<div class="pb-hero-copy">') if '<div class="pb-hero-copy">' in src else src.find('<div class="hero-copy pb-hero-copy">')
        end = src.find('\n  <div class="hero-phone">', i)
        if i < 0 or end < 0:
            return 'no .pb-hero-copy container'
        box = src[i:end]
        top = re.search(r'<span class="eyebrow[^"]*"><span class="pip"></span>[^<]*</span>\s*<div class="pb-reg pb-reg-top">(.*?)\n\s*</div>\n', box, re.S)
        tail = re.search(r'<div class="pb-reg">(.*?)\n\s*</div>\s*</div>\s*$', box, re.S)
        if box.count('pb-reg pb-reg-top') != 1 or not top:
            return 'the copy under the eyebrow is missing or not straight after it'
        if box.count('<div class="pb-reg">') != 1 or not tail:
            return 'the copy at the end is missing or not last'
        if ' '.join(top.group(1).split()) != ' '.join(tail.group(1).split()):
            return 'the two copies differ'
        return None
    eq('28. the four heroes: a lockup straight after the eyebrow and one last, saying the same, in a .pb-hero-copy container',
       {n: lockups(sources[n]) for n in HEROES if lockups(sources[n])}, {})
    eq('28. and no other page carries the lockup in a hero', sorted(n for n, t in sources.items()
       if '<div class="pb-reg' in t and n not in HEROES and t.find('<div class="pb-reg') < t.find('</header>')), [])
    dr = sources['director.html']
    for label, mut, want in (
            ('the class dropped from a hero', dr.replace('<div class="pb-hero-copy">', '<div>', 1), 'no .pb-hero-copy container'),
            ('the copy under the eyebrow dropped', re.sub(r'\n\s*<div class="pb-reg pb-reg-top">.*?\n\s*</div>(?=\n)', '', dr, count=1, flags=re.S),
             'the copy under the eyebrow is missing or not straight after it'),
            ('the copies drifting apart', dr.replace('30 years in financial services', '31 years in financial services', 1), 'the two copies differ')):
        assert mut != dr, label
        eq('28. %s is caught' % label, lockups(mut), want)

    # ----------------------------------------------------------------- 31
    # Run 35: Damian's qualifications and memberships. One list, the same
    # words everywhere, in the places the brief named: the end of the home
    # page's story, under Damian's own section, beside the booking form, and
    # small in every page's footer (the foot-top, so chrome_drift holds it
    # to the skeleton's on every page, and check 8 says so). The label says
    # whose they are, so no body seems to endorse Pensionbuddy; nothing else
    # is said in the strip, and nothing in it moves. (Checks 29 and 30 are
    # numbered on the unmerged claude/overnight-3 branch.)
    QUAL_LABEL = 'Damian&rsquo;s qualifications and memberships'
    QUAL_ITEMS = ['Qualified Financial Adviser (QFA)', 'Life Insurance Association (LIA)']
    WHERE = {'index.html': ['pbQualsStory', 'pbQualsDamian', 'pbQualsFoot'],
             'booking.html': ['pbQualsBook', 'pbQualsFoot']}

    def quals(src):
        """[(id, label, items, alts, extra words)] for every strip, in page order."""
        out = []
        for m in re.finditer(r'<div class="pb-quals(?: pb-quals-sm)?">', src):
            # the strip holds no <div>, so it ends at the first </div>
            box = src[m.end():src.find('</div>', m.end())]
            lab = re.search(r'<p class="pb-quals-label" id="([^"]+)">(.*?)</p>\s*<ul class="pb-quals-list" aria-labelledby="([^"]+)">', box, re.S)
            if not lab or lab.group(1) != lab.group(3):
                out.append(('unlabelled', None, None, None, None))
                continue
            items = re.findall(r'<li>(.*?)</li>', box, re.S)
            alts = re.findall(r'<img[^>]*\salt="([^"]*)"', box)
            words = re.sub(r'<p class="pb-quals-label".*?</p>|<li>.*?</li>|<[^>]+>|\s', '', box, flags=re.S)
            out.append((lab.group(1), lab.group(2), [re.sub(r'<img[^>]*>', '', i).strip() for i in items], alts, words))
        return out

    def quals_faults(srcs):
        f = []
        for page, want in sorted(WHERE.items()):
            got = quals(srcs[page])
            if [g[0] for g in got] != want:
                f.append('%s: strips %s, expected %s' % (page, [g[0] for g in got], want))
            for g in got:
                if g[1] != QUAL_LABEL:
                    f.append('%s %s: the label is %r' % (page, g[0], g[1]))
                if g[2] != QUAL_ITEMS:
                    f.append('%s %s: the items are %r' % (page, g[0], g[2]))
                if g[3] and any(a not in QUAL_ITEMS for a in g[3]):
                    f.append('%s %s: a logo without its full name as alt text' % (page, g[0]))
                if g[4]:
                    f.append('%s %s: words in the strip beyond its label and names: %r' % (page, g[0], g[4][:40]))
        for page in sorted(n for n in srcs if n not in WHERE):
            got = quals(srcs[page])
            if [g[0] for g in got] != ['pbQualsFoot']:
                f.append('%s: strips %s, expected the footer\'s only' % (page, [g[0] for g in got]))
        ix = srcs['index.html']
        story, damian = ix.find('<section id="story">'), ix.find('<section id="damian"')
        if not (story < ix.find('id="pbQualsStory"') < damian < ix.find('id="pbQualsDamian"') < ix.find('<section id="adam"')):
            f.append('index.html: the strips are not at the end of the story and in Damian\'s section')
        bk = srcs['booking.html']
        if not (bk.find('<div class="lead">') < bk.find('id="pbQualsBook"') < bk.find('<div class="book-card">')):
            f.append('booking.html: the strip is not in the column beside the form, before its card')
        skel = srcs['pension-calculator.html']
        c = pagebuild.css_span(skel, 'QUALS')
        block = re.sub(r'/\*.*?\*/', '', skel[c[0]:c[1]], flags=re.S) if c else ''
        if not block or re.search(r'transition|animation|transform|@keyframes', block):
            f.append('the QUALS block is missing, or something in it moves')
        return f

    eq('31. Damian\'s qualifications and memberships: the same label and names in the four places, and nothing else',
       quals_faults(sources), [])
    for label, page, find, repl, want in (
            ('the label changed to a claim', 'index.html', 'id="pbQualsStory">Damian&rsquo;s qualifications and memberships',
             'id="pbQualsStory">Accredited by', 'the label is'),
            ('a name dropped from the booking page', 'booking.html',
             'aria-labelledby="pbQualsBook"><li>Qualified Financial Adviser (QFA)</li>', 'aria-labelledby="pbQualsBook">', 'the items are'),
            ('a body added', 'index.html', '<li>Life Insurance Association (LIA)</li></ul>\n    </div>\n  </div>\n</div></section>\n\n<section id="damian"',
             '<li>Life Insurance Association (LIA)</li><li>Brokers Ireland</li></ul>\n    </div>\n  </div>\n</div></section>\n\n<section id="damian"', 'the items are'),
            ('an endorsement line added', 'index.html',
             'aria-labelledby="pbQualsDamian"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>',
             'aria-labelledby="pbQualsDamian"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>'
             '<p>Pensionbuddy is recommended by the LIA.</p>', 'beyond its label'),
            ('a logo with no alt text', 'booking.html', '<li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>\n    </div>',
             '<li><img src="assets/logos/qfa.svg" alt="">Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>\n    </div>', 'without its full name'),
            ('a label no longer tied to its list', 'index.html', 'id="pbQualsDamian"', 'id="pbQualsDamianX"', 'strips'),
            ('the strip taken off the booking page', 'booking.html', '<div class="pb-quals">\n      <p class="pb-quals-label" id="pbQualsBook">',
             '<div class="pb-gone">\n      <p class="pb-quals-label" id="pbQualsBook">', 'strips'),
            ('a strip added to another page\'s main', 'director.html', '</main>',
             '<div class="pb-quals"><p class="pb-quals-label" id="pbQualsX">Damian&rsquo;s qualifications and memberships</p><ul class="pb-quals-list" aria-labelledby="pbQualsX"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul></div></main>', 'strips'),
            ('motion put in the block', 'pension-calculator.html', '.pb-quals{margin:28px 0 0}', '.pb-quals{margin:28px 0 0;transition:opacity .3s}', 'moves')):
        mut = dict(sources)
        mut[page] = sources[page].replace(find, repl, 1)
        assert mut[page] != sources[page], label
        eq('31. %s is caught' % label, any(want in x for x in quals_faults(mut)), True)




# Run 27: every Netlify form on the site, by page. Adding a lead form means
# adding it here, and telling Damian its name for the notification settings.
LEAD_FORMS = {
    'booking.html': 'booking',
    'pension-calculator.html': 'pension-calculator-results',
    'director-calculator.html': 'director-calculator-results',
    'director.html': 'director-guide',
    'starter.html': 'starter-guide',
    'tracker.html': 'tracker-guide',
    'find-my-pension.html': 'pension-finder',
}


if __name__ == '__main__':
    run()
    report()
