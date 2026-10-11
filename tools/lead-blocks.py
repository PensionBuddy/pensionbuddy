#!/usr/bin/env python3
"""Write the two reply forms into the pages that carry them.

    python3 tools/lead-blocks.py            # write the pages
    python3 tools/lead-blocks.py --check    # report, change nothing, exit 1 if stale

    ask    "Ask Damian. He replies by email." (Netlify form "enquiry"):
           the home, starter, directors' and booking pages
    jobs   the old jobs timeline (Netlify form "pension-trace"): tracker.html

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

BLOCKS = {
    'ask': {'pages': ['index.html', 'starter.html', 'director.html', 'booking.html'],
            'js': ['assets/js/pb-forms.js', 'assets/js/pb-ask.js']},
    'jobs': {'pages': ['tracker.html'],
             'js': ['assets/js/pb-forms.js', 'assets/js/pb-jobs.js']},
}

# where the markup goes on a page that does not carry it yet: (text, before or after)
ANCHORS = {
    ('ask', 'index.html'): ('<section class="expect"><div class="wrap faq-grid">', 'before'),
    ('ask', 'starter.html'): ('<div class="final-band">', 'before'),
    ('ask', 'director.html'): ('<div class="final-band">', 'before'),
    ('ask', 'booking.html'): ('\n</main>', 'before'),
    ('jobs', 'tracker.html'): ('</div></header>\n', 'after'),
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
        css = '/* LEAD:%s:BEGIN (tools/lead-blocks.py writes this; edit tools/lead-parts/%s.css) */' % (name, name)
        text = put(text, css, '/* LEAD:%s:END */' % name, part(name, '.css'),
                   '</style>', 'before', label)
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
