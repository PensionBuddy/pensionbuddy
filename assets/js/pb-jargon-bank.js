/*
  The Jargon Battle question bank, 26 entries, shared by the game and the site.

  It used to live inside games/jargon-battle.html. It moved here so the
  education pages can show the same one-line definitions the game quizzes on,
  rather than a second set written to say the same thing. Entries are the
  game's own: term, prompt, correct, wrong[3], buddySays, difficulty.

  Classic script, no build step. It publishes one global:
    window.PBJargonBank   the array, in its original order

  The game loads it with a relative src, which tools/stamp-images.py never
  reaches (it globs the repository root only), so the game's tag carries no
  ?v= hash. If the bank is ever edited, bump that query by hand in
  games/jargon-battle.html or a returning player keeps the cached copy.
*/
(function (global) {
  'use strict';

  global.PBJargonBank = [
 {
  "term": "AVC (Additional Voluntary Contribution)",
  "prompt": "What is an AVC?",
  "correct": "Extra money you put into your work pension on top.",
  "wrong": [
   "Advanced Vocal Coaching, for anyone who sings at the karaoke.",
   "Automatic Volume Control, the knob on the back of the telly.",
   "The yearly service the boiler gets before the cold sets in."
  ],
  "buddySays": "AVCs usually go in through payroll, and they normally get the same tax relief as your regular pension contributions.",
  "difficulty": 1
 },
 {
  "term": "Annuity",
  "prompt": "An annuity is...",
  "correct": "A guaranteed income for life, bought with your pension pot.",
  "wrong": [
   "An annual tea dance the credit union puts on for members.",
   "A garden plant that flowers once and is gone by autumn.",
   "A festival for retired accountants, held every year in Athlone."
  ],
  "buddySays": "An insurer takes on the job of paying you for as long as you live. Once it is bought, it usually cannot be changed.",
  "difficulty": 2
 },
 {
  "term": "PRSA (Personal Retirement Savings Account)",
  "prompt": "A PRSA is...",
  "correct": "A flexible personal pension you own and take between jobs.",
  "wrong": [
   "Public Roads Safety Authority, the crowd behind the speed signs.",
   "Personal Retirement Shopping Allowance, for the January sales.",
   "A savings stamp book, filled in at the top of the kitchen press."
  ],
  "buddySays": "The A stands for account, and the account is yours, not the employer's. It travels with you when you move on.",
  "difficulty": 2
 },
 {
  "term": "Defined Contribution pension",
  "prompt": "A Defined Contribution pension is...",
  "correct": "A pot of contributions and growth, with no income promised.",
  "wrong": [
   "The speech someone gives when they finally retire.",
   "The euro you drop in the collection tin at the shop door.",
   "A firmly worded contribution to the letters page of the paper."
  ],
  "buddySays": "The pot is yours, though the final value is not guaranteed. Investments can fall as well as rise along the way.",
  "difficulty": 2
 },
 {
  "term": "Drawdown",
  "prompt": "Drawdown means...",
  "correct": "Taking money out of your pension pot once you retire.",
  "wrong": [
   "Pulling the blinds down in the front room of an afternoon.",
   "The drop in the water level in the well after a dry spell.",
   "The final raffle draw at the ploughing championships."
  ],
  "buddySays": "Drawdown is the taking out, after all the years of putting in. Whatever stays invested can still rise or fall.",
  "difficulty": 1
 },
 {
  "term": "Tracker fund",
  "prompt": "What is a tracker fund?",
  "correct": "A fund that follows an index instead of picking shares.",
  "wrong": [
   "A fund that tracks down the socks lost behind the radiator.",
   "The number you type in to see where the parcel got to.",
   "A fund that follows the same route as the 46A bus."
  ],
  "buddySays": "It follows the index up and it follows the index down, with no stock picking involved.",
  "difficulty": 2
 },
 {
  "term": "Vesting",
  "prompt": "Vesting means...",
  "correct": "When your employer's contributions become yours to keep.",
  "wrong": [
   "The thermal vest your mother insists on once it turns cold.",
   "Pulling on a hi-vis vest before you go near the site.",
   "The waistcoat half of a three piece suit, rarely worn now."
  ],
  "buddySays": "In Ireland that point generally comes after a qualifying period, often two years in the scheme. Your own contributions are always your own money.",
  "difficulty": 3
 },
 {
  "term": "Defined Benefit pension",
  "prompt": "What is a Defined Benefit pension?",
  "correct": "A pension promising a set income based on pay and service.",
  "wrong": [
   "Benefits worked out by a committee that meets twice a year.",
   "A pension paid out in vouchers for the staff canteen.",
   "A pension counting only the years you actually enjoyed the job."
  ],
  "buddySays": "With Defined Benefit the promise is about income, not about a pot with your name on it. Salary and years of service do the sums.",
  "difficulty": 2
 },
 {
  "term": "Tax relief",
  "prompt": "What is pension tax relief?",
  "correct": "Your contribution comes off the top of your taxable income.",
  "wrong": [
   "The great relief of getting the tax return finished at last.",
   "A relief map of Ireland showing where all the tax offices are.",
   "A carved stone relief of a taxman over an old bank door."
  ],
  "buddySays": "For a higher rate taxpayer, a hundred euro going in costs about sixty. PRSI and USC are not relieved, mind.",
  "difficulty": 1
 },
 {
  "term": "State Pension (Contributory)",
  "prompt": "The State Pension (Contributory) is...",
  "correct": "A State payment from age 66, based on your PRSI record.",
  "wrong": [
   "A pension paid to anyone in a contributory state of mind.",
   "The pension the State of Texas posts over to Irish cousins.",
   "A payment that arrives with a card from the President."
  ],
  "buddySays": "It is not means tested, so savings or a work pension do not cut it back. A full personal rate comes to €15,564 a year.",
  "difficulty": 1
 },
 {
  "term": "Auto-enrolment (My Future Fund)",
  "prompt": "Auto-enrolment means...",
  "correct": "A State scheme enrolling eligible employees who have no pension.",
  "wrong": [
   "A motoring club that enrols anyone with an automatic gearbox.",
   "The night class they put you into when the one you wanted fills up.",
   "A subscription that renews itself whether you like it or not."
  ],
  "buddySays": "It goes by the name My Future Fund, and eligible employees are put in automatically. The employee, the employer and the State all pay into it.",
  "difficulty": 2
 },
 {
  "term": "ARF (Approved Retirement Fund)",
  "prompt": "What is an ARF?",
  "correct": "Your pot stays invested and you draw from it in retirement.",
  "wrong": [
   "What Buddy says at the postman, twice, from behind the gate.",
   "Any Remaining Funds, the bit left over after the will is read.",
   "A Really Fine hat, handed over on your last day at work."
  ],
  "buddySays": "An ARF can grow, it can fall, and it can run out, because the money stays invested. The A is for Approved, not for anything Buddy barks.",
  "difficulty": 2
 },
 {
  "term": "PRSI",
  "prompt": "What does PRSI stand for?",
  "correct": "Pay Related Social Insurance, which builds State Pension rights.",
  "wrong": [
   "Pretty Rough Sea Index, the number read out after the shipping forecast.",
   "Public Records Service Ireland, the crowd who mind the old files.",
   "Personal Ready Spending Income, whatever is left after the bills."
  ],
  "buddySays": "Paid, credited and HomeCaring contributions all count towards the State Pension, subject to caps. Only the paid ones count towards the 520 qualifying minimum.",
  "difficulty": 1
 },
 {
  "term": "Tax-free lump sum",
  "prompt": "A tax-free lump sum is...",
  "correct": "Part of your pot taken tax free at retirement, within limits.",
  "wrong": [
   "The lump in the porridge that nobody at the table owns up to.",
   "The bump you get on your head off the low door in the attic.",
   "A sum you never have to do at school, because the tax is free."
  ],
  "buddySays": "In many cases it is up to a quarter of the fund, and Revenue sets the limits.",
  "difficulty": 1
 },
 {
  "term": "Consolidation (of old pensions)",
  "prompt": "Consolidation means...",
  "correct": "Bringing old pensions from past jobs together into one plan.",
  "wrong": [
   "Consoling a pension that has had a rough enough week.",
   "Building a console table to keep all the pension letters on.",
   "A consolation prize for the pension that came second this year."
  ],
  "buddySays": "Some older pensions carry guarantees that would be left behind if the money moved, so they are not all the same inside.",
  "difficulty": 2
 },
 {
  "term": "Standard Fund Threshold",
  "prompt": "The Standard Fund Threshold is...",
  "correct": "Revenue's cap on the pension fund that gets full tax relief.",
  "wrong": [
   "A doorstep built to a standard height, the way builders like it.",
   "A standard size of envelope that An Post prefers.",
   "The level the racket has to reach before the neighbours ring."
  ],
  "buddySays": "Anything above the cap is taxed on drawdown. The cap is legislated to rise in steps from 2026 to 2029.",
  "difficulty": 3
 },
 {
  "term": "Employer contribution",
  "prompt": "An employer contribution is...",
  "correct": "Money your employer pays in, effectively part of your pay.",
  "wrong": [
   "The boss's turn to buy the fancy biscuits on a Friday.",
   "The card the whole office signs when somebody is off having a baby.",
   "The pen the company hands out with its own name on it."
  ],
  "buddySays": "It is effectively part of your pay, just pointed at your pension instead of your current account.",
  "difficulty": 1
 },
 {
  "term": "Compound growth",
  "prompt": "Compound growth is...",
  "correct": "Your growth earns growth of its own, so time matters.",
  "wrong": [
   "A locked compound where the council keeps the gritters.",
   "Two words stuck together to make one, the way teapot works.",
   "The way a damp patch on the ceiling keeps quietly spreading."
  ],
  "buddySays": "It is growth on the growth, quiet at first and louder later. No growth is ever guaranteed, mind.",
  "difficulty": 1
 },
 {
  "term": "QFA (Qualified Financial Adviser)",
  "prompt": "QFA stands for...",
  "correct": "Qualified Financial Adviser, an Irish financial advice qualification.",
  "wrong": [
   "Quick Fire Answers, the frantic last round of the table quiz.",
   "Quality Farm Assured, the sticker on a packet of rashers.",
   "Queueing For Ages, the national pastime at the deli counter on a Friday."
  ],
  "buddySays": "It is the professional qualification behind regulated financial advice in Ireland, not a round on the table quiz.",
  "difficulty": 2
 },
 {
  "term": "Occupational pension scheme",
  "prompt": "An occupational pension scheme is...",
  "correct": "A pension scheme set up by an employer for its staff.",
  "wrong": [
   "The physio you get for the shoulder you hurt at work.",
   "A rota deciding who is occupying the hot desk this week.",
   "Occupational therapy, run out of the local health centre."
  ],
  "buddySays": "Occupational simply means workplace. The employer sets it up and trustees run it.",
  "difficulty": 1
 },
 {
  "term": "Annual management charge (AMC)",
  "prompt": "What is an AMC?",
  "correct": "The yearly percentage charge taken from a fund for managing it.",
  "wrong": [
   "A Mighty Cuppa, the standard morning break in any Irish office.",
   "Automatic Meter Check, the job the electricity fella does out the back.",
   "A cinema chain famous for the enormous buckets of popcorn."
  ],
  "buddySays": "It comes out of the fund itself each year rather than landing as a bill in the post. A percentage, taken every year the money is invested.",
  "difficulty": 2
 },
 {
  "term": "Preserved benefit (a pension left behind when you change jobs)",
  "prompt": "A preserved benefit is...",
  "correct": "A vested pension left in an old scheme, still yours.",
  "wrong": [
   "A jar of jam your aunt makes and labels with the date.",
   "A grant for keeping an old building exactly as it is.",
   "The good china, kept for visitors who never come."
  ],
  "buddySays": "Once you are vested it stays put in the old scheme, or it can be transferred. Changing jobs does not make it vanish.",
  "difficulty": 3
 },
 {
  "term": "Transfer value",
  "prompt": "A transfer value is...",
  "correct": "The cash value a scheme puts on benefits if you move them.",
  "wrong": [
   "The price a club pays to sign a player in the winter window.",
   "A transfer you iron onto the back of a T-shirt.",
   "What the sofa is worth on the day you move house."
  ],
  "buddySays": "It is one figure for everything you built up in that scheme, and it is the figure that travels if the benefits move.",
  "difficulty": 3
 },
 {
  "term": "Trustee (of a pension scheme)",
  "prompt": "A pension scheme trustee is...",
  "correct": "Someone legally bound to run the scheme in the members' interests.",
  "wrong": [
   "A very trusting soul, the sort who lends out ladders and lawnmowers.",
   "The tall tree in the car park that everyone parks under.",
   "Whoever minds the keys of the community hall."
  ],
  "buddySays": "Trustees answer to the members, and the duty on them is a legal one. Quiet work, and important work.",
  "difficulty": 3
 },
 {
  "term": "Risk rating (the 1 to 7 scale on a fund)",
  "prompt": "A fund's risk rating is...",
  "correct": "A one to seven scale for how bumpy a fund may be.",
  "wrong": [
   "How hot the takeaway is, by the chillies on the menu.",
   "How steep the climb is, according to the walking guide.",
   "Seven gold stars for the bravest fund of the year."
  ],
  "buddySays": "It has a proper name, the Summary Risk Indicator, and it runs from 1 at the lowest to 7 at the highest.",
  "difficulty": 2
 },
 {
  "term": "Pay and File deadline (31 October)",
  "prompt": "The Pay and File deadline is...",
  "correct": "Contributions paid by 31 October can count against last year's tax.",
  "wrong": [
   "The day the shops are finally let put the Christmas tins on the shelves.",
   "The deadline for filing your nails ahead of the Halloween party.",
   "The evening the parish accounts are read out at Mass."
  ],
  "buddySays": "Online filers usually get until the middle of November. It is a Revenue date rather than a pension rule.",
  "difficulty": 3
 }
];

}(typeof window !== 'undefined' ? window : this));
