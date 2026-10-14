#!/usr/bin/env python3
"""Reading age: the words on every page read at age 10 or under.

    python3 tests/readability.test.py            # the check
    python3 tests/readability.test.py --table    # the table only, no check:
                                                 # each page's figures and the
                                                 # longest sentences, where to cut

docs/WRITING-RULES.md is the rule; this is its measure. Each page's own
words are scored with the Flesch-Kincaid grade, and reading age is the grade
plus 5 (grade 5 is age 10). The bar is a reading age of 10 or under.

WHAT IS READ. Each root page's html from disk: the text of <main>, with
<script>, <style>, <noscript>, <template>, <svg>, the nav, the footer and
HTML comments taken out. Only text a reader sees when the page opens:

  - not an element with the hidden attribute or an inline display:none (a
    form's later steps, a result for other inputs, the honeypot field);
  - not the body of a closed <details> (its <summary> is read): the folded
    "How we worked this out" lists and the like;
  - not an element marked aria-hidden="true": the site marks a drawing so,
    and its labels are part of the picture, not copy;
  - not an attribute: alt text, placeholders and aria-labels are not read.

Script-written text (a result a slider writes) is not in the html and is not
read. Each paragraph, heading, list item, cell, label and button is its own
line; a line with no full stop is one sentence, the way a headline is.
Two elements side by side, a card's title then its description, are two
lines when the first has no full stop and the second starts with a capital.

WHAT IS LEFT OUT, and why: fixed wording the owner cannot simplify.

  - Caveats and legal text: any element whose class includes one of
    pb-warn, pb-caveat, pb-reg, pb-reviewed, infoadvice, disclosure,
    gap-note, pb-src, assume; and every other caveat tools/pagebuild.py lists
    (CAVEAT_CLASSES, CAVEAT_WITHIN, CAVEAT_IDS: sources, notes, "as at"
    dates), so a caveat added there is left out here too.
  - The class legal counts as pagebuild counts it, not on its own. The legal
    notices carry it with pb-caveat (left out), but it also dresses the body
    of every guide and the glossary's headline (pagebuild: ".legal ... also
    dress[es] guides and plain card copy, which are not caveats"). Left out
    on its own, three guides and the year-end checklist would have no words
    left. A legal block's "as at" line, notes and call box (.legal .updated,
    .ck-note, .callbox) are caveats and are left out.
  - The legal pages: privacy.html, terms.html, complaints.html.
  - A page with no full sentence left after that (how-we-work.html: its
    whole body is a caveat). 404.html is read: it has prose ("This page is
    gone.").
  - The two games in games/: they are not root pages, and they draw on a
    canvas.

THE FORMULA. Flesch-Kincaid grade = 0.39 x (words / sentences) + 11.8 x
(syllables / words) - 15.59. A word is a run of characters between spaces
with a letter or digit in it. A euro amount, number or percentage ("€303",
"4.5%", "1,560", "2026") is one short word of one syllable; "20-minute" is
one word, the number one syllable and "minute" two. A sentence with no
letters in it (a slider's value) is not prose and is not counted.

SYLLABLES, a heuristic with no dictionary (no installs). Per word, lower
case, letters only:
  1. three letters or fewer: one. An initialism (PRSI, AVCs) is said letter
     by letter: one a letter, W three.
  2. A handful of the site's own words the rules get wrong: EXCEPT below.
  3. A compound on a silent e (some-, home-, house-, life-, else-, care-,
     time-: "something", "household"): the first part is one syllable.
  4. Endings: -es after s, x, z, ch, sh, c or g is a syllable ("pages"), a
     plural s is not ("rates"); -ed is silent except after t, d or e
     ("worked", but "wanted", "agreed"); -ing is a syllable of its own
     ("paying"); -ment, -ness, -less, -ful and -ly each add one
     ("retirement", "safely").
  5. A final e after a consonant is silent ("rate"), except -le and -re
     after a consonant ("table", "centre").
  6. A y at the start, or between two vowels, is a consonant ("year",
     "employer"); otherwise it is a vowel.
  7. Count the groups of vowels, then add one for each "ua" not after q or
     g ("annual"), "ia" not after c, t, s or x ("Damian"), "io" not after c,
     t, s, x, g, l or n ("period"), and "iu" ("medium").
  Known misses, each one syllable short: "idea", "area", "reality", "ratio",
  "anyone", "science", "earlier", "maybe".

THE BAR, AND THE RATCHET. A page reads at 10 or under, or it is listed in
ABOVE_TODAY with its reading age when the list was made, rounded up to one
decimal. The test fails if:
  (a) a page not in ABOVE_TODAY reads above 10;
  (b) a page in ABOVE_TODAY reads higher than its figure there;
  (c) a page in ABOVE_TODAY now reads 10 or under: take it off the list.
So a listed page can only come down, and the list only gets shorter. The
copy was not changed to pass: each listed page must come down by a rewrite.

The score is a page's average: one long sentence on a long page moves it
little. --table lists the longest sentences on the site, to find those.

Same report as the other suites, from tests/harness.py: one line per
assertion, ALL PASS or FAILURES at the end, exit 0 or 1.
"""
import math
import os
import re
import subprocess
import sys
import unicodedata
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
sys.path.insert(0, os.path.join(ROOT, 'tests'))

import pagebuild  # noqa: E402
from harness import eq, report  # noqa: E402

BAR = 10.0

# Each must come down. The reading age when this list was made (14 October
# 2026), rounded up to one decimal. A page leaves the list when it reads at
# 10 or under; nothing is ever added to it. Both pages it held came off the
# same day, rewritten: director-pension-rules.html (10.88 to 9.91) and
# glossary.html (10.71 to 9.84). The list is empty.
ABOVE_TODAY = {}

# Fixed wording: legal pages, and caveats wherever they are.
LEGAL_PAGES = ('privacy.html', 'terms.html', 'complaints.html')
CAVEAT_CLASSES = frozenset(('pb-warn', 'pb-caveat', 'pb-reg', 'pb-reviewed', 'infoadvice', 'disclosure',
                            'gap-note', 'pb-src', 'assume')) | frozenset(pagebuild.CAVEAT_CLASSES)

# What the parser drops whole, and what breaks a line.
SKIP_TAGS = frozenset(('script', 'style', 'noscript', 'template', 'svg', 'nav', 'footer'))
VOID = frozenset(('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param',
                  'source', 'track', 'wbr'))
BLOCK = frozenset(('address', 'article', 'aside', 'blockquote', 'button', 'caption', 'dd', 'details',
                   'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'form', 'h1', 'h2', 'h3',
                   'h4', 'h5', 'h6', 'header', 'hr', 'img', 'input', 'label', 'legend', 'li', 'main', 'meter',
                   'ol', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'section', 'select', 'summary',
                   'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'tr', 'ul'))
HARD, SOFT, DOT = '\x1d', '\x1e', '\x1f'


# ---------------------------------------------------------------- the copy
class Copy(HTMLParser):
    """The text a reader sees in <main>, as one string. HARD marks the edge
    of a block (a new line); SOFT marks two elements side by side."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []      # open elements: {'tag', 'cls', 'out', 'closed', 'calc'}
        self.parts = []
        self.main = 0
        self.after_end = False

    def reading(self):
        if not self.main:
            return False
        top = self.stack[-1] if self.stack else None
        return not (top and (top['out'] or top['closed']))

    def left_out(self, tag, a, cls):
        """Is this element left out, for itself? (Its children inherit it.)"""
        style = (a.get('style') or '').replace(' ', '').lower()
        ident = a.get('id') or ''
        anc = {c for el in self.stack for c in el['cls']}
        return (tag in SKIP_TAGS
                or 'hidden' in a or 'display:none' in style
                or a.get('aria-hidden') == 'true'
                or any(c in CAVEAT_CLASSES for c in cls)
                or ident in pagebuild.CAVEAT_IDS
                or (not any((el['calc'], ident) in pagebuild.CAVEAT_NOT for el in self.stack)
                    and any(c == inner and outer in anc for outer, inner in pagebuild.CAVEAT_WITHIN
                            for c in cls)))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get('class') or '').split()
        if tag == 'main':
            self.main += 1
        if self.reading():
            if tag in BLOCK:
                self.parts.append(HARD)
            elif tag == 'br' or not self.after_end:
                self.parts.append(' ')
            else:
                self.parts.append(SOFT)
        self.after_end = False
        if tag in VOID:
            return
        parent = self.stack[-1] if self.stack else None
        out = bool(parent and (parent['out'] or (parent['closed'] and tag != 'summary')))
        self.stack.append({'tag': tag, 'cls': cls, 'calc': a.get('data-pb-calc') or '',
                           'out': out or self.left_out(tag, a, cls),
                           'closed': tag == 'details' and 'open' not in a})

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                break
        else:
            return
        if self.reading():
            self.parts.append(HARD if tag in BLOCK else ' ')
        self.after_end = True
        if tag == 'main':
            self.main -= 1

    def handle_data(self, data):
        if self.reading():
            self.parts.append(data)
            if data.strip():
                self.after_end = False


def copy_of(html):
    """The visible text of <main>, with the line marks."""
    p = Copy()
    p.feed(re.sub(r'<!--.*?-->', '', html, flags=re.S))
    p.close()
    return ''.join(p.parts)


# ----------------------------------------------------------- the sentences
ENDS = re.compile(r'[.!?…]["\'’”)\]]*$')
SPLIT = re.compile(r'(?<=[.!?…])["\'’”)\]]*\s+')
# a full stop that does not end a sentence: "e.g.", "St. George",
# "Finance (No. 2) Bill", "(S.I.)"
NOT_AN_END = re.compile(r'\b(?:[Ee]\.g|[Ii]\.e|etc|vs|approx|St|Dr|Mr|Mrs|Ms)\.|\bNo\.(?=\s*\d)'
                        r'|\b(?:[A-Z]\.){2,}')


def sentences(text):
    """Every sentence, in order. A line with no full stop is one sentence."""
    out = []
    for block in text.split(HARD):
        lines = ['']
        for i, piece in enumerate(block.split(SOFT)):
            before = lines[-1].strip()
            if i and before and not ENDS.search(before) and re.match(r'\s*[A-Z]', piece):
                lines.append(piece)
            else:
                lines[-1] += ' ' + piece
        for line in lines:
            line = NOT_AN_END.sub(lambda m: m.group(0).replace('.', DOT), ' '.join(line.split()))
            out += [s.replace(DOT, '.').strip() for s in SPLIT.split(line) if s.strip()]
    return out


# ---------------------------------------------------- words and syllables
LETTER = re.compile(r'[^\W\d_]')
PARTS = re.compile(r"\d[\d.,]*[^\W\d_]*|[^\W\d_]+(?:['’][^\W\d_]+)*")
# the site's own words the rules below get wrong, with their syllables
EXCEPT = {'ireland': 2, 'business': 2, 'annuity': 4, 'european': 4, 'video': 3}
# a first part that ends in a silent e: "something", "household", "lifetime"
SILENT_E_FIRST = ('some', 'home', 'house', 'life', 'else', 'care', 'time')
SUFFIXES = ('ment', 'ness', 'less', 'ful', 'ly')
ES = re.compile(r'(?:[sxzcg]|[cs]h)es$')


def words(sentence):
    """The words of a sentence: each run between spaces with a letter or a digit."""
    return [t for t in sentence.split() if LETTER.search(t) or re.search(r'\d', t)]


def syllables_of_part(part):
    """Syllables in one run of letters (a word, or one half of "auto-enrolment")."""
    if re.fullmatch(r'[A-Z]{2,}s?', part):
        return sum(3 if c == 'W' else 1 for c in part.rstrip('s'))
    w = ''.join(c for c in unicodedata.normalize('NFKD', part.lower()) if 'a' <= c <= 'z')
    if not w:
        return 0
    if len(w) <= 3:
        return 1
    for stem, extra in ((w, 0), (w[:-1], 0), (w[:-2], 1 if ES.search(w) else 0)):
        if stem in EXCEPT and (stem == w or w.endswith('s')):
            return EXCEPT[stem] + extra
    for first in SILENT_E_FIRST:
        rest = w[len(first):]
        if w.startswith(first) and len(rest) >= 2 and re.search('[aeiouy]', rest):
            return 1 + syllables_of_part(rest)
    n = 0
    if ES.search(w):                                        # pages, taxes
        n, w = n + 1, w[:-2]
    elif w.endswith('s') and not w.endswith(('ss', 'us', 'is')):
        w = w[:-1]                                          # rates, pensions
    if w.endswith('ed') and len(w) > 3 and w[-3] not in 'tde':
        w = w[:-2]                                          # worked; not wanted, agreed
    if w.endswith('ing') and re.search('[aeiouy]', w[:-3]):
        n, w = n + 1, w[:-3]                                # paying, going
    stripped = True
    while stripped:                                         # retirement, carefully
        stripped = False
        for suffix in SUFFIXES:
            stem = w[:-len(suffix)]
            if w.endswith(suffix) and len(stem) >= 3 and re.search('[aeiouy]', stem):
                n, w, stripped = n + 1, stem, True
                break
    if len(w) > 2 and w.endswith('e') and w[-2] not in 'aeiouy' and not re.search('[^aeiouy][lr]e$', w):
        w = w[:-1]                                          # rate; not table, centre
    if w.startswith('y'):
        w = w[1:]                                           # year
    w = re.sub('(?<=[aeiou])y(?=[aeiou])', 'c', w)          # employer
    k = len(re.findall('[aeiouy]+', w))
    k += len(re.findall('(?<![qg])ua', w))                  # annual, January
    k += len(re.findall('(?<![ctsx])ia', w))                # Damian, liable
    k += len(re.findall('(?<![ctsxgln])io', w))             # period, previous
    k += w.count('iu')                                      # medium
    return n + max(1, k)


def syllables(word):
    """Syllables in a word as written: a number is one, letters by the rules."""
    if not LETTER.search(word):
        return 1                                            # €303, 4.5%, 2026
    return sum(1 if p[0].isdigit() else syllables_of_part(re.sub("['’]", '', p))
               for p in PARTS.findall(word)) or 1


# ---------------------------------------------------------------- scoring
def measure(html):
    """{words, sentences, syllables, grade, age, has_prose, lines} for a page's html."""
    lines = [s for s in sentences(copy_of(html)) if LETTER.search(s)]
    nw = sum(len(words(s)) for s in lines)
    ns = len(lines)
    syl = sum(syllables(w) for s in lines for w in words(s))
    grade = 0.39 * nw / ns + 11.8 * syl / nw - 15.59 if nw else None
    return {'words': nw, 'sentences': ns, 'syllables': syl, 'grade': grade,
            'age': None if grade is None else grade + 5,
            'has_prose': any(ENDS.search(s) for s in lines), 'lines': lines}


def up1(x):
    """Rounded up to one decimal: the figure ABOVE_TODAY lists."""
    return math.ceil(round(x * 10, 6)) / 10


def verdict(page, age, above_today=None, bar=BAR):
    """'ok', or what is wrong with this page's reading age."""
    above_today = ABOVE_TODAY if above_today is None else above_today
    if page not in above_today:
        return 'ok' if age <= bar else 'reads at %.2f, above %g: simplify it' % (age, bar)
    if age <= bar:
        return 'reads at %.1f, %g or under: take it off ABOVE_TODAY' % (age, bar)
    if age > above_today[page]:
        return 'reads at %.2f, higher than its %.1f in ABOVE_TODAY' % (age, above_today[page])
    return 'ok'


def root_pages():
    ls = subprocess.run(['git', 'ls-files', '*.html'], cwd=ROOT, capture_output=True, text=True).stdout.split()
    if not ls:   # not a checkout, e.g. from git archive
        ls = os.listdir(ROOT)
    return sorted(n for n in ls if n.endswith('.html') and '/' not in n)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def scores():
    """{page: measure} for every root page, legal pages left out."""
    return {p: measure(read(p)) for p in root_pages() if p not in LEGAL_PAGES}


# ------------------------------------------------------------------ table
def table(found):
    print('%-36s %6s %10s %6s %12s' % ('page', 'words', 'sentences', 'grade', 'reading age'))
    for page in root_pages():
        m = found.get(page)
        if m is None:
            print('%-36s %6s %10s %6s %12s   left out: legal page' % (page, '-', '-', '-', '-'))
        elif not m['has_prose']:
            print('%-36s %6d %10d %6s %12s   left out: no sentence outside caveats'
                  % (page, m['words'], m['sentences'], '-', '-'))
        else:
            v = verdict(page, m['age'])
            note = ('above %g; ABOVE_TODAY %.1f' % (BAR, ABOVE_TODAY[page])) if page in ABOVE_TODAY else ''
            print('%-36s %6d %10d %6.1f %12.1f   %s' % (page, m['words'], m['sentences'], m['grade'], m['age'],
                                                      note if v == 'ok' else v))
    longest = sorted(((len(words(s)), page, s) for page, m in found.items() if m['has_prose']
                      for s in m['lines']), key=lambda r: -r[0])[:10]
    print('\nThe longest sentences, where to cut first:')
    for n, page, s in longest:
        print('  %2d words  %-30s %s' % (n, page, s))


# ------------------------------------------------------------------ check
def run():
    found = scores()
    read_pages = sorted(p for p, m in found.items() if m['has_prose'])

    # ------------------------------------------------------------------ 1
    # Which pages are read. Every root page but the three legal ones, and a
    # page drops out only when nothing outside its caveats is left: today
    # that is how-we-work.html alone, so a page that loses its copy to a
    # wrong exclusion is caught here. The guides' bodies are read.
    eq('1. the legal pages are left out by name', sorted(p for p in root_pages() if p not in found),
       sorted(LEGAL_PAGES))
    eq('1. the pages with no sentence outside caveats', sorted(p for p, m in found.items() if not m['has_prose']),
       ['how-we-work.html'])
    eq('1. 404.html has prose, so it is read', '404.html' in read_pages, True)
    for guide in ('pensions-over-50.html', 'self-employed-pensions.html', 'uk-pensions-in-ireland.html',
                  'director-year-end-checklist.html'):
        eq('1. %s: the guide inside .legal is read (over 300 words)' % guide,
           found.get(guide, {}).get('words', 0) > 300, True)
    eq('1. ABOVE_TODAY names only pages that are read', sorted(set(ABOVE_TODAY) - set(read_pages)), [])
    eq('1. ABOVE_TODAY figures are to one decimal', [p for p, v in ABOVE_TODAY.items() if round(v, 1) != v], [])

    # ------------------------------------------------------------------ 2
    # The bar and the ratchet, page by page.
    for page in read_pages:
        bar = ('no higher than its %.1f in ABOVE_TODAY' % ABOVE_TODAY[page] if page in ABOVE_TODAY
               else 'at age %g or under' % BAR)
        eq('2. %s reads %s' % (page, bar), verdict(page, found[page]['age']), 'ok')

    # ------------------------------------------------------------------ 3
    # The counting, pinned. Each figure is the dictionary's, so a change to
    # the heuristic that gets a common word wrong is caught.
    pinned = {'the': 1, 'you': 1, 'year': 1, 'yearly': 2, 'pension': 2, 'pensions': 2, 'retirement': 3,
              'contribution': 4, 'calculator': 4, 'company': 3, 'money': 2, 'rates': 1, 'rate': 1,
              'pages': 2, 'taxes': 2, 'worked': 1, 'used': 1, 'wanted': 2, 'agreed': 2, 'guaranteed': 3,
              'paying': 2, 'safely': 2, 'carefully': 3, 'table': 2, 'centre': 2, 'people': 2, 'employer': 3,
              'beyond': 2, 'annual': 3, 'January': 4, 'usually': 4, 'Damian': 3, 'period': 3,
              'previous': 3, 'social': 2, 'financial': 3, 'million': 2, 'medium': 3, 'something': 2,
              'household': 2, 'career': 2, 'Ireland': 2, 'business': 2, 'businesses': 3,
              'Revenue’s': 3, 'self-employed': 3, 'auto-enrolment': 5, 'PRSI': 4, 'AVCs': 3, 'UK': 2,
              '€303': 1, '4.5%': 1, '1,560': 1, '2026': 1, '20-minute': 3, 'Seán': 1}
    eq('3. syllables, against the dictionary', {w: syllables(w) for w in pinned}, pinned)
    eq('3. a euro amount, a number and a percentage are each one word',
       words('Pay €303 a month, 4.5% more, from 2026.'), ['Pay', '€303', 'a', 'month,', '4.5%', 'more,',
                                                                'from', '2026.'])
    eq('3. sentences end at a full stop, not at "No. 2", "St.", "e.g." or "(S.I.)"',
       sentences('Watch the Finance (No. 2) Bill 2026. It puts Budget 2027 into law. St. George Private Bank, '
                 'e.g. a PRSA. Statutory Instrument (S.I.) No. 128 of 2021; and 4.5% a year!'),
       ['Watch the Finance (No. 2) Bill 2026.', 'It puts Budget 2027 into law.',
        'St. George Private Bank, e.g. a PRSA.', 'Statutory Instrument (S.I.) No. 128 of 2021; and 4.5% a year!'])
    m = measure('<main><p>Your pension pays you an income in retirement. Start one today.</p></main>')
    eq('3. Flesch-Kincaid on a known text: 11 words, 2 sentences, 16 syllables, grade 3.72',
       (m['words'], m['sentences'], m['syllables'], round(m['grade'], 2)), (11, 2, 16, 3.72))
    eq('3. reading age is the grade plus 5', round(m['age'] - m['grade'], 9), 5)
    eq('3. up1 rounds up to one decimal', [up1(10.41), up1(10.4), up1(10.76), up1(10.0)], [10.5, 10.4, 10.8, 10.0])

    # ------------------------------------------------------------------ 4
    # What is read and what is left out, on real pages. Each mutant adds one
    # long, jargon-heavy sentence (36 words, grade 31). In a page's copy it
    # is caught; in anything the docstring leaves out it changes nothing.
    jargon = ('Notwithstanding the aforementioned considerations, the beneficiary’s entitlement to accumulated '
              'contributions, inclusive of investment appreciation and applicable administrative remuneration, '
              'shall be determined by the scheme’s trustees in accordance with the prevailing legislative '
              'provisions governing occupational retirement arrangements.')
    main_tag = '<main id="main" tabindex="-1">'

    def inject(page, text):
        """The page's html with text put first in its <main>."""
        html = read(page)
        assert html.count(main_tag) == 1, page
        return html.replace(main_tag, main_tag + text, 1)

    def change(page, text):
        """What the text adds to the page's (words, sentences, syllables)."""
        a, b = measure(read(page)), measure(inject(page, text))
        return tuple(b[k] - a[k] for k in ('words', 'sentences', 'syllables'))

    page = min(read_pages, key=lambda p: found[p]['words'])     # the shortest page
    eq('4. %s, the shortest page, passes before the mutants' % page, verdict(page, found[page]['age']), 'ok')
    eq('4. a long jargon sentence in a paragraph of %s is caught' % page,
       verdict(page, measure(inject(page, '<p>%s</p>' % jargon))['age']).startswith('reads at'), True)
    eq('4. and it counts as one sentence of 36 words', change(page, '<p>%s</p>' % jargon)[:2], (36, 1))
    longest = max((p for p in read_pages if p not in ABOVE_TODAY), key=lambda p: found[p]['words'])
    eq('4. on the longest page not listed, %s, a paragraph of five of them is caught' % longest,
       verdict(longest, measure(inject(longest, '<p>%s</p>' % ' '.join([jargon] * 5)))['age'])
       .startswith('reads at'), True)
    # the ratchet on the hardest page, listed at today's figure whether or
    # not it is in ABOVE_TODAY: one more such sentence is caught by (b)
    # alone (no bar), and with a page of short sentences added it must come
    # off the list by (c)
    top = max(read_pages, key=lambda p: found[p]['age'])
    listed = {top: up1(found[top]['age'])}
    eq('4. (b) %s, the hardest page, listed at today\'s figure: one more such sentence is caught' % top,
       verdict(top, measure(inject(top, '<p>%s</p>' % jargon))['age'], listed, bar=0)
       .endswith('in ABOVE_TODAY'), True)
    eq('4. (c) %s, listed, with 120 short sentences added would have to come off the list' % top,
       verdict(top, measure(inject(top, '<p>%s</p>' % ('You pay in. The State adds. Your pot grows. ' * 40)))['age'],
               listed).endswith('take it off ABOVE_TODAY'), True)
    nothing = (0, 0, 0)
    left_out = [('a caveat, .%s' % c, '<p class="%s">%s</p>' % (c, jargon), nothing) for c in sorted(
        ('pb-warn', 'pb-caveat', 'pb-reg', 'pb-reviewed', 'infoadvice', 'disclosure', 'gap-note', 'pb-src',
         'assume'))]
    left_out += [
        ('a caveat inside a legal block, .legal .updated',
         '<div class="legal"><p class="updated">%s</p></div>' % jargon, nothing),
        ('a nav', '<nav>%s</nav>' % jargon, nothing),
        ('a footer', '<footer><p>%s</p></footer>' % jargon, nothing),
        ('a script', '<script>var s="%s";</script>' % jargon, nothing),
        ('a style', '<style>/* %s */</style>' % jargon, nothing),
        ('a noscript', '<noscript><p>%s</p></noscript>' % jargon, nothing),
        ('an HTML comment', '<!-- %s -->' % jargon, nothing),
        ('a hidden element', '<p hidden>%s</p>' % jargon, nothing),
        ('an inline display:none', '<p style="color:red; display: none">%s</p>' % jargon, nothing),
        ('a drawing, aria-hidden', '<span aria-hidden="true">%s</span>' % jargon, nothing),
        ('an attribute', '<img src="x.png" alt="%s">' % jargon, nothing),
        # its summary is read: five words of one syllable, one line
        ('a closed details (but its summary is read)',
         '<details><summary>How we worked this out</summary><p>%s</p></details>' % jargon, (5, 1, 5)),
    ]
    for what, mutant, expected in left_out:
        eq('4. the sentence in %s is left out' % what, change(page, mutant), expected)
    after = read(page).replace('</main>', '</main><p>%s</p>' % jargon, 1)
    eq('4. the sentence after </main> is left out', measure(after)['words'], found[page]['words'])
    eq('4. the body of an open details is read',
       change(page, '<details open><summary>More</summary><p>%s</p></details>' % jargon)[:2], (1 + 36, 2))
    eq('4. a guide body inside .legal is read',
       change(page, '<div class="legal"><h2>Moving it</h2><p>%s</p></div>' % jargon)[:2], (2 + 36, 2))
    eq('4. a card\'s title and description, side by side, are two lines',
       sentences(copy_of('<main><a href="x"><span>Track down old pensions</span><span>List your old jobs. '
                         'We find the pensions.</span></a></main>')),
       ['Track down old pensions', 'List your old jobs.', 'We find the pensions.'])
    eq('4. a bold phrase inside a sentence is not a line of its own',
       sentences(copy_of('<main><p><b>Move it to a QROPS in Ireland.</b> It usually <b>arrives</b> '
                         '<a href="x">whole</a>.</p></main>')),
       ['Move it to a QROPS in Ireland.', 'It usually arrives whole .'])
    eq('4. a slider\'s value is not a sentence',
       measure('<main><label>Year you were born</label><output>1962</output></main>')['sentences'], 1)

    # ------------------------------------------------------------------ 5
    # The ratchet's rules, on made-up figures.
    listed = {'a.html': 10.6}
    eq('5. (a) a page not listed, at 10.0, passes', verdict('b.html', 10.0, listed), 'ok')
    eq('5. (a) a page not listed, at 10.01, fails', verdict('b.html', 10.01, listed).startswith('reads at'), True)
    eq('5. (b) a listed page at its figure passes', verdict('a.html', 10.6, listed), 'ok')
    eq('5. (b) a listed page above its figure fails', verdict('a.html', 10.61, listed).startswith('reads at'),
       True)
    eq('5. (c) a listed page at 10 or under must come off the list',
       [verdict('a.html', x, listed).endswith('take it off ABOVE_TODAY') for x in (10.0, 9.2)], [True, True])
    eq('5. a listed page between 10 and its figure passes', verdict('a.html', 10.3, listed), 'ok')


if __name__ == '__main__':
    if '--table' in sys.argv:
        table(scores())
        sys.exit(0)
    run()
    report()
