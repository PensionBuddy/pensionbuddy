#!/usr/bin/env python3
"""Run 32, parts 1a and 2b: the reveal classes come off, and nothing else moves.

Not a refactor in the strict sense, because markup changes: elements lose
their `reveal` class (and so never gain `in` and `settled` at run time), and
a few gain `pb-caveat`. The claim is that that is ALL that changes. This takes
browser-diff's real Chrome probe of the five calculators, baseline checkout
against the working tree, over every frame it takes, and allows a cell to
differ only when its text and its hidden flag are the same on both sides and
its classes are the same once reveal, in, settled and pb-caveat are set
aside. Any other difference, on any calculator, fails.

    BASELINE_REF=<the commit before the change> python3 classify-reveal-classes.py
"""
import importlib.util
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('browser_diff', os.path.join(HERE, 'browser-diff.py'))
bd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bd)

SET_ASIDE = {'reveal', 'in', 'settled', 'pb-caveat'}


def classify(x, y):
    """None if y differs from x only in the classes set aside, else the reason."""
    if not isinstance(x, dict) or not isinstance(y, dict) or set(x) != set(y):
        return 'different shape'
    for k in x:
        if k == 'c':
            if set(str(x[k]).split()) - SET_ASIDE != set(str(y[k]).split()) - SET_ASIDE:
                return 'a class other than reveal, in, settled or pb-caveat changed'
        elif x[k] != y[k]:
            return 'its %s changed' % {'t': 'text', 'h': 'hidden flag'}.get(k, k)
    return None


def main():
    print('classify the reveal classes, working tree against %s' % bd.BASELINE_REF)
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
                    why = classify(x, y)
                    if why:
                        reasons.setdefault(why, []).append('%s #%s' % (fa['label'], k))
            errs = a['errors'] + b['errors']
            ok = not reasons and not errs
            bad += 0 if ok else 1
            print('  %s %-32s %d frames, %d cells, %d differing, all only in reveal classes%s'
                  % ('ok  ' if ok else 'FAIL', page, len(a['frames']), cells, diffs,
                     '' if not errs else ', %d errors' % len(errs)))
            for why, where in reasons.items():
                print('        %s: %s' % (why, ', '.join(where[:4])))
    finally:
        shutil.rmtree(old, ignore_errors=True)
    print('\n%s' % ('every difference is a reveal class and nothing else' if not bad else 'FAILURES: %d' % bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
