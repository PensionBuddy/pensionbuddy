#!/usr/bin/env python3
"""Tests for the two runners: node, and tests/run-tests.py in headless Chrome.

    python3 tests/runner.test.py

Every case here is a subprocess. The harness cannot report on its own exit
code, and the Chrome runner's claims (one launch, nothing written into the
repository) are only visible from outside it. Fixture suites are written to a
temporary directory, never to tests/.
"""
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS = os.path.join(ROOT, 'tests')
sys.path.insert(0, TESTS)

from harness import eq, report  # noqa: E402

HARNESS = os.path.join(TESTS, 'harness.js')


def node(src, tmp, name='fixture.test.js'):
    """Run a fixture suite under node. Returns (exit code, stdout, stderr)."""
    path = os.path.join(tmp, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src)
    p = subprocess.run(['node', path], capture_output=True, text=True, timeout=60)
    return p.returncode, p.stdout, p.stderr


def fixture(body, name='fixture'):
    return ("var H = require(%r);\nvar t = H.suite(%r);\n%s\n" % (HARNESS, name, body))


def run():
    tmp = tempfile.mkdtemp(prefix='pb-runner-test-')

    # ------------------------------------------------------------------ 1
    # Node: the report is printed at exit and the exit code follows it,
    # with nothing at the end of the suite file to make that happen.
    rc, out, err = node(fixture("t.eq('one', 1, 1);"), tmp)
    eq('1. a passing suite exits 0', rc, 0)
    eq('1. and prints its report', out, '  ok   one\nALL PASS  1 passed, 0 failed\n')
    eq('1. nothing on stderr', err, '')

    rc, out, err = node(fixture("t.eq('one', 1, 2);"), tmp)
    eq('1. a failing suite exits 1', rc, 1)
    eq('1. with the failure and the summary', out,
       '  FAIL one\n         expected 2\n         actual   1\nFAILURES  0 passed, 1 failed\n')

    # ------------------------------------------------------------------ 2
    # The throw guard, at top level: a suite that throws with no wrapper of
    # its own still reports, names the last label, and exits 1. The stack
    # goes to stderr so the throw is not hidden either.
    rc, out, err = node(fixture("t.eq('before', 1, 1);\nthrow new Error('boom');"), tmp)
    eq('2. a throwing suite exits 1', rc, 1)
    eq('2. the report survives, with the throw recorded after the last label', out,
       '  ok   before\n  FAIL  uncaught: boom\n         after: before\nFAILURES  1 passed, 1 failed\n')
    eq('2. the stack is on stderr', 'Error: boom' in err, True)

    # a module that throws while being required, before any assertion
    with open(os.path.join(tmp, 'explodes.js'), 'w') as f:
        f.write("throw new Error('module threw at load');\n")
    rc, out, err = node("var H = require(%r);\nrequire('./explodes.js');\n" % HARNESS, tmp)
    eq('2. a module throwing at load exits 1', rc, 1)
    eq('2. and is reported against a synthetic suite', out,
       'SUITE  (before any suite)\n  FAIL  uncaught: module threw at load\n         after: (none)\n'
       'FAILURES  0 passed, 1 failed\n')

    # ------------------------------------------------------------------ 3
    # Several suites required into one process print one report, each block
    # headed, and one total on the last line.
    with open(os.path.join(tmp, 'a.js'), 'w') as f:
        f.write(fixture("t.eq('a', 1, 1);", 'first'))
    with open(os.path.join(tmp, 'b.js'), 'w') as f:
        f.write(fixture("t.eq('b', 1, 2);\nt.skip('c', 'why');", 'second'))
    rc, out, err = node("require('./a.js'); require('./b.js');", tmp)
    eq('3. two suites in one process exit 1 when either fails', rc, 1)
    eq('3. one report, two blocks, one total', out,
       'SUITE  first\n  ok   a\nALL PASS  1 passed, 0 failed\n\n'
       'SUITE  second\n  FAIL b\n         expected 2\n         actual   1\n  skip c  (why)\n'
       'FAILURES  0 passed, 1 failed, 1 skipped\n\n'
       'FAILURES  1 passed, 1 failed, 1 skipped\n')

    # ------------------------------------------------------------------ 4
    # A report larger than a pipe's buffer arrives whole. The suites used to
    # console.log then process.exit(), which is safe at today's sizes; the
    # harness writes from the exit handler and sets exitCode instead, and this
    # is the check that a 100 KB report is not truncated on the way out.
    rc, out, err = node(fixture("for (var i = 0; i < 4000; i++) t.eq('assertion number ' + i, i, i);"), tmp)
    eq('4. a 4,000-line report exits 0', rc, 0)
    eq('4. and arrives whole through a pipe', out.endswith('ALL PASS  4000 passed, 0 failed\n'), True)
    eq('4. every line of it', out.count('\n'), 4001)

    # ------------------------------------------------------------------ 5
    # The shipped suites, under node, each exit 0 on their own.
    for name in ('harness', 'compare-calc', 'state-pension', 'state-pension-entitlement'):
        p = subprocess.run(['node', os.path.join(TESTS, name + '.test.js')],
                           capture_output=True, text=True, timeout=120)
        eq('5. node tests/%s.test.js exits 0' % name, p.returncode, 0)
        eq('5. and ends with ALL PASS', p.stdout.strip().split('\n')[-1].startswith('ALL PASS'), True)



CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
RUNNER = os.path.join(TESTS, 'run-tests.py')


def chrome_runs(tmp, args, env=None):
    """Run tests/run-tests.py with CHROME pointed at a shim that counts every
    launch before handing over to the real browser. The launch count is the
    one claim the runner cannot make about itself. Returns (launches, exit
    code, stdout)."""
    counter = os.path.join(tmp, 'launches')
    shim = os.path.join(tmp, 'chrome-shim.sh')
    with open(shim, 'w') as f:
        f.write('#!/bin/sh\necho launch >> "%s"\nexec "%s" "$@"\n' % (counter, CHROME))
    os.chmod(shim, 0o755)
    if os.path.exists(counter):
        os.remove(counter)
    e = dict(os.environ, CHROME=shim)
    e.update(env or {})
    p = subprocess.run([sys.executable, RUNNER] + args, capture_output=True, text=True,
                       timeout=300, env=e, cwd=ROOT)
    launches = 0
    if os.path.exists(counter):
        with open(counter) as f:
            launches = f.read().count('launch')
    return launches, p.returncode, p.stdout


def untracked():
    p = subprocess.run(['git', 'status', '--porcelain', '--untracked-files=all'],
                       capture_output=True, text=True, cwd=ROOT)
    return sorted(l for l in p.stdout.split('\n') if l.startswith('??'))


def chrome():
    if not os.path.exists(CHROME):
        print('  (Chrome not found at %s: the Chrome cases are not run)' % CHROME)
        return
    tmp = tempfile.mkdtemp(prefix='pb-runner-test-')

    # ------------------------------------------------------------------ 6
    # ONE Chrome launch, whatever is asked for. The launch is the cost of
    # the run, so this is the number the rewrite exists to change.
    before = untracked()
    launches, rc, out = chrome_runs(tmp, [])
    eq('6. the whole run is one Chrome launch', launches, 1)
    eq('6. and it passes', rc, 0)
    for needle in ('SUITE  compare', 'ALL PASS  141 passed, 0 failed',
                   'SUITE  state-pension-entitlement', 'ALL PASS  608 passed, 0 failed',
                   'SUITE  harness', 'PANEL CHECK', 'ALL SUITES PASS'):
        eq('6. the output carries %r' % needle, needle in out, True)
    eq('6. each suite is gated on its exact assertion count',
       'GATE   compare 141 assertions' in out, True)

    # nothing is written into the repository by a run: the probes are served
    # from memory, where the old runner wrote two throwaway pages into the root
    for name in ('__panel_probe.html', '__drift_probe.html'):
        eq('6. %s is not left in the repository root' % name,
           os.path.exists(os.path.join(ROOT, name)), False)
    eq('6. the run adds no untracked file to the working tree', untracked(), before)

    launches, rc, out = chrome_runs(tmp, ['state-pension-entitlement'])
    eq('6. one suite plus its panel check is still one launch', launches, 1)
    eq('6. and passes', rc, 0)
    eq('6. the panel check ran with it', 'PANEL CHECK' in out, True)
    eq('6. and the other suites did not', 'SUITE  compare' in out, False)

    launches, rc, out = chrome_runs(tmp, ['compare', '--drift'])
    eq('6. a suite plus the drift check is one launch', launches, 1)
    eq('6. and passes', rc, 0)
    eq('6. with the drift table in the output', 'drift check: no drift' in out, True)

    # ------------------------------------------------------------------ 7
    # Can the run fail? Each PB_BREAK breaks one thing in the served bytes,
    # never in the repository, and the run has to say so and exit 1.
    launches, rc, out = chrome_runs(tmp, ['state-pension-entitlement'], {'PB_BREAK': 'drop-module'})
    eq('7. dropping state-pension.js from the entitlement frame fails', rc, 1)
    eq('7. with the module\'s own message', 'PBEntitlement needs state-pension.js loaded first' in out, True)

    launches, rc, out = chrome_runs(tmp, ['state-pension-entitlement'], {'PB_BREAK': 'swap-order'})
    eq('7. loading the two modules in the wrong order fails', rc, 1)
    eq('7. for the same reason', 'PBEntitlement needs state-pension.js loaded first' in out, True)

    launches, rc, out = chrome_runs(tmp, ['state-pension'], {'PB_BREAK': 'suite-404'})
    eq('7. a suite script that fails to load fails the run', rc, 1)
    eq('7. naming the resource', 'resource failed' in out, True)
    eq('7. and the gate sees zero assertions', 'GATE   state-pension 0 assertions' in out, True)

    launches, rc, out = chrome_runs(tmp, ['harness'], {'PB_BREAK': 'collector'})
    eq('7. a parent page that never reports fails the run', rc, 1)
    eq('7. saying so', 'could not read the report from the harness page' in out, True)

    launches, rc, out = chrome_runs(tmp, ['compare'], {'PB_MUTATE': 'tests/compare-calc.test.js|c1.employee, 750|c1.employee, 751'})
    eq('7. a served-bytes mutation of a suite fails the run', rc, 1)
    eq('7. with the one failure', 'FAILURES  140 passed, 1 failed' in out, True)
    eq('7. and the repository is untouched by it', untracked(), before)


if __name__ == '__main__':
    run()
    chrome()
    report()
