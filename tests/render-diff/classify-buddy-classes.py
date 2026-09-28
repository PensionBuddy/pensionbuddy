#!/usr/bin/env python3
"""Run 32, part 3b: floating chrome gives way, and nothing else moves.

Not a refactor in the strict sense: Ask Buddy's button gains classes at run
time (pb-b-away while the analytics choice is open, pb-b-aside while
something the reader needs is under it), and the booking and results bars
gain a class on <html> when they step down. The claim is that that is ALL
that changes on the five calculators. This takes browser-diff's real Chrome
probe, baseline checkout against the working tree, over every frame it
takes, and allows a cell to differ only when it is Ask Buddy's button, its
text and hidden flag are the same on both sides, and its classes are the
same once pb-b-away and pb-b-aside are set aside. Any other difference, on
any calculator, fails.

    BASELINE_REF=<the commit before the change> python3 classify-buddy-classes.py
"""
import importlib.util
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('browser_diff', os.path.join(HERE, 'browser-diff.py'))
bd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bd)

CELL = 'pbBuddyBtn'
SET_ASIDE = {'pb-b-away', 'pb-b-aside'}


def classify(k, x, y):
    """None if y differs from x only in the classes set aside on Ask Buddy's
    button, else the reason."""
    if k != CELL:
        return 'a cell other than Ask Buddy\'s button changed'
    if not isinstance(x, dict) or not isinstance(y, dict) or set(x) != set(y):
        return 'different shape'
    for f in x:
        if f == 'c':
            if set(str(x[f]).split()) - SET_ASIDE != set(str(y[f]).split()) - SET_ASIDE:
                return 'a class other than pb-b-away or pb-b-aside changed'
        elif x[f] != y[f]:
            return 'its %s changed' % {'t': 'text', 'h': 'hidden flag'}.get(f, f)
    return None


def main():
    print('classify Ask Buddy\'s classes, working tree against %s' % bd.BASELINE_REF)
    old = bd.checkout_baseline()
    bad = 0
    try:
        for page, cfg in bd.PAGES.items():
            a, b = bd.probe(old, page, cfg), bd.probe(bd.ROOT, page, cfg)
            if a is None or b is None or len(a['frames']) != len(b['frames']):
                print('  FAIL %-32s probe output missing or frame counts differ' % page)
                bad += 1
                continue
            cells = diffs = 0
            reasons = {}
            for fa, fb in zip(a['frames'], b['frames']):
                for k in set(fa['snap']) | set(fb['snap']):
                    cells += 1
                    x, y = fa['snap'].get(k), fb['snap'].get(k)
                    if x == y:
                        continue
                    diffs += 1
                    why = classify(k, x, y)
                    if why:
                        reasons.setdefault(why, []).append('%s #%s' % (fa['label'], k))
            errs = a['errors'] + b['errors']
            ok = not reasons and not errs
            bad += 0 if ok else 1
            print('  %s %-32s %d frames, %d cells, %d differing, all only in Ask Buddy\'s classes%s'
                  % ('ok  ' if ok else 'FAIL', page, len(a['frames']), cells, diffs,
                     '' if not errs else ', %d errors' % len(errs)))
            for why, where in reasons.items():
                print('        %s: %s' % (why, ', '.join(where[:4])))
    finally:
        shutil.rmtree(old, ignore_errors=True)
    print('\n%s' % ('every difference is Ask Buddy stepping aside and nothing else' if not bad else 'FAILURES: %d' % bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
