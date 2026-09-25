#!/usr/bin/env python3
"""sitemap.xml from the pages themselves.

    python3 tools/sitemap.py            # rewrite sitemap.xml
    python3 tools/sitemap.py --check    # report, change nothing, exit 1 if it is wrong

Run 28. A page is listed when it is live and indexable: every root page and
every game page, less any that carries a robots noindex (404, thank-you, and
the pages held back until signed off: how-we-work, the finder, the readiness
check). Holding a page back is adding that meta; releasing it is removing it,
and this tool follows either way. about.html is not a page: it was folded
into index.html#story in Run 4, and verify.py fails the site if it returns.

lastmod is the date of the last commit that changed the file, or today for a
file with changes not yet committed, so a rewrite just before a commit dates
that commit's pages correctly. Priorities and order are kept from the
current sitemap; a newly listed page goes at the end at 0.5.

--check fails on a missing or extra page and on a lastmod older than the
file's last commit. A lastmod ahead of it is allowed: it is what a rewrite
before a commit leaves until that commit lands.
"""
import datetime
import glob
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://pensionbuddy.ie/'
PATH = os.path.join(ROOT, 'sitemap.xml')
NOINDEX = re.compile(r'<meta name="robots" content="[^"]*noindex', re.I)
ENTRY = re.compile(r'<url><loc>([^<]+)</loc><lastmod>([^<]+)</lastmod><priority>([^<]+)</priority></url>')


def pages():
    """Every live, indexable page, as ROOT-relative paths."""
    out = []
    found = sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, '*.html')))
    found += sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, 'games', '*.html')))
    for rel in found:
        text = open(os.path.join(ROOT, rel), encoding='utf-8', errors='replace').read()
        if not NOINDEX.search(text):
            out.append(rel)
    return out


def url(rel):
    return SITE if rel == 'index.html' else SITE + rel


def git(*args):
    return subprocess.run(['git'] + list(args), cwd=ROOT, capture_output=True, text=True).stdout.strip()


def committed(rel):
    return git('log', '-1', '--format=%cs', '--', rel)


def changed(rel):
    """The date the file last changed: today if it differs from HEAD."""
    dirty = subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', rel], cwd=ROOT).returncode != 0
    return datetime.date.today().isoformat() if dirty or not committed(rel) else committed(rel)


def current():
    if not os.path.exists(PATH):
        return []
    return ENTRY.findall(open(PATH, encoding='utf-8').read())


def build():
    have = {loc: pri for loc, _, pri in current()}
    order = [loc for loc, _, _ in current()]
    want = {url(rel): rel for rel in pages()}
    locs = [l for l in order if l in want] + [url(r) for r in pages() if url(r) not in order]
    rows = ['  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>'
            % (l, changed(want[l]), have.get(l, '0.5')) for l in locs]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(rows) + '\n</urlset>\n')


def problems():
    listed = {loc: mod for loc, mod, _ in current()}
    want = {url(rel): rel for rel in pages()}
    out = ['missing: %s' % l for l in want if l not in listed]
    out += ['listed but not a live, indexable page: %s' % l for l in listed if l not in want]
    for l, rel in want.items():
        if l in listed and committed(rel) and listed[l] < committed(rel):
            out.append('stale lastmod: %s says %s, last changed %s' % (rel, listed[l], committed(rel)))
    return out


def main():
    if '--check' in sys.argv:
        found = problems()
        for p in found:
            print('  ' + p)
        print('sitemap.xml: %d pages, %s' % (len(pages()), 'ok' if not found else '%d problem(s)' % len(found)))
        sys.exit(1 if found else 0)
    text = build()
    old = open(PATH, encoding='utf-8').read() if os.path.exists(PATH) else ''
    if text != old:
        open(PATH, 'w', encoding='utf-8').write(text)
    print('sitemap.xml: %d pages, %s' % (len(pages()), 'rewritten' if text != old else 'unchanged'))


if __name__ == '__main__':
    main()
