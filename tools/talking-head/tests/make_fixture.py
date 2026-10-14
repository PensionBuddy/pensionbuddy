#!/usr/bin/env python3
"""
A synthetic shoot for testing pb_edit.py. Text-to-speech takes of the brief's
lines, read word by word so the true word times are known: clean takes, takes
with a stumble, a wrong figure or a changed word, a clip holding two takes, an
off-script clip, an older shoot that must be ignored, and audio faults (one
channel silent, clipping, hiss). Writes the clips into --out/source and the
true word times into --out/truth for mock_whisper.py.

  python3 tests/make_fixture.py --out DIR [--tts espeak|say] [--face IMAGE]

Needs ffmpeg, numpy, and espeak-ng (Linux) or say (macOS).
"""
import argparse
import json
import os
import random
import re
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import pb_edit  # noqa: E402

SR = 48000
rng = random.Random(7)


def sh(cmd):
    p = subprocess.run([str(c) for c in cmd], capture_output=True)
    if p.returncode:
        raise SystemExit('failed: %s\n%s' % (' '.join(map(str, cmd[:8])), p.stderr.decode()[-1500:]))
    return p.stdout


class TTS:
    def __init__(self, kind, tmp):
        self.kind, self.tmp, self.cache = kind, tmp, {}
        tmp.mkdir(parents=True, exist_ok=True)
        if kind == 'espeak':
            voices = sh(['espeak-ng', '--voices=mb']).decode()
            self.voice = 'mb-en1' if 'mb-en1' in voices else 'en-gb'

    def word(self, text):
        spoken = re.sub(r'[^\w€%\'.,-]', '', text).strip('.,') or text
        if spoken in self.cache:
            return self.cache[spoken]
        raw = self.tmp / ('w%04d.wav' % len(self.cache))
        if self.kind == 'say':
            aiff = raw.with_suffix('.aiff')
            sh(['say', '-v', 'Daniel', '-r', '185', '-o', aiff, spoken])
            src = aiff
        else:
            sh(['espeak-ng', '-v', self.voice, '-s', '165', '-w', raw, spoken])
            src = raw
        x = np.frombuffer(sh(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', SR, '-f', 'f32le', '-']), np.float32)
        x = x / (np.max(np.abs(x)) + 1e-9) * 0.35
        loud = np.where(np.abs(x) > 0.004)[0]
        x = x[max(0, loud[0] - 240):loud[-1] + 480] if len(loud) else x
        self.cache[spoken] = x.astype(np.float32)
        return self.cache[spoken]


def breath(dur):
    n = int(dur * SR)
    noise = np.random.default_rng(len(str(dur))).normal(0, 1, n).astype(np.float32)
    k = np.ones(24, np.float32) / 24
    noise = noise - np.convolve(noise, k, 'same')
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    return (noise * env * 0.012).astype(np.float32)


def speak(tts, words, start, buf, truth):
    """Append words to buf (a list of arrays) from time start; record their true times."""
    t = start
    for w in words:
        x = tts.word(w)
        truth.append({'text': w, 't0': round(t, 3), 't1': round(t + len(x) / SR, 3),
                      'p': 0.55 if w.lower().strip('.,') in pb_edit.FILLERS else 0.96})
        buf.append(x)
        t += len(x) / SR
        if re.search(r'[.?!]$', w):
            gap = rng.uniform(0.48, 0.62)
            if gap > 0.55:
                g = np.zeros(int(gap * SR), np.float32)
                b = breath(0.26)
                o = int(0.12 * SR)
                g[o:o + len(b)] += b
                buf.append(g)
            else:
                buf.append(np.zeros(int(gap * SR), np.float32))
        elif re.search(r'[,:;]$', w):
            gap = rng.uniform(0.2, 0.26)
            buf.append(np.zeros(int(gap * SR), np.float32))
        else:
            gap = rng.uniform(0.03, 0.08)
            buf.append(np.zeros(int(gap * SR), np.float32))
        t += gap
    return t


def variant(line, kind):
    w = line.split()
    if kind == 'stumble':
        k = max(1, len(w) // 2)
        return w[:k] + ['um,'] + [w[k]] + w[k:]
    if kind == 'figure':
        for i, x in enumerate(w):
            m = re.search(r'\d+', x)
            if m:
                n = int(m.group(0))
                w[i] = x.replace(m.group(0), str(n + (10 if n >= 10 else 1)), 1)
                return w
        return None
    return w


def has_figure(line):
    return bool(re.search(r'\d', line))


def make_clip(out, name, takes, tts, when, face, drawtext, fault=None):
    """takes: list of word lists, read one after another with a pause between."""
    buf, truth = [np.zeros(int(rng.uniform(1.0, 1.4) * SR), np.float32)], []
    t = len(buf[0]) / SR
    for k, words in enumerate(takes):
        if k:
            buf.append(np.zeros(int(1.8 * SR), np.float32))
            t += 1.8
        t = speak(tts, words, t, buf, truth)
    buf.append(np.zeros(int(2.5 * SR), np.float32))
    x = np.concatenate(buf)
    rest = np.random.default_rng(3).normal(0, 1, len(x)).astype(np.float32) * 10 ** (-62 / 20)
    x = x + rest
    if fault == 'hiss':
        x = x + np.random.default_rng(5).normal(0, 1, len(x)).astype(np.float32) * 10 ** (-38 / 20)
    if fault == 'clip':
        x = np.clip(x * 8.0, -1, 1)
    left, right = x, x.copy()
    if fault == 'left-only':
        right = np.random.default_rng(9).normal(0, 1, len(x)).astype(np.float32) * 10 ** (-70 / 20)
    stereo = np.stack([left, right], axis=1).astype('<f4')
    wav = out / ('.%s.f32' % name)
    stereo.tofile(wav)
    dur = len(x) / SR
    label = ''
    if drawtext:
        label = (",drawtext=text='%s %%{pts\\:hms}':x=40:y=40:fontsize=42:fontcolor=white:box=1:boxcolor=black@0.5"
                 % name.replace('.', ' '))
    inputs = ['-f', 'lavfi', '-i', 'color=c=0x1D4E89:s=1920x1080:r=25:d=%.3f' % dur]
    if face:
        inputs += ['-loop', '1', '-framerate', '25', '-t', '%.3f' % dur, '-i', face]
        vf = '[1:v]scale=-2:900[f];[0:v][f]overlay=x=1010:y=180%s[v]' % label
    else:
        vf = '[0:v]null%s[v]' % label
    a_idx = 2 if face else 1
    sh(['ffmpeg', '-v', 'error', '-y'] + inputs + ['-f', 'f32le', '-ar', SR, '-ac', '2', '-i', wav,
       '-filter_complex', vf, '-map', '[v]', '-map', '%d:a' % a_idx, '-c:v', 'libx264', '-preset', 'ultrafast',
       '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-shortest',
       '-metadata', 'creation_time=%s' % when.strftime('%Y-%m-%dT%H:%M:%S.000000Z'), out / name])
    wav.unlink()
    ts = when.timestamp()
    os.utime(out / name, (ts, ts))
    return truth


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--tts', choices=['espeak', 'say'], default='say' if sys.platform == 'darwin' else 'espeak')
    ap.add_argument('--face')
    ap.add_argument('--brief', default=str(HERE.parent / 'brief.toml'))
    a = ap.parse_args()
    out = Path(a.out)
    src, truth_dir = out / 'source', out / 'truth'
    for d in (src, truth_dir):
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)
    filters = sh(['ffmpeg', '-hide_banner', '-filters']).decode()
    drawtext = ' drawtext ' in filters
    cfg = pb_edit.Cfg(argparse.Namespace(brief=a.brief))
    tts = TTS(a.tts, out / 'tts')
    start = datetime(2026, 10, 13, 10, 0, tzinfo=timezone.utc)
    n = [0]
    expected = {'clean': {}, 'flag_wording': [], 'two_takes_clip': None, 'unmatched': [], 'old': []}

    def clip(takes, fault=None, when=None):
        n[0] += 1
        name = 'C%04d.MP4' % n[0]
        t = when or start + timedelta(minutes=2 * n[0])
        tr = make_clip(src, name, takes, tts, t, a.face, drawtext, fault)
        (truth_dir / ('C%04d.json' % n[0])).write_text(json.dumps({'words': tr}, indent=1))
        return name

    old = start - timedelta(days=5)
    v2 = cfg.video(2)
    expected['old'].append(clip([v2['lines'][0].split()], when=old))
    expected['old'].append(clip([v2['lines'][1].split()], when=old + timedelta(minutes=3)))
    for v in (cfg.video(2), cfg.video(3)):
        for k, line in enumerate(v['lines'], 1):
            key = 'v%d.%d' % (v['n'], k)
            if v['n'] == 3 and k == 2:
                name = clip([variant(line, 'stumble'), line.split()])
                expected['clean'][key] = name
                expected['two_takes_clip'] = name
                continue
            if v['n'] == 3 and k == 6:
                clip(['How much you can claim depends on your age and your earnings.'.split()])
                expected['flag_wording'].append(key)
                continue
            fault = {('v2', 2): 'left-only', ('v3', 3): 'hiss'}.get(('v%d' % v['n'], k))
            if k % 2 == 1:
                clip([variant(line, 'stumble')], fault='clip' if (v['n'], k) == (2, 1) else None)
            expected['clean'][key] = clip([line.split()], fault=fault)
            if has_figure(line):
                clip([variant(line, 'figure')], fault='hiss' if (v['n'], k) == (3, 3) else None)
    expected['unmatched'].append(clip([['Okay.', 'Are', 'we', 'rolling?', 'Testing,', 'one,', 'two,', 'three.']]))
    (out / 'expected.json').write_text(json.dumps(expected, indent=1))
    print('fixture: %d clips in %s' % (n[0], src))


if __name__ == '__main__':
    main()
