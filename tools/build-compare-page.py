#!/usr/bin/env python3
"""
Assemble broker-vs-autoenrolment.html from pension-calculator.html's skeleton.

The head, CSS, nav, skip link, footer, Ask Buddy widget, consent bar and every
shared runtime script are taken verbatim from pension-calculator.html, so the
new page inherits the same chrome and accessibility scaffolding and cannot
drift from it visually. Only three things are swapped:

  1. <main> content              -> the comparison UI
  2. the page-specific calc script (the FIRST script block after </main>)
     -> tools/compare-page.js, plus the two shared modules
  3. the progressive-disclosure KEEP array -> this page's field ids

pension-calculator.html itself is never modified. Re-runnable.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'pension-calculator.html')
OUT = os.path.join(ROOT, 'broker-vs-autoenrolment.html')
PARTS = os.path.join(ROOT, 'tools', 'compare-parts')

TITLE = 'Auto-enrolment or a broker pension, Pensionbuddy'
DESC = ('Compare what goes into your pension under My Future Fund auto-enrolment '
        'against a personal pension arranged through a broker, for your own salary '
        'and age. An illustration, not advice.')

# The vs component lives on director-calculator.html but not on this skeleton,
# so it is ported verbatim rather than reinvented.
VS_CSS = """
/* ---- side-by-side comparison, ported verbatim from director-calculator.html ---- */
.vs-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-xl);padding:26px 28px;box-shadow:var(--sh-sm)}
.vs-card h3{font-size:17px;font-weight:700;letter-spacing:-0.02em;margin-bottom:4px}
.vs-card .sub{font-size:13.5px;color:var(--ink-3);margin-bottom:20px}
.vs-card .vs-note{margin:16px 0 0;line-height:1.55}
.vs{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center}
.vs-col{border-radius:var(--r-lg);padding:22px 20px;text-align:center}
.vs-salary{background:var(--surface-2)}
.vs-pension{background:var(--teal-50)}
.vs-col .vt{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px}
.vs-pension .vt{color:var(--teal-700)}
.vs-col .amt{font-weight:800;font-size:clamp(24px,3vw,32px);letter-spacing:-0.03em;line-height:1;font-variant-numeric:tabular-nums;color:var(--ink)}
.vs-pension .amt{color:var(--teal-700)}
.vs-col .lab{font-size:12.5px;color:var(--ink-2);margin-top:10px;line-height:1.5}
.vsmark{font-size:13px;font-weight:700;color:var(--ink-3);background:var(--surface);border:1px solid var(--line);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center}
@media(max-width:560px){.vs{grid-template-columns:1fr;gap:12px}.vsmark{margin:0 auto}}
/* itemised breakdown rows, built from the existing card + divline language */
.bd{display:flex;justify-content:space-between;gap:16px;padding:9px 0;font-size:14.5px}
.bd .bl{color:var(--ink-2)}
.bd .bv{font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.bd.tot{border-top:1px solid var(--line);margin-top:6px;padding-top:12px;font-weight:700}
.bd.tot .bl{color:var(--ink)}
.bd .capnote{font-size:12px;color:var(--ink-3)}
.verdict{border-left:2px solid var(--teal);padding:2px 0 2px 14px;margin:0}
.srcwarn{font-size:12.5px;color:var(--ink-3);line-height:1.55;margin-top:14px}
/* ---- headline face ----
   The page headline is Bricolage Grotesque; body copy stays Hanken Grotesk and
   the remaining headings stay on --font-display for now. Kept behind its own
   token so widening or reverting the scope is a one-line change.

   Retuned for the face rather than inheriting Fraunces' values: Fraunces at
   opsz 144 sat at 600 weight and -.015em. Bricolage is a grotesque with a
   large x-height and a squarer, lighter-reading 600, so it takes 700 and
   noticeably tighter tracking to carry the same weight at headline size, with
   a little leading taken back out. */
:root{--font-headline:'Bricolage Grotesque','Hanken Grotesk',-apple-system,system-ui,sans-serif}
.phead h1{font-family:var(--font-headline);font-weight:700;letter-spacing:-.028em;line-height:1.04}
/* two modes, one input panel: the mode switch reuses the .seg control as a tablist,
   and each results panel keeps the results column's own vertical rhythm */
.calc-wrap .modebar{grid-column:1 / -1;margin-bottom:4px}
.modebar .modelab{font-family:var(--font-mono);font-size:.66rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3)}
.modebar .modeseg{max-width:560px;margin-top:10px}
.modebar .subnote{max-width:640px}
.modepanel{display:flex;flex-direction:column;gap:18px}
.modepanel[hidden]{display:none}
@media(max-width:560px){.modebar .modeseg{max-width:none}.modebar .seg button{font-size:13px;padding:11px 4px}}
/* a three-way segmented control: the skeleton's .seg is two columns with a
   half-width indicator, so a third option needs its own grid and a third-width
   indicator. translateX(i * 100%) of the indicator's own width still lands it
   on button i. */
.seg.seg-3{grid-template-columns:repeat(3,1fr)}
.seg.seg-3 .ind{width:calc(33.333% - 2.667px)}
@media(max-width:560px){.seg.seg-3 button{font-size:13px;padding:11px 4px}}
/* the money-above-the-cap card only exists when there is money above the cap */
#capCard[hidden]{display:none}
/* yes/no toggles that reveal a secondary control. A plain checkbox row, so it
   reads as a question rather than another slider. */
.tog{display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:14.5px;font-weight:600;color:var(--ink);line-height:1.45;padding:2px 0}
.tog input{appearance:auto;-webkit-appearance:checkbox;width:20px;height:20px;margin:1px 0 0;accent-color:var(--teal);flex:none;cursor:pointer}
.tog input:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.togbody{margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)}
.togbody[hidden]{display:none}
/* funds and risk: three illustration tiles, each carrying its own downside */
#riskCard .riskintro{font-size:15px;line-height:1.6;color:var(--ink);margin:6px 0 10px}
#riskCard .risksub{font-size:13.5px;color:var(--ink-2);line-height:1.55;margin:0 0 14px}
.risktiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.risktile{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-lg);padding:16px 16px 14px;display:flex;flex-direction:column;gap:6px}
.risktile .rk-name{font-weight:700;font-size:15px;letter-spacing:-0.01em}
.risktile .rk-sri{font-size:12.5px;color:var(--ink-3)}
.risktile .rk-sri b{color:var(--ink);font-variant-numeric:tabular-nums}
.risktile .rk-row{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--ink-2);padding-top:6px;border-top:1px dashed var(--line)}
.risktile .rk-row b{color:var(--ink);text-align:right;font-variant-numeric:tabular-nums}
.risktile .rk-note{font-size:12.5px;color:var(--ink-3);line-height:1.5;margin-top:4px}
.risktile .rk-warn{font-size:12px;color:var(--ink-2);font-weight:600;margin-top:auto;padding-top:8px}
#riskCard .riskrule{font-size:13.5px;line-height:1.6;color:var(--ink-2);margin:16px 0 8px}
#riskCard .riskrule b{color:var(--ink)}
@media(max-width:700px){.risktiles{grid-template-columns:1fr}}

/* the risk card ends in the same link the verdict card uses; those rules are scoped to
   .waitcard, so they are repeated here for #riskCard, otherwise the arrow icon has no
   size and fills the card */
#riskCard .wlink{display:inline-flex;align-items:center;gap:7px;margin-top:12px;
  font-size:.86rem;font-weight:600;color:var(--teal-700);text-decoration:none}
#riskCard .wlink:hover{text-decoration:underline}
#riskCard .wlink .ico{width:15px;height:15px}
#riskCard .wlink{display:inline-flex;align-items:center;padding:11px 0}
#riskCard .wlink{color:var(--teal)}
#riskCard .wlink{margin-top:14px}
#riskCard .wlink .ico{width:16px;height:16px;flex:none}
/* the one-sentence lead sits above the numbers in both modes */
.results .lead{margin-bottom:0}
.results .lead .wtext{font-size:17px;line-height:1.5}
.results .lead .phaseline{font-size:13.5px;color:var(--ink-2);line-height:1.55;margin:12px 0 0}
"""


def read(p):
    return open(p, encoding='utf-8', errors='replace').read()


def main():
    src = read(SRC)

    head_end = src.index('<main id="main" tabindex="-1">')
    tail_start = src.index('</main>')
    head = src[:head_end]
    tail = src[tail_start:]

    # --- head: title, description, and the ported component CSS ------------
    head = re.sub(r'<title>.*?</title>', '<title>%s</title>' % TITLE, head, count=1, flags=re.S)
    head = re.sub(r'(<meta name="description" content=")[^"]*(")',
                  lambda m: m.group(1) + DESC + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  lambda m: m.group(1) + TITLE + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                  lambda m: m.group(1) + DESC + m.group(2), head, count=1)
    assert head.count('</style>') >= 1
    head = head.replace('</style>', VS_CSS + '</style>', 1)

    # add the headline face to the existing single Google Fonts request
    m = re.search(r'(<link href="https://fonts\.googleapis\.com/css2\?)([^"]*)(")', head)
    assert m, 'could not find the Google Fonts request'
    if 'Bricolage' not in m.group(2):
        head = head[:m.start(2)] + 'family=Bricolage+Grotesque:opsz,wght@12..96,600..800&' + head[m.start(2):]

    # mark this page as the active nav item instead of the pension calculator
    # The skeleton's active Calculator link carries aria-current AFTER href, so an
    # exact-string replace never fired and the built page shipped with Calculator
    # highlighted as the current page. Match on the attributes, not their order.
    head, n = re.subn(r'<a class="lnk active"(?=[^>]*href="pension-calculator\.html")[^>]*>Calculator</a>',
                      '<a class="lnk" href="pension-calculator.html">Calculator</a>', head, count=1)
    assert n == 1, 'could not un-activate the Calculator nav item'

    # --- tail: swap the page-specific calc script for ours -----------------
    m = re.search(r'<script>\s*const REDUCE=', tail)
    assert m, 'could not find the page-specific calculator script'
    end = tail.index('</script>', m.start()) + len('</script>')
    calc_js = read(os.path.join(PARTS, 'compare-page.js'))
    # Content-hashed query strings so a changed module can never be served from
    # a stale browser cache under the old URL (the maths would silently break).
    def v(rel):
        import hashlib
        h = hashlib.sha1(open(os.path.join(ROOT, rel), 'rb').read()).hexdigest()[:8]
        return '%s?v=%s' % (rel, h)
    new_script = ('<script src="%s"></script>\n' % v('assets/js/pension-tax-relief.js') +
                  '<script src="%s"></script>\n' % v('assets/js/autoenrolment.js') +
                  '<script>\n' + calc_js.strip() + '\n</script>')
    tail = tail[:m.start()] + new_script + tail[end:]

    # progressive disclosure keeps this page's primary controls visible
    # every range on this page is a primary control for one mode or the other;
    # only the tax-rate segment folds into "More options", as on the other calculators
    tail = re.sub(r"KEEP = \[[^\]]*\]", "KEEP = ['age','salary','gross','match','extra','tmatch']", tail, count=1)

    body = read(os.path.join(PARTS, 'main.html'))
    out = head + body.strip() + '\n' + tail
    open(OUT, 'w', encoding='utf-8').write(out)

    print('wrote %s  (%d bytes)' % (os.path.relpath(OUT, ROOT), len(out.encode('utf-8'))))
    for check, label in [('<main id="main" tabindex="-1">', 'main landmark'),
                         ('class="skip"', 'skip link'),
                         ('foot-top', 'footer'),
                         ('pension-tax-relief.js', 'shared relief module'),
                         ('autoenrolment.js', 'shared AE module'),
                         ('vs-card', 'comparison component')]:
        print('  %-22s %s' % (label, 'ok' if check in out else 'MISSING'))
    if '\u2014' in out or '&mdash;' in out:
        print('  WARNING: em dash present in output')


if __name__ == '__main__':
    main()
