#!/usr/bin/env python3
"""
Assemble state-pension-reality-check.html from pension-calculator.html's skeleton.

Same approach as tools/build-compare-page.py: the head, CSS, nav, skip link,
footer, Ask Buddy widget, consent bar and every shared runtime script are taken
verbatim, so the new page inherits the same chrome and accessibility
scaffolding and cannot drift from it. Only three things are swapped:

  1. <main> content              -> tools/state-pension-parts/main.html
  2. the page-specific calc script (the FIRST script block after </main>)
     -> tools/state-pension-parts/page.js, plus the shared module
  3. the progressive-disclosure KEEP array -> this page's field ids

pension-calculator.html itself is never modified. Re-runnable.
"""
import hashlib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'pension-calculator.html')
OUT = os.path.join(ROOT, 'state-pension-reality-check.html')
PARTS = os.path.join(ROOT, 'tools', 'state-pension-parts')

TITLE = 'The State Pension reality check, Pensionbuddy'
DESC = ('What the State Pension actually pays, next to what retirement in Ireland '
        'costs according to the Pensions Council. An illustration, not advice.')

# The living-standards bars. Built from the same language as the relief
# visualiser on pension-calculator.html: a rounded track, a filled portion, and
# tabular figures. Each bar is scaled to its own standard, so the fill reads as
# "how much of this one the State Pension covers".
LS_CSS = """
/* ---- living standards comparison, this page only ---- */
.lstd{display:flex;flex-direction:column;gap:20px;margin-top:6px}
.lsrow .lshead{display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin-bottom:8px}
.lsrow .lsname{font-weight:700;font-size:15px;letter-spacing:-0.01em}
.lsrow .lstarget{font-size:13px;color:var(--ink-3);font-variant-numeric:tabular-nums;white-space:nowrap}
.lsbar{height:13px;border-radius:99px;overflow:hidden;background:var(--surface-2);border:1px solid var(--line)}
.lsbar i{display:block;height:100%;background:var(--teal);border-radius:99px;
  transition:width .45s cubic-bezier(.22,.61,.36,1)}
.lsrow.is-covered .lsbar i{background:var(--aqua)}
.lsrow .lsgap{font-size:13.5px;color:var(--ink-2);line-height:1.55;margin-top:9px}
.lsrow .lsgap b{color:var(--ink);font-variant-numeric:tabular-nums}
.srcnote{font-size:12.5px;color:var(--ink-3);line-height:1.6;margin-top:22px;
  padding-top:16px;border-top:1px solid var(--line)}
@media(prefers-reduced-motion:reduce){.lsbar i{transition:none}}
/* the two result states are wrappers inside the results column, so they carry
   the column's own vertical rhythm or the cards inside them touch */
#spHas,#spNone{display:flex;flex-direction:column;gap:18px}
#spHas[hidden],#spNone[hidden]{display:none}
/* the explainer reads as prose, not as an assumptions list */
.assume .expl{max-width:70ch}
.assume .expl p{font-size:15px;line-height:1.7;color:var(--ink-2);margin-bottom:14px}
.assume .expl p:last-child{margin-bottom:0}
.assume .expl b{color:var(--ink);font-weight:600}
"""


def read(p):
    return open(p, encoding='utf-8', errors='replace').read()


def main():
    src = read(SRC)

    head_end = src.index('<main id="main" tabindex="-1">')
    tail_start = src.index('</main>')
    head = src[:head_end]
    tail = src[tail_start:]

    # --- head: title, description, and the page-specific CSS ---------------
    head = re.sub(r'<title>.*?</title>', '<title>%s</title>' % TITLE, head, count=1, flags=re.S)
    for prop in ('name="description"', 'property="og:description"'):
        head = re.sub(r'(<meta %s content=")[^"]*(")' % re.escape(prop),
                      lambda m: m.group(1) + DESC + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  lambda m: m.group(1) + TITLE + m.group(2), head, count=1)
    assert head.count('</style>') >= 1
    head = head.replace('</style>', LS_CSS + '</style>', 1)

    # this page is the active nav item, not the pension calculator
    # The skeleton's active Calculator link carries aria-current AFTER href, so an
    # exact-string replace never fired and the built page shipped with Calculator
    # highlighted as the current page. Match on the attributes, not their order.
    head, n = re.subn(r'<a class="lnk active"(?=[^>]*href="pension-calculator\.html")[^>]*>Calculator</a>',
                      '<a class="lnk" href="pension-calculator.html">Calculator</a>', head, count=1)
    assert n == 1, 'could not un-activate the Calculator nav item'
    assert head.count('href="state-pension-reality-check.html"') >= 1, \
        'nav link missing: run the nav update before building'
    head = head.replace('<a class="lnk" href="state-pension-reality-check.html">',
                        '<a class="lnk active" aria-current="page" href="state-pension-reality-check.html">', 1)

    # --- tail: swap the page-specific calc script for ours -----------------
    m = re.search(r'<script>\s*const REDUCE=', tail)
    assert m, 'could not find the page-specific calculator script'
    end = tail.index('</script>', m.start()) + len('</script>')

    def v(rel):
        h = hashlib.sha1(open(os.path.join(ROOT, rel), 'rb').read()).hexdigest()[:8]
        return '%s?v=%s' % (rel, h)

    new_script = ('<script src="%s"></script>\n' % v('assets/js/state-pension.js') +
                  '<script>\n' + read(os.path.join(PARTS, 'page.js')).strip() + '\n</script>')
    tail = tail[:m.start()] + new_script + tail[end:]

    # both controls are primary, so nothing folds into "More options"
    tail = re.sub(r"KEEP = \[[^\]]*\]", "KEEP = ['contribs','age']", tail, count=1)

    body = read(os.path.join(PARTS, 'main.html'))
    out = head + body.strip() + '\n' + tail
    open(OUT, 'w', encoding='utf-8').write(out)

    print('wrote %s  (%d bytes)' % (os.path.relpath(OUT, ROOT), len(out.encode('utf-8'))))
    ok = True
    for check, label in [('<main id="main" tabindex="-1">', 'main landmark'),
                         ('class="skip"', 'skip link'),
                         ('foot-top', 'footer'),
                         ('assets/js/state-pension.js', 'shared module'),
                         ('id="contribs"', 'contributions slider'),
                         ('id="lsRows"', 'living standards bars'),
                         ('pensionscouncil.ie', 'Pensions Council cited'),
                         ('citizensinformation.ie', 'Citizens Information cited'),
                         ('aria-current="page"', 'nav marked active')]:
        good = check in out
        ok = ok and good
        print('  %-26s %s' % (label, 'ok' if good else 'MISSING'))
    for bad, label in (('\u2014', 'em dash'), ('&mdash;', 'em dash entity'),
                       ('owns their home outright', 'the withdrawn housing claim'),
                       ('outright home ownership', 'the withdrawn housing claim')):
        if bad in out:
            ok = False
            print('  %-26s PRESENT, must not be' % label)
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
