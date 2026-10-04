#!/usr/bin/env python3
"""Run 43, item 5: give, then ask. Where the calculators differ, and only there.

Not a refactor, so the claim is WHERE each page differs: browser-diff's real
Chrome probe of the six calculators, baseline checkout against the working
tree, over every frame it takes (load, every state, every toggle, every click).

--reason (BASELINE_REF = the commit before item 5d's swap). The reason line
beside a booking link was "Free, 20 minutes, no obligation." and is now
"Free · 20 minutes · no obligation · reschedule any time." Every differing
cell must be the old cell with those words swapped and nothing else changed:
every property but its text the same, and its text, whitespace removed, equal
to the old text with every old line replaced by the new one (the old line
present at least once). A cell on one side only fails. The proof must not be
vacuous, in every frame:
  * pension, director and comparison: #main (the closing band's line) and
    #pbBuddyPanel (the Ask Buddy panel's footer, built by pb-buddy.js) are
    among the differing cells;
  * reality, entitlement and PIA: #pbBuddyPanel is the only differing cell.

    BASELINE_REF=<commit before the swap> python3 classify-give-then-ask.py --reason
    python3 classify-give-then-ask.py --self-test     # proves each mode can fail
"""
import importlib.util
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('browser_diff', os.path.join(HERE, 'browser-diff.py'))
bd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bd)

OLD = 'Free, 20 minutes, no obligation.'
NEW = 'Free · 20 minutes · no obligation · reschedule any time.'

# --reason: the cells that must differ in every frame, and whether they are
# the only ones that may (True) or merely among them (False)
REASON_MUST = {
    'pension-calculator.html': ({'main', 'pbBuddyPanel'}, False),
    'director-calculator.html': ({'main', 'pbBuddyPanel'}, False),
    'broker-vs-autoenrolment.html': ({'main', 'pbBuddyPanel'}, False),
    'state-pension-reality-check.html': ({'pbBuddyPanel'}, True),
    'state-pension-entitlement.html': ({'pbBuddyPanel'}, True),
    'pia.html': ({'pbBuddyPanel'}, True),
}


def norm(s):
    """text with all whitespace removed: textContent runs paragraphs together
    and indentation differs between the hand-written and built pages"""
    return ''.join(str(s).split())


def classify_reason(x, y):
    """None if y is x with every reason line swapped, else the reason why not."""
    if x is None or y is None:
        return 'cell on one side only'
    if not isinstance(x, dict) or not isinstance(y, dict) or set(x) != set(y):
        return 'different shape'
    for k in x:
        if k != 't' and x[k] != y[k]:
            return 'property %s changed' % k
    a, b = norm(x.get('t', '')), norm(y.get('t', ''))
    if norm(OLD) not in a:
        return 'old cell has no reason line'
    if b != a.replace(norm(OLD), norm(NEW)):
        return 'text differs beyond the reason'
    return None


def judge(page, frames_a, frames_b):
    """(reasons, cells, diffs, explained) for one page's frames, --reason."""
    reasons = {}
    cells = diffs = explained = 0
    if len(frames_a) != len(frames_b):
        reasons['frame counts differ'] = ['%d vs %d' % (len(frames_a), len(frames_b))]
        return reasons, cells, diffs, explained
    must, only = REASON_MUST[page]
    for fa, fb in zip(frames_a, frames_b):
        differing = set()
        for k in set(fa['snap']) | set(fb['snap']):
            cells += 1
            x, y = fa['snap'].get(k), fb['snap'].get(k)
            if x == y:
                continue
            diffs += 1
            differing.add(k)
            why = classify_reason(x, y)
            if why is None and only and k not in must:
                why = 'cell #%s may not change on this page' % k
            if why is None:
                explained += 1
            else:
                reasons.setdefault(why, []).append('%s #%s' % (fa['label'], k))
        missing = must - differing
        if missing:
            reasons.setdefault('vacuous: expected %s to differ' % ', '.join('#' + m for m in sorted(must)),
                               []).append('%s (not #%s)' % (fa['label'], ', #'.join(sorted(missing))))
    return reasons, cells, diffs, explained


def run_reason():
    print('classify the reason line swap, working tree against %s' % bd.BASELINE_REF)
    old = bd.checkout_baseline()
    bad = 0
    try:
        for page, cfg in bd.PAGES.items():
            a, b = bd.probe(old, page, cfg), bd.probe(bd.ROOT, page, cfg)
            if a is None or b is None:
                print('  FAIL %-34s probe output missing (%s)' % (page, 'old' if a is None else 'new'))
                bad += 1
                continue
            reasons, cells, diffs, explained = judge(page, a['frames'], b['frames'])
            errs = a['errors'] + b['errors']
            ok = not reasons and not errs
            bad += 0 if ok else 1
            print('  %s %-34s %d frames, %d cells, %d differing, %d are the reason line swapped%s'
                  % ('ok  ' if ok else 'FAIL', page, len(a['frames']), cells, diffs, explained,
                     '' if not errs else ', %d errors' % len(errs)))
            for why, where in reasons.items():
                print('        %s: %s' % (why, ', '.join(where[:4])))
            for e in errs[:4]:
                print('        error: %s' % e)
    finally:
        shutil.rmtree(old, ignore_errors=True)
    print('\n%s' % ('the only difference is the reason line, swapped' if not bad else 'FAILURES: %d' % bad))
    return bad


def self_test():
    """Each mode must be able to fail: synthetic frames through the same judge."""
    bad = 0

    def cell(t, c='x'):
        return {'t': t, 'h': False, 'c': c}

    panel_a = cell('Ask Buddy ... Book a call with Damian for free' + OLD)
    panel_b = cell('Ask Buddy ... Book a call with Damian for free' + NEW)
    main_a = cell('Your pot €123,000. Book a call with Damian for free\n  ' + OLD + ' footer')
    main_b = cell('Your pot €123,000. Book a call with Damian for free\n  ' + NEW + ' footer')
    fig = cell('€123,000')
    page = 'pension-calculator.html'

    def frames(snap):
        return [{'label': 'load', 'snap': snap}]

    base = {'main': main_a, 'pbBuddyPanel': panel_a, 'fig': fig}
    cases = [
        ('1. the swap', {'main': main_b, 'pbBuddyPanel': panel_b, 'fig': fig}, None),
        ('2. the swap plus a figure', {'main': cell(main_b['t'].replace('123', '124')), 'pbBuddyPanel': panel_b,
                                       'fig': fig}, 'text differs beyond the reason'),
        ('3. a class changed', {'main': main_b, 'pbBuddyPanel': cell(panel_b['t'], 'y'), 'fig': fig},
         'property c changed'),
        ('4. a cell only on the new side', {'main': main_b, 'pbBuddyPanel': panel_b, 'fig': fig,
                                            'extra': cell(NEW)}, 'cell on one side only'),
    ]
    for label, snap, want in cases:
        reasons, _, _, _ = judge(page, frames(base), frames(snap))
        got = sorted(reasons)
        ok = (not got) if want is None else (want in got)
        bad += 0 if ok else 1
        print('  %s reason %s: %s' % ('ok  ' if ok else 'FAIL', label,
                                       'PASS' if not got else 'FAIL ' + '; '.join(got)))
    # and the vacuity rule: a tree that has lost the swap (or a baseline that
    # already has it) differs nowhere, and that must fail
    reasons, _, _, _ = judge(page, frames(base), frames(dict(base)))
    ok = any(r.startswith('vacuous') for r in reasons)
    bad += 0 if ok else 1
    print('  %s reason 4b. nothing differs: %s' % ('ok  ' if ok else 'FAIL', '; '.join(sorted(reasons)) or 'PASS'))
    # on a page where only the panel may differ, #main differing fails
    reasons, _, _, _ = judge('pia.html', frames(base), frames({'main': main_b, 'pbBuddyPanel': panel_b, 'fig': fig}))
    ok = any('may not change' in r for r in reasons)
    bad += 0 if ok else 1
    print('  %s reason 4c. #main swapped on the PIA page: %s' % ('ok  ' if ok else 'FAIL',
                                                                 '; '.join(sorted(reasons)) or 'PASS'))
    print('\n%s' % ('self-test: every case judged as it should be' if not bad else 'self-test FAILURES: %d' % bad))
    return bad


def main():
    args = sys.argv[1:]
    if '--self-test' in args:
        sys.exit(1 if self_test() else 0)
    if '--reason' in args:
        sys.exit(1 if run_reason() else 0)
    print('usage: classify-give-then-ask.py --reason | --self-test')
    sys.exit(2)


if __name__ == '__main__':
    main()
