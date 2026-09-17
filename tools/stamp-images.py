#!/usr/bin/env python3
"""Stamp local image and script URLs with a content hash, so replaced bytes are seen.

    python3 tools/stamp-images.py
    python3 tools/stamp-images.py --check     # report, change nothing, exit 1 if stale

Swapping a photo keeps the same filename, so a browser that already has the old
one carries on showing it. That is exactly what happened when Damian's portrait
went black and white: the file changed, the URL did not, and the old colour
version stayed on screen. Adding ?v=<hash of the file> makes the URL change
whenever the bytes change, which is the same trick the calculator pages already
use for their JavaScript modules.

The same goes for a script: the calculator modules have always carried a hash,
and assets/js/calc-page.js, the shared UI runtime, gets one the same way. That
one matters here in particular, because pension-calculator.html is both a
hand-written page and the skeleton every other calculator is assembled from,
and its tag is written with no ?v= so this is what fills it in.

The stamping rule itself lives in tools/pagebuild.py, which applies it inside
assembly so an assembled page is complete when it is written. This script is
for the hand-written pages, which have no build step; run over an assembled
page it finds nothing to do. Re-runnable either way: only files that actually
changed are rewritten. tools/verify.py strips the query off a path before
checking it exists, so stamped URLs still pass the link audit.
"""
import glob
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pagebuild import IMG_PAT, JS_PAT, ROOT, stamp_html  # noqa: E402


def main():
    check = '--check' in sys.argv
    touched, missing, total = {}, set(), 0

    scripts = 0
    for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
        src = open(f, encoding='utf-8').read()
        out = stamp_html(src, missing)
        total += sum(1 for m in IMG_PAT.finditer(out) if m.group(2))
        scripts += sum(1 for m in JS_PAT.finditer(out) if m.group(3))
        if out != src:
            # count both kinds, or a page whose only stale stamp is a script
            # reports "0 updated" and reads as a no-op
            touched[os.path.basename(f)] = sum(
                1 for a, b in zip(IMG_PAT.finditer(src), IMG_PAT.finditer(out))
                if a.group(0) != b.group(0)) + sum(
                1 for a, b in zip(JS_PAT.finditer(src), JS_PAT.finditer(out))
                if a.group(0) != b.group(0))
            if not check:
                open(f, 'w', encoding='utf-8').write(out)

    if missing:
        print('referenced but not on disk:')
        for m in sorted(missing):
            print('   ', m)
    print('%d image and %d script reference%s stamped; %d page%s updated'
          % (total, scripts, '' if total + scripts == 1 else 's',
             len(touched), '' if len(touched) == 1 else 's'))
    for k in sorted(touched):
        print('   %-32s updated' % k)
    if check and touched:
        sys.exit('--check: stamps are out of date, run without --check')
    if missing:
        sys.exit(1)


if __name__ == '__main__':
    main()
