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


if __name__ == '__main__':
    run()
    report()
