#!/usr/bin/env python3
"""Run 32: the comparison page's second mode gains the first mode's warning box.

Not a refactor, so the claim is WHERE the page differs: browser-diff's real
Chrome probe of broker-vs-autoenrolment.html, baseline checkout against the
working tree, over every frame it takes (load, every state, every toggle).
Every differing cell must be one of the two that contain the new box,
#mode2Results and #main, and each must be the old cell with the warning's
text inserted exactly once and nothing else changed: no figure, no class,
no other text. The other four calculators must not differ at all.

    BASELINE_REF=HEAD~1 python3 classify-compare-warning.py
"""
import importlib.util
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('browser_diff', os.path.join(HERE, 'browser-diff.py'))
bd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bd)

WARN = ('Warning: These figures are estimates only. They are not a reliable guide to the future '
        'performance of your investment. Warning: The value of your investment may go down as well as up.')
ALLOWED = {'mode2Results', 'main'}
PAGE = 'broker-vs-autoenrolment.html'


def norm(s):
    """text with all whitespace removed: textContent runs the box's two
    paragraphs together ("investment.Warning:"), and indentation differs"""
    return ''.join(str(s).split())


def classify(x, y):
    """None if y is x with the warning inserted once, else the reason."""
    if not isinstance(x, dict) or not isinstance(y, dict) or set(x) != set(y):
        return 'different shape'
    for k in x:
        if k == 't':
            continue
        if x[k] != y[k]:
            return 'property %s changed' % k
    a, b, w = norm(x.get('t', '')), norm(y.get('t', '')), norm(WARN)
    if b.count(w) != a.count(w) + 1:
        return 'warning not inserted exactly once'
    i = b.find(w)
    while i >= 0:
        if b[:i] + b[i + len(w):] == a:
            return None
        i = b.find(w, i + 1)
    return 'text differs beyond the warning'


def main():
    print('classify the comparison warning, working tree against %s' % bd.BASELINE_REF)
    old = bd.checkout_baseline()
    bad = 0
    try:
        for page, cfg in bd.PAGES.items():
            a, b = bd.probe(old, page, cfg), bd.probe(bd.ROOT, page, cfg)
            if a is None or b is None or len(a['frames']) != len(b['frames']):
                print('  FAIL %-32s probe output missing or frame counts differ' % page)
                bad += 1
                continue
            cells = diffs = explained = 0
            reasons = {}
            for fa, fb in zip(a['frames'], b['frames']):
                for k in set(fa['snap']) | set(fb['snap']):
                    cells += 1
                    x, y = fa['snap'].get(k), fb['snap'].get(k)
                    if x == y:
                        continue
                    diffs += 1
                    why = 'not allowed on this page' if page != PAGE else (
                        'cell #%s may not change' % k if k not in ALLOWED else classify(x, y))
                    if why is None:
                        explained += 1
                    else:
                        reasons.setdefault(why, []).append('%s #%s' % (fa['label'], k))
            errs = a['errors'] + b['errors']
            ok = not reasons and not errs
            bad += 0 if ok else 1
            print('  %s %-32s %d frames, %d cells, %d differing, %d are the warning inserted once%s'
                  % ('ok  ' if ok else 'FAIL', page, len(a['frames']), cells, diffs, explained,
                     '' if not errs else ', %d errors' % len(errs)))
            for why, where in reasons.items():
                print('        %s: %s' % (why, ', '.join(where[:4])))
    finally:
        shutil.rmtree(old, ignore_errors=True)
    print('\n%s' % ('the only difference is the warning, in #mode2Results and #main' if not bad
                    else 'FAILURES: %d' % bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
