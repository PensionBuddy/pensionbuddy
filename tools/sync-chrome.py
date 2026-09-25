#!/usr/bin/env python3
"""Copy the shared chrome, the nav, the footer's link columns and (Run 28)
the NAV block of CSS that styles the nav, from the skeleton to every
hand-written page.

    python3 tools/sync-chrome.py
    python3 tools/sync-chrome.py --check     # report, change nothing, exit 1 if stale

The nav and the four link columns at the bottom are the same on all sixteen
pages, and until now every change to them was the same edit made sixteen
times: the last three commits that touched them touched 16, 16 and 18 pages.
Now they have one owner, pension-calculator.html. Edit the nav or the
foot-top there, run this, and the twelve hand-written pages follow; the three
built calculator pages take theirs from the same skeleton when
tools/pagebuild.py next runs, and --check names any that are behind. The two
tools commute: either order reaches the same tree, as long as both run.

What differs per page is worked out here rather than kept in a list: the
page's own nav item carries class="lnk active" and aria-current="page", and
on index.html the nav's own-page fragments are same-page anchors. The rules,
the block finders and the guard live in tools/pagebuild.py; this is the
command line, in the shape of tools/stamp-images.py: only files that actually
change are rewritten, and index.html's foot-top, which differs from the
skeleton's only in the whitespace between its tags, is left as it is.

NOT SYNCED, on purpose: the disclosure paragraphs under the link columns,
which carry different legal wording on the legal pages; and the stylesheet,
which is three families across the sixteen pages with no shared subset. Both
are guarded by tools/verify.py where they are meant to be identical (the
Central Bank paragraph, the design tokens), never rewritten.

Every page is checked before any is written: a page with two navs, or none,
stops the run with nothing changed. Pages are the html files git tracks at
the root, so a throwaway file left there by another tool is never touched.
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pagebuild import PAGES, ROOT, SKELETON, chrome_drift, sync_blocks  # noqa: E402


def page_files(root):
    """The html pages at the root: the tracked ones, or, outside a checkout,
    whatever is there."""
    try:
        ls = subprocess.run(['git', 'ls-files', '*.html'], cwd=root, capture_output=True, text=True)
        names = [n for n in ls.stdout.split('\n') if n.endswith('.html') and '/' not in n]
    except OSError:
        names = []
    return names or sorted(f for f in os.listdir(root) if f.endswith('.html'))


def main(argv):
    check = '--check' in argv
    root = argv[argv.index('--root') + 1] if '--root' in argv else ROOT
    skeleton = os.path.basename(SKELETON)
    names = page_files(root)
    if skeleton not in names:
        sys.exit('refusing to write: %s is not among the pages in %s' % (skeleton, root))
    sources = {}
    for n in names:
        with open(os.path.join(root, n), encoding='utf-8') as f:
            sources[n] = f.read()

    try:
        updates = sync_blocks(sources)
    except ValueError as e:
        sys.exit('refusing to write: %s' % e)

    built = {p.out for p in PAGES.values()}
    behind = sorted(p for p in chrome_drift(sources) if p in built)

    if not check:
        for page, text in sorted(updates.items()):
            with open(os.path.join(root, page), 'w', encoding='utf-8') as f:
                f.write(text)

    hand = len(names) - 1 - len(built & set(names))
    print('nav and footer synced from %s; %d page%s checked, %d owned by pagebuild, %d updated'
          % (skeleton, hand, '' if hand == 1 else 's', len(built & set(names)), len(updates)))
    for page in sorted(updates):
        print('   %-32s %s' % (page, 'would update' if check else 'updated'))
    for page in behind:
        print('   %-32s chrome is behind the skeleton: run tools/pagebuild.py' % page)
    if check and (updates or behind):
        sys.exit('--check: the chrome is out of date, run without --check')
    if behind:
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1:])
