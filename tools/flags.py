#!/usr/bin/env python3
"""Apply shared/site-flags.json to the pages.

    python3 tools/flags.py            # write the pages to match the flags
    python3 tools/flags.py --check    # report, change nothing, exit 1 if stale

A part of a page that a flag controls carries data-flag="<name>" on its
opening tag. When the flag is false the tag also carries hidden; when it is
true it does not. The code stays in the page either way, so Netlify still
reads the form at deploy and switching back on is one value and one run.

    guide_forms   the "email me the guide" form on director.html,
                  starter.html and tracker.html
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLAGS = os.path.join(ROOT, 'shared', 'site-flags.json')
PAGES = ['director.html', 'starter.html', 'tracker.html']
TAG = re.compile(r'<(\w+)([^>]*?)\sdata-flag="([a-z_]+)"(\s+hidden)?([^>]*)>')


def flags():
    with open(FLAGS, encoding='utf-8') as f:
        return {k: v for k, v in json.load(f).items() if not k.startswith('_')}


def apply(text, values):
    def one(m):
        name = m.group(3)
        if name not in values:
            raise SystemExit('unknown flag "%s"' % name)
        return '<%s%s data-flag="%s"%s%s>' % (m.group(1), m.group(2), name,
                                             '' if values[name] else ' hidden', m.group(5))
    return TAG.sub(one, text)


def main(argv):
    check = '--check' in argv
    values = flags()
    stale = []
    for name in PAGES:
        path = os.path.join(ROOT, name)
        with open(path, encoding='utf-8') as f:
            text = f.read()
        new = apply(text, values)
        if new != text:
            stale.append(name)
            if not check:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new)
    for name in stale:
        print(('stale: ' if check else 'wrote: ') + name)
    return 1 if check and stale else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
