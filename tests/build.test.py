#!/usr/bin/env python3
"""Acceptance tests for the built pages and the assembly that produces them.

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


if __name__ == '__main__':
    run()
    report()
