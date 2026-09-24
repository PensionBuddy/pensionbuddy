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
    eq('8. the pages that mark themselves current are derived from the nav, and are these six',
       sorted(pagebuild.nav_targets(skel_nav)),
       ['director.html', 'glossary.html', 'pension-calculator.html', 'starter.html',
        'state-pension-reality-check.html', 'tracker.html'])

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
         nav_only('terms.html', '<a class="lnk" href="glossary.html">Jargon buster</a>',
                  '<a class="lnk" href="glossary.html">Jargon buster</a>\n    <a class="lnk" href="glossary.html#tax-relief">Tax relief</a>')),
        ('a relabelled nav item', 'privacy.html', 'nav',
         nav_only('privacy.html', '>Jargon buster</a>', '>Jargon</a>')),
        ('the current marker on the wrong item', 'tracker.html', 'active',
         nav_only('tracker.html', '<a class="lnk active" href="tracker.html" aria-current="page">Find a pension</a>',
                  '<a class="lnk" href="tracker.html">Find a pension</a>').replace(
             '<a class="lnk" href="glossary.html">Jargon buster</a>',
             '<a class="lnk active" href="glossary.html" aria-current="page">Jargon buster</a>', 1)),
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
        '<a class="lnk" href="glossary.html">Jargon buster</a>',
        '<a class="lnk" href="glossary.html">Jargon buster</a>\n    <a class="lnk" href="state-pension-entitlement.html">Entitlement</a>')
    out = pagebuild.sync_blocks(moved)
    eq('10. a new item in the skeleton reaches every hand-written page',
       sorted(out), sorted(p for p in sources if p != 'pension-calculator.html' and p not in {q.out for q in pagebuild.PAGES.values()}))
    eq('10. and never the skeleton or the built pages',
       [p for p in out if p == 'pension-calculator.html' or p in {q.out for q in pagebuild.PAGES.values()}], [])
    eq('10. the new item lands on the page that marks itself current, still marked',
       '<a class="lnk active" href="tracker.html" aria-current="page">' in out['tracker.html'] and
       'href="state-pension-entitlement.html">Entitlement' in out['tracker.html'], True)
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


if __name__ == '__main__':
    run()
    report()
