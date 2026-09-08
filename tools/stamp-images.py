#!/usr/bin/env python3
"""Stamp local image URLs with a content hash, so a replaced photo is actually seen.

    python3 tools/stamp-images.py

Swapping a photo keeps the same filename, so a browser that already has the old
one carries on showing it. That is exactly what happened when Damian's portrait
went black and white: the file changed, the URL did not, and the old colour
version stayed on screen. Adding ?v=<hash of the file> makes the URL change
whenever the bytes change, which is the same trick the calculator pages already
use for their JavaScript modules.

Re-runnable. Only files that actually changed get a new stamp, so running this
when nothing has moved rewrites nothing. tools/verify.py strips the query off a
path before checking it exists, so stamped URLs still pass the link audit.
"""
import glob, hashlib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# assets/img/name.ext, optionally already stamped
PAT = re.compile(r'(assets/img/[A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|webp|svg))(\?v=[0-9a-f]+)?')

_hash = {}


def stamp(rel):
    if rel not in _hash:
        path = os.path.join(ROOT, rel)
        if not os.path.isfile(path):
            _hash[rel] = None
        else:
            with open(path, 'rb') as f:
                _hash[rel] = hashlib.sha1(f.read()).hexdigest()[:8]
    return _hash[rel]


def main():
    check = '--check' in sys.argv
    touched, missing, total = {}, set(), 0
    for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
        src = open(f, encoding='utf-8').read()

        def repl(m):
            nonlocal total
            rel, had = m.group(1), m.group(2)
            h = stamp(rel)
            if h is None:
                missing.add(rel)
                return m.group(0)
            total += 1
            return '%s?v=%s' % (rel, h)

        out = PAT.sub(repl, src)
        if out != src:
            touched[os.path.basename(f)] = sum(
                1 for a, b in zip(PAT.finditer(src), PAT.finditer(out)) if a.group(0) != b.group(0))
            if not check:
                open(f, 'w', encoding='utf-8').write(out)

    if missing:
        print('image referenced but not on disk:')
        for m in sorted(missing):
            print('   ', m)
    print('%d image reference%s stamped across %d page%s'
          % (total, '' if total == 1 else 's', len(touched), '' if len(touched) == 1 else 's'))
    for k in sorted(touched):
        print('   %-32s updated' % k)
    if check and touched:
        sys.exit('--check: stamps are out of date, run without --check')
    if missing:
        sys.exit(1)


if __name__ == '__main__':
    main()
