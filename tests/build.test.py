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
         after('terms.html', '/* FONTS:BEGIN', 'font-weight:400 800;font-display:swap', 'font-weight:300 800;font-display:swap')),
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
        ('the CTA block of CSS changed', 'old-pension-checklist.html', 'cta-css',
         after('old-pension-checklist.html', '/* CTA:BEGIN', '.pb-bookbar.pb-bookbar-on{transform:none}', '.pb-bookbar.pb-bookbar-on{transform:translateY(0)}')),
        ('the CTA block of CSS missing', 'privacy.html', 'cta-css',
         sources['privacy.html'].replace('/* CTA:END */', '/* CTA-END */', 1)),
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
        ('a reason line put back', 'index.html', '</main>', '<p class="pb-why">Free · 20 minutes.</p></main>', 'reason'),
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
    want_forms = {}
    for p, n in LEAD_FORMS.items():
        want_forms.setdefault(n, []).append(p)
    eq('14. the five lead form names, each on its own pages', sorted((n, sorted(p for p, _ in v)) for n, v in netlify.items()),
       sorted((n, sorted(ps)) for n, ps in want_forms.items()))
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
    eq('14. calculator-results: every calculator declares the same fields, in the same order (Run 45: name, email and the box to tick; no opt-in)',
       sorted(set(tuple(f[1] for f in form['fields']) for _, form in netlify.get('calculator-results', []))),
       [pagebuild.AFTER_FIELDS])
    eq('14. calculator-results: the box to tick is never ticked in the markup',
       sorted(set(f for _, form in netlify.get('calculator-results', []) for f in form['fields'] if f[0] == 'checkbox')),
       [('checkbox', 'consent', 'yes')])
    eq('14. and no form stands in front of the booking calendar (Run 45)', 'booking' in netlify, False)
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
            ('a 20% that is not about directors', 'pensions-over-50.html', 'The tax-free amount can be lower too.',
             'The tax-free amount can be lower too. Tax at 20% is the standard rate.', False)):
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
    # and a script that brings back its own rate. Run 36: the calculator's
    # two sentences in words (#pbPrsiSalary under "Taken as salary",
    # #pbPrsiAssume in the assumptions) carry the table's statics(), true on
    # any date; pb-prsi.js writes the day's own as it loads (prsi.test.js 5).
    prsi_js = read('assets/js/pb-prsi.js')
    rates = [dict(pct=m.group(4), rate=float(m.group(3)), said=m.group(5))
             for m in re.finditer(r"\{ from: \[(\d+), (\d+), \d+\], rate: ([0-9.]+), pct: '([^']+)', said: '([^']+)' \}", prsi_js)]
    eq('17. the PRSI table has its rates', [r['pct'] for r in rates], ['4.2%', '4.35%'])
    latest = rates[-1]
    keep = round(round(1000 * (1 - (0.40 + 0.08 + latest['rate'])) * 100) / 100 + 1e-9)
    import subprocess as sp17
    words = json.loads(sp17.run(['node', '-e', "process.stdout.write(JSON.stringify(require('./assets/js/pb-prsi.js').statics()))"],
                                cwd=ROOT, capture_output=True, text=True).stdout or '{}')

    def prsi_findings(docs):
        out = []
        calc, dire = docs['director-calculator.html'], docs['director.html']
        if 'id="pbCutPrsi" style="width:%s"' % latest['pct'] not in calc:
            out.append(('director-calculator.html', 'key bar'))
        if '<b id="pbCutPrsiN">%s</b> PRSI' % latest['pct'] not in calc:
            out.append(('director-calculator.html', 'key label'))
        split = round(20000 * (1 - (0.40 + 0.08 + latest['rate'])) + 1e-9)
        # Job 5: the split's sentence, at its default of 50% of €40,000
        if '<p class="vs-split-out" id="splitOut">Put 50% in your pension: you keep <b>€{:,}</b> now'.format(split) not in calc:
            out.append(('director-calculator.html', 'split line'))
        if not words or '<div class="lab" id="pbPrsiSalary">%s</div>' % words.get('salary') not in calc:
            out.append(('director-calculator.html', 'salary sentence'))
        if not words or '<li id="pbPrsiAssume">%s</li>' % words.get('assume') not in calc:
            out.append(('director-calculator.html', 'assumption sentence'))
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
            ('the split line at the old figure', 'director-calculator.html', 'you keep <b>€9,530</b> now', 'you keep <b>€9,560</b> now', 'split line'),
            ('the profit line at the old figure', 'director.html', '<b>&euro;%d</b> in your pocket' % keep, '<b>&euro;478</b> in your pocket', 'profit line'),
            ('a script with its own rate', 'director-calculator.html', 'var PRSI = PRSI_NOW.rate;', 'var PRSI = new Date() < new Date(2026, 9, 1) ? 0.042 : 0.0435;', 'a rate in the script'),
            ('the old one-decimal formatting', 'director.html', 'var pct=p.pct;', "var pct=(Math.round(prsi*1000)/10)+'%';", 'a rate in the script'),
            ('the salary sentence as it read to 30 September', 'director-calculator.html', 'id="pbPrsiSalary">lands in your pocket after up to 52.35%',
             'id="pbPrsiSalary">lands in your pocket after up to 52.2%', 'salary sentence'),
            ('the assumption as it read to 30 September', 'director-calculator.html', 'id="pbPrsiAssume">The salary comparison assumes a higher-rate taxpayer facing up to 52.35%',
             'id="pbPrsiAssume">The salary comparison assumes a higher-rate taxpayer facing up to 52.2%', 'assumption sentence')):
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
            ('the product caveat revealed', 'index.html', '<figcaption class="pb-product-cap">', '<figcaption class="pb-product-cap reveal">')):
        m = dict(sources)
        assert find in m[page], (label, find)
        m[page] = m[page].replace(find, repl, 1)
        eq('20. %s is caught' % label, sorted(pagebuild.caveat_drift(m)), [page])

    # ----------------------------------------------------------------- 21
    # Run 45, and the stripped booking page: the heading, one line, then the
    # calendar. No form in front of it, and none of the old reassurance.
    BOOK_H1, BOOK_LINE = 'Book a call with us', 'Free. 20 minutes.'
    FILLER = ('That is the lot.', 'We do not ask what you earn', 'none of it is needed to book a chat',
              'this site gives information, not advice', 'The house promise', 'class="timeline"',
              'class="lead-more"', 'class="qnote"', 'id="pbFrom"')
    def booking_faults(src):
        main = src[src.find('<main'):src.find('</main>')]
        out = []
        if '<form' in main:
            out.append('a form')
        h1, line, stage = main.find('<h1>%s</h1>' % BOOK_H1), main.find('<p class="sub">%s</p>' % BOOK_LINE), main.find('<div id="calStage">')
        if not 0 <= h1 < line < stage:
            out.append('order')
        if len(re.findall(r'<p\b', main[:stage])) != 1:
            out.append('more than one line before the calendar')
        out += [w for w in FILLER if w in main]
        return out
    bk = sources['booking.html']
    eq('21. booking: the heading, one line, the calendar; no form, no filler', booking_faults(bk), [])
    gate = bk.replace('<div id="calStage">', '<form id="qualForm"><input name="name"></form>\n    <div id="calStage">', 1)
    eq('21. a form put back in front of the calendar is caught', 'a form' in booking_faults(gate), True)
    back = bk.replace('<div id="calStage">', '<p class="qnote">That is the lot.</p>\n    <div id="calStage">', 1)
    eq('21. the old note put back is caught', 'That is the lot.' in booking_faults(back), True)

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
    # the viewport meta and the head script, together, moved below the first
    # stylesheet (since Run 34 the page's own <style>: no font stylesheet)
    bk = sources['booking.html']
    pair = VIEWPORT + '\n' + pagebuild.MOTION_HEAD + '\n'
    first = re.search(r'<link\b[^>]*\brel="stylesheet"|<style\b', bk)
    assert pair in bk and first and bk.find(pair) < first.start()
    moved = bk.replace(pair, '', 1)
    end = moved.index('</style>\n') + len('</style>\n')
    moved = moved[:end] + pair + moved[end:]
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
    # no --pb-t level, no data-pb-state, no amber or red (Run 42), no rotation or transition
    # beyond the dial's fixed cross, and no script that writes #pbSafe.
    def safe(src):
        out = []
        css = re.sub(r'(?s)/\*.*?\*/', '', ' '.join(re.findall(r'(?is)<style[^>]*>(.*?)</style>', src)))
        rules = [(' '.join(sel.split()), b) for sel, b in re.findall(r'([^{}]*)\{([^{}]*)\}', css) if 'pb-safe' in sel]
        if not rules:
            out.append('no safe')
        for sel, b in rules:
            if re.search(r'var\(--pb-t\b(?!-)|--amber|--red|transition|animation|rotateY|perspective', b):
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
            ('the red fill put back', '</style>', '.pb-safe-fill{background:var(--red)}\n</style>', 'moves: .pb-safe-fill'),
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
    WORDS = '<p>May we use cookies for analytics and ads? <a href="privacy.html#cookies">Privacy Notice</a></p>'
    eq('28. the cookie bar says the approved line, and only it', (consent_js.count(WORDS), 'never sold' in consent_js), (1, False))
    HEROES = ('index.html', 'director.html', 'starter.html', 'tracker.html')
    def lockups(src):
        # the hero's container, its two copies, where each sits, and whether they say the same
        i = src.find('<div class="pb-hero-copy">') if '<div class="pb-hero-copy">' in src else src.find('<div class="hero-copy pb-hero-copy">')
        # the box ends at the nearer of the chart column and the hero's end (Run 42:
        # the home hero ends on its chart; the chat pictures are gone from the rest)
        ends = [e for e in (src.find('\n  <div class="pb-hero-chart">', i), src.find('\n</div></header>', i)) if e >= 0]
        end = min(ends) if ends else -1
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

    # ----------------------------------------------------------------- 29
    # Run 34, item 2: the fonts are the site's own. No page (the games
    # included) asks Google Fonts for anything; the FONTS block names every
    # file in assets/fonts/, each a real woff2 there, with its licence; each
    # page preloads the Latin Inter file once, before its first stylesheet,
    # with crossorigin (a font preload without it is fetched twice).
    # Run 46: Geist, one variable file, in place of Inter's seven
    FONT_FILES = ['geist-variable', 'schibsted-grotesk-latin-ext', 'schibsted-grotesk-latin']
    def fonts(src, prefix=''):
        out = []
        if re.search(r'fonts\.(?:googleapis|gstatic)\.com', src):
            out.append('asks Google Fonts')
        named = re.findall(r"url\(%sassets/fonts/([a-z-]+)\.woff2\) format\('woff2'\)" % re.escape(prefix), src)
        if sorted(named) != sorted(FONT_FILES):
            out.append('font files named: %s' % sorted(set(named) ^ set(FONT_FILES)))
        pre = '<link rel="preload" href="%sassets/fonts/geist-variable.woff2" as="font" type="font/woff2" crossorigin>' % prefix
        first = re.search(r'<link\b[^>]*\brel="stylesheet"|<style\b', src)
        if src.count(pre) != 1 or not first or src.find(pre) > first.start():
            out.append('preload')
        return out
    eq('29. every page: no request to Google Fonts, its own three font files, Geist preloaded',
       {n: fonts(t) for n, t in sources.items() if fonts(t)}, {})
    eq('29. and the two games, from one level down',
       {g: fonts(t, '../') for g, t in games.items() if fonts(t, '../')}, {})
    real = {}
    for f in FONT_FILES:
        path = os.path.join(ROOT, 'assets', 'fonts', f + '.woff2')
        real[f] = os.path.isfile(path) and open(path, 'rb').read(4) == b'wOF2' and os.path.getsize(path) > 5000
    eq('29. each named file is a woff2 in assets/fonts/', [f for f, ok in real.items() if not ok], [])
    eq('29. with the two licences beside them',
       [n for n in ('OFL-Geist.txt', 'OFL-SchibstedGrotesk.txt')
        if 'SIL Open Font License' not in read('assets/fonts/' + n)], [])
    pc = sources['pension-calculator.html']
    for label, mut, want in (
            ('the Google stylesheet back', pc.replace('</title>', '</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">', 1), 'asks Google Fonts'),
            ('a font file dropped from the block', pc.replace("url(assets/fonts/geist-variable.woff2) format('woff2')", "url(x.woff2) format('woff2')", 1), 'font files named'),
            ('the preload without crossorigin', pc.replace('type="font/woff2" crossorigin>', 'type="font/woff2">', 1), 'preload')):
        assert mut != pc, label
        eq('29. %s is caught' % label, any(x.startswith(want) for x in fonts(mut)), True)

    # ----------------------------------------------------------------- 30
    # Run 34, item 3: search and sharing. tools/seo.py writes every page's
    # block; this holds what it writes to the pages' own words. Every page
    # in the sitemap: a title under 60 characters and a description under
    # 155, each its own; the canonical and og:url its sitemap address; the
    # share picture there at its stated size. Structured data: valid JSON,
    # schema.org, only the three types the site uses; a two-step
    # BreadcrumbList ending at the page; the business on the home page, in
    # the footer's own sentence and address, with no phone (the site shows
    # none); FAQPage only where the page shows those questions and answers,
    # word for word. A page the sitemap leaves out carries none of it.
    import seo
    import html as htmllib
    from PIL import Image
    everything = dict(sources, **{'games/' + g: t for g, t in games.items()})
    INDEX = seo.indexable()
    def norm(t):
        t = htmllib.unescape(t).replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
        return re.sub(r'\s+', ' ', t).strip()
    def visible(src):
        body = src[src.find('<body'):]
        return norm(re.sub(r'<[^>]+>', ' ', re.sub(r'(?is)<script\b.*?</script>|<style\b.*?</style>', '', body)))
    def seo_findings(name, src):
        out = []
        head = src[:src.find('</head>')]
        if seo.apply(name, src) != src:
            out.append('block not as tools/seo.py writes it')
        title = norm(re.search(r'<title>(.*?)</title>', head, re.S).group(1))
        desc = norm(re.search(r'<meta name="description" content="([^"]*)"', head).group(1))
        blocks = []
        for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', src, re.S):
            try:
                blocks.append(json.loads(m.group(1)))
            except ValueError as e:
                out.append('JSON-LD does not parse: %s' % e)
        can = re.findall(r'<link rel="canonical" href="([^"]*)">', head)
        if name not in INDEX:
            if can or 'og:url' in head or blocks:
                out.append('not in the sitemap, yet carries a canonical, og:url or JSON-LD')
            return out
        if len(title) >= 60: out.append('title %d characters' % len(title))
        if len(desc) >= 155: out.append('description %d characters' % len(desc))
        if can != [seo.url_of(name)] or head.count('<meta property="og:url" content="%s">' % seo.url_of(name)) != 1:
            out.append('canonical or og:url is not the sitemap address')
        img = re.search(r'<meta property="og:image" content="https://pensionbuddy\.ie/([^"]+)">', head)
        wh = (int(re.search(r'og:image:width" content="(\d+)"', head).group(1)), int(re.search(r'og:image:height" content="(\d+)"', head).group(1)))
        path = os.path.join(ROOT, img.group(1)) if img else ''
        if not img or not os.path.isfile(path) or Image.open(path).size != wh:
            out.append('share picture missing or not %dx%d' % wh)
        types = [b.get('@type') for b in blocks]
        if any(b.get('@context') != 'https://schema.org' for b in blocks) or not set(types) <= {'FinancialService', 'FAQPage', 'BreadcrumbList'}:
            out.append('JSON-LD types: %s' % types)
        for b in blocks:
            if b.get('@type') == 'BreadcrumbList':
                items = b['itemListElement']
                if ([i['position'] for i in items] != [1, 2] or items[0]['item'] != seo.SITE
                        or items[-1]['item'] != seo.url_of(name) or not all(i.get('name') for i in items)):
                    out.append('breadcrumb is not Home, then the page')
            if b.get('@type') == 'FAQPage':
                vis = visible(src)
                for q in b['mainEntity']:
                    if norm(q['name']) not in vis or norm(q['acceptedAnswer']['text']) not in vis:
                        out.append('FAQ not word for word on the page: %s' % q['name'][:40])
            if b.get('@type') == 'FinancialService':
                foot = norm(re.sub(r'<[^>]+>', ' ', src[src.rfind('<footer'):]))
                addr = b['address']
                if (b['description'] not in foot or addr['streetAddress'] not in foot or addr['addressLocality'] not in foot
                        or addr['addressRegion'] not in foot or 'mailto:%s' % b['email'] not in src or 'telephone' in b
                        or b['legalName'] not in foot or b['url'] != seo.SITE):
                    out.append('the business data is not the footer\'s')
        want = ['FinancialService'] if name == 'index.html' else ['BreadcrumbList']
        if [t for t in types if t != 'FAQPage'] != want:
            out.append('JSON-LD should be %s (and FAQPage where a FAQ is shown)' % want)
        return out
    eq('30. every page: its search and sharing tags, and its structured data, held to its own words',
       {n: seo_findings(n, t) for n, t in everything.items() if seo_findings(n, t)}, {})
    titles = {}
    descs = {}
    for n in INDEX:
        h = everything[n][:everything[n].find('</head>')]
        titles.setdefault(norm(re.search(r'<title>(.*?)</title>', h, re.S).group(1)), []).append(n)
        descs.setdefault(norm(re.search(r'<meta name="description" content="([^"]*)"', h).group(1)), []).append(n)
    eq('30. no two pages in the sitemap share a title or a description',
       [v for v in list(titles.values()) + list(descs.values()) if len(v) > 1], [])
    eq('30. and every page in the sitemap is a page', [n for n in INDEX if n not in everything], [])
    st = sources['starter.html']
    ix = sources['index.html']
    q = "We'll look at whether it's set up well."
    for label, name, src, want in (
            ('a title of 60 characters', 'terms.html', sources['terms.html'].replace('<title>Terms of Business, Pensionbuddy</title>',
                                                                                    '<title>' + 'T' * 60 + '</title>', 1), 'title 60'),
            ('a FAQ answer the page no longer shows', 'starter.html', st.replace(q, "We'll tell you whether it's set up well for you.", 1), 'FAQ not word for word'),
            ('a phone number added to the business', 'index.html', ix.replace('"email": "hello@pensionbuddy.ie"', '"telephone": "+353 1 000 0000", "email": "hello@pensionbuddy.ie"', 1), 'block not as'),
            ('a canonical on a held page', 'thank-you.html', sources['thank-you.html'].replace('</title>', '</title>\n<link rel="canonical" href="https://pensionbuddy.ie/thank-you.html">', 1), 'block not as')):
        assert src != everything[name], label
        eq('30. %s is caught' % label, any(x.startswith(want) for x in seo_findings(name, src)), True)

    # ----------------------------------------------------------------- 31
    # Run 35: Damian's qualifications and memberships. One list, the same
    # words everywhere, in the places the brief named: under Damian's own
    # section of the home page (Run 36 took the second copy, at the end of
    # the story, off, at Damian's word), beside the booking form, and small
    # in every page's footer (the foot-top, so chrome_drift holds it
    # to the skeleton's on every page, and check 8 says so). The label says
    # whose they are, so no body seems to endorse Pensionbuddy; nothing else
    # is said in the strip, and nothing in it moves. (Checks 29 and 30 are
    # Run 34's, merged into main in Run 36.)
    QUAL_LABEL = 'Damian&rsquo;s qualifications and memberships'
    QUAL_ITEMS = ['Qualified Financial Adviser (QFA)', 'Life Insurance Association (LIA)']
    # (the stripped booking page keeps only the footer's)
    WHERE = {'index.html': ['pbQualsDamian', 'pbQualsFoot']}

    def quals(src):
        """[(id, label, names, image faults, extra words)] for every strip, in
        page order. An item's name is its text, or, for an item that is only a
        logo, the logo's alt text; every logo must carry the name of the item it
        sits in as its alt text."""
        out = []
        for m in re.finditer(r'<div class="pb-quals(?: pb-quals-sm)?">', src):
            # the strip holds no <div>, so it ends at the first </div>
            box = src[m.end():src.find('</div>', m.end())]
            lab = re.search(r'<p class="pb-quals-label" id="([^"]+)">(.*?)</p>\s*<ul class="pb-quals-list" aria-labelledby="([^"]+)">', box, re.S)
            if not lab or lab.group(1) != lab.group(3):
                out.append(('unlabelled', None, None, None, None))
                continue
            names, bad = [], []
            for li in re.findall(r'<li>(.*?)</li>', box, re.S):
                imgs = re.findall(r'<img\b[^>]*>', li)
                alts = [re.search(r'\salt="([^"]*)"', i) for i in imgs]
                text = re.sub(r'<[^>]+>', '', li).strip()
                name = text or (alts[0].group(1) if alts and alts[0] else '')
                names.append(name)
                if any(a is None or a.group(1) != name for a in alts):
                    bad.append(name)
            words = re.sub(r'<p class="pb-quals-label".*?</p>|<li>.*?</li>|<[^>]+>|\s', '', box, flags=re.S)
            out.append((lab.group(1), lab.group(2), names, bad, words))
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
                if g[3]:
                    f.append('%s %s: a logo without its own item\'s full name as alt text: %s' % (page, g[0], g[3]))
                if g[4]:
                    f.append('%s %s: words in the strip beyond its label and names: %r' % (page, g[0], g[4][:40]))
        for page in sorted(n for n in srcs if n not in WHERE):
            got = quals(srcs[page])
            if [g[0] for g in got] != ['pbQualsFoot']:
                f.append('%s: strips %s, expected the footer\'s only' % (page, [g[0] for g in got]))
        ix = srcs['index.html']
        damian = ix.find('<section id="damian"')
        if not (damian < ix.find('id="pbQualsDamian"') < ix.find('<section id="adam"')):
            f.append('index.html: the strip is not in Damian\'s section')
        skel = srcs['pension-calculator.html']
        c = pagebuild.css_span(skel, 'QUALS')
        block = re.sub(r'/\*.*?\*/', '', skel[c[0]:c[1]], flags=re.S) if c else ''
        if not block or re.search(r'transition|animation|transform|@keyframes', block):
            f.append('the QUALS block is missing, or something in it moves')
        return f

    eq('31. Damian\'s qualifications and memberships: the same label and names in the three places, and nothing else',
       quals_faults(sources), [])
    for label, page, find, repl, want in (
            ('the label changed to a claim', 'index.html', 'id="pbQualsDamian">Damian&rsquo;s qualifications and memberships',
             'id="pbQualsDamian">Accredited by', 'the label is'),
            ('a name dropped from Damian\'s section', 'index.html',
             'aria-labelledby="pbQualsDamian"><li>Qualified Financial Adviser (QFA)</li>', 'aria-labelledby="pbQualsBook">', 'the items are'),
            ('a body added', 'index.html', '<li>Life Insurance Association (LIA)</li></ul>\n    </div>\n  </div>\n</div></section>\n\n<section id="adam"',
             '<li>Life Insurance Association (LIA)</li><li>Brokers Ireland</li></ul>\n    </div>\n  </div>\n</div></section>\n\n<section id="adam"', 'the items are'),
            ('the story\'s copy put back', 'index.html', 'So they built Pensionbuddy together.</p>\n  </div>',
             'So they built Pensionbuddy together.</p>\n<div class="pb-quals"><p class="pb-quals-label" id="pbQualsStory">Damian&rsquo;s qualifications and memberships</p>'
             '<ul class="pb-quals-list" aria-labelledby="pbQualsStory"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul></div>\n  </div>', 'strips'),
            ('an endorsement line added', 'index.html',
             'aria-labelledby="pbQualsDamian"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>',
             'aria-labelledby="pbQualsDamian"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>'
             '<p>Pensionbuddy is recommended by the LIA.</p>', 'beyond its label'),
            ('a logo with empty alt text', 'index.html', '<li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>\n    </div>',
             '<li><img src="assets/logos/qfa.svg" alt="">Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>\n    </div>', 'without its own'),
            ('a logo with no alt at all', 'index.html', '<li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>\n    </div>',
             '<li><img src="assets/logos/qfa.svg">Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul>\n    </div>', 'without its own'),
            ('the other body\'s logo in an item', 'index.html', 'aria-labelledby="pbQualsDamian"><li>Qualified Financial Adviser (QFA)</li>',
             'aria-labelledby="pbQualsDamian"><li><img src="assets/logos/lia.svg" alt="Life Insurance Association (LIA)">Qualified Financial Adviser (QFA)</li>', 'without its own'),
            ('a label no longer tied to its list', 'index.html', 'id="pbQualsDamian"', 'id="pbQualsDamianX"', 'strips'),
            ('the strip put back on the booking page', 'booking.html', '<div class="book-card">',
             '<div class="pb-quals"><p class="pb-quals-label" id="pbQualsBook">Damian&rsquo;s qualifications and memberships</p><ul class="pb-quals-list" aria-labelledby="pbQualsBook"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul></div>\n  <div class="book-card">', 'strips'),
            ('a strip added to another page\'s main', 'director.html', '</main>',
             '<div class="pb-quals"><p class="pb-quals-label" id="pbQualsX">Damian&rsquo;s qualifications and memberships</p><ul class="pb-quals-list" aria-labelledby="pbQualsX"><li>Qualified Financial Adviser (QFA)</li><li>Life Insurance Association (LIA)</li></ul></div></main>', 'strips'),
            ('motion put in the block', 'pension-calculator.html', '.pb-quals{margin:28px 0 0}', '.pb-quals{margin:28px 0 0;transition:opacity .3s}', 'moves')):
        mut = dict(sources)
        mut[page] = sources[page].replace(find, repl, 1)
        assert mut[page] != sources[page], label
        eq('31. %s is caught' % label, any(want in x for x in quals_faults(mut)), True)

    # ----------------------------------------------------------------- 32
    # Run 35: "Just here to learn?" on the home page, straight after its
    # first section (the gap band), before the calculator band. Two cards,
    # Buddy's Run then Jargon Battle: each a still photograph of the real
    # game mid-play, the picture tools/shoot-product.py takes (both in its
    # SHOTS), its width and height the file's own, a line, and a play link
    # to the game. Static: the section's rules move nothing, no script
    # touches it, and it offers nothing to win. Each card is a whole-card
    # link, so (Run 36) it carries .pb-card-link: MOTION rule 5's shadow on
    # hover and focus, as every whole-card link does since Run 34.
    GAMES = [('Buddy&rsquo;s Run', 'buddys-run', 'Collect the benefits, jump the excuses.'),
             ('Jargon Battle', 'jargon-battle', 'Pick the right meaning to bust the Jargon Blob.')]

    def jpeg_size(rel):
        b = open(os.path.join(ROOT, rel), 'rb').read()
        i = 2
        while i < len(b) - 9:
            if b[i] != 0xFF:
                return None
            marker, length = b[i + 1], int.from_bytes(b[i + 2:i + 4], 'big')
            if marker in (0xC0, 0xC1, 0xC2):
                return int.from_bytes(b[i + 7:i + 9], 'big'), int.from_bytes(b[i + 5:i + 7], 'big')
            i += 2 + length
        return None

    def learn_faults(ix):
        f = []
        # one comment at most between the two, and never a span across others
        # (Run 37: with a comment earlier on the page, `<!--.*?-->` reached
        # from there to this one); since 7 October 2026 the provider logos
        # (their comment, mount and still row) may sit between, and nothing else
        m = re.search(r'</section>\s*(?:<!--(?:(?!-->).)*-->\s*<div data-pb-providers hidden></div>\s*<noscript><div class="pb-prov-ns">(?:(?!</noscript>).)*</div></noscript>\s*)?(?:<!--(?:(?!-->).)*-->\s*)?<section class="pb-learn" id="learn"><div class="wrap">(.*?)</div></section>\s*<section id="calc"', ix, re.S)
        gap = ix.find('<section class="pb-changed" id="changed" aria-labelledby="pbChangedH">')
        if not m or gap < 0 or not (gap < m.start() < ix.find('<section id="calc"')) or ix.find('<section', gap + 1) != ix.find('<section class="pb-learn"'):
            return ['the section is not straight after "What\'s changed?" and before the calculator band']
        box = m.group(1)
        if '<h2>Play the jargon buster.</h2>' not in box:
            f.append('the heading')
        # (Run 38: the picture sits in .pb-learn-media with the video over it;
        # check 43 holds the video and its button)
        cards = re.findall(r'<li><div class="pb-learn-card pb-card-link">\s*(?:<div class="pb-learn-media">\s*)?<picture><source type="image/webp" srcset="assets/img/product-([a-z-]+)\.webp\?v=[0-9a-f]+">'
                           r'<img src="assets/img/product-([a-z-]+)\.jpg\?v=[0-9a-f]+" width="(\d+)" height="(\d+)" loading="lazy" alt="([^"]+)"></picture>\s*'
                           r'(?:<video\b.*?</video>\s*<button\b[^>]*>.*?</button>\s*</div>\s*)?'
                           r'<div class="pb-learn-body">\s*<h3>([^<]+)</h3>\s*<p class="pb-learn-d">([^<]+)</p>\s*'
                           r'<a class="pb-learn-play" href="games/([a-z-]+)\.html">Play ([^<]+?) <svg[^>]*>.*?</svg></a>\s*</div>\s*</div></li>', box, re.S)
        if len(cards) != 2 or box.count('<li>') != 2:
            f.append('%d whole cards, expected 2' % len(cards))
        for (name, slug, line), c in zip(GAMES, cards):
            webp, jpg, w, h, alt, title, d, href, play = c
            if (webp, jpg, href) != (slug, slug, slug):
                f.append('%s: the picture or the link is not the game\'s' % slug)
            if (title, play, d) != (name, name, line):
                f.append('%s: the title, the play link or the line' % slug)
            if not alt.startswith(name + ', mid-game: '):
                f.append('%s: the alt text' % slug)
            size = jpeg_size('assets/img/product-%s.jpg' % slug) if os.path.isfile(os.path.join(ROOT, 'assets/img/product-%s.jpg' % slug)) else None
            if size != (int(w), int(h)) or not os.path.isfile(os.path.join(ROOT, 'assets/img/product-%s.webp' % slug)):
                f.append('%s: the files, or width and height not the picture\'s own (%s)' % (slug, size))
        css = re.search(r'/\* Run 35: "Just here to learn\?".*?\*/(.*?)@media\(max-width:760px\)\{\.pb-learn-grid[^\n]*\n', ix, re.S)
        if not css or re.search(r'transition|animation|transform|@keyframes', css.group(1)) or re.search(r'pb-learn|#learn', ''.join(re.findall(r'<script\b[^>]*>(.*?)</script>', ix, re.S))):
            f.append('the section moves, or a script touches it')
        text = re.sub(r'<[^>]+>', ' ', box).lower()
        if re.search(r'\b(win|won|prize|reward|earn|badge|points|free gift)\b', text):
            f.append('the section offers something to win')
        return f

    shots = open(os.path.join(ROOT, 'tools/shoot-product.py'), encoding='utf-8').read()
    eq('32. "Just here to learn?": after the first section, two game cards, each the real game\'s picture, a line and a play link, still',
       (learn_faults(sources['index.html']), "'buddys-run': {'page': 'games/buddys-run.html'" in shots,
        "'jargon-battle': {'page': 'games/jargon-battle.html'" in shots), ([], True, True))
    ix = sources['index.html']
    for label, find, repl, want in (
            ('the section moved below the calculator band', None, None, 'straight after'),
            ('a card with no play link', 'href="games/jargon-battle.html">Play Jargon Battle', 'href="games/jargon-battle.html">Try it', 'whole cards'),
            ('a card pointing at the other game', 'href="games/buddys-run.html">Play Buddy', 'href="games/jargon-battle.html">Play Buddy', 'the link is not'),
            ('the picture\'s height not its own', 'jpg?v=', None, 'width and height'),
            ('a hover that lifts', '.pb-learn-card:hover{border-color:var(--teal);background:var(--teal-50)}',
             '.pb-learn-card:hover{border-color:var(--teal);background:var(--teal-50);transform:translateY(-2px)}', 'moves'),
            ('a reward on offer', '<span class="kicker">Learn it the fun way</span>',
             '<span class="kicker">Learn it the fun way, and win a prize</span>', 'offers something to win')):
        if find is None:
            # take the section out and put it back after the calculator band
            s0 = ix.find('<!-- JUST HERE TO LEARN?')
            s1 = ix.find('<section id="calc"')
            sec = ix[s0:s1]
            rest = ix[:s0] + ix[s1:]
            c1 = rest.find('</div></section>', rest.find('<section id="calc"')) + len('</div></section>\n')
            mut = rest[:c1] + '\n' + sec + rest[c1:]
        elif repl is None:
            mut = re.sub(r'(product-buddys-run\.jpg\?v=[0-9a-f]+" width="2400" height=")1350', r'\g<1>1400', ix, count=1)
        else:
            mut = ix.replace(find, repl, 1)
        assert mut != ix, label
        eq('32. %s is caught' % label, any(want in x for x in learn_faults(mut)), True)

    # ----------------------------------------------------------------- 33
    # Run 37, item 1: "What's changed?" on the home page. Since Run 42 it sits
    # straight after the way-of-life band (#life), which follows the hero, and
    # before the provider logos and the games (logos moved 7 October 2026). Six plain links, one per change in
    # a life, each to the live page that already covers it; each link's name
    # starts with its visible words and then names the page as the nav does
    # (WCAG 2.5.3). Nothing runs and nothing is stored: no script mentions
    # it, and its rules change colours only.
    CHANGED = [('New job', 'broker-vs-autoenrolment.html'),
               ('Left a job', 'tracker.html'),
               ('Started a company', 'director.html'),
               ('Turning 50', 'pensions-over-50.html'),
               ('Had a baby or a career break', 'state-pension-entitlement.html'),
               ('Moved from the UK', 'uk-pensions-in-ireland.html')]
    skel_nav = sources['pension-calculator.html']
    nav_label = dict((h, re.sub(r'<[^>]+>', '', l).strip()) for h, l in
                     re.findall(r'<a class="lnk(?: active)?" href="([^"#]+)"(?: aria-current="page")?>(.*?)</a>', skel_nav))

    def changed_faults(ix):
        f = []
        life = ix.find('</section>', ix.find('<section class="pb-gap-more" id="life">'))
        m = re.search(r'<section class="pb-changed" id="changed" aria-labelledby="pbChangedH"><div class="wrap">(.*?)</div></section>', ix, re.S)
        if not m or life < 0 or not (life < m.start() < ix.find('<section class="pb-learn"')) or re.search(r'<(?:section|div|header)\b', ix[life + len('</section>'):m.start()]):
            return ['the section is not straight after the way-of-life band, before the games']
        box = m.group(1)
        if '<h2 class="pb-changed-h" id="pbChangedH">What&rsquo;s changed?</h2>' not in box:
            f.append('the heading')
        links = re.findall(r'<li><a class="pb-changed-chip" href="([^"]+)" aria-label="([^"]+)">([^<]+)</a></li>', box)
        if len(links) != 6 or box.count('<li') != 6 or box.count('<a ') != 6:
            f.append('%d links, expected 6' % len(links))
        for (label, page), (href, name, text) in zip(CHANGED, links):
            if (text, href) != (label, page):
                f.append('%s: goes to %s, expected %s' % (text, href, page))
            if name != '%s: %s' % (text, nav_label.get(href, '?')):
                f.append('%s: its name does not start with its words and name the page as the nav does' % text)
            target = os.path.join(ROOT, href)
            if not os.path.isfile(target) or pagebuild.NOINDEX in read(href):
                f.append('%s: %s is not a live page' % (text, href))
        css = re.search(r'/\* Run 37, item 1: "What\'s changed\?".*?\*/(.*?)@media\(prefers-reduced-motion:reduce\)\{\.pb-changed-chip\{transition:none\}\}', ix, re.S)
        scripts = ''.join(re.findall(r'<script\b[^>]*>(.*?)</script>', ix, re.S))
        if not css or re.search(r'transform|animation|@keyframes|translate', css.group(1)) or re.search(r'pb-changed|#changed|getElementById\(.changed', scripts):
            f.append('the section moves, or a script touches it')
        return f

    eq('33. "What\'s changed?": after the way-of-life band, six links to the live pages that cover each change, named for where they go, still',
       changed_faults(sources['index.html']), [])
    ix = sources['index.html']
    for label, find, repl, want in (
            ('the section moved above the provider logos', None, None, 'straight after'),
            ('a link to a held page', 'href="tracker.html" aria-label="Left a job: Find a pension"',
             'href="find-my-pension.html" aria-label="Left a job: Find a pension"', 'not a live page'),
            ('a name that does not start with the words', 'aria-label="Turning 50: Pensions after 50"',
             'aria-label="Pensions after 50"', 'its name'),
            ('a hover that lifts', '.pb-changed-chip:hover{border-color:var(--teal);',
             '.pb-changed-chip:hover{transform:translateY(-2px);border-color:var(--teal);', 'moves'),
            ('a seventh link', '<li><a class="pb-changed-chip" href="uk-pensions-in-ireland.html"',
             '<li><a class="pb-changed-chip" href="glossary.html" aria-label="Other: Pension jargon buster">Other</a></li>\n    <li><a class="pb-changed-chip" href="uk-pensions-in-ireland.html"', 'links, expected 6'),
            ('a script that stores the choice', '</body>',
             '<script>document.querySelector(\'#changed\').addEventListener(\'click\',function(){localStorage.x=1})</script></body>', 'a script touches it')):
        if find is None:
            s0 = ix.find("<!-- WHAT'S CHANGED?")
            s1 = ix.find('<!-- JUST HERE TO LEARN?')
            sec = ix[s0:s1]
            rest = ix[:s0] + ix[s1:]
            tk = rest.find('<!-- PROVIDER TICKER')
            mut = rest[:tk] + sec + rest[tk:]
        else:
            mut = ix.replace(find, repl, 1)
        assert mut != ix, label
        eq('33. %s is caught' % label, any(want in x for x in changed_faults(mut)), True)

    # ----------------------------------------------------------------- 34
    # Run 37, item 2: the jargon buster's words at the first use of each term.
    # assets/js/pb-glossary.js is the buster word for word (tools/site-index.py
    # writes it; a buster edited without a rerun fails here). pb-terms.js is
    # on the pages with running prose for a reader to meet a term in, and on
    # none of the others: the buster itself, the legal pages, how we work,
    # booking, the thank-you page and the 404. Both load late. It stores and
    # sends nothing, and nothing it draws moves.
    import importlib.util
    spec = importlib.util.spec_from_file_location('site_index', os.path.join(ROOT, 'tools', 'site-index.py'))
    site_index = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(site_index)
    TERMS_HAND = ['director-calculator.html', 'director-year-end-checklist.html', 'director.html', 'index.html',
                  'old-pension-checklist.html', 'pension-calculator.html', 'pensions-over-50.html',
                  'self-employed-pensions.html', 'starter.html', 'tracker.html', 'uk-pensions-in-ireland.html']
    TERMS_PAGES = sorted(TERMS_HAND + [p.out for p in pagebuild.PAGES.values()])
    LATE = (r'<script src="assets/js/pb-glossary\.js\?v=[0-9a-f]+" type="text/pb-late"></script>\n'
            r'<script src="assets/js/pb-terms\.js\?v=[0-9a-f]+" type="text/pb-late"></script>\n')

    def terms_faults(srcs, gloss_src, runtime):
        f = []
        if site_index.glossary_js_from(gloss_src) != read('assets/js/pb-glossary.js'):
            f.append('pb-glossary.js is not the jargon buster as it stands: run tools/site-index.py')
        have = sorted(n for n, s in srcs.items() if 'assets/js/pb-terms.js' in s or 'assets/js/pb-glossary.js' in s)
        if have != TERMS_PAGES:
            f.append('on the wrong pages: %s' % sorted(set(have) ^ set(TERMS_PAGES)))
        for n in have:
            if len(re.findall(LATE, srcs[n])) != 1:
                f.append('%s: not the two late tags, once' % n)
        if re.search(r'localStorage|sessionStorage|document\.cookie|indexedDB|fetch\(|XMLHttpRequest|sendBeacon', runtime):
            f.append('pb-terms.js stores or sends something')
        if re.search(r'transition|animation|@keyframes|\.animate\(', runtime):
            f.append('pb-terms.js moves something')
        return f

    runtime = read('assets/js/pb-terms.js')
    gloss = sources['glossary.html']
    eq('34. jargon definitions: pb-glossary.js is the buster word for word; pb-terms.js late, on the prose pages only; stores nothing, moves nothing',
       terms_faults(sources, gloss, runtime), [])
    for label, target, find, repl, want in (
            ('a buster entry edited without a rerun', 'gloss', 'A flexible personal pension you own, which moves with you between jobs.',
             'A personal pension you own, which moves with you between jobs.', 'not the jargon buster'),
            ('the definitions on the privacy notice', 'privacy.html', '</body>',
             '<script src="assets/js/pb-glossary.js?v=00000000" type="text/pb-late"></script>\n<script src="assets/js/pb-terms.js?v=00000000" type="text/pb-late"></script>\n</body>', 'wrong pages'),
            ('the definitions dropped from a guide', 'pensions-over-50.html', '<script src="assets/js/pb-terms.js', '<script src="assets/js/pb-termz.js', 'not the two late tags'),
            ('a definition that remembers', 'runtime', "pop.setAttribute('popover', 'manual');",
             "pop.setAttribute('popover', 'manual'); localStorage.setItem('pb-seen', e.id);", 'stores'),
            ('a definition that fades in', 'runtime', "'.pb-term-pop:not(:popover-open){display:none}'",
             "'.pb-term-pop{transition:opacity .2s}.pb-term-pop:not(:popover-open){display:none}'", 'moves')):
        srcs, g, r = dict(sources), gloss, runtime
        if target == 'gloss':
            g = gloss.replace(find, repl, 1)
            assert g != gloss, label
        elif target == 'runtime':
            r = runtime.replace(find, repl, 1)
            assert r != runtime, label
        else:
            srcs[target] = sources[target].replace(find, repl, 1)
            assert srcs[target] != sources[target], label
        eq('34. %s is caught' % label, any(want in x for x in terms_faults(srcs, g, r)), True)

    # ----------------------------------------------------------------- 35
    # Run 37, item 3: search. assets/js/pb-search-index.js is the live pages
    # and the jargon buster as they stand (tools/site-index.py), and never a
    # page held back with noindex. The nav carries one search button, after
    # the links and before the menu button, named "Search", saying it opens a
    # dialog and that "/" does the same; the NAV block draws it only with
    # JavaScript. Every page loads the search late and holds the index's tag
    # unexecuted (text/pb-lazy), so the index is fetched only when a reader
    # opens the search. The search stores and sends nothing, keeps nothing in
    # the address, and nothing it draws moves.
    live = dict((n, s) for n, s in sources.items())
    held = sorted(n for n, s in sources.items() if pagebuild.NOINDEX in s)
    BTN = ('<button class="nav-search" id="navSearch" type="button" aria-label="Search" aria-haspopup="dialog" aria-keyshortcuts="/">')
    TAGS = (r'<script src="assets/js/pb-search\.js\?v=[0-9a-f]+" type="text/pb-late"></script>\n'
            r'<script src="assets/js/pb-search-index\.js\?v=[0-9a-f]+" type="text/pb-lazy"></script>\n')

    def search_faults(srcs, index_text, runtime):
        f = []
        if site_index.search_js_from(dict(srcs), srcs['glossary.html']) != index_text:
            f.append('pb-search-index.js is not the pages as they stand: run tools/site-index.py')
        body = index_text[index_text.index('= ') + 2:index_text.index(';\nif')]
        urls = [p['u'] for p in json.loads(body)['pages']]
        if [u for u in urls if u in held]:
            f.append('the index holds a page held back: %s' % [u for u in urls if u in held])
        nav = srcs['pension-calculator.html']
        i = nav.find('<nav id="nav">')
        j = nav.find('</nav>', i)
        n = nav[i:j]
        if n.count(BTN) != 1 or not (n.find('id="navLinks"') < n.find(BTN) < n.find('id="navToggle"')):
            f.append('the nav\'s search button: not one, not named, or not between the links and the menu button')
        if '#navSearch{display:none;' not in nav or 'html.pb-js #navSearch{display:inline-flex}' not in nav:
            f.append('the search button is drawn without JavaScript')
        for name, s in sorted(srcs.items()):
            if len(re.findall(TAGS, s)) != 1:
                f.append('%s: not the search and its index, once, late and lazy' % name)
        if re.search(r'localStorage|sessionStorage|document\.cookie|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|pushState|replaceState|location\.hash\s*=', runtime):
            f.append('pb-search.js stores, sends or writes the address')
        if re.search(r'transition|animation|@keyframes|\.animate\(', runtime):
            f.append('pb-search.js moves something')
        return f

    index_text = read('assets/js/pb-search-index.js')
    search_rt = read('assets/js/pb-search.js')
    eq('35. search: the index is the live pages and the buster as they stand; one named button in the nav, drawn with JavaScript; every page, late and lazy; stores nothing, moves nothing',
       search_faults(live, index_text, search_rt), [])
    for label, target, find, repl, want in (
            ('a page retitled without a rerun', 'pensions-over-50.html', '<title>Pensions after 50, Pensionbuddy</title>',
             '<title>Pensions over 50, Pensionbuddy</title>', 'not the pages as they stand'),
            ('a held page in the index', 'index', '{"u":"index.html"', '{"u":"how-we-work.html","t":"How we work","d":"","h":"","s":[]},{"u":"index.html"', 'held back'),
            ('the button without its name', 'pension-calculator.html', 'aria-label="Search" aria-haspopup', 'aria-haspopup', 'search button'),
            ('the button drawn without JavaScript', 'pension-calculator.html', 'html.pb-js #navSearch{display:inline-flex}', '#navSearch{display:inline-flex}', 'without JavaScript'),
            ('a page without the search', 'privacy.html', 'type="text/pb-lazy"', 'type="text/pb-late"', 'privacy.html'),
            ('a search that remembers', 'runtime', "function typing(t) {", "function typing(t) { localStorage.setItem('q', 1);", 'stores'),
            ('a search that puts the words in the address', 'runtime', "function typing(t) {", "function typing(t) { location.hash = 'q';", 'address')):
        srcs, ix_t, rt = dict(live), index_text, search_rt
        if target == 'index':
            ix_t = index_text.replace(find, repl, 1)
            assert ix_t != index_text, label
        elif target == 'runtime':
            rt = search_rt.replace(find, repl, 1)
            assert rt != search_rt, label
        else:
            srcs[target] = live[target].replace(find, repl, 1)
            assert srcs[target] != live[target], label
        eq('35. %s is caught' % label, any(want in x for x in search_faults(srcs, ix_t, rt)), True)

    # ----------------------------------------------------------------- 36
    # Run 37, item 4: "Your pension through life" on the home page, after
    # "Six places to begin", before Revenue's deadline. An ordered list of
    # ages from 18 to 75, each a whole-card link to a live page; every
    # percentage and euro figure a step states is on the page it links to,
    # so the timeline says nothing the site does not. No step at 75 (nothing
    # on the site says what happens then: STATUS, Run 37, question 1). The
    # card beside the list is aria-hidden; the rules' date is under it; the
    # script only listens (no scrolling, nothing stored), and only the fill
    # and the mark move, never for a reader who asks for less motion.
    def timeline_faults(ix, srcs, js):
        f = []
        aud = ix.find('<section id="calc" ')
        dl = ix.find('<section class="tickband" id="deadline">')
        m = re.search(r'<section class="pb-tl-sec" id="through-life"><div class="wrap">(.*?)</div></section>', ix, re.S)
        if not m or not (aud < m.start() < dl) or ix.find('<section', aud + 1) != m.start():
            return ['the section is not straight after the calculator band and before the deadline']
        box = m.group(1)
        if '<span class="kicker">Your pension through life</span>' not in box or '<h2>What changes, and when.</h2>' not in box:
            f.append('the kicker or the heading')
        if '<div class="pb-tl-stage" aria-hidden="true">' not in box:
            f.append('the card is not aria-hidden')
        if '<p class="pb-src">Rules as at 24 September 2026. Budget 2027 is on 6 October 2026 and could change them.</p>' not in box:
            f.append('the rules\' date is missing')
        steps = re.findall(r'<li class="pb-tl-step pb-card-link" data-age="(\d+)" data-show="([^"]+)"><h3><a href="([^"#]+)(?:#([a-z-]+))?">([^<]+)</a></h3><p>(.*?)</p></li>', box)
        if len(steps) < 8 or len(steps) != box.count('<li'):
            f.append('%d steps' % len(steps))
        ages = [int(s[0]) for s in steps]
        if ages != sorted(ages) or not ages or ages[0] < 18 or ages[-1] > 75:
            f.append('the ages are not in order from 18 to 75')
        if 75 in ages:
            f.append('a step at 75, which nothing on the site describes')
        for age, show, href, frag, head, text in steps:
            page = srcs.get(href)
            if page is None or pagebuild.NOINDEX in page:
                f.append('%s: %s is not a live page' % (head, href))
                continue
            if frag and ('id="%s"' % frag) not in page:
                f.append('%s: no #%s on %s' % (head, frag, href))
            plain = html.unescape(re.sub(r'<[^>]+>', ' ', page))
            for fig in re.findall(r'€[\d,]+|\d+%', html.unescape(text + ' ' + show)):
                if fig not in plain:
                    f.append('%s: %s is not on %s' % (head, fig, href))
        if re.search(r'scrollTo|scrollBy|scrollIntoView|scrollTop\s*=|localStorage|sessionStorage|document\.cookie', js):
            f.append('the script scrolls the page or stores something')
        css = re.search(r'/\* Run 37, item 4: "Your pension through life"\..*?\*/(.*?)@media\(prefers-reduced-motion:reduce\)\{\.pb-tl-fill,\.pb-tl-mark\{transition:none\}\}', ix, re.S)
        if not css or re.findall(r'transition:([^;}]+)', css.group(1)) != ['width var(--pb-t-fill)', 'left var(--pb-t-fill)'] or re.search(r'animation|@keyframes', css.group(1)):
            f.append('something besides the fill and the mark moves, or it moves for a reader who asks for less')
        return f

    import html
    tl_js = read('assets/js/pb-timeline.js')
    ix = sources['index.html']
    eq('36. "Your pension through life": after the calculator band, ages 18 to 75 in order, each a link to a live page that states its figures; none at 75; the card hidden from screen readers; the date; nothing scrolls, nothing stored',
       timeline_faults(ix, sources, tl_js), [])
    for label, target, find, repl, want in (
            ('a figure the linked page does not state', 'ix', '<p>25% from 40 to 49.</p>', '<p>26% from 40 to 49.</p>', 'is not on'),
            ('a step at 75', 'ix', 'data-age="71"', 'data-age="75"', 'at 75'),
            ('a step to a held page', 'ix', '<h3><a href="state-pension-reality-check.html">At 66</a>', '<h3><a href="how-we-work.html">At 66</a>', 'not a live page'),
            ('a card screen readers hear', 'ix', '<div class="pb-tl-stage" aria-hidden="true">', '<div class="pb-tl-stage">', 'aria-hidden'),
            ('a script that scrolls', 'js', "steps.forEach(function (s) { io.observe(s); });", "steps.forEach(function (s) { io.observe(s); }); window.scrollTo(0, 0);", 'scrolls'),
            ('a card that bounces', 'ix', '.pb-tl-mark{position:absolute;', '.pb-tl-mark{animation:pbBounce 1s infinite;position:absolute;', 'moves')):
        mix, mjs = ix, tl_js
        if target == 'ix':
            mix = ix.replace(find, repl, 1)
            assert mix != ix, label
        else:
            mjs = tl_js.replace(find, repl, 1)
            assert mjs != tl_js, label
        eq('36. %s is caught' % label, any(want in x for x in timeline_faults(mix, sources, mjs)), True)

    # ----------------------------------------------------------------- 37
    # Save as A (Run 37, item 5) was cut on 8 October 2026, with the guess
    # card, the share row and the paw prints: fewer things on each page.
    eq('37. Save as A, the guess card, the share row and the paw prints are gone',
       sorted(n for n, t in sources.items() if any(x in t for x in (
           'id="pbAbSave"', '<script src="assets/js/pb-guess.js', '<script src="assets/js/pb-share.js',
           '<script src="assets/js/pb-report.js', '<script src="assets/js/pb-scenario.js',
           '<script src="assets/js/pb-badges.js', 'data-pb-badges="strip"', "classList.add('pb-preveil')"))), [])

    # ----------------------------------------------------------------- 38
    # Run 37, item 6: the six long guides. Each carries one "On this page"
    # list after its introduction, whose links are its own sections in
    # order, each link's words its heading's words; one next-step card at
    # the end, to a live page, in words already on the site; and
    # assets/js/pb-guide.js once. No other page has any of the three. The
    # script keeps the list in reach and never scrolls the page or stores
    # anything; the bar's progress line has no transition (it follows the
    # scroll one to one).
    GUIDES = {'pensions-over-50.html': 'pension-calculator.html', 'self-employed-pensions.html': 'pension-calculator.html',
              'uk-pensions-in-ireland.html': 'tracker.html', 'director-pension-rules.html': 'director-calculator.html',
              'standard-fund-threshold.html': 'booking.html', 'pia.html': 'pension-calculator.html'}

    def heading_text(s, hid):
        m = re.search(r'<(h2|h3)\b[^>]*\bid="%s"[^>]*>(.*?)</\1>' % re.escape(hid), s, re.S)
        if not m:
            m = re.search(r'<(?:section|div)\b[^>]*\bid="%s"[^>]*>.*?<(h2)\b[^>]*>(.*?)</h2>' % re.escape(hid), s, re.S)
        if not m:
            return None, -1
        return re.sub(r'\s+', ' ', re.sub(r'<br\s*/?>', ' ', m.group(2))).strip(), m.start()

    def same_words(link, head):
        """The heading's words, or the heading's words with an initialism
        spelled out in front of it ("exchange-traded fund (ETF)"): the list
        can come before the page first spells one out."""
        if link == head:
            return True
        pat = re.escape(head)
        for x in set(re.findall(r'\b[A-Z]{2,}\b', head)):
            pat = re.sub(r'(?<![A-Za-z])%s(?![A-Za-z])' % x, '(?:%s|[a-z][a-z-]*(?: [a-z][a-z-]*){0,3} \\\\(%s\\\\))' % (x, x), pat)
        return re.fullmatch(pat, link) is not None

    def guide_faults(srcs, js, css_all):
        f = []
        for name, s in sorted(srcs.items()):
            tocs = re.findall(r'<div class="pb-toc" role="navigation" aria-labelledby="pbTocH"><p class="pb-toc-h" id="pbTocH">On this page</p><ol class="pb-toc-list">(.*?)</ol></div>', s, re.S)
            nexts = re.findall(r'<aside class="pb-next" aria-labelledby="pbNextH"><p class="pb-next-k" id="pbNextH">Next step</p><a class="pb-next-card pb-card-link" href="([^"]+)"><span class="pb-next-t">([^<]+)</span><span class="pb-next-d">([^<]+)</span></a></aside>', s)
            script = len(re.findall(r'<script src="assets/js/pb-guide\.js(?:\?v=[0-9a-f]+)?"></script>', s))
            if name not in GUIDES:
                if tocs or nexts or script or 'class="pb-toc"' in s:
                    f.append('%s: a guide\'s parts on a page that is not one of the six' % name)
                continue
            if len(tocs) != 1 or len(nexts) != 1 or script != 1:
                f.append('%s: %d lists, %d next steps, %d scripts' % (name, len(tocs), len(nexts), script))
                continue
            links = re.findall(r'<li><a href="#([^"]+)">([^<]+)</a></li>', tocs[0])
            last = s.find('<div class="pb-toc"')
            if len(links) < 2:
                f.append('%s: a list of %d' % (name, len(links)))
            for hid, words in links:
                h, at = heading_text(s, hid)
                if h is None:
                    f.append('%s: #%s is not a section here' % (name, hid))
                elif not same_words(words, h):
                    f.append('%s: "%s" is not the heading\'s words ("%s")' % (name, words, h))
                elif at < last:
                    f.append('%s: #%s is out of order' % (name, hid))
                else:
                    last = at
            href, title, line = nexts[0]
            if href != GUIDES[name]:
                f.append('%s: the next step goes to %s, not %s' % (name, href, GUIDES[name]))
            if href not in srcs or pagebuild.NOINDEX in srcs[href]:
                f.append('%s: the next step is not a live page' % name)
            plain = lambda x: html.unescape(re.sub(r'<[^>]+>', ' ', x)).replace('’', "'")
            # on another page, in its text or its own description
            if not any(plain(line).strip() in plain(o) or html.unescape(line).replace('\u2019', "'") in html.unescape(o).replace('\u2019', "'")
                       for o in srcs.values() if o is not s):
                f.append('%s: the next step\'s words are not on the site' % name)
        if re.search(r'scrollTo|scrollBy|scrollIntoView|scrollTop\s*=|localStorage|sessionStorage|document\.cookie', js):
            f.append('pb-guide.js scrolls the page or stores something')
        m = re.search(r'\.pb-tocbar-prog\{([^}]*)\}', css_all)
        if not m or 'transition' in m.group(1):
            f.append('the progress line eases')
        return f

    import html
    guide_js = read('assets/js/pb-guide.js')
    gcss = sources['pension-calculator.html']
    eq('38. the long guides: each has its own sections listed in order under "On this page", one next step to a live page in the site\'s words, the script once; no other page any of it; nothing scrolls, nothing stored',
       guide_faults(sources, guide_js, gcss), [])
    for label, target, find, repl, want in (
            ('a listed section the page does not have', 'pensions-over-50.html', '<li><a href="#early">', '<li><a href="#earlier">', 'not a section'),
            ('a list word that is not the heading', 'uk-pensions-in-ireland.html', '<li><a href="#tax">How Ireland taxes it</a></li>', '<li><a href="#tax">Tax</a></li>', 'heading\'s words'),
            ('a next step to a held page', 'standard-fund-threshold.html', 'class="pb-next-card pb-card-link" href="booking.html"', 'class="pb-next-card pb-card-link" href="how-we-work.html"', 'not a live page'),
            ('a list on a page that is not a guide', 'privacy.html', '</main>', '<div class="pb-toc" role="navigation" aria-labelledby="pbTocH"></div></main>', 'not one of the six'),
            ('a bar that scrolls', 'js', 'function later() {', 'function later() { window.scrollBy(0, 1);', 'scrolls'),
            ('a line that eases', 'css', '.pb-tocbar-prog{position:absolute;', '.pb-tocbar-prog{transition:transform .3s;position:absolute;', 'eases')):
        srcs, j2, c2 = dict(sources), guide_js, gcss
        if target == 'js':
            j2 = guide_js.replace(find, repl, 1)
            assert j2 != guide_js, label
        elif target == 'css':
            c2 = gcss.replace(find, repl, 1)
            assert c2 != gcss, label
        else:
            srcs[target] = sources[target].replace(find, repl, 1)
            assert srcs[target] != sources[target], label
        eq('38. %s is caught' % label, any(want in x for x in guide_faults(srcs, j2, c2)), True)

    # ----------------------------------------------------------------- 39
    # Run 37, item 7: related pages. Every page's block is the one the
    # RELATED table gives it (sync-chrome and pagebuild write them; a page
    # edited by hand fails here), last in <main>; every card goes to a live
    # page other than its own, and its line is on the site word for word
    # (on the page CARDS names); the table leaves out the home page,
    # booking, the thank-you page, the 404, the held pages and the games.
    def related_faults(srcs):
        f = [p + ': ' + d for p, ks in sorted(pagebuild.related_drift(srcs).items()) for k, d in ks]
        plain = lambda x: html.unescape(re.sub(r'<[^>]+>', ' ', x)).replace('’', "'")
        for page, targets in sorted(pagebuild.RELATED.items()):
            if page in ('index.html', 'booking.html', 'thank-you.html', '404.html') or pagebuild.NOINDEX in srcs.get(page, pagebuild.NOINDEX):
                f.append('%s should carry none' % page)
            if not 2 <= len(targets) <= 3 or page in targets or len(set(targets)) != len(targets):
                f.append('%s: %d cards, or one to itself, or one twice' % (page, len(targets)))
            for tgt in targets:
                if tgt not in srcs or pagebuild.NOINDEX in srcs[tgt]:
                    f.append('%s: %s is not a live page' % (page, tgt))
        raw = lambda x: html.unescape(x).replace('\u2019', "'")
        for tgt, (title, line, where) in sorted(pagebuild.CARDS.items()):
            # in the page's text, or its own description
            if plain(line).strip() not in plain(srcs.get(where, '')) and raw(line) not in raw(srcs.get(where, '')):
                f.append('%s: its line is not on %s' % (tgt, where))
        return f

    import html
    eq('39. related pages: every page\'s block is the table\'s, last in <main>; two or three live pages each, never itself; every line on the site word for word; none on the home page, booking, thank-you, the 404 or a held page',
       related_faults(sources), [])
    for label, target, find, repl, want in (
            ('a card edited by hand', 'terms.html', '<span class="pb-related-t">Privacy Notice</span>', '<span class="pb-related-t">Our privacy</span>', 'not the table'),
            ('a block moved out of <main>', 'complaints.html', None, None, 'outside'),
            ('a block half lost', 'glossary.html', '<!-- RELATED:BEGIN', '<!-- RELATED:GONE', 'broken')):
        srcs = dict(sources)
        if find is None:
            s = sources[target]
            i = s.find('<!-- RELATED:BEGIN'); j = s.find('<!-- RELATED:END -->\n') + len('<!-- RELATED:END -->\n')
            blk = s[i:j]; rest = s[:i] + s[j:]
            k = rest.find('</footer>') + len('</footer>')
            srcs[target] = rest[:k] + blk + rest[k:]
        else:
            srcs[target] = sources[target].replace(find, repl, 1)
        assert srcs[target] != sources[target], label
        eq('39. %s is caught' % label, any(want in x for x in related_faults(srcs)), True)
    saved = (dict(pagebuild.RELATED), dict(pagebuild.CARDS))
    for label, mut, want in (
            ('a card to a held page', lambda: pagebuild.RELATED.__setitem__('terms.html', ('privacy.html', 'how-we-work.html')), 'not a live page'),
            ('a line the site does not have', lambda: pagebuild.CARDS.__setitem__('complaints.html', ('Complaints', 'We always put things right.', 'complaints.html')), 'not on'),
            ('related pages on the home page', lambda: pagebuild.RELATED.__setitem__('index.html', ('starter.html', 'tracker.html')), 'should carry none')):
        mut()
        eq('39. %s is caught' % label, any(want in x for x in related_faults(sources)), True)
        pagebuild.RELATED.clear(); pagebuild.RELATED.update(saved[0]); pagebuild.CARDS.clear(); pagebuild.CARDS.update(saved[1])

    # ----------------------------------------------------------------- 40
    # Run 37, item 8: the 404. Buddy's picture with his usual words for a
    # screen reader; the search box in the page (label, field, a polite
    # count, the list), drawn only with JavaScript, which it needs; and the
    # home page's "Six places to begin", the same six places, names and lines
    # word for word, in the same order. The page stays noindex.
    NF_SIX = [('tracker.html', 'Track down old pensions', 'Find pensions from old jobs, and what they are worth.'),
              ('starter.html', 'Start a pension', 'For a first pension. It&rsquo;s never too late to begin.'),
              ('director.html', 'Company directors', 'Your company can fund your pension beyond personal limits.'),
              ('pension-calculator.html', 'Pension calculator', 'Your projection, with Revenue&rsquo;s tax relief.'),
              ('state-pension-reality-check.html', 'State Pension reality check', 'What the State Pension leaves you to find.'),
              ('broker-vs-autoenrolment.html', 'Auto-enrolment comparison', 'My Future Fund and a personal pension, side by side.')]

    def nf_faults(nf, ix):
        f = []
        if '<img src="assets/img/buddy-avatar.jpg' not in nf or 'alt="Buddy, the Pensionbuddy dog"' not in nf:
            f.append('Buddy is not there')
        for want in ('<div class="pb-nf-search" data-pb-search>', '<label class="pb-search-label" for="pbSearchIn">Search Pensionbuddy</label>',
                     'id="pbSearchIn" class="pb-search-q"', '<p class="pb-search-count" id="pbSearchInCount" role="status"></p>',
                     '<ul class="pb-search-list" id="pbSearchInList"></ul>', 'html:not(.pb-js) .pb-nf-search{display:none}'):
            if want not in nf:
                f.append('the search box: %s' % want[:40])
        home = NF_SIX
        here = re.findall(r'<li><a href="([^"]+)"><b>([^<]+)</b><span>([^<]+)</span></a></li>', nf[nf.find('<ul class="pb-nf-six">'):])
        if '<h2 class="pb-nf-h">Six places to begin.</h2>' not in nf or len(home) != 6 or here[:6] != home:
            f.append('not the six places to begin')
        if pagebuild.NOINDEX not in nf:
            f.append('the 404 is indexable')
        if len(re.findall(r'<script src="assets/js/pb-search\.js\?v=[0-9a-f]+" type="text/pb-late"></script>', nf)) != 1:
            f.append('the search script')
        return f

    nf, ix = sources['404.html'], sources['index.html']
    eq('40. the 404: Buddy, the search box drawn with JavaScript, and its six places to begin word for word; still noindex',
       nf_faults(nf, ix), [])
    for label, find, repl, want in (
            ('a place missing', '<li><a href="director.html"><b>Company directors</b>', '<li><a href="director.html"><b>Directors</b>', 'six places'),
            ('the box drawn without JavaScript', 'html:not(.pb-js) .pb-nf-search{display:none}', '', 'search box'),
            ('Buddy with no words', 'alt="Buddy, the Pensionbuddy dog"', 'alt=""', 'Buddy')):
        mut = nf.replace(find, repl, 1)
        assert mut != nf, label
        eq('40. %s is caught' % label, any(want in x for x in nf_faults(mut, ix)), True)


    # ----------------------------------------------------------------- 41
    # Run 37, item 9 (built in Run 39): slider feel. Marks go only on sliders whose values
    # have a meaning the relief module already holds: the pension
    # calculator's and the comparison's age (where the relief band changes)
    # and earnings (the earnings cap). The script takes every mark from
    # PBRelief, types no number of its own, never sets a slider's value or
    # sends an event (the calculators' figures cannot change: render-diff
    # proves the page scripts' writes), and adds no datalist, so the browser
    # never snaps. It loads after the "slider polish" script that draws the
    # bubble it signs on.
    MARKED = {'pension-calculator.html': {'age': 'relief-age', 'earn': 'relief-cap'},
              'broker-vs-autoenrolment.html': {'age': 'relief-age', 'salary': 'relief-cap'}}

    def feel_faults(srcs, js):
        f = []
        for name, s in sorted(srcs.items()):
            got = dict((i, k) for i, k in re.findall(r'<input type="range" id="([^"]+)"[^>]*\bdata-pb-ticks="([^"]+)"', s))
            if got != MARKED.get(name, {}):
                f.append('%s: marks on %s' % (name, got))
            if '<datalist' in s or re.search(r'<input type="range"[^>]*\blist="', s):
                f.append('%s: a datalist would make the slider snap' % name)
            if name in MARKED:
                polish = s.find('/* fintech slider polish: wrap each range')
                me = s.find('<script src="assets/js/pb-slider-feel.js')
                if polish < 0 or me < polish:
                    f.append('%s: the marks load before the bubble they sign on' % name)
        code = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
        # 22 the thumb, 3 the gap under it, 320 the sign's time: sizes, not figures
        nums = [n for n in re.findall(r'(?<![\w.])\d+(?:\.\d+)?(?![\w.])', code) if n not in ('0', '1', '2', '3', '22', '100', '320', '0.5')]
        if nums:
            f.append('pb-slider-feel.js types numbers of its own: %s' % nums)
        if re.search(r'\.value\s*=|dispatchEvent|localStorage|sessionStorage', code):
            f.append('pb-slider-feel.js moves a slider, sends an event or stores something')
        if 'R.reliefBand' not in code or 'R.EARN_CAP' not in code:
            f.append('the marks do not come from the relief module')
        return f

    feel_js = read('assets/js/pb-slider-feel.js')
    eq('41. slider feel: marks only on the ages and earnings the relief module gives meaning to, every mark from the module, no snapping, no slider moved',
       feel_faults(sources, feel_js), [])
    for label, target, find, repl, want in (
            ('a mark typed in', 'js', "if (R.reliefBand(v) !== R.reliefBand(v - 1)) { out.push(v); }", "if (R.reliefBand(v) !== R.reliefBand(v - 1)) { out.push(v); } out.push(66);", 'numbers of its own'),
            ('a slider that snaps', 'pension-calculator.html', '<input type="range" id="age"', '<input type="range" list="ageMarks" id="age"', 'datalist'),
            ('the slider set by the marks', 'js', "    r.addEventListener('input', function () { mark(true); });", "    r.addEventListener('input', function () { mark(true); r.value = r.value; });", 'moves a slider'),
            ('marks on a slider with no meaning for them', 'director-calculator.html', '<input type="range" id="age"', '<input type="range" id="age" data-pb-ticks="relief-age"', 'marks on'),
            ('the marks loading before the bubble', 'pension-calculator.html', '/* fintech slider polish: wrap each range', '/* the bubble: wrap each range', 'before the bubble')):
        srcs, j2 = dict(sources), feel_js
        if target == 'js':
            j2 = feel_js.replace(find, repl, 1)
            assert j2 != feel_js, label
        else:
            srcs[target] = sources[target].replace(find, repl, 1)
            assert srcs[target] != sources[target], label
        eq('41. %s is caught' % label, any(want in x for x in feel_faults(srcs, j2)), True)


    # ----------------------------------------------------------------- 42
    # Run 37's item 10 (built in Run 39): figures that wait. The head script sets html.pb-ready
    # (and, for that moment, html.pb-readying, which stops a figure's own
    # colour transition fading it in) at DOMContentLoaded (MOTION_HEAD, on every page), the WAIT block draws a
    # bar only until then and only with JavaScript, and every element marked
    # data-pb-wait is one a script replaces at load: its markup is a
    # placeholder ("--", "€0", "€0/mo"), never a real figure or a sentence.
    # The nav's deadline chip carries one on every page. The bar pulses only
    # for a reader who allows motion.
    WAIT_PLACEHOLDERS = ('--', '&euro;0', '€0', '€0/mo')

    def wait_faults(srcs, head, css):
        f = []
        if "r.classList.add('pb-ready','pb-readying')" not in head or "r.classList.remove('pb-readying')" not in head:
            f.append('the head script never says the page is ready')
        if 'html.pb-readying [data-pb-wait]{transition:none!important}' not in css:
            f.append('a figure fades in when the page is ready (figures never wait)')
        for rule in ('html.pb-js:not(.pb-ready) [data-pb-wait]{color:transparent!important;',
                     'html.pb-motion:not(.pb-ready) [data-pb-wait]{animation:pbWait'):
            if rule not in css:
                f.append('the WAIT block: %s' % rule[:40])
        if re.search(r'html:not\(\.pb-js\)[^{]*\[data-pb-wait\]|(?<!pb-motion)(?<!pb-motion:not\(\.pb-ready\) )\[data-pb-wait\]\{animation', css):
            f.append('a bar without JavaScript, or one that pulses regardless')
        for name, s in sorted(srcs.items()):
            for m in re.finditer(r'<(\w+)\b[^>]*\bdata-pb-wait\b[^>]*>(.*?)</\1>', s, re.S):
                if m.group(2) not in WAIT_PLACEHOLDERS:
                    f.append('%s: a bar over "%s", which is not a placeholder' % (name, m.group(2)[:30]))
            if 'id="ntVal"' in s and not re.search(r'id="ntVal" aria-hidden="true" data-pb-wait>--<', s):
                f.append('%s: the nav chip\'s figure waits without a bar' % name)
        return f

    whead = pagebuild.MOTION_HEAD
    wcss = sources['pension-calculator.html']
    eq('42. figures that wait: html.pb-ready from the head script; a bar only before it and only with JavaScript; only over placeholders; the nav chip on every page',
       wait_faults(sources, whead, wcss), [])
    for label, target, find, repl, want in (
            ('a bar over a real figure', 'index.html', '<h1>', '<h1 data-pb-wait>', 'not a placeholder'),
            ('a chip without its bar', 'privacy.html', 'id="ntVal" aria-hidden="true" data-pb-wait>', 'id="ntVal" aria-hidden="true">', 'without a bar'),
            ('a page that is never ready', 'head', "r.classList.add('pb-ready','pb-readying');", '', 'never says'),
            ('a figure that fades in when ready', 'css', 'html.pb-readying [data-pb-wait]{transition:none!important}\n', '', 'fades in'),
            ('a bar that always pulses', 'css', 'html.pb-motion:not(.pb-ready) [data-pb-wait]{animation:pbWait', '[data-pb-wait]{animation:pbWait', 'pulses')):
        srcs, h2, c2 = dict(sources), whead, wcss
        if target == 'head':
            h2 = whead.replace(find, repl, 1)
            assert h2 != whead, label
        elif target == 'css':
            c2 = wcss.replace(find, repl, 1)
            assert c2 != wcss, label
        else:
            srcs[target] = sources[target].replace(find, repl, 1)
            assert srcs[target] != sources[target], label
        eq('42. %s is caught' % label, any(want in x for x in wait_faults(srcs, h2, c2)), True)

    # ----------------------------------------------------------------- 43
    # Run 38, item 1: the game cards' videos. Each card keeps its picture
    # (the poster, and all there is without JavaScript or with reduced
    # motion) and carries over it a video of the real game: muted, looping,
    # inline, preload="none", aria-hidden, its poster the card's own
    # picture (the picture's WebP, as data-poster, which pb-video.js makes
    # the poster only as the video comes near: a poster attribute in the
    # markup is fetched at once, and two of them cost the home page 1.7 s of
    # Lighthouse LCP), an MP4 first and a WebM second, each under 1.5 MB;
    # and a button whose name starts with its words (WCAG 2.2.2, 2.5.3).
    # The CSS draws the video and the button only where motion is allowed;
    # pb-video.js loads late, stores nothing, fetches near the viewport and
    # pauses off it. tools/record-games.mjs made the files, seeded as the
    # pictures are, and (Run 39) with Buddy's Run's own pause control hidden
    # in its place: beside the card's real pause button it read as a second.
    VIDEOS = [('buddys-run', 'Buddy&rsquo;s Run'), ('jargon-battle', 'Jargon Battle')]

    def video_faults(ix, js, sizes, rec, shoot):
        f = []
        for slug, name in VIDEOS:
            m = re.search(r'<div class="pb-learn-media">\s*<picture><source type="image/webp" srcset="(assets/img/product-%s\.webp\?v=[0-9a-f]+)">'
                          r'.*?<img src="assets/img/product-%s\.jpg\?v=[0-9a-f]+"[^>]*></picture>\s*'
                          r'<video ([^>]*)>(.*?)</video>\s*<button ([^>]*)>(.*?)</button>\s*</div>' % (slug, slug), ix, re.S)
            if not m:
                f.append('%s: no picture, video and button together' % slug)
                continue
            webp, vattrs, sources, battrs, words = m.groups()
            for want in ('class="pb-learn-vid"', ' muted', ' loop', ' playsinline', 'preload="none"', 'aria-hidden="true"', 'data-pb-video'):
                if want not in ' ' + vattrs:
                    f.append('%s: the video is not %s' % (slug, want.strip()))
            if 'autoplay' in vattrs or 'controls' in vattrs:
                f.append('%s: the video plays by itself or shows controls' % slug)
            if 'data-poster="%s"' % webp not in vattrs:
                f.append('%s: the poster is not the card\'s own picture' % slug)
            if re.search(r'(?<![-\w])poster=', vattrs):
                f.append('%s: a poster in the markup, fetched at once' % slug)
            if re.findall(r'<source src="([^"]+)" type="([^"]+)">', sources) != [('assets/video/%s.mp4' % slug, 'video/mp4'), ('assets/video/%s.webm' % slug, 'video/webm')]:
                f.append('%s: not the MP4 then the WebM' % slug)
            if ('type="button"' not in battrs or 'data-state="paused"' not in battrs or ('aria-label="Play video: %s"' % name) not in battrs
                    or 'pb-vid-i-play' not in words or 'pb-vid-i-pause' not in words or re.sub(r'<[^>]+>', '', words).strip()):
                f.append('%s: the button\'s icons or name' % slug)
            for ext in ('mp4', 'webm'):
                size = sizes.get('%s.%s' % (slug, ext))
                if size is None or size >= 1.5 * 1024 * 1024:
                    f.append('%s.%s: missing, or 1.5 MB or more (%s)' % (slug, ext, size))
        for want in ('.pb-learn-vid,.pb-vid-btn{display:none}', 'html.pb-motion .pb-learn-vid{display:block;', 'html.pb-motion .pb-vid-btn{display:inline-flex;'):
            if want not in ix:
                f.append('the CSS: %s' % want[:36])
        if len(re.findall(r'<script src="assets/js/pb-video\.js\?v=[0-9a-f]+" type="text/pb-late"></script>', ix)) != 1:
            f.append('pb-video.js is not loaded late, once')
        code = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
        if re.search(r'localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest', code):
            f.append('pb-video.js stores or fetches something itself')
        if 'new IntersectionObserver(' not in code or 'v.pause()' not in code or "classList.contains('pb-motion')" not in code:
            f.append('pb-video.js does not pause off screen, or ignores reduced motion')
        if "v.poster = v.getAttribute('data-poster')" not in code:
            f.append('pb-video.js does not give the video its poster')
        if "setRng(pbSeed(20260929))" not in rec or rec.count("setRng(pbSeed(20260929))") != 2:
            f.append('the recorder does not seed both games as the pictures are')
        if "hide: '#hud .hint,#pauseBtn{visibility:hidden!important}'" not in rec or 'SETTLE + (g.hide' not in rec:
            f.append("the recorder shows Buddy's Run's own pause control (Run 39: hidden, in its place)")
        if "'hide': '#hud .hint,#pauseBtn{visibility:hidden!important}'" not in shoot:
            f.append("the still shows Buddy's Run's own pause control (Run 40: hidden, as in the clip)")
        return f

    vdir = os.path.join(ROOT, 'assets', 'video')
    vsizes = dict((n, os.path.getsize(os.path.join(vdir, n))) for n in (os.listdir(vdir) if os.path.isdir(vdir) else []))
    vjs = read('assets/js/pb-video.js')
    vrec = read('tools/record-games.mjs')
    vshoot = read('tools/shoot-product.py')
    ix = sources['index.html']
    eq('43. game videos: over each card\'s picture, muted, looping, inline, not preloaded, hidden from screen readers, the picture as poster, MP4 then WebM under 1.5 MB, a named pause button; drawn only with motion; late, pauses off screen',
       video_faults(ix, vjs, vsizes, vrec, vshoot), [])
    for label, target, find, repl, want in (
            ('a video that preloads', 'ix', 'preload="none" aria-hidden="true" disablepictureinpicture data-poster="assets/img/product-buddys-run',
             'preload="auto" aria-hidden="true" disablepictureinpicture data-poster="assets/img/product-buddys-run', 'preload'),
            ('a video with sound', 'ix', '<video class="pb-learn-vid" muted loop', '<video class="pb-learn-vid" loop', 'muted'),
            ('a poster that is not the picture', 'ix', 'data-poster="assets/img/product-jargon-battle.webp', 'data-poster="assets/img/product-buddys-run.webp', 'poster'),
            ('a poster in the markup again', 'ix', ' data-poster="assets/img/product-jargon-battle.webp', ' poster="assets/img/product-jargon-battle.jpg" data-poster="assets/img/product-jargon-battle.webp', 'at once'),
            ('a player that never sets the poster', 'js', "v.poster = v.getAttribute('data-poster')", "v.title = v.getAttribute('data-poster')", 'its poster'),
            ('a video drawn for reduced motion', 'ix', '.pb-learn-vid,.pb-vid-btn{display:none}', '.pb-vid-btn{display:none}', 'the CSS'),
            ('a button named otherwise', 'ix', 'aria-label="Play video: Jargon Battle"', 'aria-label="Start the animation"', 'button'),
            ('a button with no pause icon', 'ix', '<svg class="pb-vid-i pb-vid-i-pause"', '<svg class="pb-vid-i pb-vid-i-stop"', 'button'),
            ('a video too big', 'sizes', None, None, '1.5 MB'),
            ('a player that does not watch the viewport', 'js', 'new IntersectionObserver(', 'new ResizeObserver(', 'pause'),
            ('the game\'s own pause control back in the clip', 'rec', "    hide: '#hud .hint,#pauseBtn{visibility:hidden!important}',\n", '', 'pause control'),
            ('the game\'s own pause control back in the still', 'shoot', "'hide': '#hud .hint,#pauseBtn{visibility:hidden!important}'", "'hide': ''", 'the still shows')):
        mix, mjs, ms, mrec, mshoot = ix, vjs, dict(vsizes), vrec, vshoot
        if target == 'shoot':
            mshoot = vshoot.replace(find, repl, 1)
            assert mshoot != vshoot, label
        elif target == 'rec':
            mrec = vrec.replace(find, repl, 1)
            assert mrec != vrec, label
        elif target == 'ix':
            mix = ix.replace(find, repl, 1)
            assert mix != ix, label
        elif target == 'js':
            mjs = vjs.replace(find, repl, 1)
            assert mjs != vjs, label
        else:
            ms['buddys-run.webm'] = 2 * 1024 * 1024
        eq('43. %s is caught' % label, any(want in x for x in video_faults(mix, mjs, ms, mrec, mshoot)), True)

    # ----------------------------------------------------------------- 44
    # Run 38, item 2: media pops in, and nothing else can. pb-pop.js's list
    # (POP) names only media: every selector ends on a picture, a video, an
    # image or one of two media holders (the game tiles, Buddy on the 404
    # page), and none names a heading, words, a figure, a
    # caveat, a warning, the regulator line or a form. The POP block (on
    # every page, byte for byte: chrome_drift) animates opacity and transform
    # only, rises no further than --pb-rise, runs over at most half an
    # element's entry or on a pair of 320ms or less, and only inside
    # html.pb-motion (written :root.pb-motion, the same element, so check
    # 19 does not read a rule on html) and prefers-reduced-motion:
    # no-preference; paper gets everything. pb-pop.js loads late on every page, once.
    POP_ENDS = re.compile(r'(?:^|\s|>)(?:picture|video|img)$|^\.(?:arc-tile|pb-nf-buddy)$')
    POP_NEVER = re.compile(r'\bh[1-6]\b|(?:^|[\s>,])(?:p|li|label|input|select|textarea|button|form|table|figure|figcaption)\b'
                           r'|\.pb-warn|\.pb-reg|\.pb-reviewed|\.big\b|data-pb-count|\.infoadvice|\.assume|\.disclosure|\.pb-src|\.announce'
                           r'|\.pb-quals|\.badge|\.buddy-mini|\.cta-')

    def pop_faults(srcs, js, css):
        f = []
        m = re.search(r"var POP = ((?:'[^']*'\s*\+?\s*)+);", js)
        if not m:
            return ['no POP list in pb-pop.js']
        for s in [s.strip() for s in ''.join(re.findall(r"'([^']*)'", m.group(1))).split(',') if s.strip()]:
            if POP_NEVER.search(s) or not POP_ENDS.search(s):
                f.append('the list names more than media: %s' % s)
        b = re.search(r'/\* POP:BEGIN.*?\*/(.*?)/\* POP:END \*/', css, re.S)
        if not b:
            return f + ['no POP block']
        block = b.group(1)
        k = re.search(r'@keyframes pbPop\{(.*?)\}\}', block, re.S)
        props = set(re.findall(r'([a-z-]+):', k.group(1))) if k else set()
        if not k or props - {'opacity', 'transform'}:
            f.append('the pop moves more than opacity and transform: %s' % sorted(props))
        for tr in re.findall(r'translate[XY]?\(([^)]*\)?)\)', block):
            if tr != 'var(--pb-rise)':
                f.append('the pop travels by %s, not --pb-rise' % tr)
        for rule in re.findall(r'\{([^{}]*)\}', block):
            if re.search(r'(?<![-\w])(?:(?:margin|padding|inset)(?:-[a-z]+)*|top|left|bottom|right|width|height|filter|box-shadow)\s*:', rule) and '!important' not in rule:
                f.append('the pop moves more than opacity and transform: %s' % rule.strip()[:60])
        rng = re.search(r'animation-range:entry 0% entry (\d+)%', block)
        if not rng or int(rng.group(1)) > 50 or 'animation:pbPop var(--pb-ease-scroll) both;animation-timeline:view()' not in block:
            f.append('the scroll-driven pop is not linear over the first half of the entry or less')
        trs = re.findall(r'transition:([^;}]*)', block)
        if not trs:
            f.append('the pop has no clock to finish on')
        for tr in trs:
            if any(not re.fullmatch(r'(?:opacity|transform) var\(--pb-t-(?:press|swap|state)\)', p.strip()) for p in tr.split(',')):
                f.append('the clock is longer than 320ms, or moves more than opacity and transform: %s' % tr)
        outside = re.sub(r'@media \(prefers-reduced-motion:no-preference\)\{.*?\n\}\n', '', block, flags=re.S)
        outside = re.sub(r'@keyframes pbPop\{.*?\}\}', '', outside, flags=re.S)
        if re.search(r'\{[^}]*(?:animation:pbPop|opacity:0|transition:)', outside) or \
                any(not r.startswith(':root.pb-motion ') for r in re.findall(r'\n\s*([^\n{}@]*data-pb-pop[^{]*)\{', block)):
            f.append('a pop outside html.pb-motion and prefers-reduced-motion: no-preference')
        if '@media print{[data-pb-pop]{animation:none!important;opacity:1!important;transform:none!important}}' not in block:
            f.append('paper does not get everything')
        for name, s in sorted(srcs.items()):
            if len(re.findall(r'<script src="assets/js/pb-pop\.js\?v=[0-9a-f]+" type="text/pb-late"></script>', s)) != 1:
                f.append('%s: pb-pop.js is not loaded late, once' % name)
        return f

    pop_js = read('assets/js/pb-pop.js')
    pcss = sources['pension-calculator.html']
    eq('44. pop-ins: the list names only media; opacity and transform, by --pb-rise, over at most half the entry or on a 320ms pair; only where motion is allowed; paper gets everything; on every page, late',
       pop_faults(sources, pop_js, pcss), [])
    for label, target, find, repl, want in (
            ('a heading given a pop-in', 'js', "'.pb-split-media > picture > img,", "'.pb-split-media > picture > img,.sec-head h2,", 'more than media'),
            ('words given a pop-in', 'js', "'.pb-split-media > picture > img,", "'.pb-split-media > picture > img,.pb-learn-d,", 'more than media'),
            ('the regulator line given a pop-in', 'js', "'.pb-split-media > picture > img,", "'.pb-split-media > picture > img,.pb-reg,", 'more than media'),
            ('the QFA badge given a pop-in', 'js', "'.pb-split-media > picture > img,", "'.pb-split-media > picture > img,.about-port .badge,", 'more than media'),
            ('a whole card given a pop-in', 'js', "'.pb-split-media > picture > img,", "'.pb-split-media > picture > img,.pb-learn-card,", 'more than media'),
            ('a pop that moves the layout', 'css', '@keyframes pbPop{from{opacity:0;transform:translateY(var(--pb-rise)) scale(.97)}',
             '@keyframes pbPop{from{opacity:0;margin-top:14px}', 'opacity and transform'),
            ('a pop that travels too far', 'css', '[data-pb-pop="io"]{opacity:0;transform:translateY(var(--pb-rise))',
             '[data-pb-pop="io"]{opacity:0;transform:translateY(40px)', 'travels'),
            ('a long scrub', 'css', 'animation-range:entry 0% entry 40%', 'animation-range:entry 0% cover 60%', 'first half'),
            ('a slow clock', 'css', 'transition:opacity var(--pb-t-state),transform var(--pb-t-state)',
             'transition:opacity var(--pb-t-draw),transform var(--pb-t-draw)', 'longer'),
            ('a pop for a reader who asks for less motion', 'css', '@media (prefers-reduced-motion:no-preference){\n  @supports',
             '@media all{\n  @supports', 'outside'),
            ('a pop without html.pb-motion', 'css', '  :root.pb-motion [data-pb-pop="io"]', '  [data-pb-pop="io"]', 'outside'),
            ('paper left waiting', 'css', '@media print{[data-pb-pop]{animation:none!important;opacity:1!important;',
             '@media print{[data-pb-pop]{animation:none!important;', 'paper'),
            ('a page without it', 'page', None, None, 'not loaded')):
        srcs, j2, c2 = dict(sources), pop_js, pcss
        if target == 'js':
            j2 = pop_js.replace(find, repl, 1)
            assert j2 != pop_js, label
        elif target == 'css':
            c2 = pcss.replace(find, repl, 1)
            assert c2 != pcss, label
        else:
            srcs['terms.html'] = re.sub(r'<script src="assets/js/pb-pop\.js\?v=[0-9a-f]+" type="text/pb-late"></script>\n', '', sources['terms.html'])
            assert srcs['terms.html'] != sources['terms.html'], label
        eq('44. %s is caught' % label, any(want in x for x in pop_faults(srcs, j2, c2)), True)

    # ----------------------------------------------------------------- 45
    # Run 39: "How a call with Damian works", the home page's three steps
    # with a slot over each for Damian's own short video. The steps are the
    # words the section already had, unchanged, under its heading; each slot
    # keeps a 16:9 box (so nothing moves when a video arrives), shows the
    # placeholder poster until then (sized, lazy, no words: aria-hidden, alt
    # ""), and any video put in one later follows the game cards' rules
    # (muted, inline, not preloaded, aria-hidden, its poster the slot's
    # picture, pb-video.js to play and pause it).
    CALL_STEPS = [('You reach out', 'A short message or call, so Damian comes prepared. No forms.'),
                  ('We talk it through', 'Twenty minutes, by phone or video.'),
                  ('You decide', "You leave with a next step. If we're not the right fit, we say so.")]

    def call_faults(ix, sizes):
        f = []
        sec = re.search(r'<section class="expect" id="call">(.*?)</section>', ix, re.S)
        if not sec:
            return ['no "How a call with Damian works" section']
        body = sec.group(1)
        if '<span class="kicker">How a call with Damian works</span>' not in body or \
                '<h2>Three steps.</h2>' not in body:
            f.append('the label or the heading')
        steps = re.findall(r'<div class="step">(.*?)<div class="sx">(\d)</div><h3>([^<]*)</h3><p>([^<]*)</p></div>', body, re.S)
        if [(h, p) for _, _, h, p in steps] != CALL_STEPS:
            f.append('the steps are not the words the section already had: %s' % [(h, p[:20]) for _, _, h, p in steps])
        for slot, n, _, _ in steps:
            m = re.fullmatch(r'<div class="pb-call-slot" data-pb-call-video="call-step-%s" aria-hidden="true"><picture>'
                             r'<source type="image/webp" srcset="assets/img/call-video-placeholder\.webp\?v=[0-9a-f]+">'
                             r'<img src="assets/img/call-video-placeholder\.jpg\?v=[0-9a-f]+" width="1280" height="720" alt="" loading="lazy"></picture>'
                             r'(<video [^>]*>.*?</video>\s*<button [^>]*>.*?</button>)?</div>' % n, slot, re.S)
            if not m:
                f.append('step %s: its slot is not the placeholder poster in a 16:9 box' % n)
                continue
            if m.group(1):
                v = re.match(r'<video ([^>]*)>', m.group(1)).group(1)
                for want in (' muted', ' loop', ' playsinline', 'preload="none"', 'aria-hidden="true"', 'data-pb-video',
                             'data-poster="assets/img/call-video-placeholder.webp'):
                    if want not in ' ' + v:
                        f.append('step %s: its video is not %s' % (n, want.strip()))
        if '.step .pb-call-slot{display:block;margin:0 0 18px;aspect-ratio:16/9;' not in ix:
            f.append('the slots do not keep a 16:9 box')
        for ext in ('jpg', 'webp'):
            size = sizes.get(ext)
            if size is None or size > 60 * 1024:
                f.append('the placeholder .%s is missing or over 60 KB (%s)' % (ext, size))
        return f

    csizes = {}
    for ext in ('jpg', 'webp'):
        pth = os.path.join(ROOT, 'assets', 'img', 'call-video-placeholder.' + ext)
        if os.path.exists(pth):
            csizes[ext] = os.path.getsize(pth)
    cix = sources['index.html']
    eq('45. "How a call with Damian works": the section\'s own three steps, word for word, each with a 16:9 slot showing the placeholder poster (sized, lazy, no words)',
       call_faults(cix, csizes), [])
    for label, find, repl, want in (
            ('a step reworded', "If we're not the right fit, we say so.", "If we're not the right fit, we tell you.", 'not the words'),
            ('a slot without its size', 'width="1280" height="720" alt="" loading="lazy"></picture></div><div class="sx">2',
             'alt="" loading="lazy"></picture></div><div class="sx">2', 'step 2'),
            ('a slot that speaks', 'data-pb-call-video="call-step-3" aria-hidden="true"', 'data-pb-call-video="call-step-3"', 'step 3'),
            ('a slot that does not keep its box', '.step .pb-call-slot{display:block;margin:0 0 18px;aspect-ratio:16/9;',
             '.step .pb-call-slot{display:block;margin:0 0 18px;', '16:9'),
            ('a video with sound', '</picture></div><div class="sx">1',
             '</picture><video class="pb-learn-vid" loop playsinline preload="none" aria-hidden="true" data-poster="assets/img/call-video-placeholder.webp" data-pb-video></video> <button type="button">x</button></div><div class="sx">1', 'muted')):
        assert find in cix, label
        mix = cix.replace(find, repl, 1)
        eq('45. %s is caught' % label, any(want in x for x in call_faults(mix, csizes)), True)


    # ----------------------------------------------------------------- 46
    # Run 43, item 1 (Damian's "yes" to Run 42's question 7): the starter,
    # tracker and director heroes give before they ask. Each hero keeps its
    # second button and its two lockups (check 28), and carries no booking
    # link (the chat pictures were cut in October 2026); the booking button
    # (its reason line cut on 8 October 2026) stands, moved word for word, after the page's
    # first figures: the starter page's 30, 40 and 50 chart with its
    # warnings and note, the director page's €1,000 example and relief
    # ladder with its note; the tracker page gives no figure, so after its
    # tick list (docs/GIVE-BEFORE-ASK-42.md S1, T1, D1).
    ARROW = (' <svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/>'
             '<polyline points="12 5 19 12 12 19"/></svg></a>')
    GIVE_FIRST = {  # page: (the button's words, what comes before it, what follows it at once)
        'starter.html': ('Help me get started', ('id="sa50Less"', '<div class="pb-warn">', '<p class="pb-sa-note">'),
                         '  <div class="pb-sa pb-wait" id="pbWait">'),
        'tracker.html': ('Help me find my pensions', ('id="pbTrace"',),
                         '</div></section>\n\n<section style="padding-top:0"><div class="wrap">\n'
                         '  <div class="callout pb-bleed pb-dark pb-split">'),
        'director.html': ('Book a free 20-minute call with us', ('id="pbTwoOut"', '<p class="pb-lad-note">'),
                          '</div></section>\n\n<section class="coverband pb-bleed pb-wash">'),
    }

    def moved_block(words):
        return ('  <div class="hero-cta" style="margin-top:22px">\n      <a class="btn btn-acc" href="booking.html">'
                + words + ARROW + '\n  </div>\n')

    def gives_first(name, src):
        words, before, follows = GIVE_FIRST[name]
        h = src.find('<header class="hero aud-hero">')
        end = src.find('</header>', h)
        hero = src[h:end]
        if h < 0 or end < 0 or 'href="booking.html"' in hero:
            return 'the hero asks before the page gives'
        if '<a class="btn btn-ghost"' not in hero:
            return 'the hero lost its second button'
        block = moved_block(words)
        if src.count(block) != 1:
            return 'the moved button and its reason are missing, doubled or reworded'
        i = src.index(block)
        if not all(0 <= src.find(b) < i for b in before):
            return 'the button comes before the first figures'
        if not src.startswith(follows, i + len(block)):
            return 'the button is not where it was put'
        return None
    eq('46. the starter, tracker and director heroes give before they ask: the button and its reason after the first figures (the tracker: its tick list)',
       {n: gives_first(n, sources[n]) for n in GIVE_FIRST if gives_first(n, sources[n])}, {})
    st, dr = sources['starter.html'], sources['director.html']
    sblock = moved_block('Help me get started')
    for label, name, mut, want in (
            ('the button put back in a hero', 'director.html',
             dr.replace('<a class="btn btn-ghost" href="director-calculator.html">',
                        '<a class="btn btn-acc" href="booking.html">Book a call</a>\n      <a class="btn btn-ghost" href="director-calculator.html">', 1),
             'the hero asks before the page gives'),
            ('the button above the chart', 'starter.html',
             st.replace(sblock, '', 1).replace('<div class="pb-sa">', sblock + '  <div class="pb-sa">', 1),
             'the button comes before the first figures'),
            ('its words reworded', 'starter.html', st.replace(sblock, sblock.replace('Help me get started', 'Get started'), 1),
             'the moved button and its reason are missing, doubled or reworded'),
            ('a booking link put under the lede', 'tracker.html',
             sources['tracker.html'].replace(
                 'have pension money somewhere.</p>\n',
                 'have pension money somewhere.</p>\n    <p><a href="booking.html">Book a free 20-minute call with us</a></p>\n', 1),
             'the hero asks before the page gives')):
        assert mut != sources[name], label
        eq('46. %s is caught' % label, gives_first(name, mut), want)

    # ----------------------------------------------------------------- 47
    # Run 43, Run 42's question 14. Damian: "non-State teal -> neutral slate
    # (teal = State only)". In a chart, a bar, a key or a figure, teal is what
    # the State pays and nothing else. These are the rules that drew something
    # else in teal until Run 43: each must now name no teal, aqua or mint (the
    # marks and figures take --slate, the tinted cards a neutral; the
    # reader's own place on a scale, a "You" chip, the picked year, the
    # step that applies, is neutral too), and the skeleton's tokens must
    # hold --slate (chrome_drift holds every other page
    # to the skeleton's tokens).
    not_state = (
        ('index.html', ('.pb-tl-age', '.pb-tl-fill', '.pb-tl-mark', '.pb-life-n', '.pb-life-rows i',
                        '.pb-tl-step.pb-on::after')),
        ('starter.html', ('.pb-sa-fill', '.pb-lad-you')),
        ('director.html', ('.pb-stat-n', '.pb-lad-you')),
        ('glossary.html', ('.pb-risk li', '.pb-risk li:nth-child(n+3)', '.pb-risk li:nth-child(n+5)', '.pb-lad-you')),
        ('pension-calculator.html', ('.dotk', '.boost-card', '.boost-card .bt', '.pb-lad-you',
                                     '#chart svg path:not([stroke])', '#chart svg path[stroke="#0B7A6E"]')),
        ('director-calculator.html', ('.vs-pension', '.vs-pension .vt', '.vs-pension .amt',
                                      '#chart svg path:not([stroke])', '#chart svg path[stroke="#0B7A6E"]')),
        ('broker-vs-autoenrolment.html', ('.vs-pension', '.vs-pension .vt', '.vs-pension .amt', '.pb-scale-track::after',
                                          '#pbScaleAeBar', '#pbScalePpBar', '#pbMyAeBar', '#pbMyPpBar', '.pb-stair-you')),
        ('pension-fees-calculator.html', ('.fee-chart .fee-l-b', '.fee-key .fee-k-b')),
        ('my-pensions.html', ('.pt-seg', '.pt-key i', '.pt-dot')),
        ('pension-readiness-check.html', ('.rd-b-onway', '.rd-b-good')),
        ('standard-fund-threshold.html', ('.sft-strip li.sft-on',)),
        ('state-pension-entitlement.html', ('.yal-you', '.pb-glide-you',
                                            '.pb-glide-col:has(.pb-glide-you:not([hidden])) .pb-glide-bar')),
    )
    # a teal token, or one of the teal tokens' own hex values written raw
    # (and the growth charts' #0B7A6E)
    teal_var = re.compile(r'var\(--(?:aqua|teal|mint)[\w-]*'
                          r'|#(?:16C9B0|12B49E|04302A|5EEAD4|0C8175|0A7166|08655A|0A332E|E8F6F3|CBEBE4|0B7A6E)\b', re.I)

    def not_state_faults(srcs):
        out = []
        for page, sels in not_state:
            for sel in sels:
                # the selector alone, or one of a group (a comma before it)
                bodies = re.findall(r'(?:^|[},\s])' + re.escape(sel) + r'\{([^}]*)\}', srcs[page], re.M)
                if not bodies:
                    out.append('%s: no rule for %s' % (page, sel))
                elif any(teal_var.search(b) for b in bodies):
                    out.append('%s: %s is teal' % (page, sel))
        if '--slate:#586B85' not in (pagebuild.root_tokens(srcs['pension-calculator.html']) or ()):
            out.append('pension-calculator.html: no --slate token')
        # the growth charts' CSS finds the script's own line by its colour:
        # if the script's colour changes, the selector no longer matches
        for page in ('pension-calculator.html', 'director-calculator.html'):
            if "stroke:'#0B7A6E'" not in srcs[page] or "{fill:'rgba(11,122,110,0.12)'}" not in srcs[page]:
                out.append('%s: the growth chart script no longer draws what the slate rules select' % page)
        return out

    eq('47. teal is what the State pays: no chart, bar, key or figure that is not the State\'s is drawn in teal, aqua or mint (Run 43)',
       not_state_faults(sources), [])
    for label, page, find, repl, want in (
            ('the starter page\'s pot bars put back in aqua', 'starter.html',
             '.pb-sa-fill{left:0;background:var(--slate)}', '.pb-sa-fill{left:0;background:var(--aqua)}',
             ['starter.html: .pb-sa-fill is teal']),
            ('the slate token dropped from the skeleton', 'pension-calculator.html',
             ' --slate:#586B85;', '', ['pension-calculator.html: no --slate token']),
            ('the director chart\'s line drawn in another colour by its script', 'director-calculator.html',
             "stroke:'#0B7A6E'", "stroke:'#0B7A6F'",
             ['director-calculator.html: the growth chart script no longer draws what the slate rules select'])):
        mut = dict(sources)
        mut[page] = sources[page].replace(find, repl, 1)
        assert mut[page] != sources[page], label
        eq('47. %s is caught' % label, not_state_faults(mut), want)

    # ----------------------------------------------------------------- 48
    # Run 43, item 5d (a reason beside every booking link) was dropped on
    # 8 October 2026: Damian cut the reason line from the whole site. The
    # TRUST guard (check 12) keeps a .pb-why line from coming back.

    # ----------------------------------------------------------------- 49
    # Run 43, rebuilt in Run 45 (give, then ask). Each calculator and tool ends
    # its result with one shared block, pagebuild.after_block(), byte for byte
    # on every page that carries it and on no other (after_drift): what it does
    # not show (each names only what the page's own assumptions say it leaves
    # out), then the booking button in wording A (its line under it, "Free.
    # No obligation. No pressure.", cut on 8 October 2026), then "Email me this result", hidden until the script shows
    # it, and its form: name, email, a box never ticked for the reader, and
    # the line on what is stored, why and where it goes. my-pensions sends
    # nothing, so it has no form. No other booking link sits in the results
    # before the block (the comparison's #riskCard is exempt only while it is
    # hidden).
    eq('49. the block after the result is the shared one, on every page that carries it and on no other',
       findings(pagebuild.after_drift(sources)), [])
    eq('49. on the nine calculators and the directors\' rules',
       sorted(pagebuild.AFTER), sorted(['pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html',
                                        'pension-fees-calculator.html', 'state-pension-reality-check.html', 'state-pension-entitlement.html',
                                        'standard-fund-threshold.html', 'pia.html', 'my-pensions.html', 'director-pension-rules.html']))
    squash = lambda s: re.sub(r'>\s+<', '><', s)

    def after_faults(srcs):
        f = []
        for page, (calc, not_line, mail) in sorted(pagebuild.AFTER.items()):
            s = srcs[page]
            try:
                span = pagebuild.after_span(s)
            except ValueError:
                span = None
            if not span:
                f.append('%s: no block after the result' % page); continue
            blk = s[span[0]:span[1]]
            n = blk.find('id="pbAfterNot"')
            b, w = blk.find('data-pb-ab="cta"'), blk.find(pagebuild.AFTER_WORDS)
            y = blk.find('<p class="pb-after-why">%s</p>' % pagebuild.AFTER_WHY) if pagebuild.AFTER_WHY else w
            if not (0 <= b < w <= y) or (not_line and not 0 <= n < b):
                f.append('%s: not in order: what it does not show, the button and its words, its line' % page)
            if mail:
                m, fm = blk.find('id="ecMore"'), blk.find('<form id="ecForm" name="calculator-results"')
                if not (y < m < fm):
                    f.append('%s: the email offer is not after the button' % page)
                if ('aria-controls="ecCap" hidden>Email me this result</button>' not in blk or
                        '<div class="pb-after-mail" id="ecCap" hidden>' not in blk):
                    f.append('%s: the email offer is not hidden until the script shows it' % page)
                if re.search(r'<input[^>]*type="checkbox"[^>]*\schecked', blk):
                    f.append('%s: the box is ticked for the reader' % page)
            elif '<form' in blk:
                f.append('%s: a form on a page that says nothing leaves it' % page)
            res = {'my-pensions.html': 'id="ptSum"', 'director-pension-rules.html': 'id="drOut"'}.get(page, '<div class="results">')
            r = s.find(res)
            seg = re.sub(r'<div class="chart-card" id="riskCard" hidden>.*?</a>(?:<p class="pb-why">[^<]*</p>)?</div>', '',
                         squash(s[r:span[0]])) if r >= 0 else ''
            if r < 0 or 'href="booking.html' in seg:
                f.append('%s: a booking link in the results before the block' % page)
        # the stripped booking page has no "seen your number" line (Job 2)
        if 'id="pbFrom"' in srcs['booking.html']:
            f.append('booking.html: the old line is back')
        return f

    eq('49. each block: what it does not show, the button, its line, then the email offer hidden until the script shows it, the box unticked; no booking link in the results before it; and no "seen your number" line on the booking page',
       after_faults(sources), [])
    dc, bk, fc = sources['director-calculator.html'], sources['booking.html'], sources['pension-fees-calculator.html']
    for label, page, mut, want in (
            ('the box ticked for the reader', 'pension-fees-calculator.html',
             fc.replace('id="ecConsent" name="consent" value="yes"', 'id="ecConsent" name="consent" value="yes" checked', 1),
             'pension-fees-calculator.html: the box is ticked for the reader'),
            ('the cost of waiting asking again', 'director-calculator.html',
             dc.replace('<div class="wtext" id="waitOut">Move the sliders to see it.</div>',
                        '<div class="wtext" id="waitOut">Move the sliders to see it.</div><a class="wlink" href="booking.html">Book</a>', 1),
             'director-calculator.html: a booking link in the results before the block'),
            ('the old line put back on the booking page', 'booking.html',
             bk.replace('<h1>', '<p class="pb-from" id="pbFrom" hidden>You&rsquo;ve seen your number.</p>\n    <h1>', 1),
             'booking.html: the old line is back')):
        assert mut != sources[page], label
        m49 = dict(sources); m49[page] = mut
        eq('49. %s is caught' % label, want in after_faults(m49), True)
    for label, page, mut in (
            ('the button reworded on one page', 'pia.html', sources['pia.html'].replace(
                '<span class="pb-ab-t">%s</span>' % pagebuild.AFTER_WORDS, '<span class="pb-ab-t">Book a call</span>', 1)),
            ('the block copied onto a page outside the table', 'glossary.html',
             sources['glossary.html'].replace('</main>', pagebuild.after_block('pia.html') + '</main>', 1))):
        assert mut != sources[page], label
        m49 = dict(sources); m49[page] = mut
        eq('49. %s is caught, on that page only' % label, sorted(set(findings(pagebuild.after_drift(m49)))), [(page, 'after')])

    # ----------------------------------------------------------------- 50
    # Run 45: the button test, the booking links' tags and what is counted,
    # assets/js/pb-cta.js. On every root page, once, straight after
    # pb-consent.js, whose PBTrack and PBConsent it uses. Its wording A is the
    # markup's own (pagebuild.AFTER_WORDS) and B Damian's; the pick is kept
    # (localStorage 'pb-ab-cta') only after "That's fine", and pb-consent.js
    # deletes the key with any other answer; no cookie is written; the four
    # tags are the brief's.
    cta_js, consent_js = read('assets/js/pb-cta.js'), read('assets/js/pb-consent.js')

    def cta_missing(srcs):
        return sorted(p for p, t in srcs.items()
                      if t.count('<script src="assets/js/pb-cta.js?v=') != 1 or not re.search(
                          r'<script src="assets/js/pb-consent\.js\?v=[0-9a-f]+"></script>\n<script src="assets/js/pb-cta\.js\?v=[0-9a-f]+"></script>', t))
    eq('50. pb-cta.js once on every root page, straight after pb-consent.js', cta_missing(sources), [])
    m50 = dict(sources)
    m50['terms.html'] = re.sub(r'<script src="assets/js/pb-cta\.js\?v=[0-9a-f]+"></script>\n', '', sources['terms.html'], count=1)
    eq('50. a page without it is caught', cta_missing(m50), ['terms.html'])
    eq('50. wording A is the markup\'s, wording B Damian\'s',
       ("A: '%s'" % pagebuild.AFTER_WORDS in cta_js, "B: 'See what this means for you - free 20-min call'" in cta_js), (True, True))
    eq('50. the pick is kept only after "That\'s fine", and deleted with any other answer',
       ("var KEY = 'pb-ab-cta'" in cta_js, 'if (consented()) write(variant);' in cta_js,
        "var CONSENTED_KEYS = ['pb-ab-cta']" in consent_js), (True, True, True))
    eq('50. it writes no cookie', 'document.cookie' in cta_js, False)
    eq('50. the four tags, as the brief gives them',
       [t for t in ("'utm_source=site'", "'utm_medium=cta'", "'utm_campaign=' + encodeURIComponent(page)", "'utm_content=' + variant")
        if t not in cta_js], [])
    eq('50. the five events, each counted through PBTrack',
       [e for e in ("'cta_view'", "'cta_click'", "'booking_click'") if e not in cta_js] +
       [e for e in ("'calculator_complete'", "'email_result_submit'") if e not in read('assets/js/pb-after.js')], [])

    # ----------------------------------------------------------------- 51
    # Run 45: the phone booking bar, "Book a free 20-minute call with us", on the home
    # page, the audience pages, the glossary, every page built from the
    # skeleton and the director calculator, and the five guides; never on
    # booking, the legal pages, the 404, the thank-you page or how we work.
    # It stops by itself on a page kept out of search (the held pages
    # inherit its tag from the skeleton).
    bar_js = read('assets/js/pb-bookbar.js')
    BAR = sorted(['index.html', 'starter.html', 'tracker.html', 'director.html', 'glossary.html',
                  'pension-calculator.html', 'director-calculator.html', 'pensions-over-50.html', 'self-employed-pensions.html',
                  'uk-pensions-in-ireland.html', 'old-pension-checklist.html', 'director-year-end-checklist.html'] +
                 [q.out for q in pagebuild.PAGES.values()])
    eq('51. the phone booking bar on the content pages, the calculators and tools and the guides, and nowhere else',
       sorted(p for p, t in sources.items() if re.search(r'<script src="assets/js/pb-bookbar\.js\?v=[0-9a-f]+"></script>', t)), BAR)
    eq('51. its words, and no reason line in it (the words carry it)',
       ('>Book a free 20-minute call with us</a>' in bar_js, 'pb-why' in bar_js), (True, False))
    eq('51. it stops on a page kept out of search', "meta[name=\"robots\"][content*=\"noindex\"]" in bar_js, True)
    eq('51. it stands aside for a calculator\'s inputs, the block after the result and every booking link in the page',
       [x for x in ("main a[href^=\"booking.html\"]", '#pbAfter', '.calc-wrap .panel', 'form[data-pb-calc]', "'pb-peek-on'") if x not in bar_js], [])

    # ----------------------------------------------------------------- 52
    # Run 45: one primary ask per page. A link drawn as a filled button
    # (btn-primary, btn-acc, btn-light) leads to booking; every other link is
    # drawn quieter (btn-ghost, btn-quiet-dark or a plain link). Exempt by
    # name: the 404, whose filled button is the way home, and the two pages
    # held back. The home page's hero gives the figure and asks only which of
    # the three situations is the reader's, and its booking ask after the
    # way-of-life picker stands alone.
    FILLED = {'btn-primary', 'btn-acc', 'btn-light'}

    def loud_links(srcs):
        out = []
        for page, text in sorted(srcs.items()):
            if page in ('404.html', 'find-my-pension.html', 'pension-readiness-check.html'):
                continue
            body = re.sub(r'<script\b.*?</script>', '', text[text.find('<main'):text.find('</main>')], flags=re.S)
            for m in re.finditer(r'<a\b([^>]*)>', body):
                cls = (re.search(r'class="([^"]*)"', m.group(1)) or [None, ''])[1].split()
                href = (re.search(r'href="([^"]*)"', m.group(1)) or [None, ''])[1]
                if 'btn' in cls and FILLED & set(cls) and not re.match(r'(booking\.html|https://calendly\.com/)', href):
                    out.append('%s: %s' % (page, href))
        return out
    eq('52. every link drawn as a filled button leads to booking', loud_links(sources), [])
    m52 = dict(sources)
    m52['starter.html'] = sources['starter.html'].replace('<a class="btn btn-ghost" href="broker-vs-autoenrolment.html">',
                                                         '<a class="btn btn-primary" href="broker-vs-autoenrolment.html">', 1)
    assert m52['starter.html'] != sources['starter.html']
    eq('52. a filled button to another page is caught', loud_links(m52), ['starter.html: broker-vs-autoenrolment.html'])
    home = sources['index.html']
    hero = home[home.find('<header class="hero'):home.find('</header>')]
    eq('52. the home page hero: the three situations, and no button and no booking link',
       (re.findall(r'<a class="pb-chip-hero" href="([a-z]+)\.html"', hero), 'class="btn' in hero, 'booking.html' in hero),
       (['starter', 'tracker', 'director'], False, False))
    life = home[home.find('<section class="pb-gap-more" id="life">'):home.find('</section>', home.find('id="life"'))]
    eq('52. the booking ask after the way-of-life picker stands alone', re.findall(r'<a class="btn [^"]*" href="([^"]+)"', life), ['booking.html'])




    # ----------------------------------------------------------------- 53
    # Run 47: the two prescribed warnings (Regs 372 and 392, compliance pack
    # 1.4) come from one source, pagebuild.WARN. Every page with projected
    # figures carries exactly its boxes, each the exact two sentences; no
    # other page carries one; no box sits outside the WARN comments.
    SENT = ('Warning: These figures are estimates only. They are not a reliable guide to the future performance of your investment.',
            'Warning: The value of your investment may go down as well as up.')
    eq('53. pagebuild.WARN is the two sentences, word for word, each bold, in one pb-warn box',
       pagebuild.WARN, '<div class="pb-warn"><p><b>%s</b></p><p><b>%s</b></p></div>' % SENT)
    eq('53. the pages with projected figures, and their boxes',
       sorted(pagebuild.WARN_PAGES.items()), [('broker-vs-autoenrolment.html', 2), ('director-calculator.html', 1), ('pension-calculator.html', 1),
                                              ('pension-fees-calculator.html', 1), ('pia.html', 1), ('starter.html', 3)])
    eq('53. every page carries exactly its warnings, word for word, from pagebuild.WARN, and no other page one',
       findings(pagebuild.warn_drift(sources)), [])

    def sentences(srcs):
        """pages whose visible box text is not the two exact sentences, or that lack them"""
        bad = []
        for page, n in pagebuild.WARN_PAGES.items():
            got = re.findall(r'<div class="pb-warn"><p><b>([^<]*)</b></p><p><b>([^<]*)</b></p></div>', srcs[page])
            if len(got) != n or any(g != SENT for g in got):
                bad.append(page)
        return sorted(bad)
    eq('53. and each box reads the exact two sentences', sentences(sources), [])
    for label, page, mut in (
            ('a word changed on one page', 'pia.html', sources['pia.html'].replace('may go down as well as up', 'can go down as well as up', 1)),
            ('a box removed', 'starter.html', sources['starter.html'].replace(pagebuild.WARN_OPEN + pagebuild.WARN + pagebuild.WARN_CLOSE, '', 1)),
            ('a hand-written box outside the comments', 'director-calculator.html',
             sources['director-calculator.html'].replace(pagebuild.WARN_OPEN + pagebuild.WARN + pagebuild.WARN_CLOSE, pagebuild.WARN, 1)),
            ('a box on a page without projected figures', 'glossary.html',
             sources['glossary.html'].replace('</main>', pagebuild.WARN_OPEN + pagebuild.WARN + pagebuild.WARN_CLOSE + '</main>', 1))):
        assert mut != sources[page], label
        m53 = dict(sources); m53[page] = mut
        eq('53. %s is caught, on that page only' % label, sorted(set(findings(pagebuild.warn_drift(m53)))), [(page, 'warn')])
    m53 = dict(sources); m53['pia.html'] = sources['pia.html'].replace('may go down as well as up', 'can go down as well as up', 1)
    eq('53. and the sentence check names it', sentences(m53), ['pia.html'])
    eq('53. the copy editor still locks every box', "'pb-warn'," in read('tools/edit-server.py'), True)


# Run 27: every Netlify form on the site, by page. Adding a lead form means
# adding it here, and telling Damian its name for the notification settings.
LEAD_FORMS = {
    'director.html': 'director-guide',
    'starter.html': 'starter-guide',
    'tracker.html': 'tracker-guide',
    'find-my-pension.html': 'pension-finder',
    # Run 43, item 5e, and Run 45: "Email me this result" under one name on
    # every calculator that offers it (pagebuild.after_block), with the same
    # fields on each; the pension and director calculators' own forms and the
    # booking page's routing form are gone
    'pension-calculator.html': 'calculator-results',
    'director-calculator.html': 'calculator-results',
    'director-pension-rules.html': 'calculator-results',
    'broker-vs-autoenrolment.html': 'calculator-results',
    'pension-fees-calculator.html': 'calculator-results',
    'state-pension-reality-check.html': 'calculator-results',
    'state-pension-entitlement.html': 'calculator-results',
    'standard-fund-threshold.html': 'calculator-results',
    'pia.html': 'calculator-results',
}


if __name__ == '__main__':
    run()
    report()
