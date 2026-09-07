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
/* two modes, one input panel: the mode switch reuses the .seg control as a tablist,
   and each results panel keeps the results column's own vertical rhythm */
.calc-wrap .modebar{grid-column:1 / -1;margin-bottom:4px}
.modebar .modelab{font-family:var(--font-mono);font-size:.66rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3)}
.modebar .modeseg{max-width:560px;margin-top:10px}
.modebar .subnote{max-width:640px}
.modepanel{display:flex;flex-direction:column;gap:18px}
.modepanel[hidden]{display:none}
@media(max-width:560px){.modebar .modeseg{max-width:none}.modebar .seg button{font-size:13px;padding:11px 4px}}
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

    # mark this page as the active nav item instead of the pension calculator
    head = head.replace('<a class="lnk active" aria-current="page" href="pension-calculator.html">',
                        '<a class="lnk" href="pension-calculator.html">')

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
    tail = re.sub(r"KEEP = \[[^\]]*\]", "KEEP = ['age','salary','phase','gross','match','extra','tmatch']", tail, count=1)

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
    if '—' in out or '&mdash;' in out:
        print('  WARNING: em dash present in output')


if __name__ == '__main__':
    main()
