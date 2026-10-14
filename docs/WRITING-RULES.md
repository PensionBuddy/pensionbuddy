# Writing rules

These rules are for every word on the site. That means headlines, buttons,
guides, forms and emails. The test is simple: a ten-year-old can follow it.
Write like Hemingway's iceberg. Show the tip. The reader can work out the rest.

The measure is `tests/readability.test.py`. It gives each page a reading
age. The bar is 10 or under, and every page meets it (14 October 2026:
`director-pension-rules.html` came down from 10.9 and `glossary.html`
from 10.7).
`--table` shows each page, and the longest sentences on the site. The test
does not score warnings, sources or legal text. That wording is fixed. Do
not change it to meet these rules.

## 1. Short sentences. One idea each.

Keep a sentence under 12 words where you can.
Why: a long sentence makes the reader hold too much at once.

- Before (director.html, 30 words): "Into your pension, all €1,000 goes in,
  within Revenue’s limits; it is taxed when you take it, usually from 60,
  apart from a lump sum that is tax-free within limits."
- Done: "All €1,000 goes into your pension, within Revenue’s limits. You
  pay tax when you take it out, usually from 60. A lump sum is tax-free,
  within limits."

## 2. Numbers, not adjectives.

Write "€303 a month", not "a big gap".
Why: a number is clear. "Big" makes the reader guess.

- Before (the "Pensions after 50" card): "Pay in more with tax relief, and
  plan your retirement."
- Done: "Tax relief: 30% of earnings at 50, 40% at 60."

## 3. The reader first.

Do not put "we" in a headline. Start with "you". On a page, write 3 "you"
for every "we".
Why: the reader came for their pension, not for us.

- Before (tracker.html): "We trace and value them"
- After: "Your old pensions, found and valued"

## 4. Headlines name the problem, the wish or the reward.

Put it in the first 7 words.
Why: many readers stop at the headline. Give them a reason to read on.

- Before (index.html): "Revenue’s deadline is 18 November if you pay and
  file online."
- After: "Cut last year’s tax: pay in before Revenue’s deadline."
- Good now (starter.html): "You pay €80. Revenue adds €20." The reward, in
  six words.

## 5. Every line answers "So what for me?"

Read each line aloud. Ask "So what for me?" No answer: cut the line.
Why: a line the reader does not need hides a line they do need.

- Before (director-pension-rules.html): "The Pensions Authority counted
  40,644 one-member arrangements on 1 September 2026, some being wound up.
  There were 141,500 in January 2023."
- After: cut both. A line above already says that most have moved.

## 6. The gain first. The loss second. No fear.

Show the gain first, in green. Show the loss second, in red (on a chart,
coral: see `CONTEXT.md`). Do not frighten the reader about the future.
Show what they can do now.
Why: fear makes people stop. A gain makes them act.

- Done (index.html): "In 30 years, €1,000 in a pension could buy what
  €3,171 buys today." The deposit line comes second.
- Done (pension-calculator.html): "Start now, not in a year, and you retire
  with roughly €18,702 more." The handle under it says what waiting costs.
- Before (index.html headline): "€1,000 buys less every year."
- After: "A pension can keep up with prices."

## 7. Plain words. Explain a term where it first appears.

Use the word you say out loud. If you need a pension term, explain it in
plain words. Do this the first time it is on the page. Spell out each
initialism at its first use: "Personal Retirement Savings Account (PRSA)".
This is the law (Consumer Protection Code 2025, regulation 88), and
`tools/check-initialisms.py` checks it.
Why: one word the reader does not know can stop them.

- Before (director-pension-rules.html): "Above 100%, the excess is a
  taxable benefit-in-kind for you."
- Done: "Above 100%, you pay tax on the extra, as on your pay. Revenue calls
  it a benefit-in-kind."

## 8. Leave out what the reader can work out.

This is the iceberg. Give the one figure that matters. The reader can do
the rest. Do not explain a joke or a picture.
Why: each extra figure makes the main one weaker.

- Before (index.html): "€3,636 a year short. €303 a month. €72,720 over 20
  years."
- After: "€303 a month short."
- Good now (index.html): Buddy is "Chief Napping Officer". No line explains
  the joke.

## 9. Never invent proof.

No made-up stories, reviews, counts or deadlines. Every claim must be true.
You must be able to show where it comes from.
Why: one false claim breaks trust. A regulated adviser must not mislead.

- Never: "Trusted by thousands." "Offer ends Friday."
- Good now (index.html): "I founded Gresham Wealth Management in 2012 and
  still lead it." It is true, and a reader can check it.

## 10. Say the main point again. People forget.

People forget that other people forget. Say the one main point more than
once, in a new place each time. Repeat the point, not the detail.
Why: a reader skims. The second time is often the first time they see it.

- Good now (index.html): the calculator's own figures come back in the gap,
  and again in Prices, Time and Tax.
- Not this: three figures in one line (rule 8).

## Before you publish

1. Read the page aloud. Ask "So what for me?" of each line.
2. Find the longest sentence. Make it two.
3. Run `python3 tests/readability.test.py --table`: the page is at 10 or
   under. Then run `python3 tools/check-initialisms.py`.
