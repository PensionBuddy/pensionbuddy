#!/usr/bin/env python3
"""Run 34, item 1: the PIA page's two results tables each go into a box that
scrolls on the narrowest phones, and nothing a reader sees changes but that.

The box is a new element around each table, so the text of every element
around it gains a run of whitespace, and each table's caption gains an id
(the box is named by it). This takes browser-diff's real Chrome probe of
every calculator, baseline checkout against the working tree, over every
frame it takes, and allows a difference only when

  * a cell's classes and hidden flag are the same on both sides and its
    text is the same once every run of whitespace is collapsed to one
    space, or
  * the cell is one of the two captions, absent from the old probe only
    because it had no id, and its text is the caption's text on the old
    page, word for word.

Any other difference, on any calculator, fails.

    BASELINE_REF=<the commit before the change> python3 classify-pia-tablewrap.py
"""
import importlib.util
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('browser_diff', os.path.join(HERE, 'browser-diff.py'))
bd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bd)

CAPTIONS = {
    'piaStCapPaths': 'What each could leave you after tax, under three growth paths',
    'piaStCapTax': 'Tax relief and tax for each product, at your growth rate',
}


def squash(t):
    return re.sub(r'\s+', ' ', str(t)).strip()


def classify(page, k, x, y, old_html):
    """None if the difference is one this change is allowed to make, else the reason."""
    if page == 'pia.html' and k in CAPTIONS and x is None:
        if not isinstance(y, dict) or y.get('t') != CAPTIONS[k] or y.get('c') != 'tk-sr':
            return 'a caption is not the old caption'
        if old_html.count('<caption class="tk-sr">%s</caption>' % CAPTIONS[k]) != 1:
            return 'the old page did not carry this caption'
        return None
    if not isinstance(x, dict) or not isinstance(y, dict) or set(x) != set(y):
        return 'different shape'
    for f in x:
        if f == 't':
            if squash(x[f]) != squash(y[f]):
                return 'its text changed'
        elif x[f] != y[f]:
            return 'its %s changed' % {'h': 'hidden flag', 'c': 'class'}.get(f, f)
    return None


def main():
    print('classify the PIA table boxes, working tree against %s' % bd.BASELINE_REF)
    old = bd.checkout_baseline()
    bad = 0
    try:
        for page, cfg in bd.PAGES.items():
            old_html = open(os.path.join(old, page), encoding='utf-8').read()
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
                    why = classify(page, k, x, y, old_html)
                    if why:
                        reasons.setdefault(why, []).append('%s #%s' % (fa['label'], k))
            errs = a['errors'] + b['errors']
            ok = not reasons and not errs
            bad += 0 if ok else 1
            print('  %s %-32s %d frames, %d cells, %d differing, all whitespace or a caption given an id%s'
                  % ('ok  ' if ok else 'FAIL', page, len(a['frames']), cells, diffs,
                     '' if not errs else ', %d errors' % len(errs)))
            for why, where in reasons.items():
                print('        %s: %s' % (why, ', '.join(where[:4])))
    finally:
        shutil.rmtree(old, ignore_errors=True)
    print('\n%s' % ('every difference is the table boxes and nothing else' if not bad else 'FAILURES: %d' % bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
