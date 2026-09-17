/* The one test harness, for every suite in tests/.

   Loads two ways, like the calculation modules:
       node:     var H = require('./harness.js');
       browser:  <script src="tests/harness.js"></script>  ->  window.PBTest

   A suite asks for a context and makes its assertions through it:

       var t = H.suite('state-pension');          // or { tolerance: 0.005 }
       t.eq('1. weekly', r.weeklyCents, 29930);
       t.money('1. weekly', r.weeklyCents, 299.30);
       t.has('2. the sentence carries the figure', cell.textContent, '1,820');
       t.group('CASE 1  ...');                    // a heading in the report
       t.skip('S8 row 4', 'entry 1970 is below the slider floor');
       t.fail('the probe did not load', detail);

   Nothing else is needed at the end of a suite. Under node the report is
   printed as the process finishes and the exit code follows it; in a browser
   the runner calls PBTest.report() after the suite's script tag.

   ONE FORMAT. Every assertion is one line, ok or FAIL, and a failure carries
   expected and actual on continuation lines. tests/build.test.py prints the
   same shape from Python. The summary line is ALL PASS or FAILURES with the
   counts, as the suites have always printed it.

   ONE THROW GUARD. A suite that throws partway is not a suite with no report;
   it is a failed suite whose report shows how far it got. Node's
   uncaughtException listener and the browser's capture-phase error listener
   both hand the error to uncaught(), which records it as a FAIL against the
   suite that was running, after the last label that completed. The capture
   phase matters in the browser: a throw inside an input listener never
   reaches dispatchEvent, so a probe's own try/catch would see nothing.

   eq IS STRICT, ===, unless the suite declared a tolerance. The two State
   Pension suites compare integer cents and say "no tolerances anywhere";
   compare-calc's module returns euro floats, so that suite declares half a
   cent. A tolerance applies to numbers only: under one, two equal strings
   FAIL, which is the failure that is easy to read rather than the pass that
   hides a wrong type.

   create() returns a fresh, independent registry. tests/harness.test.js uses
   it to drive a sandbox through this same API and then assert, from the
   default registry, on what the sandbox reports. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.PBTest = api;
  }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var isNode = typeof process === 'object' && process !== null &&
               process.versions && !!process.versions.node &&
               typeof module === 'object' && !!module.exports;

  function fmt(v) {
    var s;
    try { s = JSON.stringify(v); } catch (e) { s = undefined; }
    return s === undefined ? String(v) : s;
  }

  function summary(passed, failed, skipped) {
    return (failed === 0 ? 'ALL PASS' : 'FAILURES') + '  ' + passed + ' passed, ' +
           failed + ' failed' + (skipped ? ', ' + skipped + ' skipped' : '');
  }

  function create() {
    var suites = [];
    var byName = {};
    var current = null;       // the suite an uncaught error is charged to
    var captured = [];        // raw messages, for a runner's diagnostics line

    function suite(name, opts) {
      opts = opts || {};
      if (byName[name]) throw new Error('duplicate suite: ' + name);
      var s = {
        name: name,
        tolerance: +opts.tolerance || 0,
        synthetic: !!opts.synthetic,
        lines: [], passed: 0, failed: 0, skipped: 0,
        last: null
      };
      suites.push(s);
      byName[name] = s;
      current = s;

      function pass(label) {
        s.passed++;
        s.last = label;
        s.lines.push('  ok   ' + label);
        return true;
      }

      function fail(label, detail) {
        s.failed++;
        s.last = label;
        s.lines.push('  FAIL ' + label + (detail ? '\n         ' + detail : ''));
        return false;
      }

      function eq(label, actual, expected) {
        var ok = s.tolerance
          ? (typeof actual === 'number' && typeof expected === 'number' &&
             Math.abs(actual - expected) < s.tolerance)
          : actual === expected;
        return ok ? pass(label)
                  : fail(label, 'expected ' + fmt(expected) + '\n         actual   ' + fmt(actual));
      }

      function money(label, actualCents, expectedEuro) {
        // compare in cents so nothing depends on float formatting
        return eq(label + ' = EUR ' + expectedEuro.toFixed(2),
                  actualCents, Math.round(expectedEuro * 100));
      }

      function has(label, haystack, needle) {
        var ok = typeof haystack === 'string' && haystack.indexOf(needle) >= 0;
        if (ok) return pass(label);
        var shown = typeof haystack === 'string' ? fmt(haystack.slice(0, 120)) : String(haystack);
        return fail(label, 'missing  ' + fmt(needle) + '\n         in       ' + shown);
      }

      function group(heading) {
        s.lines.push('');
        s.lines.push(heading);
      }

      function skip(label, reason) {
        s.skipped++;
        s.lines.push('  skip ' + label + '  (' + reason + ')');
      }

      return { name: name, eq: eq, money: money, has: has, group: group,
               skip: skip, fail: fail };
    }

    function uncaught(err) {
      var msg = (err && err.message) ? err.message : String(err);
      captured.push(msg);
      if (!current) suite('(before any suite)', { synthetic: true });
      var s = current;
      s.failed++;
      s.lines.push('  FAIL  uncaught: ' + msg + '\n         after: ' + (s.last || '(none)'));
    }

    function report() {
      var passed = 0, failed = 0, skipped = 0, blocks = [], records = [];
      var headed = suites.length > 1;
      suites.forEach(function (s) {
        passed += s.passed; failed += s.failed; skipped += s.skipped;
        records.push({ name: s.name, passed: s.passed, failed: s.failed, skipped: s.skipped });
        var text = s.lines.join('\n') + (s.lines.length ? '\n' : '') +
                   summary(s.passed, s.failed, s.skipped);
        blocks.push(((headed || s.synthetic) ? 'SUITE  ' + s.name + '\n' : '') + text);
      });
      var text = blocks.join('\n\n');
      if (headed) text += '\n\n' + summary(passed, failed, skipped);
      return { text: text, passed: passed, failed: failed, skipped: skipped, suites: records };
    }

    return {
      suite: suite,
      uncaught: uncaught,
      report: report,
      suites: function () { return suites.map(function (s) { return { name: s.name }; }); },
      errors: function () { return captured.slice(); }
    };
  }

  var H = create();
  H.create = create;

  if (isNode) {
    process.on('uncaughtException', function (err) {
      H.uncaught(err);
      process.stderr.write(((err && err.stack) || String(err)) + '\n');
    });
    // beforeExit, not exit: stdout is a pipe when a runner captures it, and
    // on macOS a pipe is written asynchronously, so a report longer than the
    // pipe's 64 KB buffer written from the exit handler is cut off mid-line.
    // A write started in beforeExit keeps the process alive until it has
    // drained. tests/runner.test.py pushes a 4,000-line report through a
    // pipe to keep this true.
    var reported = false;
    process.on('beforeExit', function () {
      if (reported || !H.suites().length) return;   // nothing registered: a utility require
      reported = true;
      var r = H.report();
      process.stdout.write(r.text + '\n');
      if (r.failed) process.exitCode = 1;
    });
  } else if (root && typeof root.addEventListener === 'function') {
    root.addEventListener('error', function (e) {
      var target = e.target;
      if (target && target !== root && target.tagName) {
        H.uncaught('resource failed: <' + target.tagName.toLowerCase() + '> ' +
                   (target.src || target.href || ''));
        return;
      }
      H.uncaught(e.error || e.message || e.type);
    }, true);
  }

  return H;
}));
