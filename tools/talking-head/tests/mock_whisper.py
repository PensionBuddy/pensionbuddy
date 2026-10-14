#!/usr/bin/env python3
"""
Stand-in for whisper-cli in tests where no whisper model can be downloaded.
Writes whisper.cpp's -ml 1 -sow -ojf JSON from the true word times that
make_fixture.py saved, timed the way whisper.cpp times words at its worst (each
word starts where the last one ended, the first at 0.00; each ends a little late). Finds the clip from the work
folder's clip id; for a rendered final, composes the words from the edit
decision list (edl.json) beside it.

  PB_MOCK_TRUTH=DIR mock_whisper.py -m MODEL -f WAV ... -of OUTBASE
"""
import json
import os
import random
import sys
from pathlib import Path


def arg(flag, default=None):
    a = sys.argv
    return a[a.index(flag) + 1] if flag in a else default


def truth_for(stem):
    p = Path(os.environ['PB_MOCK_TRUTH']) / (stem + '.json')
    return json.loads(p.read_text())['words'] if p.exists() else []


def main():
    wav = Path(arg('-f'))
    out = arg('-of')
    words = []
    edl = wav.parent / 'edl.json'
    if wav.name.startswith('final') and edl.exists():
        e = json.loads(edl.read_text())
        for seg in e['segments']:
            if seg['kind'] != 'clip':
                continue
            stem = Path(e['clip_names'][seg['clip']]).stem
            for w in truth_for(stem):
                mid = 0.5 * (w['t0'] + w['t1'])
                if seg['src_start'] <= mid < seg['src_end']:
                    o = seg['out_start'] - seg['src_start']
                    words.append(dict(w, t0=max(seg['out_start'], w['t0'] + o),
                                      t1=min(seg['out_start'] + seg['frames'] / e['fps'], w['t1'] + o)))
    else:
        clip_id = wav.parent.name
        words = truth_for(clip_id.rsplit('-', 1)[0])
    rnd = random.Random(len(words))
    segs, prev = [], 0.0
    for w in words:
        # whisper.cpp at its worst: every word starts where the last one ended, the first at 0.00,
        # however long the pause before it
        t0 = prev
        t1 = w['t1'] + rnd.uniform(0.0, 0.08)
        f, t = int(round(t0 * 100)), int(round(t1 * 100))
        segs.append({'offsets': {'from': f * 10, 'to': t * 10}, 'text': ' ' + w['text'],
                     'tokens': [{'text': '[_BEG_]', 'id': 50363, 'p': 0.9, 't_dtw': -1},
                                {'text': ' ' + w['text'], 'id': 1000, 'p': w.get('p', 0.95), 't_dtw': -1}]})
        prev = t1
    doc = {'systeminfo': 'mock', 'model': {'type': 'mock'}, 'params': {'language': 'en'},
           'result': {'language': 'en'}, 'transcription': segs}
    Path(out + '.json').write_text(json.dumps(doc, indent='\t', ensure_ascii=False))


if __name__ == '__main__':
    main()
