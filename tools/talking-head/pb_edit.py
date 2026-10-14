#!/usr/bin/env python3
"""
Pensionbuddy talking-head editor: from a folder of camera takes to captioned
9:16 and 4:5 finals, with .srt files, a take log and a flag list.

  pb_edit.py check        tools, whisper model, font and face model in place
  pb_edit.py inventory    video files in the source folder, newest first; picks the latest shoot
  pb_edit.py transcribe   audio out of each clip, light noise reduction, whisper.cpp word times
  pb_edit.py match        every take of every script line, found by its transcript
  pb_edit.py rank         best and second-best take per line, review sheets to look at
  pb_edit.py pick         override a pick after looking at the review sheets
  pb_edit.py render       cut, mix to -14 LUFS, caption, export both ratios and the .srt
  pb_edit.py qc           check the finals; contact sheets to look at
  pb_edit.py report       take log per video and the flag list, into the finals folder
  pb_edit.py run          all of it; --until rank stops for review, --from render resumes

Originals in the source folder are only ever read. brief.toml holds the
scripts, the on-screen text, the regulator line, the style and the safe
zones. RUNBOOK.md is the order of work. Python 3.9+, numpy, Pillow,
opencv-python-headless (face and eye-line check; optional), tomli on
Python < 3.11, ffmpeg and whisper.cpp (whisper-cli) on PATH.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import io
import json
import math
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

try:
    import numpy as np
except ImportError:  # pragma: no cover
    sys.exit('numpy is missing: run setup_mac.sh, or python3 -m pip install numpy pillow opencv-python-headless tomli')
try:
    import tomllib
except ImportError:  # Python < 3.11
    try:
        import tomli as tomllib
    except ImportError:  # pragma: no cover
        sys.exit('tomli is missing (Python < 3.11): python3 -m pip install tomli')

HERE = Path(__file__).resolve().parent
SR = 48000          # mix and analysis rate
SR16 = 16000        # whisper's input rate
HOP = 0.01          # analysis hop, seconds; frame i is centred on i * HOP + HALF
HALF = 0.0125
RATIOS = {'9x16': (1080, 1920), '4x5': (1080, 1350)}


class Fail(Exception):
    pass


def say(msg=''):
    print(msg, flush=True)


def warn(msg):
    print('warning: ' + msg, file=sys.stderr, flush=True)


def run(cmd, check=True, binary=False):
    cmd = [str(c) for c in cmd]
    p = subprocess.run(cmd, capture_output=True, text=not binary)
    if check and p.returncode != 0:
        err = p.stderr.decode('utf-8', 'replace') if binary else p.stderr
        raise Fail('command failed (%d): %s\n%s' % (p.returncode, ' '.join(cmd[:10]), (err or '')[-3000:]))
    return p


def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-print_format', 'json',
                           '-show_format', '-show_streams', path]).stdout)


def jload(path, default=None):
    path = Path(path)
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


def jsave(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    tmp.write_text(json.dumps(obj, indent=1, ensure_ascii=False, default=float), encoding='utf-8')
    tmp.replace(path)


def expand(p, work=None):
    s = str(p)
    if work is not None:
        s = s.replace('{work}', str(work))
    return Path(os.path.expanduser(s)).absolute()


def mmss(t):
    t = max(0.0, float(t))
    m = int(t // 60)
    return '%d:%05.2f' % (m, t - 60 * m)


def ffesc(path):
    """A path inside an ffmpeg filter argument."""
    return str(path).replace('\\', '/').replace(':', r'\:').replace("'", r"\'")


# ------------------------------------------------------------------ config

class Cfg:
    def __init__(self, args):
        brief = Path(getattr(args, 'brief', None) or HERE / 'brief.toml')
        with open(brief, 'rb') as f:
            d = tomllib.load(f)
        self.d = d
        self.brief_path = brief
        paths = d.get('paths', {})
        self.work = expand(getattr(args, 'work', None) or paths.get('work', '~/Downloads/pensionbuddy-edit'))
        self.source = expand(getattr(args, 'source', None) or paths.get('source', '~/Downloads'))
        self.finals = expand(getattr(args, 'finals', None) or paths.get('finals', '~/Downloads/pensionbuddy-finals'))
        sh = d.get('shoot', {})
        self.exts = tuple(e.lower() for e in sh.get('extensions', ['.mp4', '.mov', '.mts', '.m2ts', '.mxf']))
        self.gap_hours = float(sh.get('gap_hours', 3))
        self.max_depth = int(sh.get('max_depth', 6))
        w = d.get('whisper', {})
        self.whisper_bin = getattr(args, 'whisper_bin', None) or w.get('bin') or ''
        self.model = expand(getattr(args, 'model', None) or w.get('model', '{work}/models/ggml-large-v3-turbo.bin'), self.work)
        sm = w.get('second_model') or ''
        self.second_model = expand(sm, self.work) if sm else None
        self.language = w.get('language', 'en')
        self.threads = int(w.get('threads', 0)) or min(8, os.cpu_count() or 4)
        self.prompt = w.get('prompt', '')
        self.face_model = expand(d.get('face', {}).get('model', '{work}/models/face_detection_yunet_2023mar.onnx'), self.work)
        self.style = d.get('style', {})
        self.font = expand(self.style.get('font', '{work}/fonts/Geist-Bold.ttf'), self.work)
        self.caps = d.get('captions', {})
        self.safe = d.get('safe', {})
        self.edit = d.get('edit', {})
        self.audio = d.get('audio', {})
        self.reg = d.get('regulator', {})
        self.display = {k.lower(): v for k, v in d.get('display', {}).items()}
        self.fps = int(self.edit.get('fps', 30))
        self.videos = []
        for v in d.get('video', []):
            lines = [str(x).strip() for x in v.get('lines', []) if str(x).strip()]
            ov = [{'line': int(o['line']), 'text': str(o['text'])} for o in v.get('overlay', [])]
            for o in ov:
                if not 1 <= o['line'] <= max(1, len(lines)):
                    raise Fail('video %s: overlay on line %d, but the script has %d lines' % (v['n'], o['line'], len(lines)))
            self.videos.append({'n': int(v['n']), 'title': v.get('title', 'Video %s' % v['n']),
                                'enabled': bool(v.get('enabled', True)) and bool(lines),
                                'frame1_text': v.get('frame1_text', ''), 'lines': lines, 'overlays': ov})

    def p(self, *parts):
        return self.work.joinpath(*[str(x) for x in parts])

    def e(self, key, default):
        return float(self.edit.get(key, default))

    def video(self, n):
        for v in self.videos:
            if v['n'] == int(n):
                return v
        raise Fail('no video %s in the brief' % n)

    def reading_time(self, text):
        words = len(text.split())
        s = self.style
        return max(float(s.get('read_min', 2.0)), float(s.get('read_base', 1.0)) + float(s.get('read_per_word', 0.3)) * words)


# ------------------------------------------------------------------ text

FILLERS = {'um', 'umm', 'uh', 'uhh', 'uhm', 'er', 'erm', 'ah', 'eh', 'hmm', 'hm', 'mm', 'mmm', 'mhm'}
CONTRACTIONS = {
    "there's": 'there is', "it's": 'it is', "that's": 'that is', "what's": 'what is', "here's": 'here is',
    "he's": 'he is', "she's": 'she is', "who's": 'who is', "let's": 'let us', "can't": 'can not',
    'cannot': 'can not', "won't": 'will not', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
    "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "haven't": 'have not',
    "hasn't": 'has not', "hadn't": 'had not', "shouldn't": 'should not', "couldn't": 'could not',
    "wouldn't": 'would not', "you're": 'you are', "we're": 'we are', "they're": 'they are', "i'm": 'i am',
    "you've": 'you have', "we've": 'we have', "they've": 'they have', "i've": 'i have', "you'll": 'you will',
    "we'll": 'we will', "they'll": 'they will', "i'll": 'i will', "it'll": 'it will', "you'd": 'you would',
    "we'd": 'we would', "they'd": 'they would', "i'd": 'i would',
}
SPLITS = {'myfuturefund': 'my future fund'}
PAIRS = {('per', 'cent'): 'percent', ('pension', 'buddy'): 'pensionbuddy'}
UNITS = {w: i for i, w in enumerate('zero one two three four five six seven eight nine'.split())}
TEENS = {w: i + 10 for i, w in enumerate(
    'ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split())}
TENS = {w: 20 + 10 * i for i, w in enumerate('twenty thirty forty fifty sixty seventy eighty ninety'.split())}
SCALES = {'hundred': 100, 'thousand': 1000, 'million': 1000000}
ORDINALS = {'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5, 'sixth': 6, 'seventh': 7, 'eighth': 8,
            'ninth': 9, 'tenth': 10, 'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
            'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18, 'nineteenth': 19,
            'twentieth': 20, 'thirtieth': 30}
MONTHS = set('january february march april may june july august september october november december'.split())
NUMWORDS = set(UNITS) | set(TEENS) | set(TENS) | set(SCALES)
NUM_RE = re.compile(r'\d+(?:\.\d+)?$')
END_PUNCT = re.compile(r'[.?!]["\')\]]*$')


def word_pieces(w):
    """Lower-case pieces of one word, so that '€1,000' and 'a thousand euro' can meet."""
    w = unicodedata.normalize('NFKC', w)
    w = w.replace('\u2019', "'").replace('\u2018', "'").replace('\u2013', '-').replace('\u2014', '-')
    w = w.strip().lower()
    if re.fullmatch(r'(?:[a-z]\.){2,}[a-z]?\.?', w):          # p.r.s.a.
        w = w.replace('.', '')
    w = re.sub(r'(?<=\d),(?=\d{3}(?!\d))', '', w)              # 1,000
    w = re.sub(r'(?<=[a-z0-9])\.(?=[a-z])', ' dot ', w)        # pensionbuddy.ie
    w = re.sub(r'€\s*(\d+(?:\.\d+)?)', r' \1 euro ', w)
    w = re.sub(r'(\d+(?:\.\d+)?)\s*%', r' \1 percent ', w)
    w = re.sub(r'(?<=\d)(?:st|nd|rd|th)\b', '', w)             # 18th
    w = w.replace('%', ' percent ').replace('€', ' euro ')
    w = re.sub(r'[-/]', ' ', w)
    w = re.sub(r"[^\w'.\s]", ' ', w)
    w = re.sub(r'(?<!\d)\.|\.(?!\d)', ' ', w)
    w = re.sub(r"(?:(?<=\s)|^)'+|'+(?=\s|$)", ' ', w)
    return [x for x in w.split() if x and x != '_']


def parse_number_words(ws):
    """[(value, first, last)] for a run of number words. 'twenty twenty five' is 2025."""
    nums, cur = [], None
    for i, w in enumerate(ws):
        if w == 'and':
            continue
        if w == 'a':
            if cur:
                nums.append(cur)
            cur = {'total': 0, 'group': 1, 'start': i, 'end': i, 'last': 'a', 'n': 0, 'kinds': ''}
            continue
        if w in SCALES:
            if cur is None:
                cur = {'total': 0, 'group': 1, 'start': i, 'end': i, 'last': None, 'n': 0, 'kinds': ''}
            if SCALES[w] == 100:
                cur['group'] = (cur['group'] or 1) * 100
            else:
                cur['total'] += (cur['group'] or 1) * SCALES[w]
                cur['group'] = 0
            cur.update(last='s', end=i)
            cur['n'] += 1
            cur['kinds'] += 's'
            continue
        if w in UNITS:
            v, k = UNITS[w], 'u'
        elif w in TEENS:
            v, k = TEENS[w], 't'
        else:
            v, k = TENS[w], 'x'
        new = (cur is None or cur['last'] in ('u', 't', 'a') or (cur['last'] == 'x' and k != 'u'))
        if new:
            if cur:
                nums.append(cur)
            cur = {'total': 0, 'group': 0, 'start': i, 'end': i, 'last': None, 'n': 0, 'kinds': ''}
        cur['group'] += v
        cur.update(last=k, end=i)
        cur['n'] += 1
        cur['kinds'] += k
    if cur:
        nums.append(cur)
    out = []
    for c in nums:
        val = c['total'] + c['group']
        if (out and out[-1][3] in ('t', 'x') and out[-1][0] in (19, 20) and 's' not in c['kinds']
                and 0 <= val <= 99 and c['start'] == out[-1][2] + 1):
            prev = out.pop()
            out.append([prev[0] * 100 + val, prev[1], c['end'], 'year'])
            continue
        out.append([val, c['start'], c['end'], c['kinds']])
    return [(v, s, e) for v, s, e, _ in out]


def merge_numbers(toks):
    out, i, n = [], 0, len(toks)
    while i < n:
        t = toks[i]['t']
        if t in NUMWORDS or (t == 'a' and i + 1 < n and toks[i + 1]['t'] in SCALES):
            run_, j = [], i
            while j < n:
                tj = toks[j]['t']
                if tj in NUMWORDS:
                    run_.append(j)
                elif tj == 'a' and not run_ and j + 1 < n and toks[j + 1]['t'] in SCALES:
                    run_.append(j)
                elif (tj == 'and' and run_ and toks[run_[-1]]['t'] in SCALES and j + 1 < n
                      and toks[j + 1]['t'] in NUMWORDS):
                    run_.append(j)
                else:
                    break
                j += 1
            for v, s, e in parse_number_words([toks[k]['t'] for k in run_]):
                out.append({'t': str(v), 'a': toks[run_[s]]['a'], 'b': toks[run_[e]]['b']})
            i = j
        else:
            out.append(toks[i])
            i += 1
    return out


def merge_dates(toks):
    """'the 18th of November', 'November 18' and '18 November' all become '18 november'."""
    out, i, n = [], 0, len(toks)

    def day_at(k):
        if k >= n:
            return None
        t = toks[k]['t']
        if t in ORDINALS:
            return ORDINALS[t], k + 1
        if NUM_RE.match(t) and '.' not in t:
            v = int(t)
            if v in (20, 30) and k + 1 < n and ORDINALS.get(toks[k + 1]['t'], 99) < 10:
                return v + ORDINALS[toks[k + 1]['t']], k + 2
            if 1 <= v <= 31:
                return v, k + 1
        return None

    while i < n:
        t = toks[i]['t']
        d = day_at(i + 1 if t == 'the' else i)
        if d:
            m = d[1]
            if m < n and toks[m]['t'] == 'of':
                m += 1
            if m < n and toks[m]['t'] in MONTHS:
                out.append({'t': str(d[0]), 'a': toks[i]['a'], 'b': toks[d[1] - 1]['b']})
                out.append(dict(toks[m]))
                i = m + 1
                continue
        if t in MONTHS:
            k = i + 1
            if k < n and toks[k]['t'] == 'the':
                k += 1
            d = day_at(k)
            if d:
                out.append({'t': str(d[0]), 'a': toks[k]['a'], 'b': toks[d[1] - 1]['b']})
                out.append(dict(toks[i]))
                i = d[1]
                continue
        out.append(toks[i])
        i += 1
    return out


def normalize(words, loose=True):
    """Tokens for comparison: {'t', 'a', 'b', 'filler', 'num'}; a..b are the source word indices.
    loose=True also expands contractions, so "there's" and "there is" compare equal."""
    toks = []
    for i, w in enumerate(words):
        for piece in word_pieces(w):
            for x in SPLITS.get(piece, piece).split():
                toks.append({'t': x, 'a': i, 'b': i})
    if loose:
        toks = [{'t': x, 'a': tk['a'], 'b': tk['b']}
                for tk in toks for x in CONTRACTIONS.get(tk['t'], tk['t']).split()]
    merged, i = [], 0
    while i < len(toks):
        pair = (toks[i]['t'], toks[i + 1]['t']) if i + 1 < len(toks) else None
        if pair in PAIRS:
            merged.append({'t': PAIRS[pair], 'a': toks[i]['a'], 'b': toks[i + 1]['b']})
            i += 2
        else:
            merged.append(toks[i])
            i += 1
    toks = merged
    for tk in toks:
        tk['t'] = {'euros': 'euro', 'ok': 'okay'}.get(tk['t'], tk['t'])
    toks = merge_dates(merge_numbers(toks))
    for k in range(len(toks) - 1):
        if toks[k]['t'] in ('a', 'an') and toks[k + 1]['t'] == 'euro':
            toks[k]['t'] = '1'
    for tk in toks:
        tk['filler'] = tk['t'] in FILLERS
        tk['num'] = bool(NUM_RE.match(tk['t']))
    return toks


def bare(w):
    return re.sub(r"[^\w'.€%]", '', w.lower()).strip('.')


def money(num):
    """'1000' -> '1,000'; '60' stays '60'."""
    whole, _, frac = num.replace(',', '').partition('.')
    return '{:,}'.format(int(whole)) + ('.' + frac if frac else '') if whole.isdigit() else num


def display_words(words, dmap):
    """Transcript words spelled for captions: names from [display], '60 euro' as '€60', '40 per cent' as '40%'.
    The words stay what was said; only the spelling changes."""
    out, i, n = [], 0, len(words)
    maxk = max((len(k.split()) for k in dmap), default=1)

    def tail(w):
        m = re.search(r'[.,?!:;]+$', w)
        return m.group(0) if m else ''

    while i < n:
        hit = None
        for L in range(min(maxk, n - i), 0, -1):
            phrase = ' '.join(bare(words[i + k]['text']) for k in range(L))
            if phrase in dmap:
                hit = (L, dmap[phrase])
                break
        if hit:
            L, text = hit
            out.append({'text': text + tail(words[i + L - 1]['text']), 't0': words[i]['t0'],
                        't1': words[i + L - 1]['t1'], 'src': [i, i + L - 1]})
            i += L
            continue
        w = words[i]['text']
        m = re.fullmatch(r'(\d[\d,]*(?:\.\d+)?)', w)
        if m and i + 1 < n:
            nxt = words[i + 1]['text']
            if re.fullmatch(r'euros?[.,?!:;]*', nxt.lower()):
                out.append({'text': '€' + money(m.group(1)) + tail(nxt), 't0': words[i]['t0'],
                            't1': words[i + 1]['t1'], 'src': [i, i + 1]})
                i += 2
                continue
            if re.fullmatch(r'percent[.,?!:;]*', nxt.lower()):
                out.append({'text': m.group(1) + '%' + tail(nxt), 't0': words[i]['t0'],
                            't1': words[i + 1]['t1'], 'src': [i, i + 1]})
                i += 2
                continue
            if nxt.lower() == 'per' and i + 2 < n and re.fullmatch(r'cent[.,?!:;]*', words[i + 2]['text'].lower()):
                out.append({'text': m.group(1) + '%' + tail(words[i + 2]['text']), 't0': words[i]['t0'],
                            't1': words[i + 2]['t1'], 'src': [i, i + 2]})
                i += 3
                continue
        m = re.fullmatch(r'€(\d{4,}(?:\.\d+)?)([.,?!:;]*)', w)
        if m:
            w = '€' + money(m.group(1)) + m.group(2)
        out.append({'text': w, 't0': words[i]['t0'], 't1': words[i]['t1'], 'src': [i, i]})
        i += 1
    return out


# ------------------------------------------------------------------ inventory

def sony_xml_time(path):
    """Sony writes C0001M01.XML beside C0001.MP4 with the local time and its offset."""
    for cand in (path.with_name(path.stem + 'M01.XML'), path.with_name(path.stem + 'M01.xml')):
        if cand.exists():
            m = re.search(r'CreationDate value="([^"]+)"', cand.read_text(errors='replace'))
            if m:
                t = parse_iso(m.group(1))
                if t:
                    return t
    return None


def parse_iso(s):
    if not s:
        return None
    try:
        t = datetime.fromisoformat(s.replace('Z', '+00:00'))
    except ValueError:
        return None
    if t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    if t.year < 2000:
        return None
    return t


def rate(s):
    try:
        a, b = s.split('/')
        return float(a) / float(b) if float(b) else 0.0
    except (ValueError, AttributeError):
        return 0.0


def clip_info(path):
    st = path.stat()
    row = {'path': str(path), 'name': path.name, 'size': st.st_size,
           'id': '%s-%s' % (re.sub(r'[^A-Za-z0-9_]+', '_', path.stem)[:40],
                            hashlib.sha1(str(path).encode()).hexdigest()[:6])}
    try:
        pr = probe(path)
    except Fail as e:
        row['error'] = str(e).splitlines()[0]
        row['when'] = datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat()
        return row
    fmt = pr.get('format', {})
    streams = pr.get('streams', [])
    v = next((s for s in streams if s.get('codec_type') == 'video'
              and not s.get('disposition', {}).get('attached_pic')), None)
    auds = [s for s in streams if s.get('codec_type') == 'audio']
    tags = fmt.get('tags', {}) or {}
    created = tags.get('creation_time') or ((v or {}).get('tags') or {}).get('creation_time')
    when = sony_xml_time(path) or parse_iso(created) or datetime.fromtimestamp(st.st_mtime, timezone.utc)
    row['when'] = when.isoformat()
    row['when_source'] = 'sony-xml' if sony_xml_time(path) else ('metadata' if parse_iso(created) else 'file date')
    row['duration'] = float(fmt.get('duration') or (v or {}).get('duration') or 0)
    if v is None:
        row['error'] = 'no video stream'
        return row
    rot = 0
    for sd in v.get('side_data_list', []) or []:
        if 'rotation' in sd:
            rot = int(round(float(sd['rotation'])))
    rot = int((v.get('tags') or {}).get('rotate', rot)) % 360
    w, h = int(v.get('width', 0)), int(v.get('height', 0))
    if rot in (90, 270):
        w, h = h, w
    tc = tags.get('timecode') or next(((s.get('tags') or {}).get('timecode') for s in streams
                                       if (s.get('tags') or {}).get('timecode')), None)
    fst = float(fmt.get('start_time') or 0)
    ast = float(auds[0].get('start_time') or fst) if auds else fst
    # camera files, as against screen recordings or downloads that share the folder
    row['camera'] = bool(re.fullmatch(r'(C\d{4}|\d{5}|MVI_\d{4}|DSC_?\d{4})', path.stem, re.I) or tc
                         or str(tags.get('major_brand', '')).upper().startswith('XAVC') or sony_xml_time(path))
    row.update({
        'a_start': round(max(0.0, ast - fst), 4),   # audio that starts after the video: padded on extraction
        'w': w, 'h': h, 'rotation': rot, 'fps': round(rate(v.get('avg_frame_rate') or v.get('r_frame_rate')), 3),
        'codec': v.get('codec_name'), 'pix_fmt': v.get('pix_fmt'), 'transfer': v.get('color_transfer', ''),
        'interlaced': v.get('field_order', 'progressive') not in ('progressive', 'unknown', None, ''),
        'channels': int(auds[0].get('channels', 0)) if auds else 0,
        'audio_rate': int(auds[0].get('sample_rate', 0)) if auds else 0, 'timecode': tc,
    })
    if not auds:
        row['error'] = 'no audio stream'
    return row


def scan(cfg):
    skip = {cfg.work, cfg.finals}
    found = []
    base_depth = len(cfg.source.parts)
    for root, dirs, files in os.walk(cfg.source):
        rp = Path(root)
        if len(rp.parts) - base_depth >= cfg.max_depth:
            dirs[:] = []
        dirs[:] = sorted(d for d in dirs if not d.startswith('.') and (rp / d) not in skip
                         and not d.endswith(('.app', '.photoslibrary', '.fcpbundle', '.lrdata')))
        for f in files:
            if f.startswith('.'):
                continue
            if os.path.splitext(f)[1].lower() in cfg.exts:
                found.append(rp / f)
    return found


def is_proxy(row, rows):
    """Sony proxies (M4ROOT/SUB/C0001S03.MP4) and other low-res twins of a main clip."""
    p = Path(row['path'])
    if re.fullmatch(r'C\d{4}S\d{2}', p.stem) or 'SUB' in p.parts[-3:-1]:
        return True
    for o in rows:
        if o is row or o.get('error') or row.get('error'):
            continue
        if (abs(o.get('duration', 0) - row.get('duration', 0)) < 0.05 and o.get('when') == row.get('when')
                and o.get('h', 0) * o.get('w', 0) > row.get('h', 0) * row.get('w', 0)):
            return True
    return False


def cmd_inventory(cfg, args):
    if not cfg.source.is_dir():
        raise Fail('source folder not found: %s' % cfg.source)
    rows = [clip_info(p) for p in scan(cfg)]
    for r in rows:
        r['proxy'] = is_proxy(r, rows)
    usable = sorted([r for r in rows if not r.get('error') and not r['proxy']], key=lambda r: r['when'])
    shoots, last_end = [], None
    for r in usable:
        t = datetime.fromisoformat(r['when'])
        if last_end is None or (t - last_end).total_seconds() > cfg.gap_hours * 3600:
            shoots.append([])
        shoots[-1].append(r['id'])
        end = t.timestamp() + r.get('duration', 0)
        last_end = datetime.fromtimestamp(max(end, last_end.timestamp() if last_end else end), timezone.utc)
    for k, ids in enumerate(shoots, 1):
        for r in rows:
            if r['id'] in ids:
                r['shoot'] = k
    chosen = getattr(args, 'shoot', None)
    if chosen:
        pick_n = int(chosen)
    else:
        # the latest group that looks like a shoot: two or more camera files, or three files;
        # a lone screen recording downloaded after the shoot is not the shoot
        cam = {r['id'] for r in rows if r.get('camera')}
        pick_n = len(shoots)
        for k in range(len(shoots), 0, -1):
            ids = shoots[k - 1]
            if len(set(ids) & cam) >= 2 or len(ids) >= 3:
                pick_n = k
                break
    if shoots and not 1 <= pick_n <= len(shoots):
        raise Fail('there is no shoot %d (there are %d)' % (pick_n, len(shoots)))
    sel = shoots[pick_n - 1] if shoots else []
    inv = {'source': str(cfg.source), 'made': datetime.now(timezone.utc).isoformat(), 'clips': rows,
           'shoots': shoots, 'selected': sel, 'selected_shoot': pick_n if shoots else 0}
    jsave(cfg.p('inventory.json'), inv)
    lines = ['| # | File | Shot (local time) | Length | Size | fps | Shoot | Use |', '|---|---|---|---|---|---|---|---|']
    for k, r in enumerate(sorted(rows, key=lambda r: r['when'], reverse=True), 1):
        local = datetime.fromisoformat(r['when']).astimezone().strftime('%Y-%m-%d %H:%M')
        use = 'yes' if r['id'] in sel else ('proxy' if r.get('proxy') else (r.get('error') or ''))
        rel = os.path.relpath(r['path'], cfg.source)
        lines.append('| %d | %s | %s%s | %s | %s | %s | %s | %s |' % (
            k, rel, local, '' if r.get('when_source') != 'file date' else ' (file date)', mmss(r.get('duration', 0)),
            '%sx%s' % (r.get('w', '?'), r.get('h', '?')), r.get('fps', '?'), r.get('shoot', '-'), use))
    table = '\n'.join(lines)
    (cfg.p('inventory.md')).write_text(table + '\n', encoding='utf-8')
    say(table)
    say('')
    say('%d video files, %d shoots. Using shoot %s: %d clips, %s of footage.' % (
        len(rows), len(shoots), inv['selected_shoot'], len(sel),
        mmss(sum(r.get('duration', 0) for r in rows if r['id'] in sel))))
    for r in rows:
        if r['id'] in sel and r.get('transfer') in ('arib-std-b67', 'smpte2084'):
            warn('%s is HDR (%s): set [edit] lut in brief.toml or the colours will be wrong' % (r['name'], r['transfer']))
    return inv


def selected_clips(cfg):
    inv = jload(cfg.p('inventory.json'))
    if not inv:
        raise Fail('no inventory yet: run "inventory" first')
    return [r for r in inv['clips'] if r['id'] in inv['selected']]


# ------------------------------------------------------------------ audio

def frame_rms_db(x, sr, win=0.025):
    h, w = int(sr * HOP), int(sr * win)
    n = max(1, (len(x) - w) // h + 1)
    c = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
    idx = np.arange(n) * h
    hi = np.minimum(idx + w, len(x))
    e = (c[hi] - c[idx]) / np.maximum(1, hi - idx)
    return (10 * np.log10(e + 1e-12)).astype(np.float32)


def periodicity(x16):
    """Per 10 ms frame: how periodic the signal is (voiced speech near 1, breath and hiss low) and the pitch."""
    h, w, nfft = 160, 512, 1024
    n = max(0, (len(x16) - w) // h + 1)
    per = np.zeros(n, np.float32)
    f0 = np.zeros(n, np.float32)
    lo, hi = SR16 // 400, SR16 // 70
    win = np.hanning(w).astype(np.float32)
    for s in range(0, n, 4000):
        e = min(n, s + 4000)
        idx = (np.arange(s, e) * h)[:, None] + np.arange(w)[None, :]
        fr = x16[idx]
        fr = (fr - fr.mean(axis=1, keepdims=True)) * win
        ac = np.fft.irfft(np.abs(np.fft.rfft(fr, nfft)) ** 2, nfft)[:, :w]
        r = ac[:, lo:hi] / (ac[:, :1] + 1e-9)
        k = r.argmax(axis=1)
        per[s:e] = r[np.arange(e - s), k]
        f0[s:e] = SR16 / (k + lo)
    return per, f0


def read_f32(path):
    return np.fromfile(str(path), dtype='<f4')


def clip_events(x, thresh=0.98, run_len=3):
    """Times of clipped runs: three or more samples in a row at the top of the range."""
    hot = np.abs(x) >= thresh
    if not hot.any():
        return []
    d = np.diff(np.concatenate([[0], hot.astype(np.int8), [0]]))
    starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
    keep = (ends - starts) >= run_len
    return [round(float(s) / SR, 3) for s in starts[keep]][:500]


def extract_audio(cfg, clip, d):
    """raw.f32 (48 kHz mono, chosen channel), nr.f32 (light noise reduction), a16.wav for whisper, analysis.npz."""
    d.mkdir(parents=True, exist_ok=True)
    path = clip['path']
    ch = clip.get('channels', 1)
    mode = cfg.audio.get('channel', 'auto')
    pan, why = 'pan=mono|c0=c0', 'mono'
    if ch >= 2:
        if mode == 'left':
            pan, why = 'pan=mono|c0=c0', 'left (set in brief)'
        elif mode == 'right':
            pan, why = 'pan=mono|c0=c1', 'right (set in brief)'
        elif mode == 'mix':
            pan, why = 'pan=mono|c0=0.5*c0+0.5*c1', 'mix (set in brief)'
        else:
            p = run(['ffmpeg', '-v', 'error', '-i', path, '-map', '0:a:0', '-af', 'pan=stereo|c0=c0|c1=c1',
                     '-ar', '8000', '-f', 'f32le', '-'], binary=True)
            x = np.frombuffer(p.stdout, np.float32)
            x = x[:len(x) // 2 * 2].reshape(-1, 2)
            r = 20 * np.log10(np.sqrt(np.mean(x.astype(np.float64) ** 2, axis=0)) + 1e-9)
            if r[0] - r[1] > 10:
                pan, why = 'pan=mono|c0=c0', 'left (right is %.0f dB quieter)' % (r[0] - r[1])
            elif r[1] - r[0] > 10:
                pan, why = 'pan=mono|c0=c1', 'right (left is %.0f dB quieter)' % (r[1] - r[0])
            else:
                pan, why = 'pan=mono|c0=0.5*c0+0.5*c1', 'mix of left and right'
    run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-map', '0:a:0', '-af', pan, '-ar', str(SR),
         '-f', 'f32le', d / 'raw.f32'])
    raw = read_f32(d / 'raw.f32')
    if clip.get('a_start', 0) > 0.0005:
        # sample 0 must be time 0 of the file, where video seeking counts from
        raw = np.concatenate([np.zeros(int(round(clip['a_start'] * SR)), np.float32), raw])
        raw.astype('<f4').tofile(d / 'raw.f32')
    rms = frame_rms_db(raw, SR)
    floor = float(np.percentile(rms, 10)) if len(rms) else -90.0
    nf = int(min(-20, max(-80, round(floor))))
    nr = float(cfg.audio.get('noise_reduction_db', 10))
    hp = float(cfg.audio.get('highpass_hz', 80))
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', d / 'raw.f32',
         '-af', 'highpass=f=%g,afftdn=nr=%g:nf=%d:tn=1' % (hp, nr, nf), '-f', 'f32le', '-ar', str(SR), d / 'nr.f32'])
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', d / 'raw.f32',
         '-ar', str(SR16), '-c:a', 'pcm_s16le', d / 'a16.wav'])
    p = run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', d / 'nr.f32',
             '-ar', str(SR16), '-f', 'f32le', '-'], binary=True)
    x16 = np.frombuffer(p.stdout, np.float32)
    nrx = read_f32(d / 'nr.f32')
    rms_nr = frame_rms_db(nrx, SR)
    per, f0 = periodicity(x16)
    n = min(len(rms_nr), len(per)) if len(per) else len(rms_nr)
    np.savez_compressed(d / 'analysis.npz', rms=rms_nr[:n], per=per[:n] if len(per) else np.zeros(n, np.float32),
                        f0=f0[:n] if len(f0) else np.zeros(n, np.float32),
                        floor=np.float32(np.percentile(rms_nr, 10) if len(rms_nr) else -90),
                        floor_raw=np.float32(floor), peak=np.float32(np.max(np.abs(raw)) if len(raw) else 0),
                        clips=np.array(clip_events(raw), np.float32), dur=np.float32(len(raw) / SR))
    return why


def load_an(cfg, clip_id):
    z = np.load(cfg.p('clips', clip_id, 'analysis.npz'))
    return {k: z[k] for k in z.files}


def fidx(t, n):
    return int(min(max(0, round((t - HALF) / HOP)), max(0, n - 1)))


def runs(mask):
    """[(start, end)] of True runs, end exclusive."""
    if not len(mask):
        return []
    d = np.diff(np.concatenate([[0], mask.astype(np.int8), [0]]))
    return list(zip(np.where(d == 1)[0].tolist(), np.where(d == -1)[0].tolist()))


def refine_words(isl, words, level):
    """Put whisper's words on the sound. whisper.cpp's word times are rough and tile: each
    word starts where the last one ended, so a word after a pause seems to start in the
    silence, and a last word can run on over a long silence. A word starts on the speech
    island it starts in, or, if it starts in a gap, on the next island; never backwards.
    Islands 12 dB or more under the speech level (breaths, noise) take no word. A word
    can run on over the following islands while the gaps stay short (0.35 s) and whisper
    still has it speaking, up to the island where the next word starts: "€400" is three
    spoken words to the ear, and a cough after a long silence is not part of the last word."""
    speech = [r for r in isl if r['peak'] >= level - 12.0]
    own, k0 = [], 0
    for w in words:
        k = None
        for j in range(k0, len(speech)):
            r = speech[j]
            if r['s'] - 0.03 <= w['t0'] <= r['e'] - 0.05:
                k = j                 # starts inside; the last 50 ms of an island is the previous word's end
                nxt = speech[j + 1] if j + 1 < len(speech) else None
                if nxt and r['e'] - w['t0'] < 0.25 and w['t1'] > nxt['s'] + 0.1 and nxt['s'] - r['e'] > 0.15:
                    k = j + 1         # whisper ended the word before too early: it runs on into the next island
                break
            if r['s'] >= w['t0'] - 0.05:
                k = j if r['s'] < w['t1'] + 0.3 else None
                break
        own.append(k)
        if k is not None:
            k0 = k
    out = []
    for i, w in enumerate(words):
        k = own[i]
        if k is None:                 # nothing to hear where whisper puts it: keep whisper's times
            out.append(dict(w, t1=round(min(w['t1'], w['t0'] + 1.6), 3)))
            continue
        nxt = next((own[j] for j in range(i + 1, len(own)) if own[j] is not None), None)
        r = speech[k]
        first = i == 0 or own[i - 1] != k
        t0 = r['s'] if first else min(max(w['t0'], r['s']), r['e'] - 0.05)
        if nxt == k:                  # the next word starts on this island too
            t1 = min(max(w['t1'], t0 + 0.05), r['e'])
        else:
            e = k
            limit = nxt if nxt is not None else len(speech)
            while (e + 1 < limit and speech[e + 1]['s'] - speech[e]['e'] <= 0.35
                   and speech[e + 1]['s'] < w['t1'] + 0.05):
                e += 1
            t1 = speech[e]['e']
        out.append(dict(w, t0=round(t0, 3), t1=round(max(t1, t0 + 0.05), 3)))
    return out


def speech_islands(an, t0, t1, words=()):
    """Sound islands between t0 and t1 in seconds, the speech level, and the words pulled
    onto the islands. Frames above the speech threshold make islands; holes under 70 ms are
    filled and blips under 40 ms dropped. A breath, an island that is short, quiet, not
    periodic and holds no word, is dropped: the brief counts breaths as pauses."""
    rms, per = an['rms'], an['per']
    n = len(rms)
    a, b = fidx(t0, n), fidx(t1, n) + 1
    if b - a < 3:
        return [], -60.0, [dict(w) for w in words]
    seg = rms[a:b]
    level = float(np.percentile(seg, 95))
    thr = max(float(an['floor']) + 8.0, level - 26.0)
    act = seg > thr
    for s, e in runs(~act):
        if e - s < 7 and s > 0 and e < len(act):
            act[s:e] = True
    for s, e in runs(act):
        if e - s < 4:
            act[s:e] = False
    raw = []
    for s, e in runs(act):
        raw.append({'s': (a + s) * HOP + HALF - 0.005, 'e': (a + e) * HOP + HALF + 0.005,
                    'peak': float(seg[s:e].max()),
                    'per': float(per[a + s:a + e].mean()) if len(per) >= a + e else 1.0})
    ref = refine_words(raw, words, level)
    mids = [0.5 * (w['t0'] + w['t1']) for w in ref]
    out = []
    for r in raw:
        if (0.08 <= r['e'] - r['s'] <= 0.9 and r['peak'] < level - 10.0 and r['per'] < 0.35
                and not any(r['s'] <= m <= r['e'] for m in mids)):
            continue
        out.append([r['s'], r['e']])
    return out, level, ref


# ------------------------------------------------------------------ whisper

SPECIAL = re.compile(r'^\s*[\[\(].*[\]\)]\s*$')


def find_whisper(cfg):
    cands = [cfg.whisper_bin] if cfg.whisper_bin else ['whisper-cli', 'whisper-cpp']
    for b in cands:
        if os.sep in b:
            if os.path.exists(b):
                return b
        elif shutil.which(b):
            return shutil.which(b)
    return None


def parse_whisper(path):
    """Words from whisper.cpp -ml 1 -sow -ojf JSON. whisper.cpp only escapes quotes and
    backslashes, and older builds can split a UTF-8 character across tokens, so read leniently."""
    raw = Path(path).read_bytes().decode('utf-8', errors='replace')
    data = json.JSONDecoder(strict=False).raw_decode(raw.lstrip())[0]
    words = []
    for seg in data.get('transcription', []):
        text = seg.get('text', '').replace('\ufffd', '')
        if not text.strip() or SPECIAL.match(text):
            continue
        t0, t1 = seg['offsets']['from'] / 1000.0, seg['offsets']['to'] / 1000.0
        ps = [float(tk.get('p', 1.0)) for tk in seg.get('tokens', [])
              if not str(tk.get('text', '')).startswith('[_') and str(tk.get('text', '')).strip()]
        p = min(ps) if ps else 1.0
        parts = text.split()
        if len(parts) == 1 and not re.search(r'\w', parts[0]):
            # punctuation belongs to the word before; anything else (a music note) is not speech
            if words and re.fullmatch(r'[.,?!:;\'"\u2019\u2026-]+', parts[0]):
                words[-1]['text'] += parts[0]
                words[-1]['t1'] = max(words[-1]['t1'], t1)
            continue
        parts = [x for x in parts if re.search(r'\w', x) or re.fullmatch(r'[.,?!:;\'"\u2019\u2026-]+', x)]
        if not parts:
            continue
        total = sum(len(x) for x in parts) or 1
        acc = t0
        for x in parts:
            dur = (t1 - t0) * len(x) / total
            words.append({'text': x, 't0': round(acc, 3), 't1': round(acc + dur, 3), 'p': round(p, 3)})
            acc += dur
    return words


def run_whisper(cfg, wav, out_base, model=None):
    wb = find_whisper(cfg)
    if not wb:
        raise Fail('whisper.cpp not found: brew install whisper-cpp (or set [whisper] bin in brief.toml)')
    model = Path(model or cfg.model)
    if not model.exists():
        raise Fail('whisper model not found: %s (setup_mac.sh downloads it)' % model)
    cmd = [wb, '-m', model, '-f', wav, '-l', cfg.language, '-ml', '1', '-sow', '-ojf', '-of', out_base,
           '-np', '-t', str(cfg.threads)]
    if cfg.prompt:
        cmd += ['--prompt', cfg.prompt]
    run(cmd)
    return parse_whisper(str(out_base) + '.json')


def cmd_transcribe(cfg, args):
    clips = selected_clips(cfg)
    if not clips:
        raise Fail('the selected shoot has no usable clips')
    for k, c in enumerate(clips, 1):
        if c.get('error'):
            say('skip %s: %s' % (c['name'], c['error']))
            continue
        d = cfg.p('clips', c['id'])
        stamp = {'size': c['size'], 'when': c['when'], 'model': str(cfg.model), 'prompt': cfg.prompt,
                 'channel': cfg.audio.get('channel', 'auto'), 'nr': cfg.audio.get('noise_reduction_db', 10),
                 'hp': cfg.audio.get('highpass_hz', 80), 'v': 3}
        if jload(d / 'stamp.json') == stamp and (d / 'words.json').exists() and not getattr(args, 'force', False):
            say('[%d/%d] %s: done before' % (k, len(clips), c['name']))
            continue
        why = extract_audio(cfg, c, d)
        words = run_whisper(cfg, d / 'a16.wav', d / 'whisper')
        jsave(d / 'words.json', {'clip': c['id'], 'channel': why, 'words': words})
        jsave(d / 'stamp.json', stamp)
        say('[%d/%d] %s: %d words, audio from %s' % (k, len(clips), c['name'], len(words), why))


def clip_words(cfg, clip_id):
    w = jload(cfg.p('clips', clip_id, 'words.json'))
    return w['words'] if w else []


_REF = {}


def clip_ref(cfg, clip_id):
    """The clip's words with their edges on the sound (see refine_words). Whisper's own times
    tile, so the gap before a word after a pause only shows in these."""
    if clip_id not in _REF:
        an = load_an(cfg, clip_id)
        _REF[clip_id] = speech_islands(an, 0.0, float(an['dur']), clip_words(cfg, clip_id))[2]
    return _REF[clip_id]


# ------------------------------------------------------------------ match

def local_align(C, S):
    """Best local alignment (Smith-Waterman) of script tokens S inside clip tokens C.
    None in C is a masked token that nothing may align across."""
    n, m = len(C), len(S)
    if not n or not m:
        return None
    H = [[0.0] * (m + 1) for _ in range(n + 1)]
    T = [[0] * (m + 1) for _ in range(n + 1)]
    best, bi, bj = 0.0, 0, 0
    for i in range(1, n + 1):
        ci, Hi, Hp, Ti = C[i - 1], H[i], H[i - 1], T[i]
        for j in range(1, m + 1):
            s = -1000.0 if ci is None else (2.0 if ci == S[j - 1] else -1.0)
            v, t = 0.0, 0
            d = Hp[j - 1] + s
            if d > v:
                v, t = d, 1
            u = Hp[j] - 1.0
            if u > v:
                v, t = u, 2
            l_ = Hi[j - 1] - 1.0
            if l_ > v:
                v, t = l_, 3
            Hi[j], Ti[j] = v, t
            if v > best:
                best, bi, bj = v, i, j
    if best <= 0:
        return None
    i, j, matches = bi, bj, 0
    while i > 0 and j > 0 and T[i][j]:
        t = T[i][j]
        if t == 1:
            matches += C[i - 1] == S[j - 1]
            i, j = i - 1, j - 1
        elif t == 2:
            i -= 1
        else:
            j -= 1
    return {'score': best, 'i0': i, 'i1': bi - 1, 'j0': j, 'j1': bj - 1, 'matches': matches}


def script_tokens(line, loose=True):
    return [t for t in normalize(line.split(), loose) if not t['filler']]


def cmd_match(cfg, args):
    clips = [c for c in selected_clips(cfg) if not c.get('error')]
    lines = [(v['n'], k, text) for v in cfg.videos if v['enabled'] for k, text in enumerate(v['lines'], 1)]
    S = {(vn, k): [t['t'] for t in script_tokens(text)] for vn, k, text in lines}
    takes, unmatched = [], []
    for c in sorted(clips, key=lambda c: c['when']):
        words = clip_words(cfg, c['id'])
        if not words:
            unmatched.append({'clip': c['id'], 'name': c['name'], 'duration': c.get('duration', 0), 'heard': ''})
            continue
        ref = clip_ref(cfg, c['id'])   # word times on the sound, for real gaps
        toks = [t for t in normalize([w['text'] for w in words]) if not t['filler']]
        cands = []
        for key, st in S.items():
            C = [t['t'] for t in toks]
            for _ in range(12):
                al = local_align(C, st)
                if not al:
                    break
                m = len(st)
                if al['matches'] < max(3, math.ceil(0.5 * m)) or (al['j1'] - al['j0'] + 1) < 0.5 * m:
                    break
                al['key'] = key
                al['norm'] = al['score'] / (2.0 * m)
                cands.append(al)
                for i in range(al['i0'], al['i1'] + 1):
                    C[i] = None
        cands.sort(key=lambda a: -a['norm'])
        chosen = []
        for a in cands:
            span = set(range(a['i0'], a['i1'] + 1))
            if all(len(span & set(range(b['i0'], b['i1'] + 1))) <= 0.2 * len(span) for b in chosen):
                chosen.append(a)
        chosen.sort(key=lambda a: a['i0'])
        used = set()
        for a in chosen:
            wa, wb = toks[a['i0']]['a'], toks[a['i1']]['b']
            used.update(range(wa, wb + 1))
        for a in chosen:
            wa, wb = toks[a['i0']]['a'], toks[a['i1']]['b']
            m = len(S[a['key']])
            # A first or last script word that whisper heard as something else is still on the
            # recording: take in as many neighbouring words as script words are missing, if they
            # run on without a pause. A slate or an "okay" before a pause stays out.
            for _ in range(a['j0']):
                if (wa - 1 >= 0 and wa - 1 not in used and ref[wa]['t0'] - ref[wa - 1]['t1'] < 0.35
                        and bare(words[wa - 1]['text']) not in FILLERS):
                    wa -= 1
                    used.add(wa)
            for _ in range(m - 1 - a['j1']):
                if (wb + 1 < len(words) and wb + 1 not in used and ref[wb + 1]['t0'] - ref[wb]['t1'] < 0.35
                        and bare(words[wb + 1]['text']) not in FILLERS):
                    wb += 1
                    used.add(wb)
            takes.append({'clip': c['id'], 'name': c['name'], 'video': a['key'][0], 'line': a['key'][1],
                          'word_a': wa, 'word_b': wb, 't0': words[wa]['t0'], 't1': words[wb]['t1'],
                          'said': ' '.join(w['text'] for w in words[wa:wb + 1]), 'match': round(a['norm'], 3)})
        rest = [w['text'] for i, w in enumerate(words) if i not in used]
        if not chosen:
            unmatched.append({'clip': c['id'], 'name': c['name'], 'duration': c.get('duration', 0),
                              'heard': ' '.join(rest)[:300]})
        elif len([x for x in rest if re.search(r'\w', x)]) >= 6:
            unmatched.append({'clip': c['id'], 'name': c['name'], 'partial': True, 'heard': ' '.join(rest)[:300]})
    for k, t in enumerate(takes, 1):
        t['id'] = 'T%03d' % k
    jsave(cfg.p('takes.json'), {'takes': takes, 'unmatched': unmatched})
    per = {}
    for t in takes:
        per.setdefault((t['video'], t['line']), []).append(t['id'])
    for vn, k, text in lines:
        ids = per.get((vn, k), [])
        say('v%d line %d: %d take%s %s' % (vn, k, len(ids), '' if len(ids) == 1 else 's', ' '.join(ids)))
    nomatch = [u for u in unmatched if not u.get('partial')]
    if nomatch:
        say('clips that match no script line (not used): ' + ', '.join(u['name'] for u in nomatch))
    return takes


# ------------------------------------------------------------------ rank

def describe_change(op, sa, sb):
    a, b = ' '.join(sa), ' '.join(sb)
    if op == 'replace':
        return 'said "%s" for "%s"' % (b, a)
    if op == 'delete':
        return 'left out "%s"' % a
    return 'added "%s"' % b


def compare(A, B):
    """Script tokens A against said tokens B: (figures, wording, stumbles, matched)."""
    figures, wording, stumbles = [], [], []
    matched = 0
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op == 'equal':
            matched += a1 - a0
            continue
        sa, sb = A[a0:a1], B[b0:b1]
        if op == 'insert':
            L = b1 - b0
            if B[b1:b1 + L] == sb or B[max(0, b0 - L):b0] == sb:
                stumbles.append('repeated "%s"' % ' '.join(sb))
                continue
            if L <= 4 and B[b1:b1 + 1] == sb[:1]:
                stumbles.append('restarted at "%s"' % ' '.join(sb))
                continue
        na = [x for x in sa if NUM_RE.match(x)]
        nb = [x for x in sb if NUM_RE.match(x)]
        if na != nb:
            figures.append(describe_change(op, sa, sb))
        else:
            wording.append(describe_change(op, sa, sb))
    return figures, wording, stumbles, matched


def classify(script, words):
    """Compare what was said with the script line."""
    texts = [w['text'] for w in words]
    said = normalize(texts, loose=True)
    fillers = [texts[t['a']] for t in said if t['filler']]
    A = [t['t'] for t in script_tokens(script, loose=True)]
    B = [t['t'] for t in said if not t['filler']]
    figures, wording, stumbles, matched = compare(A, B)
    stumbles = ['filler "%s"' % f.strip('.,?!') for f in fillers] + stumbles
    minor = []
    if not wording and not figures:
        # contractions and the like: "there is" for "there's" compares equal above; list it here
        A2 = [t['t'] for t in script_tokens(script, loose=False)]
        B2 = [t['t'] for t in normalize(texts, loose=False) if not t['filler']]
        minor = compare(A2, B2)[1]
    coverage = matched / max(1, len(A))
    return {'figures': figures, 'wording': wording, 'minor': minor, 'stumbles': stumbles,
            'coverage': round(coverage, 3), 'hard': bool(figures) or coverage < 0.85,
            'lowconf': [w['text'] for w in words if w.get('p', 1) < 0.35]}


_FACE = {}


def face_detector(cfg, w, h):
    try:
        import cv2
    except ImportError:
        return None
    if not cfg.face_model.exists():
        return None
    if 'det' not in _FACE:
        try:
            cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_ERROR)
        except AttributeError:
            pass
        _FACE['det'] = cv2.FaceDetectorYN.create(str(cfg.face_model), '', (w, h), 0.6, 0.3, 5000)
    _FACE['det'].setInputSize((w, h))
    return _FACE['det']


def deint(clip):
    return 'bwdif=mode=send_frame,' if clip.get('interlaced') else ''


def vfilter_pre(cfg, clip):
    lut = cfg.edit.get('lut')
    return deint(clip) + ("lut3d=file='%s'," % ffesc(expand(lut, cfg.work)) if lut else '')


def iris_offset(gray, eye, ed):
    r = int(max(4, 0.22 * ed))
    x, y = int(round(eye[0])), int(round(eye[1]))
    h, w = gray.shape
    if x - r < 0 or y - r < 0 or x + r >= w or y + r >= h or r < 5:
        return None
    patch = gray[y - r:y + r, x - r:x + r].astype(np.float32)
    k = np.array([1, 2, 1], np.float32) / 4
    patch = np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 0, patch)
    patch = np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 1, patch)
    thr = np.percentile(patch, 15)
    ys, xs = np.nonzero(patch <= thr)
    if not len(xs):
        return None
    return (float(xs.mean()) - r) / r, (float(ys.mean()) - r) / r


def face_stats(cfg, clip, t0, t1, fps=4.0):
    """Head and eye-line per sampled frame, from YuNet's five landmarks. Rough, but enough to
    rank takes; the review sheets are for checking it by eye."""
    W, H = clip['w'], clip['h']
    sw = max(2, min(1280, W) // 2 * 2)
    sh = max(2, int(round(H * sw / W / 2)) * 2)
    det = face_detector(cfg, sw, sh)
    if det is None:
        return None
    cmd = ['ffmpeg', '-v', 'error', '-ss', '%.3f' % max(0, t0), '-t', '%.3f' % max(0.3, t1 - t0),
           '-i', clip['path'], '-map', '0:v:0', '-an', '-vf', '%sfps=%g,scale=%d:%d' % (vfilter_pre(cfg, clip), fps, sw, sh),
           '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-']
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    size = sw * sh * 3
    rows = []
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        img = np.frombuffer(buf, np.uint8).reshape(sh, sw, 3)
        gray = (0.114 * img[:, :, 0] + 0.587 * img[:, :, 1] + 0.299 * img[:, :, 2]).astype(np.float32)
        row = {'luma': float(gray.mean()), 'bgr': [float(v) for v in img.reshape(-1, 3).mean(axis=0)]}
        _, faces = det.detect(img)
        if faces is not None and len(faces):
            f = faces[int(np.argmax(faces[:, 14]))]
            x, y, w, h = [float(v) for v in f[:4]]
            re_, le, nose, rm, lm = f[4:6], f[6:8], f[8:10], f[10:12], f[12:14]
            eye_mid, ed = (re_ + le) / 2, float(np.linalg.norm(le - re_)) + 1e-6
            mouth = (rm + lm) / 2
            yaw = float((nose[0] - eye_mid[0]) / ed)
            pitch = float((nose[1] - eye_mid[1]) / (mouth[1] - eye_mid[1] + 1e-6))
            irs = [o for o in (iris_offset(gray, re_, ed), iris_offset(gray, le, ed)) if o]
            iris = (float(np.mean([o[0] for o in irs])), float(np.mean([o[1] for o in irs]))) if irs else None
            fy0, fy1 = int(max(0, y)), int(min(sh, y + h))
            fx0, fx1 = int(max(0, x)), int(min(sw, x + w))
            fl = float(gray[fy0:fy1, fx0:fx1].mean()) if fy1 > fy0 and fx1 > fx0 else row['luma']
            on = abs(yaw) < 0.15 and 0.36 < pitch < 0.74 and (iris is None or (abs(iris[0]) < 0.4 and abs(iris[1]) < 0.4))
            row.update(face=True, cx=(x + w / 2) / sw, cy=(y + h / 2) / sh, fh=h / sh, yaw=yaw, pitch=pitch,
                       iris=iris, face_luma=fl, on=on, box=[x / sw, y / sh, w / sw, h / sh])
        else:
            row.update(face=False, on=False)
        rows.append(row)
    proc.wait()
    if not rows:
        return None
    faces = [r for r in rows if r['face']]
    med = lambda k: float(np.median([r[k] for r in faces])) if faces else None
    return {'frames': len(rows), 'face_ratio': len(faces) / len(rows), 'eyes': sum(r['on'] for r in rows) / len(rows),
            'yaw': med('yaw'), 'pitch': med('pitch'), 'cx': med('cx'), 'cy': med('cy'), 'fh': med('fh'),
            'face_luma': med('face_luma'), 'luma': float(np.median([r['luma'] for r in rows])),
            'bgr': [float(np.median([r['bgr'][i] for r in rows])) for i in range(3)],
            'steady': float(1.0 - min(1.0, 8 * (np.std([r['cx'] for r in faces]) + np.std([r['cy'] for r in faces])))) if len(faces) > 1 else 1.0,
            'box': [float(np.median([r['box'][i] for r in faces])) for i in range(4)] if faces else None}


def take_audio(an, take, words):
    """Audio measures over the spoken part of a take: from the first word's sound to the last's."""
    isl, level, words = speech_islands(an, take['t0'] - 0.3, take['t1'] + 0.4, words)
    s0 = words[0]['t0'] if words else take['t0']
    s1 = words[-1]['t1'] if words else take['t1']
    isl = [x for x in isl if x[1] > s0 and x[0] < s1]
    speech = sum(min(e, s1) - max(s, s0) for s, e in isl)
    rms, per, f0 = an['rms'], an['per'], an['f0']
    n = len(rms)
    a, b = fidx(s0, n), fidx(s1, n) + 1
    seg, ps, fs = rms[a:b], per[a:b], f0[a:b]
    voiced = (ps > 0.5) & (seg > level - 30)
    st = 12 * np.log2(fs[voiced] / max(1.0, float(np.median(fs[voiced])))) if voiced.sum() > 10 else np.zeros(1)
    act = seg > level - 26
    clips = [t for t in an['clips'].tolist() if s0 - 0.2 <= t <= s1 + 0.2]
    hes = []
    for (_, e0), (g1, _) in zip(isl, isl[1:]):
        prev = [w for w in words if w['t1'] <= e0 + 0.15]
        if g1 - e0 > 0.7 and prev and not re.search(r'[.,?!:;]$', prev[-1]['text']):
            hes.append(round(g1 - e0, 2))
    return {'s0': round(s0, 3), 's1': round(s1, 3),
            'snr': round(level - float(an['floor']), 1), 'level': round(level, 1), 'clipped': len(clips),
            'speech': round(speech, 2), 'rate': round(len(words) / max(0.5, speech), 2),
            'pitch_range': round(float(np.std(st)), 2), 'loud_range': round(float(np.std(seg[act])) if act.sum() > 5 else 0.0, 2),
            'hesitations': hes}


def span(t):
    """A take's spoken span: from its first word's sound to its last's."""
    a = t.get('audio') or {}
    return a.get('s0', t['t0']), a.get('s1', t['t1'])


def rank_key(t):
    return (t['text']['hard'], len(t['text']['figures']), len(t['text']['wording']), len(t['text']['stumbles']),
            -t['quality'])


def cmd_rank(cfg, args):
    data = jload(cfg.p('takes.json'))
    if not data:
        raise Fail('no takes yet: run "match" first')
    clips = {c['id']: c for c in selected_clips(cfg)}
    cache = jload(cfg.p('rank_cache.json'), {})
    takes = data['takes']
    for k, t in enumerate(takes, 1):
        c = clips[t['clip']]
        words = clip_words(cfg, t['clip'])[t['word_a']:t['word_b'] + 1]
        script = cfg.video(t['video'])['lines'][t['line'] - 1]
        t['text'] = classify(script, words)
        an = load_an(cfg, t['clip'])
        t['audio'] = take_audio(an, t, words)
        s0, s1 = t['audio']['s0'], t['audio']['s1']
        ck = '%s:%.3f:%.3f' % (t['clip'], s0, s1)
        if ck not in cache:
            cache[ck] = face_stats(cfg, c, s0, s1)
        t['face'] = cache[ck]
        if k % 10 == 0:
            say('  scored %d of %d takes' % (k, len(takes)))
    jsave(cfg.p('rank_cache.json'), cache)
    by_line = {}
    for t in takes:
        by_line.setdefault((t['video'], t['line']), []).append(t)
    for key, group in by_line.items():
        # Whisper tends to tidy away hesitations; a take far longer than its siblings with the
        # same words probably has one.
        if len(group) >= 3:
            med = float(np.median([g['audio']['speech'] for g in group]))
            for g in group:
                if g['audio']['speech'] > 1.35 * med and g['audio']['speech'] - med > 0.8:
                    g['text']['stumbles'].append('possible hesitation (%.1f s longer than the others)' % (g['audio']['speech'] - med))
        rates = np.array([g['audio']['rate'] for g in group])
        pr = np.array([g['audio']['pitch_range'] for g in group])
        lr = np.array([g['audio']['loud_range'] for g in group])
        z = lambda a: (a - a.mean()) / (a.std() + 1e-6) if len(a) > 1 else np.zeros(len(a))
        energy = 0.5 * z(pr) + 0.3 * z(lr) - 0.4 * np.abs(z(rates))
        for g, e in zip(group, energy):
            a = g['audio']
            g['scores'] = {'energy': round(float(1 / (1 + math.exp(-e))), 3),
                           'audio': round(float(min(1.0, max(0.0, (a['snr'] - 15) / 25)) - (0.5 if a['clipped'] else 0.0)), 3)}
            if g['face']:
                g['scores']['eyes'] = round(g['face']['eyes'], 3)
                g['scores']['steady'] = round(g['face']['steady'], 3)
            w = {'eyes': 0.40, 'audio': 0.25, 'energy': 0.20, 'steady': 0.15}
            have = {k: v for k, v in w.items() if k in g['scores']}
            g['quality'] = round(sum(g['scores'][k] * v for k, v in have.items()) / sum(have.values())
                                 - 0.05 * len(g['audio']['hesitations']) - 0.03 * len(g['text']['lowconf']), 4)
        group.sort(key=rank_key)
        for r, g in enumerate(group, 1):
            g['rank'] = r
            g['clean'] = not g['text']['hard'] and not g['text']['wording'] and not g['text']['stumbles']
    picks = consistent_picks(cfg, by_line)
    jsave(cfg.p('ranking.json'), {'takes': takes, 'unmatched': data['unmatched']})
    old = jload(cfg.p('picks.json'), {})
    for key, val in old.items():
        if val.get('manual'):
            picks[key] = val
    jsave(cfg.p('picks.json'), picks)
    write_ranking_md(cfg, takes, picks)
    review_sheets(cfg, by_line, clips)
    say('ranked %d takes; picks in %s; review sheets in %s' % (len(takes), cfg.p('picks.json'), cfg.p('review')))


def consistent_picks(cfg, by_line):
    """Best take per line, then keep framing and light steady across a video: a pick whose face
    size, brightness or colour is far from the others' gives way to a clean runner-up that fits."""
    picks = {}
    for v in cfg.videos:
        if not v['enabled']:
            continue
        chosen = {}
        for k in range(1, len(v['lines']) + 1):
            g = by_line.get((v['n'], k), [])
            if g:
                chosen[k] = g[0]
        faces = [t['face'] for t in chosen.values() if t.get('face') and t['face'].get('fh')]
        if len(faces) >= 3:
            mfh = float(np.median([f['fh'] for f in faces]))
            ml = float(np.median([f['face_luma'] for f in faces]))
            mb = np.median([f['bgr'] for f in faces], axis=0)

            def off(f):
                if not f or not f.get('fh'):
                    return 0.0
                wb = float(np.max(np.abs(np.array(f['bgr']) / (np.sum(f['bgr']) + 1e-6) - mb / (mb.sum() + 1e-6))))
                return max(abs(f['fh'] / mfh - 1) / 0.15, abs(f['face_luma'] - ml) / (0.12 * ml + 1e-6), wb / 0.02)

            for k, t in list(chosen.items()):
                if off(t.get('face')) > 1.0:
                    for alt in by_line[(v['n'], k)][1:3]:
                        if alt['clean'] and off(alt.get('face')) <= 1.0 and alt['quality'] > t['quality'] - 0.25:
                            alt['note'] = 'picked over %s to keep framing and light consistent' % t['id']
                            chosen[k] = alt
                            break
        for k, t in chosen.items():
            picks['v%d.%d' % (v['n'], k)] = {'parts': [{'take': t['id']}], 'manual': False}
    return picks


def why_text(t):
    s = []
    tx = t['text']
    if not tx['figures'] and not tx['wording']:
        s.append('every word and figure as scripted' if not tx['minor'] else 'words as scripted (' + '; '.join(tx['minor']) + ')')
    else:
        s.append('; '.join(tx['figures'] + tx['wording']))
    s.append('no stumble' if not tx['stumbles'] else '; '.join(tx['stumbles']))
    sc = t.get('scores', {})
    if 'eyes' in sc:
        s.append('eyes on lens %d%%' % round(100 * sc['eyes']))
    s.append('SNR %.0f dB%s' % (t['audio']['snr'], ', clipped' if t['audio']['clipped'] else ''))
    s.append('%.1f words/s' % t['audio']['rate'])
    return ', '.join(s)


def why_lower(best, other):
    if other['text']['hard'] and not best['text']['hard']:
        return 'figure wrong or line incomplete: ' + '; '.join(other['text']['figures'] or ['coverage %d%%' % (100 * other['text']['coverage'])])
    if len(other['text']['wording']) > len(best['text']['wording']):
        return 'wording: ' + '; '.join(other['text']['wording'])
    if len(other['text']['stumbles']) > len(best['text']['stumbles']):
        return 'stumble: ' + '; '.join(other['text']['stumbles'])
    a, b = best.get('scores', {}), other.get('scores', {})
    diffs = sorted(((a.get(k, 0) - b.get(k, 0), k) for k in ('eyes', 'audio', 'energy', 'steady')), reverse=True)
    name = {'eyes': 'eye-line', 'audio': 'audio', 'energy': 'energy', 'steady': 'steadiness'}
    if diffs and diffs[0][0] > 0.02:
        return 'weaker ' + name[diffs[0][1]]
    return 'close second'


def write_ranking_md(cfg, takes, picks):
    by = {}
    for t in takes:
        by.setdefault((t['video'], t['line']), []).append(t)
    out = ['# Take ranking', '', 'Pick marked with *. Words of each take are numbered for `pick T012:1-9`.', '']
    for v in cfg.videos:
        if not v['enabled']:
            continue
        out += ['## Video %d: %s' % (v['n'], v['title']), '']
        for k, line in enumerate(v['lines'], 1):
            p = picks.get('v%d.%d' % (v['n'], k), {}).get('parts', [])
            pid = {x['take'] for x in p}
            out.append('### Line %d: "%s"' % (k, line))
            g = sorted(by.get((v['n'], k), []), key=lambda t: t['rank'])
            if not g:
                out += ['', '**No take found.**', '']
                continue
            for t in g:
                words = clip_words(cfg, t['clip'])[t['word_a']:t['word_b'] + 1]
                num = ' '.join('%d:%s' % (i, w['text']) for i, w in enumerate(words, 1))
                out.append('- %s%s %s %s-%s (%s): %s' % ('*' if t['id'] in pid else '', t['id'], t['name'],
                                                         mmss(span(t)[0]), mmss(span(t)[1]), 'clean' if t['clean'] else 'not clean', why_text(t)))
                out.append('  - %s' % num)
            out.append('')
    (cfg.p('ranking.md')).write_text('\n'.join(out), encoding='utf-8')


def grab(clip, t, cfg, height=None, width=None):
    from PIL import Image
    vf = vfilter_pre(cfg, clip) + ('scale=-2:%d' % height if height else 'scale=%d:-2' % width)
    p = run(['ffmpeg', '-v', 'error', '-ss', '%.3f' % max(0, t), '-i', clip['path'], '-map', '0:v:0',
             '-frames:v', '1', '-vf', vf, '-f', 'image2pipe', '-vcodec', 'png', '-'], binary=True, check=False)
    if p.returncode or not p.stdout:
        return None
    return Image.open(io.BytesIO(p.stdout)).convert('RGB')


def load_font(cfg, size):
    from PIL import ImageFont
    try:
        f = ImageFont.truetype(str(cfg.font), int(size))
        wt = int(cfg.style.get('font_weight', 0) or 0)
        if wt:
            try:
                f.set_variation_by_axes([wt])
            except Exception:  # not a variable font
                pass
        return f
    except OSError:
        return ImageFont.load_default()


def review_sheets(cfg, by_line, clips):
    """One sheet per line: the top takes, four frames each and a face close-up, to check eye-line,
    framing and expression by eye before rendering."""
    from PIL import Image, ImageDraw
    out = cfg.p('review')
    out.mkdir(parents=True, exist_ok=True)
    font = load_font(cfg, 22)
    small = load_font(cfg, 18)
    for (vn, k), group in sorted(by_line.items()):
        group = sorted(group, key=lambda t: t['rank'])[:4]
        rows = []
        for t in group:
            c = clips[t['clip']]
            s0, s1 = span(t)
            times = [s0 + f * (s1 - s0) for f in (0.1, 0.4, 0.7, 0.95)]
            thumbs = [grab(c, x, cfg, height=200) for x in times]
            face = None
            fs = t.get('face') or {}
            if fs.get('box'):
                big = grab(c, 0.5 * (s0 + s1), cfg, width=min(1600, c['w']))
                if big:
                    bx, by_, bw, bh = fs['box']
                    W, H = big.size
                    cx, cy, s = (bx + bw / 2) * W, (by_ + bh / 2) * H, max(bw * W, bh * H) * 0.75
                    face = big.crop((int(cx - s), int(cy - s), int(cx + s), int(cy + s))).resize((200, 200))
            rows.append((t, thumbs, face))
        if not rows:
            continue
        tw = max([im.size[0] for _, th, _ in rows for im in th if im] + [200])
        width = 4 * (tw + 8) + 216 + 16
        sheet = Image.new('RGB', (width, 70 + len(rows) * 290), (245, 245, 243))
        d = ImageDraw.Draw(sheet)
        line = cfg.video(vn)['lines'][k - 1]
        d.text((12, 12), 'Video %d, line %d: %s' % (vn, k, line[:150]), fill=(11, 31, 28), font=font)
        y = 60
        for t, thumbs, face in rows:
            d.text((12, y), '#%d %s  %s %s-%s  %s' % (t['rank'], t['id'], t['name'], mmss(s0), mmss(s1),
                                                     'CLEAN' if t['clean'] else 'NOT CLEAN'), fill=(11, 31, 28), font=font)
            d.text((12, y + 28), (why_text(t))[:190], fill=(84, 99, 95), font=small)
            d.text((12, y + 50), ('said: ' + t['said'])[:190], fill=(84, 99, 95), font=small)
            x = 12
            for im in thumbs:
                if im:
                    sheet.paste(im, (x, y + 78))
                x += tw + 8
            if face:
                sheet.paste(face, (x, y + 78))
            y += 290
        sheet.save(out / ('v%d-line%d.jpg' % (vn, k)), quality=85)


def parse_part(spec, takes):
    m = re.fullmatch(r'(T\d+)(?::(\d+)?-(\d+)?)?', spec)
    if not m or m.group(1) not in takes:
        raise Fail('bad take "%s": use T012, or T012:1-9 for words 1 to 9 of it' % spec)
    part = {'take': m.group(1)}
    if m.group(2):
        part['from_word'] = int(m.group(2))
    if m.group(3):
        part['to_word'] = int(m.group(3))
    return part


def cmd_pick(cfg, args):
    rk = jload(cfg.p('ranking.json'))
    if not rk:
        raise Fail('no ranking yet: run "rank" first')
    takes = {t['id']: t for t in rk['takes']}
    parts = [parse_part(s, takes) for s in args.take]
    for p in parts:
        t = takes[p['take']]
        if (t['video'], t['line']) != (args.video, args.line):
            raise Fail('%s is a take of video %d line %d' % (p['take'], t['video'], t['line']))
        p.update(clip=t['clip'], t0=t['t0'])
    picks = jload(cfg.p('picks.json'), {})
    picks['v%d.%d' % (args.video, args.line)] = {'parts': parts, 'manual': True, 'reason': args.reason or ''}
    jsave(cfg.p('picks.json'), picks)
    write_ranking_md(cfg, rk['takes'], picks)
    say('video %d line %d: %s' % (args.video, args.line, ' + '.join(args.take)))


# ------------------------------------------------------------------ edit plan

def cut_part(cfg, an, words, clip_dur, before, after, first):
    """Keep-segments for one take (or part of one): in and out points at the first and last
    sound, inner pauses longer than max_pause cut down at their silent middle."""
    e = cfg.e
    lo = max(0.0, before + 0.05, words[0]['t0'] - 0.6)
    hi = min(clip_dur - 0.05, after - 0.05, words[-1]['t1'] + 0.7)
    isl, _, ref = speech_islands(an, lo, hi, words)
    # the islands under the first and last words; a cough or an "okay" just after is not the line
    near_first = [s for s in isl if s[1] > ref[0]['t0'] + 0.02 and s[0] < ref[0]['t1']]
    near_last = [s for s in isl if s[0] < ref[-1]['t1'] - 0.02 and s[1] > ref[-1]['t0']]
    onset = near_first[0][0] if near_first else ref[0]['t0']
    offset = near_last[-1][1] if near_last else ref[-1]['t1']
    if offset <= onset:
        onset, offset = ref[0]['t0'], ref[-1]['t1']
    t_in = max(lo, onset - (e('lead_in', 0.08) if first else e('pre_roll', 0.08)))
    t_out = min(hi, offset + e('post_roll', 0.12))
    inner = [s for s in isl if s[1] > onset and s[0] < offset]
    cuts = []
    mids = [0.5 * (w['t0'] + w['t1']) for w in ref]
    for (s0, e0), (s1, e1) in zip(inner, inner[1:]):
        g0, g1 = e0, s1
        if g1 - g0 <= e('max_pause', 0.30):
            continue
        if any(g0 + 0.05 < m < g1 - 0.05 for m in mids):
            continue      # a word sits in this quiet stretch: leave it alone
        prev = [w for w in ref if w['t1'] <= g0 + 0.2]
        sentence = bool(prev) and bool(END_PUNCT.search(prev[-1]['text']))
        target = e('pause_sentence', 0.27) if sentence else e('pause_phrase', 0.20)
        keep_after = min(0.12, max(0.07, 0.45 * target))
        keep_before = max(0.06, target - keep_after)
        a, b = g0 + keep_after, g1 - keep_before
        if b - a > 0.03:
            cuts.append((a, b))
    segs, cur = [], t_in
    for a, b in cuts:
        segs.append([cur, a])
        cur = b
    segs.append([cur, t_out])
    rms = an['rms']
    frames = [rms[fidx(s, len(rms)):fidx(x, len(rms)) + 1] for s, x in inner]
    level = float(np.median(np.concatenate(frames))) if frames else -30.0
    return segs, ref, {'onset': onset, 'offset': offset, 'cuts': cuts, 'level': level}


def plan_video(cfg, v, takes, picks, clips):
    fps = cfg.fps
    status, problems = 'ready', []
    timeline, line_spans, all_words, levels = [], [], [], []
    t_out = 0.0
    nlines = len(v['lines'])
    for k in range(1, nlines + 1):
        pk = picks.get('v%d.%d' % (v['n'], k))
        if not pk or not pk.get('parts'):
            problems.append('line %d: no take' % k)
            status = 'blocked'
            continue
        line_start = t_out
        for pi, part in enumerate(pk['parts']):
            t = takes.get(part['take'])
            if t is None or ('clip' in part and (part['clip'] != t['clip'] or abs(part['t0'] - t['t0']) > 0.05)):
                raise Fail('video %d line %d: the hand pick %s no longer points at the same take (match was re-run). '
                           'Pick again from ranking.md.' % (v['n'], k, part['take']))
            c = clips[t['clip']]
            cw = clip_ref(cfg, t['clip'])
            a = t['word_a'] + part.get('from_word', 1) - 1
            b = t['word_a'] + part.get('to_word', t['word_b'] - t['word_a'] + 1) - 1
            words = cw[a:b + 1]
            if not words:
                raise Fail('%s: empty word range' % part['take'])
            # the sound of the words just outside the part limits how far its edges may go
            before = cw[a - 1]['t1'] if a > 0 else 0.0
            after = cw[b + 1]['t0'] if b + 1 < len(cw) else float(c.get('duration', 0))
            an = load_an(cfg, t['clip'])
            dur = min(float(c.get('duration', 0)), float(an['dur']))
            segs, wts, info = cut_part(cfg, an, words, dur, before, after, first=(k == 1 and pi == 0))
            levels.append(info['level'])
            seg_map = []
            for s, e in segs:
                n = max(1, int(round((e - s) * fps)))
                e = s + n / fps
                timeline.append({'kind': 'clip', 'clip': t['clip'], 'take': t['id'], 'line': k, 's': round(s, 4),
                                 'e': round(e, 4), 'n': n, 'out': round(t_out, 4), 'part': len(levels) - 1})
                seg_map.append((s, e, t_out))
                t_out += n / fps

            def mapt(x, start):
                for s, e, o in seg_map:
                    if s - 1e-6 <= x <= e + 1e-6:
                        return o + (x - s)
                if start:
                    nxt = [o for s, e, o in seg_map if s > x]
                    return nxt[0] if nxt else seg_map[-1][2] + (seg_map[-1][1] - seg_map[-1][0])
                prv = [o + (e - s) for s, e, o in seg_map if e < x]
                return prv[-1] if prv else seg_map[0][2]

            for w in wts:
                o0, o1 = mapt(w['t0'], True), mapt(w['t1'], False)
                all_words.append({'text': w['text'], 't0': round(o0, 3), 't1': round(max(o1, o0 + 0.05), 3),
                                  'line': k, 'p': w.get('p', 1.0), 'src_t0': w['t0'], 'src_t1': w['t1'], 'clip': t['clip']})
            if (k, pi) == (nlines, len(pk['parts']) - 1):
                last = {'clip': t['clip'], 'out': segs[-1][1], 'after': after, 'dur': dur, 'take': t['id']}
        line_spans.append({'line': k, 't0': round(line_start, 4), 't1': round(t_out, 4)})
    hold = float(cfg.reg.get('hold_seconds', 2.0)) if cfg.reg.get('text') else 0.0
    reg_span = None
    if hold > 0 and timeline and status != 'blocked':
        avail = max(0.0, min(last['dur'] - 0.1, last['after'] - 0.15) - last['out'])
        live = min(avail, cfg.e('live_tail_max', 1.5), hold)
        n_live = int(round(live * fps))
        n_hold = int(round(hold * fps))
        reg_span = {'t0': round(t_out, 4), 't1': round(t_out + n_hold / fps, 4)}
        if n_live > 0:
            s = timeline[-1]['e']
            timeline.append({'kind': 'clip', 'clip': last['clip'], 'take': last['take'], 'line': None, 's': round(s, 4),
                             'e': round(s + n_live / fps, 4), 'n': n_live, 'out': round(t_out, 4), 'tail': True,
                             'part': timeline[-1]['part']})
            t_out += n_live / fps
        if n_hold - n_live > 0:
            src = timeline[-1]
            timeline.append({'kind': 'still', 'clip': src['clip'], 'take': src['take'], 'line': None,
                             's': round(src['e'] - 1.0 / fps, 4), 'e': round(src['e'], 4), 'n': n_hold - n_live,
                             'out': round(t_out, 4), 'part': src['part']})
            t_out += (n_hold - n_live) / fps
    # takes recorded at different levels: match each line's speech level before the master
    target = float(np.median(levels)) if levels else 0.0
    for seg in timeline:
        seg['gain_db'] = round(float(np.clip(target - levels[seg['part']], -6.0, 6.0)), 2)
    return {'video': v['n'], 'status': status, 'problems': problems, 'timeline': timeline, 'words': all_words,
            'lines': line_spans, 'reg': reg_span, 'duration': round(sum(s['n'] for s in timeline) / fps, 4)}


# ------------------------------------------------------------------ captions and text

WEAK_END = {'a', 'an', 'the', 'to', 'of', 'and', 'or', 'but', 'for', 'in', 'on', 'at', 'your', 'you', 'my', 'is',
            'are', 'be', 'with', 'from', 'by', 'into', 'that', 'than', 'as', 'if', 'it', 'its', 'our', 'their',
            'this', 'not', 'no', 'can', "can't", "don't", 'will', 'would', 'may', 'just', 'how', 'much', 'every'}


def chunk_captions(cfg, words):
    """2-5 words a caption, never across a sentence or a script line, breaking at commas
    where it can and not ending on a small word like 'the' or 'your'."""
    mn, mx = int(cfg.caps.get('min_words', 2)), int(cfg.caps.get('max_words', 5))
    maxc = int(cfg.caps.get('max_chars', 30))
    sents, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        if END_PUNCT.search(w['text']) or nxt is None or nxt['line'] != w['line']:
            sents.append(cur)
            cur = []

    def cost(ch, final):
        txt = ' '.join(x['text'] for x in ch)
        c = {1: 4.0, 2: 1.0, 3: 0.0, 4: 0.0, 5: 0.6}.get(len(ch), 9.0)
        if len(txt) > maxc:
            c += 3.0 * math.ceil((len(txt) - maxc) / 4)
        last = re.sub(r"[^\w'€%]", '', ch[-1]['text'].lower())
        if not final and last in WEAK_END:
            c += 2.5
        if not final and re.search(r'[,:;]$', ch[-1]['text']):
            c -= 0.8
        if ch[-1]['t1'] - ch[0]['t0'] < 0.45:
            c += 0.5
        return c

    chunks = []
    for s in sents:
        n = len(s)
        if n <= mx and len(' '.join(x['text'] for x in s)) <= maxc + 6:
            chunks.append(s)
            continue
        best = [0.0] + [math.inf] * n
        back = [0] * (n + 1)
        for i in range(1, n + 1):
            for j in range(max(0, i - mx), i):
                if i - j < mn and not (j == 0 and i == n):
                    continue
                c = best[j] + cost(s[j:i], i == n)
                if c < best[i]:
                    best[i], back[i] = c, j
        if math.isinf(best[n]):
            for j in range(0, n, mx):
                chunks.append(s[j:j + mx])
            continue
        cuts, i = [], n
        while i > 0:
            cuts.append((back[i], i))
            i = back[i]
        for j, i in reversed(cuts):
            chunks.append(s[j:i])
    fps = cfg.fps
    out = []
    for k, ch in enumerate(chunks):
        text = ' '.join(x['text'] for x in ch)
        text = re.sub(r'[.,:;]+$', '', text)
        t0 = ch[0]['t0']
        t1 = ch[-1]['t1'] + 0.15
        nxt = chunks[k + 1][0]['t0'] if k + 1 < len(chunks) else None
        if nxt is not None and nxt - ch[-1]['t1'] < 0.45:
            t1 = nxt
        if nxt is not None:
            t1 = min(t1, nxt)
        t1 = max(t1, t0 + 0.4) if nxt is None or nxt >= t0 + 0.4 else nxt
        out.append({'text': text, 't0': round(round(t0 * fps) / fps, 4), 't1': round(round(t1 * fps) / fps, 4),
                    'words': len(ch), 'line': ch[0]['line']})
    for a, b in zip(out, out[1:]):
        if a['t1'] > b['t0']:
            a['t1'] = b['t0']
    return [c for c in out if c['t1'] > c['t0']]


def hexrgb(s, alpha=1.0):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), int(round(255 * alpha)))


def wrap_greedy(font, words, maxw):
    lines, cur = [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if font.getlength(trial) <= maxw or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def wrap(font, text, maxw):
    """Centred text wrapped into as few lines as greedy wrapping needs, but balanced, and not
    ending a line on a small word. ' · ' in on-screen text is a preferred break; the dot is
    dropped where the line breaks, as a separator at a line end reads as a stray mark."""
    from itertools import combinations
    out = []
    for part in text.split(' · '):
        words = part.split()
        greedy = wrap_greedy(font, words, maxw)
        L, n = len(greedy), len(words)
        if L <= 1 or n > 24:
            out += greedy
            continue
        best, best_cost = greedy, None
        for cuts in combinations(range(1, n), L - 1):
            idx = (0,) + cuts + (n,)
            lines = [' '.join(words[a:b]) for a, b in zip(idx, idx[1:])]
            widths = [font.getlength(l) for l in lines]
            if max(widths) > maxw:
                continue
            mean = sum(widths) / L
            cost = sum((w - mean) ** 2 for w in widths)
            cost += sum(4e4 for l in lines[:-1] if re.sub(r"[^\w']", '', l.split()[-1].lower()) in WEAK_END)
            if best_cost is None or cost < best_cost:
                best, best_cost = lines, cost
        out += best
    return out


def safe_rect(cfg, ratio):
    W, H = RATIOS[ratio]
    s = cfg.safe.get(ratio, {})
    return (int(round(W * float(s.get('left', 0.111)))), int(round(H * float(s.get('top', 0.13)))),
            int(round(W * (1 - float(s.get('right', 0.15))))), int(round(H * (1 - float(s.get('bottom', 0.229))))))


def draw_box(cfg, ratio, text, kind, max_lines=None):
    """An RGBA layer with one text box: 'caption' (white on ink, bottom of the safe area),
    'title' (ink on white, top of the safe area) or 'reg' (caption style, may run to more lines)."""
    from PIL import Image, ImageDraw
    W, H = RATIOS[ratio]
    st = cfg.style
    x0, y0, x1, y1 = safe_rect(cfg, ratio)
    if kind == 'title':
        size, fg, bg, op = float(st.get('title_size', 0.066)), st.get('title_text', '#0B1F1C'), st.get('title_box', '#FFFFFF'), float(st.get('title_box_opacity', 1.0))
        max_lines = max_lines or 3
    else:
        size, fg, bg, op = float(st.get('caption_size', 0.059)), st.get('caption_text', '#FFFFFF'), st.get('caption_box', '#0B1F1C'), float(st.get('caption_box_opacity', 0.88))
        max_lines = max_lines or (int(st.get('caption_max_lines', 2)) if kind == 'caption' else 8)
    padx, pady = int(W * float(st.get('box_pad_x', 0.026))), int(W * float(st.get('box_pad_y', 0.014)))
    px = int(round(W * size))
    for _ in range(8):
        font = load_font(cfg, px)
        lines = wrap(font, text, (x1 - x0) - 2 * padx)
        if len(lines) <= max_lines and all(font.getlength(l) <= (x1 - x0) - 2 * padx for l in lines):
            break
        px = int(px * 0.93)
    asc, desc = font.getmetrics()
    lh = int(round(px * float(st.get('line_height', 1.18))))
    content_h = (len(lines) - 1) * lh + asc + desc
    bw = int(max(font.getlength(l) for l in lines)) + 2 * padx
    bh = content_h + 2 * pady
    cx = (x0 + x1) // 2
    bx0 = cx - bw // 2
    by0 = y0 if kind == 'title' else y1 - bh
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([bx0, by0, bx0 + bw, by0 + bh], radius=int(W * float(st.get('box_radius', 0.018))),
                        fill=hexrgb(bg, op))
    for i, l in enumerate(lines):
        d.text((cx, by0 + pady + asc + i * lh), l, font=font, fill=hexrgb(fg), anchor='ms')
    return im, [bx0, by0, bx0 + bw, by0 + bh], px, len(lines)


def text_events(cfg, v, plan, captions):
    fps = cfg.fps
    q = lambda t: round(round(t * fps) / fps, 4)
    T = plan['duration']
    ev = [{'id': 'c%d' % i, 'kind': 'caption', 'text': c['text'], 't0': c['t0'], 't1': c['t1']} for i, c in enumerate(captions)]
    spans = {s['line']: s for s in plan['lines']}
    if v.get('frame1_text') and 1 in spans:
        txt = v['frame1_text']
        ev.append({'id': 'f1', 'kind': 'title', 'text': txt, 't0': 0.0,
                   't1': q(min(T, max(spans[1]['t1'], cfg.reading_time(txt))))})
    for i, o in enumerate(v['overlays']):
        if o['line'] in spans:
            s = spans[o['line']]
            ev.append({'id': 'o%d' % i, 'kind': 'title', 'text': o['text'], 't0': q(s['t0']),
                       't1': q(min(T, max(s['t1'], s['t0'] + cfg.reading_time(o['text']))))})
    if plan.get('reg'):
        ev.append({'id': 'reg', 'kind': 'reg', 'text': cfg.reg['text'], 't0': plan['reg']['t0'], 't1': T})
    # two titles at once (a long frame-1 hold running into an overlay) would collide: the later one wins
    titles = sorted([e for e in ev if e['kind'] == 'title'], key=lambda e: e['t0'])
    for a, b in zip(titles, titles[1:]):
        if a['t1'] > b['t0']:
            a['t1'] = b['t0']
    return [e for e in ev if e['t1'] > e['t0']]


def render_layer(cfg, ratio, events, T, outdir):
    """Text as one RGBA image per state, chained with ffconcat durations on the frame grid."""
    from PIL import Image
    fps = cfg.fps
    outdir.mkdir(parents=True, exist_ok=True)
    for f in outdir.glob('*.png'):
        f.unlink()
    W, H = RATIOS[ratio]
    nT = int(round(T * fps))
    bounds = sorted({0, nT} | {int(round(e['t0'] * fps)) for e in events} | {int(round(e['t1'] * fps)) for e in events})
    bounds = [b for b in bounds if 0 <= b <= nT]
    boxes, cache, entries = {}, {}, []
    for a, b in zip(bounds, bounds[1:]):
        if b <= a:
            continue
        mid = (a + 0.5) / fps
        active = [e for e in events if e['t0'] <= mid < e['t1']]
        key = tuple(sorted(e['id'] for e in active))
        if key not in cache:
            im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            for e in active:
                layer, box, px, nl = draw_box(cfg, ratio, e['text'], e['kind'])
                boxes[e['id']] = {'box': box, 'px': px, 'lines': nl, 'kind': e['kind'], 'text': e['text']}
                im = Image.alpha_composite(im, layer)
            path = outdir / ('state%03d.png' % len(cache))
            im.save(path)
            cache[key] = path
        entries.append((cache[key], b - a))
    lst = outdir / 'layer.ffconcat'
    with open(lst, 'w') as f:
        f.write('ffconcat version 1.0\n')
        for path, n in entries:
            f.write("file '%s'\nduration %.6f\n" % (path.name, n / fps))
        f.write("file '%s'\n" % entries[-1][0].name)
    return lst, boxes


def write_srt(path, captions):
    def ts(t):
        ms = int(round(t * 1000))
        return '%02d:%02d:%02d,%03d' % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)
    with open(path, 'w', encoding='utf-8') as f:
        for i, c in enumerate(captions, 1):
            f.write('%d\n%s --> %s\n%s\n\n' % (i, ts(c['t0']), ts(c['t1']), c['text']))


# ------------------------------------------------------------------ render

def crop_for(clip, face, ratio):
    """Crop window in display pixels: full height (or width), centred on the face."""
    W, H = clip['w'], clip['h']
    A = RATIOS[ratio][0] / RATIOS[ratio][1]
    cx = face['cx'] if face and face.get('cx') is not None else 0.5
    cy = face['cy'] if face and face.get('cy') is not None else 0.42
    if W / H > A:
        ch = H // 2 * 2
        cw = int(round(H * A / 2)) * 2
        x0 = int(min(max(0, cx * W - cw / 2), W - cw))
        y0 = 0
    else:
        cw = W // 2 * 2
        ch = int(round(W / A / 2)) * 2
        x0 = 0
        y0 = int(min(max(0, cy * H - 0.40 * ch), H - ch))
    return cw, ch, x0 // 2 * 2, y0 // 2 * 2


def measure_f32(path, channels=2):
    """Integrated loudness (LUFS) and true peak (dBTP) of a raw float32 file."""
    p = run(['ffmpeg', '-hide_banner', '-nostats', '-f', 'f32le', '-ar', SR, '-ac', channels, '-i', path,
             '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    s = p.stderr[p.stderr.rfind('Summary:'):]
    I = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', s)
    tp = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', s)
    num = lambda m: float(m.group(1)) if m and m.group(1) != '-inf' else -99.0
    return num(I), num(tp)


def build_audio(cfg, plan, outdir):
    """The program: segments cut from each clip's noise-reduced audio, each line's speech
    level matched, 6 ms fades at every join, centred in stereo, then gain and a lookahead
    limiter until it measures the target loudness with the true peak under its ceiling.
    The stereo file is what is measured: a mono voice in both channels reads 3 LU louder
    than the same voice measured as mono. Returns the final stereo float32 file."""
    fps = cfg.fps
    spf = SR // fps
    parts, cache = [], {}
    fade = int(0.006 * SR)
    ramp = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fade))).astype(np.float32)
    for seg in plan['timeline']:
        n = seg['n'] * spf
        if seg['kind'] == 'still':
            parts.append(np.zeros(n, np.float32))
            continue
        if seg['clip'] not in cache:
            cache[seg['clip']] = read_f32(cfg.p('clips', seg['clip'], 'nr.f32'))
        x = cache[seg['clip']]
        a = int(round(seg['s'] * SR))
        y = np.zeros(n, np.float32)
        chunk = x[a:a + n]
        y[:len(chunk)] = chunk
        y *= np.float32(10 ** (seg.get('gain_db', 0.0) / 20))
        y[:fade] *= ramp
        y[-fade:] *= ramp[::-1]
        if seg.get('tail'):
            k = min(n, int(0.3 * SR))
            y[-k:] *= np.linspace(1, 0, k, dtype=np.float32)
        parts.append(y)
    prog = np.concatenate(parts) if parts else np.zeros(spf, np.float32)
    outdir.mkdir(parents=True, exist_ok=True)
    raw = outdir / 'program_raw.f32'
    np.repeat(prog[:, None], 2, axis=1).astype('<f4').tofile(raw)
    I_t, tp_t = float(cfg.audio.get('lufs', -14.0)), float(cfg.audio.get('true_peak', -2.0))
    ceiling = 10 ** ((tp_t - 0.5) / 20)
    final = outdir / 'program.f32'
    I0, _ = measure_f32(raw)
    gain = I_t - I0 if I0 > -70 else 0.0
    for _ in range(5):
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', SR, '-ac', 2, '-i', raw, '-af',
             'volume=%.3fdB,alimiter=limit=%.5f:attack=2:release=60:level=false:latency=true' % (gain, ceiling),
             '-f', 'f32le', '-ar', SR, '-ac', 2, final])
        I, tp = measure_f32(final)
        if abs(I - I_t) <= 0.15 and tp <= tp_t + 0.05:
            break
        gain += I_t - I
    y = read_f32(final)
    want = 2 * len(prog)
    if len(y) != want:
        y = np.concatenate([y, np.zeros(max(0, want - len(y)), np.float32)])[:want]
        y.astype('<f4').tofile(final)
    plan['audio'] = {'lufs': round(I, 2), 'true_peak': round(tp, 2), 'gain_db': round(gain, 2)}
    return final


def render_segments(cfg, plan, clips, takes_face, ratio, outdir):
    fps = cfg.fps
    W, H = RATIOS[ratio]
    outdir.mkdir(parents=True, exist_ok=True)
    for f in outdir.glob('seg*.mp4'):
        f.unlink()
    enc = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-bf', '0', '-g', str(fps), '-r', str(fps),
           '-pix_fmt', 'yuv420p', '-video_track_timescale', str(fps * 512), '-an']
    files = []
    for i, seg in enumerate(plan['timeline']):
        c = clips[seg['clip']]
        cw, ch, x0, y0 = crop_for(c, takes_face.get(seg['take']), ratio)
        vf = '%sfps=%d,crop=%d:%d:%d:%d,scale=%d:%d:flags=lanczos,setsar=1,format=yuv420p' % (
            vfilter_pre(cfg, c), fps, cw, ch, x0, y0, W, H)
        out = outdir / ('seg%03d.mp4' % i)
        if seg['kind'] == 'still':
            png = outdir / ('still%03d.png' % i)
            run(['ffmpeg', '-v', 'error', '-y', '-ss', '%.4f' % seg['s'], '-i', c['path'], '-map', '0:v:0',
                 '-frames:v', '1', '-vf', vf, png])
            run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-framerate', str(fps), '-i', png,
                 '-frames:v', str(seg['n'])] + enc + [out])
        else:
            run(['ffmpeg', '-v', 'error', '-y', '-ss', '%.4f' % seg['s'], '-i', c['path'], '-map', '0:v:0',
                 '-vf', vf, '-frames:v', str(seg['n'])] + enc + [out])
        files.append(out)
    lst = outdir / 'segments.txt'
    with open(lst, 'w') as f:
        for p in files:
            f.write("file '%s'\n" % str(p).replace("'", "'\\''"))
    return lst


def encode_final(cfg, seg_list, audio, layer, T, out):
    fps = cfg.fps
    fc = ('[2:v]fps=%d,format=rgba,scale=out_color_matrix=bt709:out_range=tv,format=yuva444p[t];'
          '[0:v]setpts=PTS-STARTPTS,format=yuv444p[b];'
          '[b][t]overlay=0:0:format=yuv444:eof_action=repeat,format=yuv420p[v]') % fps
    run(['ffmpeg', '-v', 'error', '-y',
         '-f', 'concat', '-safe', '0', '-i', seg_list,
         '-f', 'f32le', '-ar', SR, '-ac', 2, '-i', audio,
         '-f', 'concat', '-safe', '0', '-i', layer,
         '-filter_complex', fc, '-map', '[v]', '-map', '1:a', '-frames:v', str(int(round(T * fps))),
         '-c:v', 'libx264', '-preset', 'slow', '-crf', str(int(cfg.edit.get('crf', 18))), '-profile:v', 'high',
         '-pix_fmt', 'yuv420p', '-r', str(fps), '-g', str(2 * fps), '-sc_threshold', '0',
         '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
         '-c:a', 'aac', '-b:a', '192k', '-ar', SR, '-movflags', '+faststart', '-t', '%.6f' % T, out])


def video_status(cfg, v, plan, takes, picks):
    """ready / flagged / blocked, with the reasons. The words checked are the words in the cut,
    so a line built from two takes is checked as built. Nothing is hidden: every deviation is listed."""
    flags = []
    status = plan['status']
    for p in plan['problems']:
        flags.append(('RESHOOT', p))
    for k in range(1, len(v['lines']) + 1):
        pk = picks.get('v%d.%d' % (v['n'], k))
        if not pk or not pk.get('parts'):
            continue
        ids = ' + '.join(x['take'] for x in pk['parts'])
        whole = len(pk['parts']) == 1 and not any(x in pk['parts'][0] for x in ('from_word', 'to_word'))
        tx = classify(v['lines'][k - 1], [w for w in plan['words'] if w['line'] == k])
        if whole:
            tx['stumbles'] += [x for x in takes[pk['parts'][0]['take']]['text']['stumbles'] if x.startswith('possible')]
        else:
            flags.append(('CHECK', 'line %d is cut from %s: listen to the join' % (k, ids)))
        any_clean = any(t.get('clean') for t in takes.values() if t['video'] == v['n'] and t['line'] == k)
        if tx['hard']:
            status = 'blocked'
            flags.append(('RESHOOT', 'line %d (%s): %s' % (k, ids, '; '.join(tx['figures']) or
                                                         'line incomplete, %d%% of the words' % round(100 * tx['coverage']))))
        if tx['wording']:
            status = 'flagged' if status == 'ready' else status
            flags.append(('WORDING', 'line %d (%s): %s' % (k, ids, '; '.join(tx['wording']))))
        if tx['stumbles']:
            status = 'flagged' if status == 'ready' else status
            flags.append(('RESHOOT?' if not any_clean else 'STUMBLE', 'line %d (%s): %s (%s)' % (
                k, ids, '; '.join(tx['stumbles']), 'no clean take of this line' if not any_clean else 'picked by hand over a clean take')))
        if tx['minor']:
            flags.append(('MINOR', 'line %d (%s): %s' % (k, ids, '; '.join(tx['minor']))))
        if tx['lowconf']:
            flags.append(('LISTEN', 'line %d (%s): whisper unsure of %s' % (k, ids, ', '.join('"%s"' % w for w in tx['lowconf']))))
    if not cfg.reg.get('approved'):
        flags.append(('COMPLIANCE', 'regulator line is a draft, not approved by Gresham compliance'))
    return status, flags


def cmd_render(cfg, args):
    rk = jload(cfg.p('ranking.json'))
    picks = jload(cfg.p('picks.json'))
    if not rk or picks is None:
        raise Fail('no ranking yet: run "rank" first')
    takes = {t['id']: t for t in rk['takes']}
    clips = {c['id']: c for c in selected_clips(cfg)}
    faces = {tid: t.get('face') for tid, t in takes.items()}
    only = set(getattr(args, 'video', None) or [])
    cfg.finals.mkdir(parents=True, exist_ok=True)
    results = {}
    for v in cfg.videos:
        if not v['enabled'] or (only and v['n'] not in only):
            continue
        plan = plan_video(cfg, v, takes, picks, clips)
        status, flags = video_status(cfg, v, plan, takes, picks)
        plan['status'], plan['flags'] = status, flags
        rdir = cfg.p('render', 'v%d' % v['n'])
        # an earlier render of this video must not survive next to this one (a stale "ready"
        # final beside a blocked one could be posted); only our own output files are removed
        for old in list(cfg.finals.glob('pensionbuddy-v%d-*.mp4' % v['n'])) + \
                list(cfg.finals.glob('pensionbuddy-v%d.srt' % v['n'])) + \
                list((cfg.finals / '_blocked').glob('pensionbuddy-v%d-*' % v['n'])) + \
                list((cfg.finals / '_blocked').glob('pensionbuddy-v%d.srt' % v['n'])):
            old.unlink()
        if not plan['timeline']:
            jsave(rdir / 'plan.json', plan)
            say('video %d: nothing to render (%s)' % (v['n'], '; '.join(plan['problems'])))
            results[v['n']] = plan
            continue
        disp = []
        for k in range(1, len(v['lines']) + 1):
            lw = [w for w in plan['words'] if w['line'] == k]
            for d in display_words(lw, cfg.display):
                d['line'] = k
                disp.append(d)
        captions = chunk_captions(cfg, disp)
        plan['captions'] = captions
        events = text_events(cfg, v, plan, captions)
        plan['events'] = events
        audio = build_audio(cfg, plan, rdir)
        dest = cfg.finals if status != 'blocked' else cfg.finals / '_blocked'
        dest.mkdir(parents=True, exist_ok=True)
        tag = '' if status != 'blocked' else '-BLOCKED'
        plan['outputs'] = {}
        for ratio in RATIOS:
            layer, boxes = render_layer(cfg, ratio, events, plan['duration'], rdir / ('layer-' + ratio))
            segs = render_segments(cfg, plan, clips, faces, ratio, rdir / ('segs-' + ratio))
            out = dest / ('pensionbuddy-v%d-%s%s.mp4' % (v['n'], ratio, tag))
            encode_final(cfg, segs, audio, layer, plan['duration'], out)
            plan['outputs'][ratio] = {'file': str(out), 'boxes': boxes, 'layer': str(layer.parent)}
            say('video %d %s: %s (%.1f s)' % (v['n'], ratio, out, plan['duration']))
        srt = dest / ('pensionbuddy-v%d%s.srt' % (v['n'], tag))
        write_srt(srt, captions)
        plan['srt'] = str(srt)
        edl = {'fps': cfg.fps, 'segments': [{'clip': s['clip'], 'kind': s['kind'], 'src_start': s['s'], 'src_end': s['e'],
                                             'out_start': s['out'], 'frames': s['n']} for s in plan['timeline']],
               'clip_names': {cid: clips[cid]['name'] for cid in {s['clip'] for s in plan['timeline']}}}
        jsave(rdir / 'edl.json', edl)
        jsave(rdir / 'plan.json', plan)
        results[v['n']] = plan
        say('video %d: %s%s' % (v['n'], status.upper(), '' if not flags else ' (%d flags)' % len(flags)))
    return results


# ------------------------------------------------------------------ qc

def decode_audio(path, sr=SR):
    """(stereo samples, mono mean): the mean, not ffmpeg's downmix, so dual mono stays at its level."""
    p = run(['ffmpeg', '-v', 'error', '-i', path, '-map', '0:a:0', '-af', 'pan=stereo|c0=c0|c1=c1',
             '-ar', str(sr), '-f', 'f32le', '-'], binary=True)
    x = np.frombuffer(p.stdout, np.float32)
    x = x[:len(x) // 2 * 2].reshape(-1, 2)
    return x, x.mean(axis=1)


def loudness(path):
    p = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-map', '0:a:0', '-af', 'ebur128=peak=true',
             '-f', 'null', '-'])
    s = p.stderr[p.stderr.rfind('Summary:'):]
    I = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', s)
    tp = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', s)
    return (float(I.group(1)) if I else None), (float(tp.group(1)) if tp else None)


def black_frames(path):
    p = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-map', '0:v:0', '-vf',
             'blackdetect=d=0.03:pix_th=0.08', '-an', '-f', 'null', '-'])
    return [(float(a), float(b)) for a, b in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', p.stderr)]


def pops_at_joins(x, joins, sr=SR):
    """Largest sample-to-sample step within 3 ms of a join, against the largest step in the
    50 ms either side of it. Hiss or speech moves as much on both sides; a click stands out."""
    worst = (0.0, None)
    d = np.abs(np.diff(x))
    w3, w50 = int(0.003 * sr), int(0.05 * sr)
    for t in joins:
        i = int(round(t * sr))
        a, b = max(0, i - w3), min(len(d), i + w3)
        ctx = np.concatenate([d[max(0, i - w50):a], d[b:min(len(d), i + w50)]])
        if b <= a or not len(ctx):
            continue
        step = float(d[a:b].max())
        r = step / (float(ctx.max()) + 1e-4) if step > 0.01 else 0.0
        if r > worst[0]:
            worst = (r, t)
    return worst


def final_analysis(path):
    stereo, mono = decode_audio(path)
    _, m16 = decode_audio(path, SR16)
    rms = frame_rms_db(mono, SR)
    per, f0 = periodicity(m16.astype(np.float32))
    n = min(len(rms), len(per))
    return stereo, mono, {'rms': rms[:n], 'per': per[:n], 'f0': f0[:n], 'floor': float(np.percentile(rms[:n], 10))}


def contact_sheet(cfg, path, ratio, out, every=1.0):
    W, H = RATIOS[ratio]
    x0, y0, x1, y1 = safe_rect(cfg, ratio)
    guides = 'drawbox=x=%d:y=%d:w=%d:h=%d:color=red:t=6' % (x0, y0, x1 - x0, y1 - y0)
    p = probe(path)
    dur = float(p['format']['duration'])
    n = int(dur / every) + 1
    cols = 6
    rows = math.ceil(n / cols)
    run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vf',
         'fps=1/%g,%s,scale=%d:-2,tile=%dx%d:padding=6:color=white' % (every, guides, 300, cols, rows),
         '-frames:v', '1', '-q:v', '3', out])


def cmd_qc(cfg, args):
    results = {}
    lines_md = ['# QC', '']
    allok = True
    for v in cfg.videos:
        if not v['enabled']:
            continue
        rdir = cfg.p('render', 'v%d' % v['n'])
        plan = jload(rdir / 'plan.json')
        if not plan or not plan.get('outputs'):
            continue
        qdir = cfg.p('qc')
        qdir.mkdir(parents=True, exist_ok=True)
        fps = cfg.fps
        joins = [s['out'] for s in plan['timeline'][1:]]
        # what the final says, heard fresh, against the captions
        first = list(plan['outputs'].values())[0]['file']
        wav = rdir / 'final16.wav'
        run(['ffmpeg', '-v', 'error', '-y', '-i', first, '-map', '0:a:0', '-ac', '1', '-ar', SR16, '-c:a', 'pcm_s16le', wav])
        heard = run_whisper(cfg, wav, rdir / 'final_whisper')
        heard2 = run_whisper(cfg, wav, rdir / 'final_whisper2', model=cfg.second_model) if cfg.second_model else None
        cap_tokens = [t for t in normalize([w for c in plan['captions'] for w in c['text'].split()]) if not t['filler']]
        cap_words = [w for c in plan['captions'] for w in c['text'].split()]
        hd_tokens = [t for t in normalize([w['text'] for w in heard]) if not t['filler']]
        A, B = [t['t'] for t in cap_tokens], [t['t'] for t in hd_tokens]
        cap_diffs = []
        for op, a0, a1, b0, b1 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
            if op != 'equal':
                aw = ' '.join(cap_words[k] for k in sorted({cap_tokens[i]['a'] for i in range(a0, a1)}))
                bw = ' '.join(heard[k]['text'] for k in sorted({hd_tokens[i]['a'] for i in range(b0, b1)}))
                at = plan['captions'][0]['t0']
                if b1 > b0:
                    at = heard[hd_tokens[b0]['a']]['t0']
                elif a0 < len(cap_tokens):
                    k = cap_tokens[a0]['a']
                    acc = 0
                    for c in plan['captions']:
                        if acc + len(c['text'].split()) > k:
                            at = c['t0']
                            break
                        acc += len(c['text'].split())
                second = ''
                if heard2 is not None:
                    seg = ' '.join(w['text'] for w in heard2 if abs(w['t0'] - at) < 1.0)
                    second = ' (second model: "%s")' % seg
                cap_diffs.append('%s: captions "%s", audio "%s"%s' % (mmss(at), aw, bw, second))
        # figures per line, from the fresh transcript
        fig_diffs = []
        for span in plan['lines']:
            want = [t['t'] for t in script_tokens(v['lines'][span['line'] - 1]) if t['num']]
            got_words = [w['text'] for w in heard if span['t0'] - 0.1 <= 0.5 * (w['t0'] + w['t1']) <= span['t1'] + 0.1]
            got = [t['t'] for t in normalize(got_words) if t['num']]
            if want != got:
                fig_diffs.append('line %d: script %s, audio %s' % (span['line'], want or '-', got or '-'))
        for ratio, o in plan['outputs'].items():
            f = o['file']
            chk = []

            def c(name, ok, detail='', level='FAIL'):
                chk.append({'check': name, 'result': 'PASS' if ok else level, 'detail': detail})

            pr = probe(f)
            vs = next(s for s in pr['streams'] if s['codec_type'] == 'video')
            aus = next((s for s in pr['streams'] if s['codec_type'] == 'audio'), {})
            W, H = RATIOS[ratio]
            c('format', vs['width'] == W and vs['height'] == H and vs['codec_name'] == 'h264' and
              abs(rate(vs['avg_frame_rate']) - fps) < 0.01 and vs.get('pix_fmt') == 'yuv420p' and aus.get('codec_name') == 'aac',
              '%sx%s %s %s fps %s, audio %s %s Hz' % (vs['width'], vs['height'], vs['codec_name'], round(rate(vs['avg_frame_rate']), 3),
                                                       vs.get('pix_fmt'), aus.get('codec_name'), aus.get('sample_rate')))
            nb = run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries',
                      'stream=nb_read_packets', '-of', 'csv=p=0', f]).stdout.strip()
            want_frames = sum(s['n'] for s in plan['timeline'])
            c('frame count', nb.isdigit() and int(nb) == want_frames, '%s frames, plan %d' % (nb, want_frames))
            I, tp = loudness(f)
            c('loudness', I is not None and abs(I - float(cfg.audio.get('lufs', -14))) <= 0.5,
              '%.1f LUFS (target %.0f)' % (I if I is not None else float('nan'), float(cfg.audio.get('lufs', -14))))
            c('true peak', tp is not None and tp <= -1.0, '%.1f dBTP (limit -1.0)' % (tp if tp is not None else float('nan')))
            stereo, x, an = final_analysis(f)
            clipped = int(np.sum(np.abs(stereo) >= 0.999))
            c('clipping', clipped == 0, '%d samples at full scale' % clipped)
            r, at = pops_at_joins(x, joins)
            c('pops at cuts', r < 3.0, 'worst step %.1fx the largest nearby%s' % (r, '' if at is None else ' at ' + mmss(at)))
            bl = black_frames(f)
            c('black frames', not bl, ', '.join('%s-%s' % (mmss(a), mmss(b)) for a, b in bl) or 'none')
            speech_end = plan['reg']['t0'] if plan.get('reg') else plan['duration']
            spoken = [w for w in heard if w['t0'] < speech_end]
            isl, _, ref = speech_islands(an, 0.0, speech_end + 0.05, spoken)
            onset = isl[0][0] if isl else None
            c('line 1 starts', onset is not None and onset <= 0.5, 'first sound at %.2f s' % (onset if onset is not None else -1))
            lim = cfg.e('max_pause', 0.30) + 0.04
            gaps = [(a_['t1'], b_['t0'] - a_['t1']) for a_, b_ in zip(ref, ref[1:]) if b_['t0'] - a_['t1'] > lim]
            c('pauses', not gaps, ', '.join('%.2f s after %s' % (g, mmss(t)) for t, g in gaps)
              or 'none over %.2f s between words' % cfg.e('max_pause', 0.30))
            x0, y0, x1, y1 = safe_rect(cfg, ratio)
            out_of = []
            from PIL import Image
            for png in sorted(Path(o['layer']).glob('state*.png')):
                bb = Image.open(png).getchannel('A').getbbox()
                if bb and (bb[0] < x0 - 1 or bb[1] < y0 - 1 or bb[2] > x1 + 1 or bb[3] > y1 + 1):
                    out_of.append('%s %s' % (png.name, bb))
            c('safe zone', not out_of, '; '.join(out_of) or 'all text inside %s' % ([x0, y0, x1, y1],))
            c('captions = audio', not cap_diffs, '; '.join(cap_diffs) or 'word for word')
            c('figures = script', not fig_diffs, '; '.join(fig_diffs) or 'all figures and dates match')
            sizes = [c_['words'] for c_ in plan['captions']]
            bad = [c_['text'] for c_ in plan['captions'] if not 2 <= c_['words'] <= 5]
            c('caption length', not bad, '; '.join(bad) or '%d captions, %d-%d words' % (len(sizes), min(sizes), max(sizes)), level='WARN')
            caps_up = [w for c_ in plan['captions'] for w in c_['text'].split()
                       if re.sub(r'\W', '', w).isupper() and len(re.sub(r'\W', '', w)) > 4]
            c('no all-caps', not caps_up, ', '.join(caps_up) or 'none', level='WARN')
            for e in plan.get('events', []):
                if e['kind'] in ('title', 'reg'):
                    need = cfg.reading_time(e['text'])
                    have = e['t1'] - e['t0']
                    c('reading time: %s' % ('regulator line' if e['kind'] == 'reg' else e['text'][:30]), have >= need - 0.05,
                      'on screen %.1f s, needs %.1f s (max(2.0, 1.0 + 0.3 a word))' % (have, need), level='WARN')
            sheet = qdir / ('v%d-%s-sheet.jpg' % (v['n'], ratio))
            contact_sheet(cfg, f, ratio, sheet)
            ok = all(x_['result'] != 'FAIL' for x_ in chk)
            allok &= ok
            results['v%d-%s' % (v['n'], ratio)] = {'file': f, 'ok': ok, 'checks': chk, 'sheet': str(sheet)}
            lines_md.append('## %s  %s' % (os.path.basename(f), 'PASS' if ok else 'FAIL'))
            lines_md += ['- %s: %s. %s' % (x_['check'], x_['result'], x_['detail']) for x_ in chk]
            lines_md += ['- contact sheet: %s' % sheet, '']
    jsave(cfg.p('qc', 'qc.json'), results)
    (cfg.p('qc', 'qc.md')).write_text('\n'.join(lines_md), encoding='utf-8')
    say('\n'.join(lines_md))
    return allok


# ------------------------------------------------------------------ report

def tc_at(clip, t):
    tc = clip.get('timecode')
    if not tc:
        return None
    m = re.fullmatch(r'(\d+):(\d+):(\d+)[:;.](\d+)', tc)
    if not m:
        return None
    fps = clip.get('fps') or 25
    nf = int(round(fps))
    h, mi, s, f = map(int, m.groups())
    total = ((h * 60 + mi) * 60 + s) * nf + f + int(round(t * fps))
    return '%02d:%02d:%02d:%02d' % (total // (3600 * nf) % 24, total // (60 * nf) % 60, total // nf % 60, total % nf)


def cmd_report(cfg, args):
    rk = jload(cfg.p('ranking.json'))
    picks = jload(cfg.p('picks.json'), {})
    if not rk:
        raise Fail('nothing to report: run "rank" and "render" first')
    takes = {t['id']: t for t in rk['takes']}
    clips = {c['id']: c for c in selected_clips(cfg)}
    qc = jload(cfg.p('qc', 'qc.json'), {})
    cfg.finals.mkdir(parents=True, exist_ok=True)
    flags_md = ['# Pensionbuddy: flag list', '', 'Made %s. Nothing here is hidden or smoothed over.' % datetime.now().strftime('%Y-%m-%d %H:%M'), '']
    for v in cfg.videos:
        if not v['enabled']:
            flags_md += ['## Video %d: %s' % (v['n'], v['title']), '', '- NOT MADE: no script in the brief.', '']
            continue
        plan = jload(cfg.p('render', 'v%d' % v['n'], 'plan.json'), {})
        status = plan.get('status', 'not rendered')
        log = ['# Video %d: %s, take log' % (v['n'], v['title']), '', 'Status: **%s**' % status.upper(), '',
               '| Line | Clip | Timecode | Why this take | Second best |', '|---|---|---|---|---|']
        for k, line in enumerate(v['lines'], 1):
            pk = picks.get('v%d.%d' % (v['n'], k))
            group = sorted([t for t in takes.values() if t['video'] == v['n'] and t['line'] == k], key=lambda t: t['rank'])
            if not pk:
                log.append('| %d | none | | no take found | |' % k)
                continue
            for part in pk['parts']:
                t = takes[part['take']]
                c = clips[t['clip']]
                s0, s1 = span(t)
                tc = tc_at(c, s0)
                tcs = '%s-%s%s' % (mmss(s0), mmss(s1), (' (TC %s)' % tc) if tc else '')
                why = why_text(t) + ('. ' + t['note'] if t.get('note') else '') + (('. Picked by hand: ' + pk.get('reason', '')) if pk.get('manual') else '')
                second = [g for g in group if g['id'] != t['id']]
                sec = ('%s %s %s: %s' % (second[0]['id'], second[0]['name'], mmss(span(second[0])[0]), why_lower(t, second[0]))) if second else 'none (only take)'
                log.append('| %d | %s (%s) | %s | %s | %s |' % (k, c['name'], t['id'], tcs, why.replace('|', '/'), sec.replace('|', '/')))
        log.append('')
        if plan.get('outputs'):
            log.append('Files: ' + ', '.join(os.path.basename(o['file']) for o in plan['outputs'].values()) + ', ' + os.path.basename(plan.get('srt', '')))
        (cfg.finals / ('pensionbuddy-v%d-take-log.md' % v['n'])).write_text('\n'.join(log) + '\n', encoding='utf-8')
        flags_md += ['## Video %d: %s (%s)' % (v['n'], v['title'], status.upper()), '']
        fl = plan.get('flags', [])
        for kind, text in fl:
            flags_md.append('- %s: %s' % (kind, text))
        for key, r in sorted(qc.items()):
            if key.startswith('v%d-' % v['n']):
                for x in r['checks']:
                    if x['result'] != 'PASS':
                        flags_md.append('- QC %s %s (%s): %s' % (x['result'], x['check'], key.split('-', 1)[1], x['detail']))
        if not fl and not any(x['result'] != 'PASS' for key, r in qc.items() if key.startswith('v%d-' % v['n']) for x in r['checks']):
            flags_md.append('- none')
        flags_md.append('')
    um = rk.get('unmatched', [])
    flags_md += ['## Clips that match no script line (not used)', '']
    flags_md += ['- %s%s: "%s"' % (u['name'], ' (rest of the clip)' if u.get('partial') else '', u['heard'][:160]) for u in um] or ['- none']
    flags_md.append('')
    (cfg.finals / 'pensionbuddy-flags.md').write_text('\n'.join(flags_md), encoding='utf-8')
    say('\n'.join(flags_md))
    say('take logs and flags written to %s' % cfg.finals)


# ------------------------------------------------------------------ check

def glyph_missing(font, ch):
    try:
        a = font.getmask(ch).getbbox()
        b = font.getmask('\uffff').getbbox()
    except Exception:
        return True
    return a is None or (a == b and bytes(font.getmask(ch)) == bytes(font.getmask('\uffff')))


def cmd_check(cfg, args):
    rows = []

    def row(name, status, detail='', fix=''):
        rows.append((name, status, detail, fix))

    row('python', 'OK' if sys.version_info >= (3, 9) else 'FAIL', sys.version.split()[0], 'Python 3.9 or later')
    try:
        import PIL
        from PIL import features
        row('Pillow', 'OK' if features.check('freetype2') else 'FAIL', PIL.__version__, 'pip install pillow')
    except ImportError:
        row('Pillow', 'FAIL', 'missing', 'pip install pillow')
    try:
        import cv2
        row('OpenCV', 'OK', cv2.__version__)
    except ImportError:
        row('OpenCV', 'WARN', 'missing: no face or eye-line check, centre crop', 'pip install opencv-python-headless')
    for b in ('ffmpeg', 'ffprobe'):
        p = shutil.which(b)
        row(b, 'OK' if p else 'FAIL', p or 'not on PATH', 'brew install ffmpeg')
    if shutil.which('ffmpeg'):
        filters = run(['ffmpeg', '-hide_banner', '-filters']).stdout
        need = ['afftdn', 'loudnorm', 'ebur128', 'blackdetect', 'highpass', 'overlay', 'bwdif', 'crop', 'scale',
                'fps', 'drawbox', 'pan', 'tile']
        miss = [f for f in need if not re.search(r'\s%s\s' % f, filters)]
        encs = run(['ffmpeg', '-hide_banner', '-encoders']).stdout
        miss += [e for e in ('libx264', 'aac') if not re.search(r'\s%s\s' % e, encs)]
        row('ffmpeg filters', 'FAIL' if miss else 'OK', ', '.join(miss) or 'all present', 'brew reinstall ffmpeg')
    wb = find_whisper(cfg)
    row('whisper.cpp', 'OK' if wb else 'FAIL', wb or 'whisper-cli not found', 'brew install whisper-cpp')
    ok = cfg.model.exists() and cfg.model.stat().st_size > 50e6
    row('whisper model', 'OK' if ok else 'FAIL', str(cfg.model), 'setup_mac.sh downloads it')
    try:
        from PIL import ImageFont
        f = ImageFont.truetype(str(cfg.font), 64)
        miss = [ch for ch in '€%·’?' if glyph_missing(f, ch)]
        row('font', 'OK' if not miss else 'WARN', '%s%s' % (cfg.font.name, (' (no glyph for %s)' % ' '.join(miss)) if miss else ''))
    except (OSError, ImportError):
        row('font', 'FAIL', str(cfg.font), 'setup_mac.sh downloads Geist')
    row('face model', 'OK' if cfg.face_model.exists() else 'WARN', str(cfg.face_model), 'setup_mac.sh downloads it')
    row('source folder', 'OK' if cfg.source.is_dir() else 'FAIL', str(cfg.source))
    try:
        free = shutil.disk_usage(cfg.work if cfg.work.exists() else cfg.work.parent).free / 1e9
        row('disk space', 'OK' if free > 20 else 'WARN', '%.0f GB free' % free, 'need about 20 GB for 4K work files')
    except OSError:
        pass
    for v in cfg.videos:
        row('video %d' % v['n'], 'OK' if v['enabled'] else 'WARN',
            '%d lines' % len(v['lines']) if v['enabled'] else 'no script: will not be made')
    row('regulator line', 'OK' if cfg.reg.get('approved') else 'WARN',
        'approved' if cfg.reg.get('approved') else 'draft: needs Gresham compliance sign-off')
    width = max(len(r[0]) for r in rows)
    for name, st, detail, fix in rows:
        say('%-*s  %-4s  %s%s' % (width, name, st, detail, ('   fix: ' + fix) if st != 'OK' and fix else ''))
    return not any(r[1] == 'FAIL' for r in rows)


# ------------------------------------------------------------------ main

STEPS = ['inventory', 'transcribe', 'match', 'rank', 'render', 'qc', 'report']


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--brief', help='brief.toml (default: next to this script)')
    ap.add_argument('--source', help='folder with the camera files (default from the brief)')
    ap.add_argument('--work', help='work folder (default from the brief)')
    ap.add_argument('--finals', help='finals folder (default from the brief)')
    ap.add_argument('--whisper-bin', help='whisper.cpp binary')
    ap.add_argument('--model', help='whisper model file')
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('check')
    p = sub.add_parser('inventory')
    p.add_argument('--shoot', type=int, help='use this shoot number instead of the latest')
    p = sub.add_parser('transcribe')
    p.add_argument('--force', action='store_true')
    sub.add_parser('match')
    sub.add_parser('rank')
    p = sub.add_parser('pick', help='pick a take by hand: pick 2 3 T012 [T015:9-] --reason "..."')
    p.add_argument('video', type=int)
    p.add_argument('line', type=int)
    p.add_argument('take', nargs='+')
    p.add_argument('--reason', default='')
    p = sub.add_parser('render')
    p.add_argument('--video', type=int, action='append')
    sub.add_parser('qc')
    sub.add_parser('report')
    p = sub.add_parser('run')
    p.add_argument('--from', dest='start', choices=STEPS, default='inventory')
    p.add_argument('--until', choices=STEPS, default='report')
    p.add_argument('--shoot', type=int)
    p.add_argument('--force', action='store_true')
    p.add_argument('--video', type=int, action='append')
    args = ap.parse_args(argv)
    try:
        cfg = Cfg(args)
        cfg.work.mkdir(parents=True, exist_ok=True)
        if args.cmd == 'run':
            steps = STEPS[STEPS.index(args.start):STEPS.index(args.until) + 1]
            for s in steps:
                say('\n== %s ==' % s)
                r = globals()['cmd_' + s](cfg, args)
                if s == 'qc' and r is False:
                    say('QC found problems: see %s' % cfg.p('qc', 'qc.md'))
            return 0
        r = globals()['cmd_' + args.cmd](cfg, args)
        return 1 if r is False else 0
    except Fail as e:
        print('error: %s' % e, file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
