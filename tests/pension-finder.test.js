/* Acceptance tests for the old pension finder's logic.
   Contract: the header of assets/js/pension-finder.js.

   Runs BOTH ways with no build step:
       node tests/pension-finder.test.js
       python3 tests/run-tests.py pension-finder      (headless Chrome)

   Every date is pinned: "today" is passed in, so nothing here moves with the
   clock. Strict comparisons throughout. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('pension-finder');
  var eq = t.eq, has = t.has, group = t.group;

  var F = isNode ? require('../assets/js/pension-finder.js') : root.PBFinder;
  var TODAY = '2026-09-24';

  function sample() {
    return {
      employers: [
        { name: '  Acme   Foods ', from: '1998', to: '2004', provider: 'Irish Life', ref: 'P-123' },
        { name: '', from: '2001', to: '2002' },
        { name: 'Harbour Bank', from: '2005', to: '', provider: '', ref: '' }
      ],
      fullName: 'Mary Byrne',
      otherNames: 'Mary Kelly',
      dob: '1972-03-09',
      address: '1 Main Street, Galway',
      email: 'mary@example.com',
      phone: '',
      consents: { phone: false, marketing: false },
      signature: { typed: 'mary byrne', confirmed: true, drawn: null }
    };
  }

  group('1  dates, written the Irish way');
  eq('1. a date of birth', F.longDate('1972-03-09'), '9 March 1972');
  eq('1. today', F.longDate(TODAY), '24 September 2026');
  eq('1. 31 April does not exist', F.longDate('1980-04-31'), '');
  eq('1. 29 February in a leap year does', F.longDate('2024-02-29'), '29 February 2024');
  eq('1. and not in any other', F.longDate('2023-02-29'), '');
  eq('1. not a date', F.longDate('09/03/1972'), '');
  eq('1. a Date is read as its own calendar day', F.isoDay(new Date(2026, 8, 24, 23, 59)), '2026-09-24');

  group('2  employer rows: tidied, blanks dropped, capped');
  var list = F.employers(sample().employers, 2026);
  eq('2. the blank row is gone', list.length, 2);
  eq('2. names are tidied', list[0].name, 'Acme Foods');
  eq('2. years read as years', list[0].fromYear + '-' + list[0].toYear, '1998-2004');
  eq('2. a missing end year is null, not zero', list[1].toYear, null);
  var many = [];
  for (var i = 0; i < 14; i++) many.push({ name: 'Employer ' + i });
  eq('2. at most ten go into a letter', F.employers(many, 2026).length, F.MAX_EMPLOYERS);
  eq('2. a year in the future is not a year', F.employers([{ name: 'X', from: '2031' }], 2026)[0].fromYear, null);
  eq('2. nor one before 1950', F.employers([{ name: 'X', from: '1949' }], 2026)[0].fromYear, null);

  group('3  step one: where you worked');
  eq('3. the sample passes', F.problems('where', sample(), TODAY).length, 0);
  var none = F.problems('where', { employers: [{ name: '' }] }, TODAY);
  eq('3. no employer at all is one problem', none.length, 1);
  eq('3. and it points at the first name box', none[0].field, 'pfEmp0Name');
  var bad = F.problems('where', { employers: [{ name: 'A', from: '2010', to: '2008' }, { name: 'B', from: '19x9' }] }, TODAY);
  eq('3. an end before a start is caught', bad[0].field, 'pfEmp0To');
  eq('3. and so is a year that is not one', bad[1].field, 'pfEmp1From');
  has('3. the message names the employer', bad[1].message, 'B');

  group('4  step two: who you are');
  eq('4. the sample passes', F.problems('who', sample(), TODAY).length, 0);
  var empty = F.problems('who', {}, TODAY).map(function (p) { return p.field; }).join(' ');
  eq('4. everything required is asked for, in order', empty, 'pfName pfDob pfAddress pfEmail');
  var s = sample(); s.dob = '2015-01-01';
  eq('4. a date of birth making you ten is questioned', F.problems('who', s, TODAY)[0].field, 'pfDob');
  s = sample(); s.email = 'mary@example';
  eq('4. an email with no domain ending is refused', F.problems('who', s, TODAY)[0].field, 'pfEmail');
  s = sample(); s.consents.phone = true;
  eq('4. ticking "phone me" with no number asks for one', F.problems('who', s, TODAY)[0].field, 'pfPhone');
  s.phone = '087 123 4567';
  eq('4. and a number settles it', F.problems('who', s, TODAY).length, 0);
  eq('4. a phone number is otherwise optional', F.problems('who', sample(), TODAY).length, 0);

  group('5  step three: signing');
  eq('5. a typed name matching in any case passes', F.problems('sign', sample(), TODAY).length, 0);
  eq('5. names match ignoring case, spaces and punctuation', F.sameName("Mary  O'Byrne", 'mary obyrne'), true);
  eq('5. an empty name matches nothing', F.sameName('', ''), false);
  s = sample(); s.signature.typed = 'Mary Kelly';
  var p = F.problems('sign', s, TODAY);
  eq('5. a different name is refused', p[0].field, 'pfSigned');
  has('5. and the message says what to type', p[0].message, 'Mary Byrne');
  s = sample(); s.signature.confirmed = false;
  eq('5. the confirming box is required', F.problems('sign', s, TODAY)[0].field, 'pfConfirm');
  s = sample(); s.signature.confirmed = 'yes';
  eq('5. and only a real tick counts', F.problems('sign', s, TODAY)[0].field, 'pfConfirm');

  group('6  the letter');
  var L = F.letter(sample(), TODAY);
  has('6. it names the reader', L.paragraphs[0], 'I, Mary Byrne, of 1 Main Street, Galway, born on 9 March 1972');
  has('6. and the other name they used', L.paragraphs[0], 'also been known as Mary Kelly');
  has('6. and who is authorised', L.paragraphs[0], F.FIRM + ', trading as ' + F.TRADING);
  has('6. it says it cannot move anything', L.paragraphs.join(' '), 'does not authorise anyone to move, change, cash in or transfer any pension');
  eq('6. both employers are listed', L.employers.length, 2);
  eq('6. with their years', L.employers[0].years + ' / ' + L.employers[1].years, '1998 to 2004 / from 2005');
  eq('6. signed on today', L.signedOn, '24 September 2026');
  eq('6. with the name as typed', L.signature, 'mary byrne');
  var noOther = sample(); noOther.otherNames = '';
  eq('6. no "also known as" when there is no other name', F.letter(noOther, TODAY).paragraphs[0].indexOf('also been known') === -1, true);
  var text = F.letterText(L);
  has('6. the plain text carries the employers', text, '- Acme Foods, 1998 to 2004, Irish Life, reference P-123');
  has('6. and the signature block', text, 'Signed: mary byrne\nName: Mary Byrne\nDate: 24 September 2026');

  group('7  what is sent, and what is never assumed');
  var P = F.payload(sample(), TODAY, 'https://pensionbuddy.ie/find-my-pension.html');
  eq('7. it says what it is', P.type, 'pension-trace');
  eq('7. both consents start as no', P.consents.phone + ' ' + P.consents.marketing, 'false false');
  var yes = sample(); yes.consents = { phone: 'true', marketing: 1 };
  eq('7. only a real true is a yes', F.payload(yes, TODAY).consents.phone + ' ' + F.payload(yes, TODAY).consents.marketing, 'false false');
  eq('7. no drawn signature is null, not an empty string', P.signature.drawn, null);
  var drawn = sample(); drawn.signature.drawn = 'data:image/png;base64,AAAA';
  eq('7. a drawn one travels as a PNG', F.payload(drawn, TODAY).signature.drawn, 'data:image/png;base64,AAAA');
  var notPng = sample(); notPng.signature.drawn = 'javascript:alert(1)';
  eq('7. anything else is dropped', F.payload(notPng, TODAY).signature.drawn, null);
  eq('7. no PPS number is asked for or sent', JSON.stringify(P).toLowerCase().indexOf('pps'), -1);
  eq('7. the blank employer row is not sent', P.employers.length, 2);
  has('7. the letter travels as text', P.letterText, 'Letter of Authority');

  group('8  the fallback email');
  var M = F.mailto(sample(), TODAY, 'hello@pensionbuddy.ie');
  var body = decodeURIComponent(M.split('&body=')[1]);
  has('8. it goes to the address given', M, 'mailto:hello@pensionbuddy.ie?subject=');
  has('8. the subject names the reader', decodeURIComponent(M.split('?subject=')[1].split('&')[0]), 'Pension search: Mary Byrne');
  has('8. it lists the employers', body, '- Harbour Bank, from 2005');
  has('8. the phone choice is written out, in the words of the box', body, 'You can phone me about this search: no');
  has('8. and the email choice', body, 'Occasional emails: no');
  has('8. it carries the authority in a sentence', body, 'I authorise ' + F.FIRM + ' (' + F.TRADING + ') to ask the providers');
  has('8. and asks for the letter to be attached', body, 'which I have attached');
  eq('8. short enough for an email app to open', M.length < 2000, true);

  group('9  the tracker');
  var tr = F.tracker(F.employers(sample().employers, 2026));
  eq('9. one line per employer', tr.length, 2);
  eq('9. three stages each', tr[0].stages.map(function (s) { return s.label; }).join(' '), 'Requested Found Valued');
  eq('9. only "requested" is done', tr[0].stages.map(function (s) { return s.state; }).join(' '), 'done next todo');
}(typeof self !== 'undefined' ? self : this));
