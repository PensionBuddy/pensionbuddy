"""The Python twin of tests/harness.js, for the suites that need Python.

    from harness import eq, skip, report

    eq('1. label', actual, expected)
    skip('S8 row 4', 'why')
    report()                       # prints, then exits 0 or 1

Same report as the JavaScript suites, line for line: `  ok   label`,
`  FAIL label` with expected and actual on continuation lines, `  skip label
(reason)`, and ALL PASS or FAILURES with the counts on the last line. One
format for every suite in this directory, whichever language it is in.
"""
import sys

_passed, _failed, _skipped, _lines = 0, 0, 0, []


def eq(label, actual, expected):
    global _passed, _failed
    ok = actual == expected
    if ok:
        _passed += 1
        _lines.append('  ok   ' + label)
    else:
        _failed += 1
        _lines.append('  FAIL %s\n         expected %r\n         actual   %r' % (label, expected, actual))
    return ok


def skip(label, reason):
    global _skipped
    _skipped += 1
    _lines.append('  skip %s  (%s)' % (label, reason))


def summary():
    return '%s  %d passed, %d failed%s' % ('ALL PASS' if _failed == 0 else 'FAILURES',
                                          _passed, _failed,
                                          ', %d skipped' % _skipped if _skipped else '')


def report():
    print('\n'.join(_lines + [summary()]))
    sys.exit(0 if _failed == 0 else 1)
