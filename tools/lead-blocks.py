#!/usr/bin/env python3
"""Write the reply forms and tools into the pages that carry them.

    python3 tools/lead-blocks.py            # write the pages
    python3 tools/lead-blocks.py --check    # report, change nothing, exit 1 if stale

    ask        "Ask us. We reply by email." (Netlify form "enquiry"):
               the home, starter, directors' and booking pages
    jobs       the old jobs timeline ("pension-trace"): tracker.html
    fee        the fee check ("fee-check"): index.html
    yearend    the year-end reminder ("year-end-reminder"): director.html
    move       changing jobs ("job-change"): tracker.html
    callback   call me back ("callback"): booking.html
    askresult  "Ask us about this" under each calculator's result (posts
               as "enquiry"): script only
    kit        the CSS the four small tools share

Each block has its markup and CSS in tools/lead-parts/<name>.html and
<name>.css, and one script of its own. On a page the markup sits between
<!-- LEAD:<name>:BEGIN --> and <!-- LEAD:<name>:END -->, the CSS between
/* LEAD:<name>:BEGIN */ and /* LEAD:<name>:END */ at the end of the head's
stylesheet, and the scripts before </body>. The first run puts each where
ANCHORS says; every later run rewrites only what is between the markers, so
editing the parts and running this is the whole job. Run
tools/stamp-images.py afterwards to give a new script tag its ?v= hash.

The markup is static HTML on purpose: Netlify reads a form, and the fields
it keeps, from the HTML it is given at deploy.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = os.path.join(ROOT, 'tools', 'lead-parts')

# In the order they are written. 'parts' says which of tools/lead-parts/<name>.html
# and .css the block has; 'js' the scripts, in load order, a page must carry.
FORMS = 'assets/js/pb-forms.js'
KIT = 'assets/js/pb-kit.js'
BLOCKS = {
    'kit': {'pages': ['index.html', 'director.html', 'tracker.html', 'booking.html'], 'parts': ['css'],
            'js': [FORMS, KIT]},
    'ask': {'pages': ['index.html', 'starter.html', 'director.html', 'booking.html'], 'parts': ['css', 'html'],
            'js': [FORMS, 'assets/js/pb-ask.js']},
    'jobs': {'pages': ['tracker.html'], 'parts': ['css', 'html'],
             'js': [FORMS, 'assets/js/pb-jobs.js']},
    'fee': {'pages': ['index.html'], 'parts': ['css', 'html'],
            'js': [FORMS, 'assets/js/pension-fees.js', KIT, 'assets/js/pb-fee.js']},
    'yearend': {'pages': ['director.html'], 'parts': ['css', 'html'],
                'js': [FORMS, KIT, 'assets/js/pb-yearend.js']},
    'move': {'pages': ['tracker.html'], 'parts': ['css', 'html'],
             'js': [FORMS, KIT, 'assets/js/pb-move.js']},
    'callback': {'pages': ['booking.html'], 'parts': ['css', 'html'],
                 'js': [FORMS, KIT, 'assets/js/pb-callback.js']},
    # "Ask us about this" under a calculator's result: script only, its CSS
    # inside it. The skeleton carries the tags into every page built from it.
    'askresult': {'pages': ['pension-calculator.html', 'director-calculator.html'], 'parts': [],
                  'js': [FORMS, KIT, 'assets/js/pb-askresult.js']},
}

# where the markup goes on a page that does not carry it yet: (text, before or after)
ANCHORS = {
    ('ask', 'index.html'): ('<section class="expect"><div class="wrap faq-grid">', 'before'),
    ('ask', 'starter.html'): ('<div class="final-band">', 'before'),
    ('ask', 'director.html'): ('<section class="pb-bleed pb-wash pb-magnetband"', 'before'),
    ('ask', 'booking.html'): ('\n</main>', 'before'),
    ('jobs', 'tracker.html'): ('</div></header>\n', 'after'),
    ('fee', 'index.html'): ('<!-- LEAD:ask:BEGIN', 'before'),
    ('yearend', 'director.html'): ('<!-- LEAD:ask:BEGIN', 'before'),
    ('move', 'tracker.html'): ('<section style="padding-top:56px"><div class="wrap faq-grid">', 'before'),
    ('callback', 'booking.html'): ('<!-- LEAD:ask:BEGIN', 'before'),
}


def part(name, ext):
    with open(os.path.join(PARTS, name + ext), encoding='utf-8') as f:
        return f.read().strip('\n')


def put(text, begin, end, body, anchor, where, label):
    """Replace what is between begin and end, or insert the whole at anchor."""
    whole = begin + '\n' + body + '\n' + end
    i, j = text.find(begin), text.find(end)
    if i >= 0 and j > i:
        return text[:i] + whole + text[j + len(end):]
    k = text.find(anchor)
    if k < 0:
        raise SystemExit('%s: no place for it (looked for %r)' % (label, anchor))
    if where == 'after':
        k += len(anchor)
        return text[:k] + whole + '\n' + text[k:]
    return text[:k] + whole + '\n' + text[k:]


def scripts(text, srcs, label):
    for src in srcs:
        if re.search(r'<script src="%s(\?v=[0-9a-f]+)?"' % re.escape(src), text):
            continue
        k = text.rfind('</body>')
        if k < 0:
            raise SystemExit('%s: no </body>' % label)
        text = text[:k] + '<script src="%s"></script>\n' % src + text[k:]
    return text


def build(page, text):
    for name, b in BLOCKS.items():
        if page not in b['pages']:
            continue
        label = '%s (%s)' % (page, name)
        if 'css' in b['parts']:
            css = '/* LEAD:%s:BEGIN (tools/lead-blocks.py writes this; edit tools/lead-parts/%s.css) */' % (name, name)
            text = put(text, css, '/* LEAD:%s:END */' % name, part(name, '.css'),
                       '</style>', 'before', label)
        if 'html' in b['parts']:
            html = '<!-- LEAD:%s:BEGIN (tools/lead-blocks.py writes this; edit tools/lead-parts/%s.html) -->' % (name, name)
            anchor, where = ANCHORS[(name, page)]
            text = put(text, html, '<!-- LEAD:%s:END -->' % name, part(name, '.html'), anchor, where, label)
        text = scripts(text, b['js'], label)
    return text


def pages():
    return sorted({p for b in BLOCKS.values() for p in b['pages']})


def main(argv):
    check = '--check' in argv
    stale = []
    for page in pages():
        path = os.path.join(ROOT, page)
        with open(path, encoding='utf-8') as f:
            text = f.read()
        new = build(page, text)
        if new != text:
            stale.append(page)
            if not check:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new)
    for page in stale:
        print(('stale: ' if check else 'wrote: ') + page)
    return 1 if check and stale else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
