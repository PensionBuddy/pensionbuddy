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
