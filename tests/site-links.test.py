#!/usr/bin/env python3
"""Every internal link on the site leads somewhere.

    python3 tests/site-links.test.py

Reads every page (and the games), every script under assets/js and
netlify/, the sitemap and robots.txt. For each internal href, src, srcset,
data-url, action and poster, and each page name a script or the search
index carries: the file exists, and a #fragment is an id or name on that
page. The site's own absolute links (https://pensionbuddy.ie/...) must be
files here too. Outside links are listed, not fetched: no network.
"""
import glob, html, os, re, sys
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
from harness import eq, report  # noqa: E402

pages=sorted(glob.glob(os.path.join(ROOT,'*.html'))+glob.glob(os.path.join(ROOT,'games','*.html')))
ids={}
def idset(path):
    if path not in ids:
        try: s=open(path,encoding='utf-8').read()
        except: ids[path]=None; return None
        ids[path]=set(re.findall(r'\bid="([^"]+)"',s))|set(re.findall(r'\bname="([^"]+)"',s))
    return ids[path]
internal=[];external={}
def check(src_file, url, ctx):
    url=html.unescape(url.strip())
    if not url or url.startswith(('mailto:','tel:','javascript:','data:','blob:')) or '{' in url or '+' in url[:1] or url.startswith('${'): return
    if re.match(r'https?://',url):
        external.setdefault(url,set()).add(os.path.relpath(src_file,ROOT)); return
    if url.startswith('//'): external.setdefault('https:'+url,set()).add(os.path.relpath(src_file,ROOT)); return
    base=os.path.dirname(src_file) if src_file.endswith('.html') else ROOT
    u=urlparse(url); path=unquote(u.path); frag=u.fragment
    if path=='' : target=src_file
    elif path.startswith('/'): target=os.path.join(ROOT,path.lstrip('/'))
    else: target=os.path.normpath(os.path.join(base,path))
    if os.path.isdir(target): target=os.path.join(target,'index.html')
    if not os.path.exists(target):
        internal.append((os.path.relpath(src_file,ROOT),url,'missing file',ctx)); return
    if frag and target.endswith('.html') and not re.match(r'^(from|persona|age|pot|[a-z]+=)',frag) and '=' not in frag and frag not in ('main','top'):
        s=idset(target)
        if s is not None and frag not in s:
            internal.append((os.path.relpath(src_file,ROOT),url,'missing anchor #'+frag,ctx))
for p in pages:
    s=open(p,encoding='utf-8').read()
    for m in re.finditer(r'\b(href|src|srcset|data-url|action|poster)="([^"]*)"',s):
        vals=[v.strip().split(' ')[0] for v in m.group(2).split(',')] if m.group(1)=='srcset' else [m.group(2)]
        for v in vals: check(p,v,m.group(1))
    # urls inside inline scripts and JSON
    for m in re.finditer(r"['\"](https?://[^'\"\s<>]+)['\"]",s): check(p,m.group(1),'script')
    for m in re.finditer(r"href=\\?['\"]([a-z0-9-]+\.html(?:#[^'\"\\]*)?)\\?['\"]",s): check(p,m.group(1),'script-href')
for j in sorted(glob.glob(os.path.join(ROOT,'assets','js','*.js'))+glob.glob(os.path.join(ROOT,'netlify','**','*.js'),recursive=True)+[os.path.join(ROOT,'sitemap.xml'),os.path.join(ROOT,'robots.txt')]):
    s=open(j,encoding='utf-8').read()
    for m in re.finditer(r"(https?://[^'\"\s<>\\)]+)",s): check(j,m.group(1).rstrip('.,;'),'js-url')
    for m in re.finditer(r"""["'(]((?:\.\./)?[a-z0-9-]+\.html(?:#[A-Za-z0-9_-]+)?)["')]""",s): check(j,m.group(1),'js-page')
    for m in re.finditer(r'"u":"([^"]+)"',s): check(j,m.group(1),'index')

own = []
for u, where in external.items():
    if u.startswith('https://pensionbuddy.ie/') and len(u) > len('https://pensionbuddy.ie/'):
        p = u[len('https://pensionbuddy.ie/'):].split('#')[0].split('?')[0]
        if not os.path.exists(os.path.join(ROOT, p)):
            own.append((u, sorted(where)))
eq('1. pages read', len(pages) >= 25, True)
eq('2. every internal link and #anchor resolves', internal, [])
eq('3. every https://pensionbuddy.ie/ link is a file on this site', own, [])
report()
