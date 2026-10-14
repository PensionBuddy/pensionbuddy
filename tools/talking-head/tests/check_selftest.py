#!/usr/bin/env python3
"""
Checks a pb_edit.py run on the make_fixture.py shoot against what the fixture
holds: the older shoot left out, the clean take picked for every line, the
changed word flagged, the off-script clip listed, every final made and every
QC check passed.

  python3 tests/check_selftest.py DIR [--strict]

--strict (the mock whisper) fails on any difference. Without it (real whisper
on synthetic speech) a pick or flag that differs is a warning, because whisper
may hear text-to-speech differently from a person; missing files and QC
failures still fail.
"""
import json
import sys
from pathlib import Path


def main():
    d = Path(sys.argv[1])
    strict = '--strict' in sys.argv
    exp = json.loads((d / 'expected.json').read_text())
    work, finals = d / 'work', d / 'finals'
    fails, warns = [], []

    def soft(msg):
        (fails if strict else warns).append(msg)

    inv = json.loads((work / 'inventory.json').read_text())
    names = {c['id']: c['name'] for c in inv['clips']}
    used = {names[i] for i in inv['selected']}
    for n in exp['old']:
        if n in used:
            fails.append('older shoot clip %s was used' % n)
    rk = json.loads((work / 'ranking.json').read_text())
    takes = {t['id']: t for t in rk['takes']}
    picks = json.loads((work / 'picks.json').read_text())
    for key, want in exp['clean'].items():
        p = picks.get(key)
        got = takes[p['parts'][0]['take']]['name'] if p else None
        if got != want:
            soft('%s: picked %s, the clean take is in %s' % (key, got, want))
    flags = (finals / 'pensionbuddy-flags.md').read_text()
    for key in exp['flag_wording']:
        v, line = key[1:].split('.')
        if 'WORDING: line %s' % line not in flags.split('## Video %s' % v)[1].split('## ')[0]:
            soft('%s: changed word not flagged' % key)
    um = {u['name'] for u in rk['unmatched'] if not u.get('partial')}
    for n in exp['unmatched']:
        if n not in um:
            soft('%s: off-script clip not listed' % n)
    for v in (2, 3):
        for f in ('pensionbuddy-v%d-9x16.mp4' % v, 'pensionbuddy-v%d-4x5.mp4' % v, 'pensionbuddy-v%d.srt' % v,
                  'pensionbuddy-v%d-take-log.md' % v):
            if not (finals / f).exists():
                fails.append('missing %s' % f)
    qc = json.loads((work / 'qc' / 'qc.json').read_text())
    for key, r in qc.items():
        for c in r['checks']:
            if c['result'] == 'FAIL':
                fails.append('QC %s: %s (%s)' % (key, c['check'], c['detail']))
    for w in warns:
        print('warn: ' + w)
    for f in fails:
        print('FAIL: ' + f)
    print('selftest: %s (%d fails, %d warnings)' % ('PASS' if not fails else 'FAIL', len(fails), len(warns)))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
