#!/usr/bin/env python3
"""Run 43, item 5: give, then ask. Where the calculators differ, and only there.

Not a refactor, so the claim is WHERE each page differs: browser-diff's real
Chrome probe of the six calculators, baseline checkout against the working
tree, over every frame it takes (load, every state, every toggle, every click).

--reason (BASELINE_REF = the commit before item 5d's swap). The reason line
beside a booking link was "Free, 20 minutes, no obligation." and is now
"Free · 20 minutes · no obligation · easy to reschedule." Every differing
cell must be the old cell with those words swapped and nothing else changed:
every property but its text the same, and its text, whitespace removed, equal
to the old text with every old line replaced by the new one (the old line
present at least once). A cell on one side only fails. The proof must not be
vacuous, in every frame:
  * pension, director and comparison: #main (the closing band's line) and
    #pbBuddyPanel (the Ask Buddy panel's footer, built by pb-buddy.js) are
    among the differing cells;
  * reality, entitlement and PIA: #pbBuddyPanel is the only differing cell.

--bands (BASELINE_REF = the swap). The same line, inserted once under the
button of every closing band that had none. Only #main may differ, with
every property but its text the same, and its text, whitespace removed, must
be the old text with the reason inserted straight after the last occurrence
of the band's button words (BAND_WORDS). In every frame #main must differ (not
vacuous); the Ask Buddy panel, like every other cell, must not.

The default mode (BASELINE_REF = the commit before items 5a, 5b, 5c and
5e). Under each calculator's results, after its last result and its caveat:
what the calculator does not show (#pbAfterNot), on four of the six the
shared offer to email the results (#ecCap and its form), then the one booking
ask (#pbAfter). On the pension and director calculators the ask is the
waitcard's "Talk it through, free" and its reason, moved, and their own
form's button now reads "Email me my results"; on the comparison it is "Talk
through what this means for you", moved out of "In one sentence". In every
frame:
  * the cells only on the new side are exactly NEW_IDS[page], and no old
    cell is gone;
  * a differing cell is only one of CHANGED[page], with every property but
    its text the same;
  * #ecForm (pension, director): its text, whitespace removed, is the old
    text with "Email my results" read as "Email me my results";
  * #main (and #calculator on the PIA page): its text, whitespace removed,
    is the old text with the same label change, the moved link and its
    reason taken out once (MOVED: its first occurrence; on the comparison the
    closing band carries the same words and reason, so the old text must hold
    them exactly twice), and the new cells' own texts put in at
    the one place they were put (ANCHOR): before "Want these figures emailed
    to you?" and after "Damian will be in touch personally." on pension and
    director, straight after the page's last caveat on the other four;
  * not vacuous: the new cells are there and #main differs.
Ask Buddy (#pbBuddyBtn, #pbBuddyPanel, #pbA0...) is built by a late script
(type="text/pb-late"), and whether it is built when the load frame is taken
depends on how many scripts the page loads: this item adds one. So its cells,
when on ONE side only, are set aside and counted, and only while
assets/js/pb-buddy.js is byte for byte the baseline's; on both sides they are
compared like any other cell, and must not differ.

    BASELINE_REF=<commit before the swap> python3 classify-give-then-ask.py --reason
    BASELINE_REF=<the swap> python3 classify-give-then-ask.py --bands
    BASELINE_REF=<the reason under the bands> python3 classify-give-then-ask.py
    python3 classify-give-then-ask.py --self-test     # proves each mode can fail
"""
import importlib.util
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('browser_diff', os.path.join(HERE, 'browser-diff.py'))
bd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bd)

OLD = 'Free, 20 minutes, no obligation.'
NEW = 'Free · 20 minutes · no obligation · easy to reschedule.'

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


# --bands: the closing band's button words on each page; the reason goes
# straight after their last occurrence in #main
BAND_WORDS = {
    'pension-calculator.html': 'Book a call with Damian for free',
    'director-calculator.html': 'Book a call with Damian for free',
    'pia.html': 'Book a call with Damian for free',
    'broker-vs-autoenrolment.html': 'Talk through what this means for you',
    'state-pension-reality-check.html': 'Talk through your own figures',
    'state-pension-entitlement.html': 'Talk through your own figures',
}
REASON_TEXT = NEW


# the default mode: what is new under each calculator's results
AFTER_IDS = {'pbAfterNot', 'pbAfter'}
FORM_IDS = {'pbAfterNot', 'ecCap', 'ecForm', 'ecEmail', 'ecErr', 'ecOk', 'ecOkText', 'pbAfter'}
NEW_IDS = {
    'pension-calculator.html': AFTER_IDS,
    'director-calculator.html': AFTER_IDS,
    'broker-vs-autoenrolment.html': FORM_IDS,
    'state-pension-reality-check.html': FORM_IDS,
    'state-pension-entitlement.html': FORM_IDS,
    'pia.html': FORM_IDS,
}
CHANGED = {
    'pension-calculator.html': {'main', 'ecForm'},
    'director-calculator.html': {'main', 'ecForm'},
    'broker-vs-autoenrolment.html': {'main'},
    'state-pension-reality-check.html': {'main'},
    'state-pension-entitlement.html': {'main'},
    'pia.html': {'main', 'calculator'},
}
# the ask that moved, with its reason, and how often the old cell carries
# those words: on the comparison the closing band's button says the same and
# has had the same reason under it since the swap, so the old #main carries
# them twice and the moved one is the first (the band is last in <main>)
MOVED = {
    'pension-calculator.html': ('Talk it through, free' + NEW, 1),
    'director-calculator.html': ('Talk it through, free' + NEW, 1),
    'broker-vs-autoenrolment.html': ('Talk through what this means for you' + NEW, 2),
}
# where the new texts go: (before this, after this) on the two hand-written
# calculators; straight after this on the other four
ANCHOR = {
    'pension-calculator.html': ('Want these figures emailed to you?', 'Damian will be in touch personally.'),
    'director-calculator.html': ('Want these figures emailed to you?', 'Damian will be in touch personally.'),
    'broker-vs-autoenrolment.html': 'Rates and rules can change.',
    'state-pension-reality-check.html': 'Figures checked 9 September 2026.',
    'state-pension-entitlement.html': 'or the assumptions.',
    'pia.html': 'that is on top.',
}
LABEL_OLD, LABEL_NEW = 'Email my results', 'Email me my results'
BUDDY = re.compile(r'^(pbBuddyBtn|pbBuddyPanel|pbA\d+)$')
BUDDY_JS = 'assets/js/pb-buddy.js'
LATE = {'n': 0, 'same': None}


def buddy_unchanged():
    """True when pb-buddy.js is the baseline's, byte for byte."""
    if LATE['same'] is None:
        LATE['same'] = subprocess.run(['git', 'diff', '--quiet', bd.BASELINE_REF, '--', BUDDY_JS],
                                      cwd=bd.ROOT).returncode == 0
    return LATE['same']


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


def classify_band(page, x, y):
    """None if y is x with the reason inserted once after the band's button
    words, else the reason why not."""
    if x is None or y is None:
        return 'cell on one side only'
    if not isinstance(x, dict) or not isinstance(y, dict) or set(x) != set(y):
        return 'different shape'
    for k in x:
        if k != 't' and x[k] != y[k]:
            return 'property %s changed' % k
    a, b = norm(x.get('t', '')), norm(y.get('t', ''))
    words, r = norm(BAND_WORDS[page]), norm(REASON_TEXT)
    k = a.rfind(words)
    if k < 0:
        return 'old cell has no band button'
    k += len(words)
    if b == a[:k] + r + a[k:]:
        return None
    if b.replace(r, '') == a.replace(r, ''):
        n = b.count(r) - a.count(r)
        if n == 1:
            return 'reason not where it was put'
        if n > 1:
            return 'reason inserted more than once'
    return 'text differs beyond the reason'


def classify_after(page, k, x, y, new):
    """None if cell k is the old cell with the after-result block put in
    where it was put, else the reason why not. new: the new side's cells."""
    if x is None or y is None:
        return 'cell on one side only'
    if k not in CHANGED[page]:
        return 'cell #%s may not change on this page' % k
    if not isinstance(x, dict) or not isinstance(y, dict) or set(x) != set(y):
        return 'different shape'
    for p in x:
        if p != 't' and x[p] != y[p]:
            return 'property %s changed' % p
    hand = isinstance(ANCHOR[page], tuple)
    a, b = norm(x.get('t', '')), norm(y.get('t', ''))
    if hand:
        a = a.replace(norm(LABEL_OLD), norm(LABEL_NEW), 1)
    if k == 'ecForm':
        return None if b == a else 'text differs beyond the button\'s label'
    if page in MOVED:
        mv, times = norm(MOVED[page][0]), MOVED[page][1]
        if a.count(mv) != times:
            return 'the moved link is not in the old cell as often as expected'
        a = a.replace(mv, '', 1)
    part = lambda i: norm((new.get(i) or {}).get('t', ''))
    loop, after = part('pbAfterNot'), part('pbAfter')
    cap = '' if hand else part('ecCap')
    if not loop or not after:
        return 'the new cells have no text'
    if hand:
        before, behind = norm(ANCHOR[page][0]), norm(ANCHOR[page][1])
        if a.count(before) != 1:
            return 'anchor not unique'
        i = a.index(before)
        j = a.find(behind, i)
        if j < 0 or a.find(behind, j + 1) >= 0:
            return 'anchor not unique'
        j += len(behind)
        want = a[:i] + loop + a[i:j] + after + a[j:]
    else:
        anchor = norm(ANCHOR[page])
        if a.count(anchor) != 1:
            return 'anchor not unique'
        j = a.index(anchor) + len(anchor)
        want = a[:j] + loop + cap + after + a[j:]
    if b == want:
        return None
    # the same texts, somewhere else: the block moved, nothing else changed
    rest = b
    for piece in (after, cap, loop):
        if piece and rest.count(piece) == 1:
            rest = rest.replace(piece, '', 1)
    if rest == a:
        return 'block not where it was put'
    return 'text differs beyond the block'


def judge_after(page, frames_a, frames_b):
    """(reasons, cells, diffs, explained) for one page's frames, default mode."""
    reasons = {}
    cells = diffs = explained = 0
    if len(frames_a) != len(frames_b):
        reasons['frame counts differ'] = ['%d vs %d' % (len(frames_a), len(frames_b))]
        return reasons, cells, diffs, explained
    for fa, fb in zip(frames_a, frames_b):
        sa, sb = dict(fa['snap']), dict(fb['snap'])
        # Ask Buddy built on one side only: the late script's timing, not the page
        for k in sorted(set(sa) ^ set(sb)):
            if BUDDY.match(k) and buddy_unchanged():
                LATE['n'] += 1
                sa.pop(k, None)
                sb.pop(k, None)
        fresh = set(sb) - set(sa)
        if fresh != NEW_IDS[page]:
            extra, missing = sorted(fresh - NEW_IDS[page]), sorted(NEW_IDS[page] - fresh)
            if extra:
                reasons.setdefault('new cell outside NEW_IDS', []).append('%s (#%s)' % (fa['label'], ', #'.join(extra)))
            if missing:
                reasons.setdefault('vacuous: the new cells are not all there', []).append(
                    '%s (not #%s)' % (fa['label'], ', #'.join(missing)))
        differing = set()
        for k in set(sa) | set(sb):
            cells += 1
            if k in fresh:
                continue
            x, y = sa.get(k), sb.get(k)
            if x == y:
                continue
            diffs += 1
            differing.add(k)
            why = classify_after(page, k, x, y, sb)
            if why is None:
                explained += 1
            else:
                reasons.setdefault(why, []).append('%s #%s' % (fa['label'], k))
        if 'main' not in differing:
            reasons.setdefault('vacuous: expected #main to differ', []).append(fa['label'])
    return reasons, cells, diffs, explained


def judge(page, frames_a, frames_b, mode='reason'):
    """(reasons, cells, diffs, explained) for one page's frames."""
    reasons = {}
    cells = diffs = explained = 0
    if len(frames_a) != len(frames_b):
        reasons['frame counts differ'] = ['%d vs %d' % (len(frames_a), len(frames_b))]
        return reasons, cells, diffs, explained
    must, only = REASON_MUST[page] if mode == 'reason' else ({'main'}, True)
    for fa, fb in zip(frames_a, frames_b):
        differing = set()
        for k in set(fa['snap']) | set(fb['snap']):
            cells += 1
            x, y = fa['snap'].get(k), fb['snap'].get(k)
            if x == y:
                continue
            diffs += 1
            differing.add(k)
            why = classify_reason(x, y) if mode == 'reason' else classify_band(page, x, y)
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


def run(mode='reason'):
    what = {'reason': 'the reason line swap', 'bands': 'the reason line under the closing bands',
            'after': 'what each calculator does not show, the offer to email the results, and the one ask'}[mode]
    print('classify %s, working tree against %s' % (what, bd.BASELINE_REF))
    old = bd.checkout_baseline()
    bad = 0
    try:
        for page, cfg in bd.PAGES.items():
            a, b = bd.probe(old, page, cfg), bd.probe(bd.ROOT, page, cfg)
            if a is None or b is None:
                print('  FAIL %-34s probe output missing (%s)' % (page, 'old' if a is None else 'new'))
                bad += 1
                continue
            if mode == 'after':
                reasons, cells, diffs, explained = judge_after(page, a['frames'], b['frames'])
            else:
                reasons, cells, diffs, explained = judge(page, a['frames'], b['frames'], mode)
            errs = a['errors'] + b['errors']
            ok = not reasons and not errs
            bad += 0 if ok else 1
            print('  %s %-34s %d frames, %d cells, %d differing, %d are %s%s'
                  % ('ok  ' if ok else 'FAIL', page, len(a['frames']), cells, diffs, explained,
                     {'reason': 'the reason line swapped', 'bands': 'the reason line inserted under the band',
                      'after': 'the block put in after the results'}[mode],
                     '' if not errs else ', %d errors' % len(errs)))
            for why, where in reasons.items():
                print('        %s: %s' % (why, ', '.join(where[:4])))
            for e in errs[:4]:
                print('        error: %s' % e)
    finally:
        shutil.rmtree(old, ignore_errors=True)
    if mode == 'after':
        print('  (Ask Buddy cells on one side only, set aside as the late script\'s timing, %s unchanged: %d)'
              % (BUDDY_JS, LATE['n']))
    print('\n%s' % ({'reason': 'the only difference is the reason line, swapped',
                      'bands': 'the only difference is the reason line, under the closing band\'s button',
                      'after': 'the only difference is the block after the results, where it was put'}[mode]
                     if not bad else 'FAILURES: %d' % bad))
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
    # --bands: the band's button words occur twice in #main (an earlier ask
    # and the band); the reason goes after the last, once
    bw = BAND_WORDS[page]
    band_a = cell('Your pot €123,000. ' + bw + ' early ' + NEW + ' ... ' + bw + '\n  footer')
    band_b = cell('Your pot €123,000. ' + bw + ' early ' + NEW + ' ... ' + bw + '\n  ' + NEW + ' footer')
    bbase = {'main': band_a, 'pbBuddyPanel': panel_b, 'fig': fig}
    bcases = [
        ('5. the reason under the band\'s button', {'main': band_b, 'pbBuddyPanel': panel_b, 'fig': fig}, None),
        ('6. inserted after the other occurrence',
         {'main': cell('Your pot €123,000. ' + bw + NEW + ' early ' + NEW + ' ... ' + bw + '\n  footer'),
          'pbBuddyPanel': panel_b, 'fig': fig}, 'reason not where it was put'),
        ('7. inserted twice', {'main': cell(band_b['t'].replace('footer', NEW + ' footer')),
                               'pbBuddyPanel': panel_b, 'fig': fig}, 'reason inserted more than once'),
        ('7b. the Ask Buddy panel changed too', {'main': band_b, 'pbBuddyPanel': cell(panel_b['t'] + NEW),
                                                 'fig': fig}, 'cell #pbBuddyPanel may not change on this page'),
    ]
    for label, snap, want in bcases:
        reasons, _, _, _ = judge(page, frames(bbase), frames(snap), 'bands')
        got = sorted(reasons)
        ok = (not got) if want is None else (want in got)
        bad += 0 if ok else 1
        print('  %s bands %s: %s' % ('ok  ' if ok else 'FAIL', label,
                                      'PASS' if not got else 'FAIL ' + '; '.join(got)))
    reasons, _, _, _ = judge(page, frames(bbase), frames(dict(bbase)), 'bands')
    ok = any(r.startswith('vacuous') for r in reasons)
    bad += 0 if ok else 1
    print('  %s bands 7c. nothing differs: %s' % ('ok  ' if ok else 'FAIL', '; '.join(sorted(reasons)) or 'PASS'))
    # the default mode: the pension calculator's #main, before and after
    pg = 'pension-calculator.html'
    loop_t = 'What this doesn\u2019t show: product charges, inflation.'
    after_t = 'Want to go through this with Damian? Talk it through, free ' + NEW
    old_main = ('Your pot €123,000. The cost of waiting Move the sliders. Talk it through, free ' + NEW +
                ' How your pot could grow Want these figures emailed to you? Email my results'
                ' Thanks - we\'ve got it. Damian will be in touch personally. Book a call with Damian for free ' + NEW)
    new_main = ('Your pot €123,000. The cost of waiting Move the sliders. How your pot could grow ' + loop_t +
                ' Want these figures emailed to you? Email me my results'
                ' Thanks - we\'ve got it. Damian will be in touch personally. ' + after_t +
                ' Book a call with Damian for free ' + NEW)
    form_a, form_b = cell('Your email Email my results Please enter'), cell('Your email Email me my results Please enter')
    abase = {'main': cell(old_main), 'ecForm': form_a, 'fig': fig}

    def anew(main_t, **more):
        s = {'main': cell(main_t), 'ecForm': form_b, 'fig': fig, 'pbAfterNot': cell(loop_t), 'pbAfter': cell(after_t)}
        s.update(more)
        return s
    elsewhere = new_main.replace(' ' + after_t, '', 1).replace('Your pot €123,000.', 'Your pot €123,000. ' + after_t, 1)
    left = new_main.replace('Move the sliders.', 'Move the sliders. Talk it through, free ' + NEW, 1)
    acases = [
        ('8. the block where it was put', anew(new_main), None),
        ('9. the block elsewhere', anew(elsewhere), 'block not where it was put'),
        ('10. the moved link left in place as well', anew(left), 'text differs beyond the block'),
        ('11. a figure changed', anew(new_main.replace('123', '124')), 'text differs beyond the block'),
        ('12. a new cell outside NEW_IDS', anew(new_main, extra=cell('x')), 'new cell outside NEW_IDS'),
        ('12b. Ask Buddy built on the new side only, pb-buddy.js unchanged', anew(new_main, pbBuddyBtn=cell('Ask Buddy')),
         None),
        ('12c. the same, pb-buddy.js changed', anew(new_main, pbBuddyBtn=cell('Ask Buddy')), 'new cell outside NEW_IDS'),
        ('12d. Ask Buddy on both sides, differing', anew(new_main, pbBuddyPanel=cell('Ask Buddy ' + NEW)),
         'cell #pbBuddyPanel may not change on this page'),
    ]
    for label, snap, want in acases:
        LATE['same'] = not label.startswith('12c')
        base = dict(abase, pbBuddyPanel=cell('Ask Buddy')) if label.startswith('12d') else abase
        reasons, _, _, _ = judge_after(pg, frames(base), frames(snap))
        got = sorted(reasons)
        ok = (not got) if want is None else (want in got)
        bad += 0 if ok else 1
        print('  %s after %s: %s' % ('ok  ' if ok else 'FAIL', label,
                                      'PASS' if not got else 'FAIL ' + '; '.join(got)))
    print('\n%s' % ('self-test: every case judged as it should be' if not bad else 'self-test FAILURES: %d' % bad))
    return bad


def main():
    args = sys.argv[1:]
    if '--self-test' in args:
        sys.exit(1 if self_test() else 0)
    if '--reason' in args:
        sys.exit(1 if run('reason') else 0)
    if '--bands' in args:
        sys.exit(1 if run('bands') else 0)
    if args:
        print('usage: classify-give-then-ask.py [--reason | --bands | --self-test]')
        sys.exit(2)
    sys.exit(1 if run('after') else 0)


if __name__ == '__main__':
    main()
