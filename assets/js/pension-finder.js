/* The old pension finder: what a trace needs, checked; the Letter of
   Authority, written out; and what is sent, built. No DOM here, so all of it
   runs under node (tests/pension-finder.test.js) exactly as it runs in the
   page (tools/finder-parts/page.js).

   WHAT A TRACE NEEDS, AND NOTHING MORE. Where the reader worked and roughly
   when, the names they used there, date of birth and address (a provider
   matches a record on those), and an email for the replies. A phone number
   is optional. A PPS number is NOT asked for: this site has no secure way to
   receive one, and Damian can ask for it on a call if a provider insists.

   CONSENT IS NEVER ASSUMED. Every yes/no here starts as no. Being phoned
   about the trace is its own box (the Central Bank's rule on calling someone
   who is not yet a client needs their consent for that purpose), and so are
   occasional emails, the same box the site's other forms carry.

   THE LETTER is a draft. Its wording is for Gresham Wealth's compliance
   officer to confirm before this page goes live; the page says so where it
   shows the letter. It authorises asking for information only: it cannot
   move, change or cash in anything, and it says so.

   Contract: this header and tests/pension-finder.test.js.
   Loads as a plain script (window.PBFinder) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBFinder = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FIRM = 'Damian Condon T/A Gresham Wealth Management';
  var TRADING = 'Pensionbuddy';
  var FIRM_ADDRESS = 'Bushfield House, Philipsburgh Avenue, Fairview, Dublin 3';
  var MAX_EMPLOYERS = 10;
  var EARLIEST_YEAR = 1950;

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

  function str(v) { return v == null ? '' : String(v).replace(/\s+/g, ' ').trim(); }

  /* a Date, or an ISO date string, as an ISO date string (local calendar day) */
  function isoDay(d) {
    if (typeof d === 'string') return d.slice(0, 10);
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  /* "1980-04-07" -> "7 April 1980"; anything else -> '' */
  function longDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(iso));
    if (!m) return '';
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    var check = new Date(Date.UTC(y, mo - 1, d));
    if (check.getUTCMonth() !== mo - 1) return '';        // 31 April and the like
    return d + ' ' + MONTHS[mo - 1] + ' ' + y;
  }

  function year(v, thisYear) {
    var s = str(v);
    if (!/^\d{4}$/.test(s)) return null;
    var y = +s;
    return (y >= EARLIEST_YEAR && y <= thisYear) ? y : null;
  }

  /* the employer rows the reader filled in, tidied; a row with no employer
     name is not a row */
  function employers(list, thisYear) {
    return (list || []).map(function (e) {
      return {
        name: str(e && e.name),
        from: str(e && e.from),
        to: str(e && e.to),
        provider: str(e && e.provider),
        ref: str(e && e.ref)
      };
    }).filter(function (e) { return e.name; }).slice(0, MAX_EMPLOYERS).map(function (e) {
      var f = year(e.from, thisYear), t = year(e.to, thisYear);
      e.fromYear = f; e.toYear = t;
      return e;
    });
  }

  function years(e) {
    if (e.fromYear && e.toYear) return e.fromYear === e.toYear ? String(e.fromYear) : e.fromYear + ' to ' + e.toYear;
    if (e.fromYear) return 'from ' + e.fromYear;
    if (e.toYear) return 'until ' + e.toYear;
    return 'dates not known';
  }

  function looksLikeEmail(v) { return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(str(v)); }

  /* the same name, ignoring case, spacing and punctuation */
  function sameName(a, b) {
    var n = function (s) { return str(s).toLowerCase().replace(/[^a-zÀ-ɏ]+/g, ''); };
    return n(a) !== '' && n(a) === n(b);
  }

  /* What is missing or wrong at one step, as [{ field, message }]. The field
     is the id of the control the page should send the reader back to. */
  function problems(step, data, today) {
    var out = [], d = data || {};
    var thisYear = +isoDay(today).slice(0, 4);
    function add(field, message) { out.push({ field: field, message: message }); }
    if (step === 'where') {
      var raw = d.employers || [];
      if (!employers(raw, thisYear).length) add('pfEmp0Name', 'Add at least one employer, even a rough name.');
      raw.forEach(function (e, i) {
        if (!str(e && e.name)) return;
        var f = str(e.from), t = str(e.to);
        if (f && year(f, thisYear) == null) add('pfEmp' + i + 'From', 'The start year for ' + str(e.name) + ' should be a year from ' + EARLIEST_YEAR + ' to ' + thisYear + '.');
        if (t && year(t, thisYear) == null) add('pfEmp' + i + 'To', 'The end year for ' + str(e.name) + ' should be a year from ' + EARLIEST_YEAR + ' to ' + thisYear + '.');
        if (year(f, thisYear) && year(t, thisYear) && year(f, thisYear) > year(t, thisYear)) add('pfEmp' + i + 'To', 'The end year for ' + str(e.name) + ' is before its start year.');
      });
      if (raw.filter(function (e) { return str(e && e.name); }).length > MAX_EMPLOYERS) add('pfEmpAdd', 'Up to ' + MAX_EMPLOYERS + ' employers here. Damian can take the rest on a call.');
    }
    if (step === 'who') {
      if (!str(d.fullName)) add('pfName', 'Your full name, as it is now.');
      var dob = longDate(d.dob);
      if (!dob) add('pfDob', 'Your date of birth.');
      else {
        var age = thisYear - +str(d.dob).slice(0, 4);
        if (age < 16 || age > 110) add('pfDob', 'That date of birth does not look right. Could you check it?');
      }
      if (!str(d.address)) add('pfAddress', 'Your address now. Providers use it to match their records.');
      if (!looksLikeEmail(d.email)) add('pfEmail', 'An email address we can send the replies to.');
      if (d.consents && d.consents.phone && !str(d.phone)) add('pfPhone', 'A phone number, since you ticked the box to be phoned.');
    }
    if (step === 'sign') {
      if (!str(d.signature && d.signature.typed)) add('pfSigned', 'Type your full name to sign.');
      else if (!sameName(d.signature.typed, d.fullName)) add('pfSigned', 'Type your name the way you gave it: ' + str(d.fullName) + '.');
      if (!(d.signature && d.signature.confirmed === true)) add('pfConfirm', 'Tick the box to confirm you have read the letter and are signing it.');
    }
    return out;
  }

  /* The Letter of Authority, as parts a page can lay out and as plain text.
     DRAFT WORDING: see the header. */
  function letter(data, today) {
    var d = data || {}, thisYear = +isoDay(today).slice(0, 4);
    var list = employers(d.employers, thisYear);
    var other = str(d.otherNames);
    var who = str(d.fullName);
    var paras = [
      'I, ' + who + ', of ' + str(d.address) + ', born on ' + longDate(d.dob) + (other ? ', who has also been known as ' + other : '') +
        ', authorise ' + FIRM + ', trading as ' + TRADING + ', ' + FIRM_ADDRESS + ', to ask you for information about any pension I hold, or have held, with you, and to receive it.',
      'That includes whether a pension exists, its current value and transfer value, the benefits it provides, its charges, how it is invested, and any guarantees or special terms attached to it, with copies of the related documents.',
      'This letter does not authorise anyone to move, change, cash in or transfer any pension. It is for information only.',
      'Please accept a copy of this letter as the original. It stays in force until I withdraw it in writing.'
    ];
    return {
      title: 'Letter of Authority',
      to: 'To the pension provider or scheme trustees',
      paragraphs: paras,
      employers: list.map(function (e) {
        return { name: e.name, years: years(e), provider: e.provider, ref: e.ref };
      }),
      signedBy: who,
      signature: str(d.signature && d.signature.typed),
      signedOn: longDate(isoDay(today))
    };
  }

  function letterText(L) {
    var lines = [L.title, '', L.to, ''];
    L.paragraphs.forEach(function (p) { lines.push(p, ''); });
    lines.push('Where I worked:');
    L.employers.forEach(function (e) {
      lines.push('- ' + e.name + ', ' + e.years + (e.provider ? ', ' + e.provider : '') + (e.ref ? ', reference ' + e.ref : ''));
    });
    lines.push('', 'Signed: ' + L.signature, 'Name: ' + L.signedBy, 'Date: ' + L.signedOn);
    return lines.join('\n');
  }

  /* what a configured LEAD_ENDPOINT receives */
  function payload(data, today, page) {
    var d = data || {}, L = letter(d, today);
    return {
      type: 'pension-trace',
      person: {
        fullName: str(d.fullName), otherNames: str(d.otherNames), dob: str(d.dob),
        address: str(d.address), email: str(d.email), phone: str(d.phone)
      },
      employers: L.employers,
      consents: {
        phone: !!(d.consents && d.consents.phone === true),
        marketing: !!(d.consents && d.consents.marketing === true)
      },
      signature: {
        typed: L.signature,
        drawn: (d.signature && typeof d.signature.drawn === 'string' && d.signature.drawn.indexOf('data:image/png') === 0) ? d.signature.drawn : null,
        confirmed: !!(d.signature && d.signature.confirmed === true),
        signedOn: isoDay(today)
      },
      letterText: letterText(L),
      page: page || ''
    };
  }

  /* No endpoint yet: a prefilled email to Damian. It carries the details,
     the two choices and a one-line authority in the reader's own words, and
     asks for the saved letter to be attached, since a signature drawn on
     screen cannot travel in a mailto link. */
  function mailto(data, today, address) {
    var d = data || {}, L = letter(d, today), c = d.consents || {};
    var body = [
      'Please search for my old pensions.',
      '',
      'Name: ' + L.signedBy + (str(d.otherNames) ? ' (also known as ' + str(d.otherNames) + ')' : ''),
      'Date of birth: ' + longDate(d.dob),
      'Address: ' + str(d.address),
      'Email: ' + str(d.email),
      'Phone: ' + (str(d.phone) || 'not given'),
      '',
      'Where I worked:'
    ];
    L.employers.forEach(function (e) {
      body.push('- ' + e.name + ', ' + e.years + (e.provider ? ', ' + e.provider : '') + (e.ref ? ', ref ' + e.ref : ''));
    });
    body.push('',
      /* the choice in the words of the box the reader ticked, so the record
         of the consent says exactly what was agreed to */
      'You can phone me about this search: ' + (c.phone === true ? 'yes' : 'no'),
      'Occasional emails: ' + (c.marketing === true ? 'yes, please' : 'no'),
      '',
      'I authorise ' + FIRM + ' (' + TRADING + ') to ask the providers of these pensions for information about them, as set out in the Letter of Authority, which I have attached.',
      'Signed: ' + L.signature + ', ' + L.signedOn);
    return 'mailto:' + address + '?subject=' + encodeURIComponent('Pension search: ' + L.signedBy) +
      '&body=' + encodeURIComponent(body.join('\n'));
  }

  /* The trace, employer by employer. Only "requested" can be known here;
     "found" and "valued" come back from the providers, by email. */
  var STAGES = [
    { key: 'requested', label: 'Requested' },
    { key: 'found', label: 'Found' },
    { key: 'valued', label: 'Valued' }
  ];
  function tracker(list) {
    return list.map(function (e) {
      return {
        name: e.name,
        stages: STAGES.map(function (s, i) { return { key: s.key, label: s.label, state: i === 0 ? 'done' : (i === 1 ? 'next' : 'todo') }; })
      };
    });
  }

  return {
    FIRM: FIRM,
    TRADING: TRADING,
    MAX_EMPLOYERS: MAX_EMPLOYERS,
    EARLIEST_YEAR: EARLIEST_YEAR,
    STAGES: STAGES,
    longDate: longDate,
    isoDay: isoDay,
    employers: employers,
    sameName: sameName,
    problems: problems,
    letter: letter,
    letterText: letterText,
    payload: payload,
    mailto: mailto,
    tracker: tracker
  };
}));
