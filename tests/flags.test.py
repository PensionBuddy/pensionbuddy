#!/usr/bin/env python3
"""shared/site-flags.json against the pages.

    python3 tests/flags.test.py

Every part a flag controls is in the page, so it can come back with one
change, and is hidden exactly when its flag is false. tools/flags.py writes
the pages; this holds them to the file.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from harness import eq, report  # noqa: E402
import flags  # noqa: E402

FLAGS = flags.flags()
eq('1. the guide forms flag is off', FLAGS.get('guide_forms'), False)

FORMS = {'director.html': 'director-guide', 'starter.html': 'starter-guide', 'tracker.html': 'tracker-guide'}
for page, form in FORMS.items():
    text = open(os.path.join(ROOT, page), encoding='utf-8').read()
    tags = re.findall(r'<section[^>]*data-flag="guide_forms"[^>]*>', text)
    eq('2. %s: one flagged guide section' % page, len(tags), 1)
    if tags:
        eq('3. %s: hidden matches the flag' % page, ' hidden' in tags[0], not FLAGS['guide_forms'])
    eq('4. %s: the form is still in the page' % page, 'name="%s"' % form in text, True)
    eq('5. %s: the page matches tools/flags.py' % page, flags.apply(text, FLAGS), text)

# switching the flag back on removes hidden, and off puts it back
sample = '<section class="x" data-flag="guide_forms" hidden><p>'
eq('6. on removes hidden', flags.apply(sample, {'guide_forms': True}), '<section class="x" data-flag="guide_forms"><p>')
eq('7. off puts it back', flags.apply('<section class="x" data-flag="guide_forms"><p>', {'guide_forms': False}), sample)
report()
