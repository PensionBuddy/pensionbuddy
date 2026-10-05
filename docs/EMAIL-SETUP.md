# Form emails: setup

`netlify/functions/submission-created.js` runs after every Netlify form
submission and emails the submitter through Resend. The submission stays in
Netlify Forms whatever happens. Nothing else is stored.

## What each form sends

| Form | Sent when | Email |
|---|---|---|
| `calculator-results` | box ticked (`consent=yes`) | result, figures entered, link back, one booking button, the two warnings |
| `director-guide`, `starter-guide`, `tracker-guide` | box "Yes, email me the guide." ticked, and the guide's link set | the guide link only |
| `pension-finder` | never | none |
| `booking`, `pension-calculator-results`, `director-calculator-results` | never (forms removed in Run 45) | none |

Exact text and screenshots: `docs/email-shots/`. Rebuild them with
`NODE_PATH=$(npm root -g) node tools/render-emails.js --shots`.

## Steps

1. **Resend:** add and verify the domain `pensionbuddy.ie` (SPF, DKIM DNS
   records). Without this, sends from `hello@pensionbuddy.ie` fail.
2. **Resend:** create an API key with "Sending access" only.
3. **Netlify → Site configuration → Environment variables:** set

   | Variable | Value |
   |---|---|
   | `EMAIL_API_KEY` | the Resend key (mark it secret) |
   | `EMAIL_TEST` | `1` while testing; remove or set `0` to go live |
   | `EMAIL_TEST_TO` | your own address; with `EMAIL_TEST=1` every email goes here only |
   | `GUIDE_URL_DIRECTOR` | https link to the director guide |
   | `GUIDE_URL_STARTER` | https link to the starter guide |
   | `GUIDE_URL_TRACKER` | https link to the lost-pension guide |

   No guide link set = no guide email for that form. The guides do not exist
   in the repo yet.
4. **Netlify → Forms:** form detection on (already needed).
5. Deploy. Functions dir is the default `netlify/functions`; no
   `netlify.toml` change is needed.
6. Test: with `EMAIL_TEST=1`, submit each form on the deploy. Check your
   inbox, and **Netlify → Logs → Functions → submission-created**: each run
   logs `sent` or `nothing sent: <reason>` (never the address).
7. Go live: delete `EMAIL_TEST`, redeploy.

## Before go-live, also

- The thank-you now says the result "is emailed to you automatically". Do
  not merge until `EMAIL_API_KEY` is set and `EMAIL_TEST` is off, or it is
  untrue.
- Privacy Notice: the Resend paragraph is drafted in
  `docs/COMPLIANCE-PACK.md`, question 1.25 (g). Compliance to approve and
  fill in the bracketed facts, then add it to `privacy.html`.
- Compliance to approve the email text in `docs/email-shots/*.txt`.

## Tests

`node tests/submission-created.test.js` (no network). It also checks every
page's warning box and footer line match `shared/compliance-text.json`, the
one source of the warning and regulator text.
