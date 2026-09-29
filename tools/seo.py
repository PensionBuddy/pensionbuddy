#!/usr/bin/env python3
"""Every page's search and sharing tags, written from one table.

    python3 tools/seo.py            # write them into every page
    python3 tools/seo.py --check    # exit 1, naming the pages, if any is not as written here

Run 34, item 3. Between <!-- SEO:BEGIN --> and <!-- SEO:END --> in each
page's <head>: the canonical address, the Open Graph and Twitter card tags,
and the page's structured data (JSON-LD): the business, as a
FinancialService, on the home page; a BreadcrumbList, Home and the page, on
every other page in the sitemap. Nothing in the block is written by hand.
Its words come from the page itself: og:title and twitter:title are its
<title>, the descriptions its meta description, and the crumb's name the
page's own label in the nav or the footer.

A page the sitemap leaves out (not indexed: 404, the held pages, the thank
you page) gets the sharing tags only: no canonical, no og:url, no JSON-LD.

The home page's business data is the footer's own sentence and address,
held by tests/build.test.py check 30 against the footer. The site shows no
phone number, so there is none here; FAQPage data stays where it is, in the
four pages that carry a visible FAQ, and check 30 holds every question and
answer to the words on the page.

pagebuild.py calls apply() on every page it builds, so a rebuild keeps the
block; run this after editing a hand-written page's title or description.
"""
import html
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://pensionbuddy.ie/'

# The crumb's name: the page's label in the nav (or, for the pages the nav
# does not list, the footer, or the page's own heading).
CRUMB = {
    'starter.html': 'Start a pension',
    'tracker.html': 'Find a pension',
    'director.html': 'Pensions for company directors',
    'booking.html': 'Book a call',
    'pension-calculator.html': 'Pension calculator',
    'director-calculator.html': 'Director calculator',
    'broker-vs-autoenrolment.html': 'Auto-enrolment comparison',
    'state-pension-reality-check.html': 'State Pension reality check',
    'state-pension-entitlement.html': 'State Pension entitlement check',
    'glossary.html': 'Pension jargon buster',
    'games/buddys-run.html': "Buddy's Run",
    'games/jargon-battle.html': 'Jargon Battle Quiz',
    'complaints.html': 'Complaints',
    'privacy.html': 'Privacy Notice',
    'terms.html': 'Terms of Business',
    'pensions-over-50.html': 'Pensions after 50',
    'self-employed-pensions.html': 'Pensions when you are self-employed',
    'uk-pensions-in-ireland.html': 'A UK pension, and living in Ireland',
    'old-pension-checklist.html': 'The old pension hunt: a checklist',
    'director-year-end-checklist.html': 'Year-end pension checklist',
    'director-pension-rules.html': 'What changed for directors in 2026',
    'standard-fund-threshold.html': 'The Standard Fund Threshold',
    'pension-fees-calculator.html': 'Pension charges calculator',
    'my-pensions.html': 'All your pensions in one view',
    'pia.html': 'Personal Investment Account (PIA)',
}

# The share picture: a 1200x630 card for the home page and each audience
# (tools/og-images.py), the square paw mark for every other page.
CARD = {
    'index.html': 'home', 'starter.html': 'starter', 'tracker.html': 'tracker', 'director.html': 'director',
    'pensions-over-50.html': 'over-50', 'self-employed-pensions.html': 'self-employed', 'uk-pensions-in-ireland.html': 'uk',
}
MARK = ('assets/brand/og-mark-512.png', 512, 512, 'The Pensionbuddy paw mark')

# The business, as the footer states it (check 30 holds these to the footer).
BUSINESS = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    'name': 'Pensionbuddy',
    'legalName': 'Damian Condon T/A Gresham Wealth Management',
    'description': ('Pensionbuddy is a trading name of Damian Condon T/A Gresham Wealth Management, '
                    'which is regulated by the Central Bank of Ireland.'),
    'url': SITE,
    'logo': SITE + 'assets/brand/og-mark-512.png',
    'image': SITE + 'assets/brand/og/og-home.png',
    'email': 'hello@pensionbuddy.ie',
    'address': {'@type': 'PostalAddress', 'streetAddress': 'Bushfield House, Philipsburgh Avenue',
                'addressLocality': 'Fairview', 'addressRegion': 'Dublin 3', 'addressCountry': 'IE'},
    'areaServed': 'IE',
    'founder': {'@type': 'Person', 'name': 'Damian Condon', 'honorificSuffix': 'QFA'},
}

BEGIN = '<!-- SEO:BEGIN (tools/seo.py writes this block; edit the table there, not here) -->'
END = '<!-- SEO:END -->'


def indexable():
    """The pages the sitemap lists, as repository paths."""
    sm = open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
    return [u[len(SITE):] or 'index.html' for u in re.findall(r'<loc>([^<]+)</loc>', sm)]


def url_of(page):
    return SITE if page == 'index.html' else SITE + page


def _og_images():
    spec = importlib.util.spec_from_file_location('og_images', os.path.join(ROOT, 'tools', 'og-images.py'))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def card_alt(page):
    og = _og_images()
    name = CARD[page]
    p, eb = og.CARDS[name]
    eyebrow, _, plain = og.words(p, eb)
    return 'Pensionbuddy. %s: %s' % (eyebrow, plain)


def attr(v):
    return html.escape(v, quote=False).replace('"', '&quot;')


def head_text(src, pat):
    m = re.search(pat, src[:src.find('</head>')], re.S)
    return html.unescape(m.group(1)).strip() if m else None


def block(page, src, alt=None):
    title = re.sub(r'\s+', ' ', head_text(src, r'<title>(.*?)</title>'))
    desc = head_text(src, r'<meta name="description" content="([^"]*)"')
    assert title and desc, '%s: no title or meta description' % page
    if page in CARD:
        img, w, h = 'assets/brand/og/og-%s.png' % CARD[page], 1200, 630
        alt = alt if alt is not None else card_alt(page)
        card = 'summary_large_image'
    else:
        img, w, h, alt = MARK
        card = 'summary'
    lines = []
    idx = page in indexable()
    if idx:
        lines.append('<link rel="canonical" href="%s">' % url_of(page))
    lines += ['<meta property="og:type" content="website">',
              '<meta property="og:site_name" content="Pensionbuddy">',
              '<meta property="og:locale" content="en_IE">']
    if idx:
        lines.append('<meta property="og:url" content="%s">' % url_of(page))
    lines += ['<meta property="og:title" content="%s">' % attr(title),
              '<meta property="og:description" content="%s">' % attr(desc),
              '<meta property="og:image" content="%s">' % (SITE + img),
              '<meta property="og:image:width" content="%d">' % w,
              '<meta property="og:image:height" content="%d">' % h,
              '<meta property="og:image:alt" content="%s">' % attr(alt),
              '<meta name="twitter:card" content="%s">' % card,
              '<meta name="twitter:title" content="%s">' % attr(title),
              '<meta name="twitter:description" content="%s">' % attr(desc),
              '<meta name="twitter:image" content="%s">' % (SITE + img),
              '<meta name="twitter:image:alt" content="%s">' % attr(alt)]
    if idx:
        if page == 'index.html':
            data = BUSINESS
        else:
            data = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE},
                {'@type': 'ListItem', 'position': 2, 'name': CRUMB[page], 'item': url_of(page)}]}
        lines.append('<script type="application/ld+json">%s</script>'
                     % json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
    return BEGIN + '\n' + '\n'.join(lines) + '\n' + END + '\n'


OLD = [r'<meta property="og:[a-z:_]+" content="[^"]*">\n', r'<meta name="twitter:[a-z:_]+" content="[^"]*">\n',
       r'<link rel="canonical" href="[^"]*">\n',
       r'<script type="application/ld\+json">\{"@context": "https://schema.org", "@type": "FinancialService".*?</script>\n']


def apply(page, src, alt=None):
    """The page with its block written: the old tags taken out, the block
    put where the first of them was (or after the meta description)."""
    head_end = src.index('</head>')
    head, rest = src[:head_end], src[head_end:]
    if BEGIN in head:
        i = head.index(BEGIN)
        j = head.index(END, i) + len(END) + 1
        head, at = head[:i] + head[j:], i
    else:
        at = None
    for pat in OLD:
        m = re.search(pat, head, re.S)
        while m:
            at = m.start() if at is None else min(at, m.start())
            head = head[:m.start()] + head[m.end():]
            m = re.search(pat, head, re.S)
    if at is None:
        m = re.search(r'<meta name="description" content="[^"]*">\n', head)
        at = m.end()
    return head[:at] + block(page, head + rest, alt) + head[at:] + rest


def pages():
    return sorted(f for f in os.listdir(ROOT) if f.endswith('.html')) + ['games/buddys-run.html', 'games/jargon-battle.html']


def main():
    check = '--check' in sys.argv
    bad = []
    for page in pages():
        path = os.path.join(ROOT, page)
        src = open(path, encoding='utf-8').read()
        out = apply(page, src)
        if out != src:
            if check:
                bad.append(page)
            else:
                open(path, 'w', encoding='utf-8').write(out)
                print('  %-34s written' % page)
    if check:
        print('search and sharing tags: %s' % ('%d pages as tools/seo.py writes them' % len(pages()) if not bad
                                                else 'NOT as written on ' + ', '.join(bad)))
        sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
