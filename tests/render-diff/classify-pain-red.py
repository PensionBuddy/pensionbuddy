#!/usr/bin/env python3
"""Run 42, item 4: red for pain, amber for money back. Colours, and nothing else.

The change is CSS only: one new token (--red) on every page's first :root, and
a set of chart, bar, figure and form-error rules pointed at a different token.
The claim is that that is ALL that changes: on every page, at 375x812 and at
1440x900, and on every frame browser-diff drives for the six calculators,
every element keeps its text, its hidden flag, its classes, its attributes,
its geometry and every style that is not paint; only paint differs (colours,
fills, strokes, shadow and gradient colours, opacity between two non-zero
values, and the :root custom properties), and every new colour is one of the
new tree's own tokens, or white, transparent, none, or #8C6010 (the amber
text brown already in the skeleton). A stray literal fails.

browser-diff.py's colour-blind snapshot is not enough for that, so this keeps
its baseline checkout, its six calculators' frames, its settle() and its probe
loop exactly, and replaces only snap(): every element under <body>, keyed by
tag#id or its nth-child path from <body>, with its own text, hidden flag,
classes, a list of attributes, its box to half a pixel, the non-colour
computed styles, and the paint. Frames after the first are sent as the
elements that differ from the first, so a calculator's sixty frames fit.

Headless Chrome will not draw a window under ~500px wide, so the page is
loaded in an iframe of the exact size, as tools/verify.py does, and the
wrapper copies the probe's output up to the top document for --dump-dom.

    cd tests/render-diff
    export CHROME=... BASELINE_REF=<the commit before the change>
    python3 classify-pain-red.py --self-test
    python3 classify-pain-red.py --pages pension-calculator.html,director-calculator.html,...
    python3 classify-pain-red.py                       # every page, both widths: long; run it alone

Every page is loaded with prefers-reduced-motion forced on, so the provider
ticker, the pop-ins, the starter bars, the tracker pile and the calculators'
CSS transitions are at rest on both sides and their boxes are comparable
(settle() ends the calculators' script tweens, not their CSS transitions).
browser-diff.py, run unchanged beside this, drives the six with motion on.
Do not run it across midnight: the day counts and "Since it is 2026" are
written from the clock.
"""
import argparse
import glob
import html as htmllib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('browser_diff', os.path.join(HERE, 'browser-diff.py'))
bd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bd)

ROOT = bd.ROOT
WIDTHS = {375: 812, 1440: 900}
SIX = list(bd.PAGES)            # the six calculators, browser-diff's own order
# the pages the change paints at load: on these a run that finds no colour
# difference at a width proves nothing, so it fails (unless --no-vacuity)
TOUCHED = ['index.html', 'starter.html', 'director.html', 'glossary.html', 'booking.html', 'thank-you.html',
           'pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html',
           'state-pension-reality-check.html', 'pension-fees-calculator.html', 'standard-fund-threshold.html']
ROOT_PROPS = ['--red', '--slate', '--amber', '--amber-soft', '--aqua', '--teal', '--teal-50', '--teal-100', '--teal-700',
              '--teal-900', '--mint', '--ink', '--ink-2', '--ink-3', '--line', '--line-2', '--surface',
              '--surface-2', '--bg', '--terracotta']
EXTRA_OK = {'rgb(255, 255, 255)', 'rgb(140, 96, 16)', 'rgba(0, 0, 0, 0)', 'none'}
PAINT = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor',
         'borderLeftColor', 'outlineColor', 'fill', 'stroke', 'textDecorationColor', 'caretColor',
         'accentColor', 'columnRuleColor', 'opacity']
STYLE = ['display', 'visibility', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
         'textDecorationLine', 'transform', 'borderTopWidth', 'borderLeftWidth', 'borderRadius',
         'strokeWidth', 'strokeDasharray']
ATTRS = ['aria-valuetext', 'aria-pressed', 'aria-selected', 'aria-current', 'tabindex', 'value', 'min',
         'max', 'width', 'height', 'd']

# The replacement snap(). One record per element: [t, h, c, a, g, s, k], each
# a string so the comparison is plain equality; k (paint) is a JSON object.
SNAP = r"""
  // browser-diff's skips, plus the Ask Buddy widget's own ids (pbBuddyBtn,
  // pbBuddyPanel), which it adds on a timer of its own
  var __SKIP_ID = /^(pbe|ask|consent|cookie|nt|pbBuddy)/i;
  var __SKIP_IDS = {__painred_still:1, nav:1, navTick:1, tkD:1, tkH:1, tkM:1, tkSr:1, tkRev:1, tkYear:1,
                    deadlineBand:1, deadlineText:1, calStage:1, __diff__:1};
  var __PAINT = __PAINT_JSON__, __STYLE = __STYLE_JSON__, __ATTRS = __ATTRS_JSON__, __ROOTP = __ROOT_JSON__;
  var __COL = /rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b/g;
  var __base = null;
  function __skip(el) {
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      if (e.id && (__SKIP_IDS[e.id] || __SKIP_ID.test(e.id))) return true;
      if (e.classList && e.classList.contains('pb-consent')) return true;
      if (e.tagName === 'PRE' && e.id === '__diff__') return true;
    }
    return false;
  }
  function __path(el) {
    var p = [];
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      var i = 1, s = e;
      while ((s = s.previousElementSibling)) i++;
      p.unshift(e.tagName.toLowerCase() + ':' + i);
    }
    return p.join('>');
  }
  function __r(v) { return Math.round(v * 2) / 2; }
  function __rec(el) {
    var cs = getComputedStyle(el);
    var t = '';
    // a script's or a style's source is not text a reader sees: the
    // entitlement page inlines its page.js, whose comments C4 rewrites; that
    // the code itself is untouched is the diff grep's job (2.4(c))
    if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE')
      for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) t += n.nodeValue;
    t = t.replace(/\s+/g, ' ').trim();
    var a = [];
    for (var i = 0; i < __ATTRS.length; i++) { var v = el.getAttribute(__ATTRS[i]); if (v !== null) a.push(__ATTRS[i] + '=' + v); }
    var b = el.getBoundingClientRect();
    var g = [__r(b.left), __r(b.top), __r(b.width), __r(b.height)].join(',');
    var s = [];
    for (var j = 0; j < __STYLE.length; j++) s.push(__STYLE[j] + '=' + cs[__STYLE[j]]);
    var st = el.style || {};
    s.push('w=' + (st.width || ''), 'l=' + (st.left || ''), 'hh=' + (st.height || ''),
           'fill=' + (st.getPropertyValue ? st.getPropertyValue('--fill') : ''));
    var bi = cs.backgroundImage, bs = cs.boxShadow;
    s.push('bgi=' + bi.replace(__COL, 'C'), 'bsh=' + bs.replace(__COL, 'C'));
    var k = {};
    for (var q = 0; q < __PAINT.length; q++) k[__PAINT[q]] = cs[__PAINT[q]];
    k.bgiColours = (bi.match(__COL) || []).join('|');
    k.bshColours = (bs.match(__COL) || []).join('|');
    return [t, el.hidden ? 1 : 0, el.getAttribute('class') || '', a.join('|'), g, s.join('|'), JSON.stringify(k)];
  }
  function snap() {
    var out = {};
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (__skip(el)) continue;
      var key = el.id ? el.tagName.toLowerCase() + '#' + el.id : __path(el);
      while (out.hasOwnProperty(key)) key += '~';
      out[key] = __rec(el);
    }
    var rcs = getComputedStyle(document.documentElement), r = {};
    for (var z = 0; z < __ROOTP.length; z++) r[__ROOTP[z]] = rcs.getPropertyValue(__ROOTP[z]).trim();
    if (!__base) { __base = out; return { full: out, r: r, n: all.length }; }
    var d = {}, gone = [];
    for (var k2 in out) if (!__base.hasOwnProperty(k2) || JSON.stringify(__base[k2]) !== JSON.stringify(out[k2])) d[k2] = out[k2];
    for (var k3 in __base) if (!out.hasOwnProperty(k3)) gone.push(k3);
    return { delta: d, gone: gone, r: r };
  }

"""


def build_probe():
    a, b = '  function snap() {', '  function setR(id, v) {'
    assert bd.PROBE.count(a) == 1 and bd.PROBE.count(b) == 1, 'browser-diff PROBE markers moved'
    snap = (SNAP.replace('__PAINT_JSON__', json.dumps(PAINT)).replace('__STYLE_JSON__', json.dumps(STYLE))
            .replace('__ATTRS_JSON__', json.dumps(ATTRS)).replace('__ROOT_JSON__', json.dumps(ROOT_PROPS)))
    p = bd.PROBE[:bd.PROBE.index(a)] + snap + bd.PROBE[bd.PROBE.index(b):]
    # The first frame waits 2s (virtual time, so it costs nothing), not 120ms:
    # the deferred scripts (type="text/pb-late": the glossary's term buttons
    # among them) can land after the load event, and a snapshot taken before
    # them reads as elements appearing on one side only. Measured: a null run,
    # the working tree against itself, failed on index at 1440 with 120ms.
    first = "    settle(); await wait(120);\n    frames.push({ label: 'load'"
    assert p.count(first) == 1, 'browser-diff PROBE load frame moved'
    return p.replace(first, "    settle(); await wait(2000); settle(); await wait(120);\n    frames.push({ label: 'load'")


PROBE2 = build_probe()
bd.PROBE = PROBE2

# Both sides, every page: no CSS transitions. Reduced motion stops the
# reveals and the marquee, but several transitions have no reduced-motion
# rule (the comparison page's mode slider, .ind, .32s), and under
# --virtual-time-budget a transition is not finished when the timers say it
# should be: a null run, the working tree against itself, caught #modeInd
# mid-slide on one side and not the other. With transitions off every frame
# is the end state the reader is left with, and the comparison is exact.
# That motion itself is untouched is proved by the diff grep (2.4(c)).
STILL = '<style id="__painred_still">*,*::before,*::after{transition:none!important}</style>\n'

WRAP = """<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}iframe{border:0;display:block}</style></head>
<body><iframe id="f" src="%s" width="%d" height="%d"></iframe>
<script>
var t = setInterval(function () {
  try {
    var d = document.getElementById('f').contentDocument, p = d && d.getElementById('__diff__');
    if (p) { clearInterval(t); var o = document.createElement('pre'); o.id = '__diff__'; o.textContent = p.textContent; document.body.appendChild(o); }
  } catch (e) {}
}, 50);
</script></body></html>
"""


def chrome_dump(url, width, reduced, budget):
    args = [bd.CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
            '--window-size=%d,%d' % (max(width, 500) + 20, WIDTHS[width] + 20),
            '--virtual-time-budget=%d' % budget, '--dump-dom', url]
    if reduced:
        args.insert(4, '--force-prefers-reduced-motion')
    for attempt in range(3):
        try:
            p = subprocess.run(args, capture_output=True, timeout=600)
            return p.stdout.decode('utf-8', 'replace')
        except subprocess.TimeoutExpired:
            print('      (chrome stalled, retry %d)' % (attempt + 1), flush=True)
    return ''


def probe(root, page, cfg, width, reduced):
    """Frames of full snapshots for one page at one width, or None."""
    src = open(os.path.join(root, page), encoding='utf-8', errors='replace').read()
    js = STILL + PROBE2.replace('__CFG__', json.dumps(cfg))
    i = src.rfind('</body>')
    assert i >= 0, page
    sub = os.path.dirname(page)
    name = '__painred-%d.html' % os.getpid()
    wrap = '__painred-wrap-%d.html' % os.getpid()
    tmp, wtmp = os.path.join(root, sub, name), os.path.join(root, sub, wrap)
    open(tmp, 'w', encoding='utf-8').write(src[:i] + js + src[i:])
    open(wtmp, 'w', encoding='utf-8').write(WRAP % (name, width, WIDTHS[width]))
    srv, port = bd.serve(root)
    budget = 120000 if cfg.get('states') else 60000
    try:
        url = 'http://127.0.0.1:%d/%s' % (port, (sub + '/' if sub else '') + wrap)
        dom = chrome_dump(url, width, reduced, budget)
    finally:
        srv.shutdown()
        os.remove(tmp)
        os.remove(wtmp)
    m = re.search(r'<pre id="__diff__">(.*?)</pre>', dom, re.S)
    if not m:
        return None
    raw = json.loads(htmllib.unescape(m.group(1)))
    frames, base = [], None
    for f in raw['frames']:
        s = f['snap']
        if 'full' in s:
            base = s['full']
            full = dict(base)
        else:
            full = dict(base)
            for k in s['gone']:
                full.pop(k, None)
            full.update(s['delta'])
        frames.append({'label': f['label'], 'snap': full, 'r': s['r']})
    return {'srcs': raw['srcs'], 'frames': frames, 'errors': raw['errors']}


def norm(c):
    """A colour string to Chrome's computed form: rgb(r, g, b) or rgba(r, g, b, a)."""
    c = c.strip()
    m = re.fullmatch(r'#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})', c)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = ''.join(x * 2 for x in h)
        return 'rgb(%d, %d, %d)' % (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    return re.sub(r'\s*,\s*', ', ', c)


NAMES = ['text', 'hidden flag', 'classes', 'attributes', 'geometry', 'style']
RANK = ['element', 'text', 'hidden', 'classes', 'attribute', 'geometry', 'style', 'visibility', 'stray']


def rank(why):
    return next(i for i, w in enumerate(RANK) if why.startswith(w))


def classify(x, y, allow):
    """(reason or None, [(property, old, new), ...] colour changes)."""
    if x is None:
        return 'element appeared', []
    if y is None:
        return 'element disappeared', []
    for i, name in enumerate(NAMES):
        if x[i] != y[i]:
            if name == 'attributes':
                ax, ay = dict(p.split('=', 1) for p in x[i].split('|') if p), dict(p.split('=', 1) for p in y[i].split('|') if p)
                n = sorted(k for k in set(ax) | set(ay) if ax.get(k) != ay.get(k))
                return 'attribute %s changed' % ','.join(n), []
            if name == 'style':
                sx, sy = x[i].split('|'), y[i].split('|')
                n = [a.split('=', 1)[0] for a, b in zip(sx, sy) if a != b] or ['?']
                return 'style %s changed' % n[0], []
            return '%s changed' % name, []
    kx, ky = json.loads(x[6]), json.loads(y[6])
    triples = []
    for p in kx:
        if kx[p] == ky.get(p):
            continue
        if p == 'opacity':
            ox, oy = float(kx[p]), float(ky[p])
            if (ox > 0) != (oy > 0):
                return 'visibility changed (opacity %s -> %s)' % (kx[p], ky[p]), []
            triples.append((p, kx[p], ky[p]))
            continue
        if p in ('bgiColours', 'bshColours'):
            new = [norm(c) for c in ky[p].split('|') if c]
        else:
            new = [norm(ky[p])]
        for c in new:
            if c not in allow:
                return 'stray colour %s in %s' % (c, p), []
        triples.append((p, kx[p], ky[p]))
    return None, triples


def compare(old, new, pages, widths, vacuity, quiet=False):
    """Every page at every width, old tree against new. (bad count, records)."""
    bad = 0
    records = []
    for page in pages:
        cfg = bd.PAGES.get(page, {'ranges': [], 'states': []})
        # every page, the six calculators too: settle() ends the script
        # tweens but not the CSS transitions, and a box measured mid-transition
        # differs between two runs of the SAME tree (measured: #rvTax on the
        # pension calculator at 1440, 5px, after a t20 click). browser-diff.py,
        # run unchanged beside this, drives the six with motion on.
        reduced = True
        for w in widths:
            a = probe(old, page, cfg, w, reduced)
            b = probe(new, page, cfg, w, reduced)
            rec = {'page': page, 'width': w, 'ok': False}
            records.append(rec)
            if a is None or b is None:
                rec['why'] = 'could not read the probe output (%s)' % ('old' if a is None else 'new')
                bad += 1
                print('  FAIL %-34s %5d  %s' % (page, w, rec['why']), flush=True)
                continue
            if len(a['frames']) != len(b['frames']):
                rec['why'] = 'frame counts differ (%d, %d)' % (len(a['frames']), len(b['frames']))
                bad += 1
                print('  FAIL %-34s %5d  %s' % (page, w, rec['why']), flush=True)
                continue
            errs = a['errors'] + b['errors']
            first = None
            elements = 0
            coloured = set()
            triples = set()
            for fa, fb in zip(a['frames'], b['frames']):
                allow = {norm(v) for v in fb['r'].values() if v} | EXTRA_OK
                # the :root custom properties are paint by definition; the
                # allowlist is read from the new side's own values
                keys = set(fa['snap']) | set(fb['snap'])
                elements = max(elements, len(keys))
                for k in sorted(keys):
                    x, y = fa['snap'].get(k), fb['snap'].get(k)
                    if x == y:
                        continue
                    why, t = classify(x, y, allow)
                    # the first frame that fails, and in it the most basic
                    # reason: a changed figure also moves the boxes after it,
                    # and the report names the figure, not a box it pushed
                    if why and (first is None or (first[1] == fa['label'] and rank(why) < rank(first[0]))):
                        first = (why, fa['label'], k, x, y)
                    if t:
                        coloured.add(k)
                        triples.update(t)
                for p in set(fa['r']) | set(fb['r']):
                    if fa['r'].get(p) != fb['r'].get(p):
                        triples.add((':root ' + p, fa['r'].get(p), fb['r'].get(p)))
            vac = vacuity and page in TOUCHED and not coloured
            ok = first is None and not errs and not vac
            rec.update(ok=ok, frames=len(a['frames']), elements=elements, coloured=len(coloured),
                       triples=sorted(triples), errors=errs[:4])
            if not ok:
                bad += 1
                rec['why'] = (first[0] if first else ('%d probe errors' % len(errs) if errs else
                              'vacuous: no colour difference on a page the change paints'))
                if first:
                    rec['where'] = '%s %s' % (first[1], first[2])
            print('  %s %-34s %5d  %3d frames, %5d elements, %4d differing in colour, %3d distinct (property, old, new)%s'
                  % ('ok  ' if ok else 'FAIL', page, w, rec['frames'], elements, len(coloured), len(triples),
                     '' if ok else '   <- %s%s' % (rec['why'], (' at ' + rec['where']) if 'where' in rec else '')), flush=True)
            if not ok and first and not quiet:
                print('        old %s' % json.dumps(first[3])[:400])
                print('        new %s' % json.dumps(first[4])[:400])
            for e in errs[:4]:
                print('        error: %s' % e)
            if not quiet:
                for t in sorted(triples):
                    print('        %s: %s -> %s' % t)
    return bad, records


def all_pages(root):
    pages = sorted(os.path.relpath(p, root).replace(os.sep, '/')
                   for pat in ('*.html', 'games/*.html') for p in glob.glob(os.path.join(root, pat)))
    return [p for p in SIX if p in pages] + [p for p in pages if p not in SIX]


def copy_tree():
    d = tempfile.mkdtemp(prefix='pb-painred-new-')
    shutil.rmtree(d)
    shutil.copytree(ROOT, d, ignore=shutil.ignore_patterns('.git', 'verify-out', '__pycache__'))
    return d


def mutate(root, page, find, repl):
    p = os.path.join(root, page)
    s = open(p, encoding='utf-8').read()
    assert s.count(find) == 1, 'the self-test anchor %r is not once in %s' % (find, page)
    open(p, 'w', encoding='utf-8').write(s.replace(find, repl, 1))


def self_test(widths):
    """Four one-change copies of the working tree, each against the working
    tree itself: a figure, a bar's width and a hidden flag must each FAIL for
    that reason; a token's value alone must PASS."""
    cases = [
        ('a figure changed', 'pension-calculator.html', 'const diffPot=boost-base;', 'const diffPot=boost-base+1;',
         'text changed', False),
        ('a bar resized', 'pension-calculator.html', '<i style="width:37.5%"></i>', '<i style="width:38%"></i>',
         'geometry changed', False),
        ('a hidden flag dropped', 'index.html', '<section class="snaps" hidden>', '<section class="snaps">',
         'hidden flag changed', False),
        ('a colour token alone', 'pension-calculator.html', '--red:#A4291D', '--red:#A4291E', None, True),
    ]
    good = 0
    out = []
    for label, page, find, repl, want, vac in cases:
        d = copy_tree()
        try:
            mutate(d, page, find, repl)
            print('self-test: %s (%s)%s' % (label, page, '' if vac else ', --no-vacuity'), flush=True)
            bad, recs = compare(ROOT, d, [page], widths, vac, quiet=True)
        finally:
            shutil.rmtree(d, ignore_errors=True)
        whys = [r.get('why', '') for r in recs if not r['ok']]
        if want is None:
            res = 'PASS' if not bad else 'FAIL'
            right = not bad
            why = 'colour only' if right else '; '.join(whys)
        else:
            res = 'FAIL' if bad else 'PASS'
            right = bad == len(recs) and all(w == want for w in whys)
            why = '; '.join(sorted(set(whys))) or 'nothing caught'
        good += right
        out.append('%s %s (%s)  [%s]' % (res, want or 'colour only', why, 'as required' if right else 'WRONG'))
    print()
    for line in out:
        print('  ' + line)
    print('\nself-test: %s' % ('all four outcomes as required' if good == len(cases) else 'FAILED'))
    return good == len(cases)


def main():
    global TOUCHED
    ap = argparse.ArgumentParser()
    ap.add_argument('--pages', help='comma-separated pages (default: every page, the six calculators first)')
    ap.add_argument('--widths', default='375,1440')
    ap.add_argument('--no-vacuity', action='store_true')
    ap.add_argument('--new', help='a tree to compare instead of the working tree')
    ap.add_argument('--self-test', action='store_true')
    ap.add_argument('--json', help='write the per-page records here')
    ap.add_argument('--touched', help="comma-separated pages the change paints at load, for the vacuity rule (default: Run 42's list; Run 43, item 2 passes its own)")
    a = ap.parse_args()
    if a.touched: TOUCHED = a.touched.split(',')
    widths = [int(x) for x in a.widths.split(',')]
    for w in widths:
        assert w in WIDTHS, 'width %d: only %s' % (w, sorted(WIDTHS))
    if not os.path.exists(bd.CHROME):
        sys.exit('Chrome not found at %s (set CHROME=...)' % bd.CHROME)
    if a.self_test:
        sys.exit(0 if self_test(widths) else 1)
    new = os.path.abspath(a.new) if a.new else ROOT
    pages = a.pages.split(',') if a.pages else all_pages(new)
    print('classify pain-red: %s against %s, %d pages at %s'
          % (new if a.new else 'the working tree', bd.BASELINE_REF, len(pages), ', '.join(map(str, widths))), flush=True)
    old = bd.checkout_baseline()
    try:
        bad, recs = compare(old, new, pages, widths, not a.no_vacuity)
    finally:
        shutil.rmtree(old, ignore_errors=True)
    if a.json:
        with open(a.json, 'w') as f:
            json.dump(recs, f, indent=1)
    trip = set()
    for r in recs:
        trip.update(tuple(t) for t in r.get('triples', []))
    print('\n%d page-widths, %d frames, %d elements compared, %d elements differing in colour, %d distinct (property, old, new) site-wide'
          % (len(recs), sum(r.get('frames', 0) for r in recs), sum(r.get('elements', 0) for r in recs),
             sum(r.get('coloured', 0) for r in recs), len(trip)))
    print('%s' % ('PASS: every difference is paint, in the site\'s own colours' if not bad else 'FAILURES: %d' % bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
