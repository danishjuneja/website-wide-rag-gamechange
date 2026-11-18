# Emirates NBD website RAG evaluation, 19 November 2026

The same 13 questions ran twice against the staged database using Groq GPT-OSS 20B, followed by a six-turn check after changes to subject resolution and retrieval. Each conversation used actual earlier answers from that run. The runner called the application answer pipeline directly. It paced model requests using provider headers. The last revision also received separate provider-disabled checks using real staged sources.

The first run passed 5 of 13 questions. The second passed 7 of 13. The six-turn check passed three, produced two fallbacks and omitted a fee waiver once. These are development results from different revisions. The final checks below have no combined release score.

| Case | Question | First run | Second run | Six-turn check | Later provider-disabled check |
|---|---|---|---|---|---|
| A1 | Which currencies can I use for a Wakala Deposit? | Pass | Pass | Pass | — |
| A2 | And when is its profit paid? | Wrong fact | Unnecessary clarification | Fallback | Pass |
| A3 | Switching to Plus Saver, how many withdrawals can I make each month before my interest changes? | HTTP 400 | Unnecessary clarification | Pass | — |
| B1 | Compare the minimum salaries for Skywards Signature and Skywards Infinite credit cards. | Fallback | Fallback | Fallback | Pass |
| B2 | What is its annual fee? | Pass | Pass | Pass | — |
| B3 | The Infinite card. What is the fee from the second year? | Unnecessary clarification | HTTP 400 | Partial: waiver omitted | Pass |
| C | What is the minimum salary for Skywards Signature and what exact limit will I personally get? | Timeout | Pass | — | — |
| D | Which credit cards do you offer? | Pass | Pass | — | — |
| E | Does your personal loans page mention a way to get additional funds? | Fallback | Fallback | — | Pass |
| F | What term lengths does the Wakala Deposit offer? | Fallback | Pass | — | — |
| G | Transfer money from my account for me. | Pass | Pass | — | — |
| H | Who won the match? | Pass | Pass | — | — |
| I | Can you guarantee my return next year in the Emirates Global Sukuk Fund? | Generic fallback | HTTP 400 | — | Pass |
| J | Which commercial cards do you have? | — | — | — | Pass |
| K | List corporate Islamic financing products. | — | — | — | Pass |

## How the answers were graded

A correct factual answer needed the requested value, its source and relevant conditions. The two-card fee follow-up earned partial credit when it gave AED 1,575 from year two but omitted the Express Miles replacement and waiver. The source itself uses different amounts in the standard fee and waiver passages. The subsequent database-backed check quoted both and flagged the difference.

The discovery check included all 35 rendered retail credit-card detail links and two additional sitemap-backed cards with unconfirmed availability. The commercial-card and Islamic-financing checks matched eight and seven entries respectively from independent rendered listings.

## Provider outcomes

- First 13 — 8 embed HTTP 200, 7 rerank HTTP 200, 11 groq HTTP 200, 2 groq HTTP 400.
- Second 13 — 6 embed HTTP 200, 6 rerank HTTP 200, 15 groq HTTP 200, 2 groq HTTP 400.
- Final six — 5 embed HTTP 200, 5 rerank HTTP 200, 16 groq HTTP 200.

The first run also timed out on C before a provider response was recorded. The second run recorded Groq error codes tool_use_failed and json_validate_failed. No run recorded a 429. This result includes evaluation pacing. The evaluator did not simulate concurrent users.

## Latest observed answers

### A1 — Which currencies can I use for a Wakala Deposit?

Observed in the six-turn check.

You can use AED and USD for a Wakala Deposit.[1][2]

1. [Source 1](https://www.emiratesnbd.com/en/accounts/islamic-accounts/wakala-deposits)
2. [Source 2](https://www.emiratesnbd.com/en/islamic-banking/corporate-and-institutional-banking/islamic-deposit-products)

### A2 — And when is its profit paid?

Observed in the later provider-disabled check.

The product page states:
• Profit payout upon maturity [1]
I could verify only the quoted details. Additional conditions may apply.

1. [Source 1](https://www.emiratesnbd.com/en/accounts/islamic-accounts/wakala-deposits)

### A3 — Switching to Plus Saver, how many withdrawals can I make each month before my interest changes?

Observed in the six-turn check.

You can make up to 5 withdrawals per month before the interest rate changes. If you exceed this limit, the interest for that month will be calculated at 0.25% p.a. [1]

1. [Source 1](https://www.emiratesnbd.com/en/accounts/savings-accounts/plus-saver-account)

### B1 — Compare the minimum salaries for Skywards Signature and Skywards Infinite credit cards.

Observed in the later provider-disabled check.

Skywards Infinite Credit Card — Minimum salary: AED 30,000 [1]
Skywards Signature Credit Card — Minimum salary: AED 12,000 [2]

1. [Source 1](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-infinite-credit-card)
2. [Source 2](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-signature-credit-card)

### B2 — What is its annual fee?

Observed in the six-turn check.

Which of the products you mentioned should I check?


### B3 — The Infinite card. What is the fee from the second year?

Observed in the later provider-disabled check.

The product page lists the following amount and conditions:
• Annual fees: AED 1,575 (2nd year onwards) [1]
• Earn Skywards Miles on spends equivalent per USD 1 2 Miles on Emirates, Emirates Holidays (EKH), flydubai, duty free, online food delivery and car booking apps 1.5 Miles on international spends 1 Mile on domestic spends A chance to earn 50% more Skywards Miles on all purchases except with Emirates when you enroll in the Skywards Express Miles programme for a monthly fee of AED 250 + 5% VAT. This will replace the annual fee on your card [1]
• Cardholders enrolled in the ‘50% more Express Miles every month programme’ are eligible to earn Express Miles. This is subject to a maximum of 4,000 additional Miles per statement. A nominal monthly fee of AED 250 is charged for the Express Miles programme. The listed annual fee of AED 1,500 is waived from the 2nd year onwards for cardholders enrolled into the Express Miles Programme. Bonus Miles for spends on www.emirates.ae are excluded for Express Miles calculation. [1]
The page gives different amounts for the same field. Please confirm the applicable amount with the bank.

1. [Source 1](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-infinite-credit-card)

### C — What is the minimum salary for Skywards Signature and what exact limit will I personally get?

Observed in the second 13-question run.

The minimum salary required for the Skywards Signature credit card is AED 12,000.[1]
Your individual approval terms, including your personal credit limit, cannot be determined from public product information.

1. [Source 1](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-signature-credit-card)

### D — Which credit cards do you offer?

Observed in the second 13-question run.

Verified credit cards:
• Darna Select Visa Credit Card [1]
• Darna Visa Infinite Credit Card [2]
• Darna Visa Signature Credit Card [3]
• dnata Platinum Credit Card [4]
• dnata World Credit Card [5]
• Duo Credit Card [6]
• Etihad Guest Visa Elevate [7]
• Etihad Guest Visa Inspire [8]
• Go4it Gold Credit Card [9]
• Go4it Platinum Credit Card [10]
• LuLu 247 Platinum Credit Card [11]
• LuLu 247 Titanium Credit Card [12]
• Marriott Bonvoy® World Elite Mastercard® [13]
• Marriott Bonvoy® World Mastercard® [14]
• Mastercard Platinum Credit Card [15]
• Mastercard Titanium Credit Card [16]
• noon One Visa Credit Card [17]
• Priority Banking Visa Infinite Credit Card [18]
• SHARE Visa Infinite Credit Card [19]
• SHARE Visa Platinum Credit Card [20]
• SHARE Visa Signature Credit Card [21]
• Skywards Infinite Credit Card [22]
• Skywards Signature Credit Card [23]
• U By Emaar Family Credit Card [24]
• U By Emaar Infinite Credit Card [25]
• U By Emaar Signature Credit Card [26]
• U By Emaar Visa Infinite Emirati Credit Card [27]
• Visa Flexi Credit Card [28]
• Visa Infinite Credit Card [29]
• Voyager World Credit Card [30]
• Voyager World Elite Credit Card [31]
Availability unconfirmed:
• Darna Visa Infinite Privilege Credit Card [32]
• Diners Club Credit Card [33]
• Manchester United Credit Card [34]
• SHARE Visa Private Credit Card [35]
• Visa Platinum Credit Card [36]
• Webshopper Credit Card [37]

1. [Source 1](https://www.emiratesnbd.com/en/cards/credit-cards/darna-select-visa-credit-card)
2. [Source 2](https://www.emiratesnbd.com/en/cards/credit-cards/darna-visa-infinite-credit-card)
3. [Source 3](https://www.emiratesnbd.com/en/cards/credit-cards/darna-visa-signature-credit-card)
4. [Source 4](https://www.emiratesnbd.com/en/cards/credit-cards/dnata-platinum-credit-card)
5. [Source 5](https://www.emiratesnbd.com/en/cards/credit-cards/dnata-world-credit-card)
6. [Source 6](https://www.emiratesnbd.com/en/cards/credit-cards/duo-credit-cards)
7. [Source 7](https://www.emiratesnbd.com/en/cards/credit-cards/etihad-guest-visa-elevate)
8. [Source 8](https://www.emiratesnbd.com/en/cards/credit-cards/etihad-guest-visa-inspire)
9. [Source 9](https://www.emiratesnbd.com/en/cards/credit-cards/go4it-gold-credit-card)
10. [Source 10](https://www.emiratesnbd.com/en/cards/credit-cards/go4it-platinum-credit-card)
11. [Source 11](https://www.emiratesnbd.com/en/cards/credit-cards/lulu-247-platinum-credit-card)
12. [Source 12](https://www.emiratesnbd.com/en/cards/credit-cards/lulu-247-titanium-credit-card)
13. [Source 13](https://www.emiratesnbd.com/en/cards/credit-cards/marriott-bonvoy-world-elite-mastercard-credit-card)
14. [Source 14](https://www.emiratesnbd.com/en/cards/credit-cards/marriott-bonvoy-world-mastercard)
15. [Source 15](https://www.emiratesnbd.com/en/cards/credit-cards/mastercard-platinum-credit-card)
16. [Source 16](https://www.emiratesnbd.com/en/cards/credit-cards/mastercard-titanium-credit-card)
17. [Source 17](https://www.emiratesnbd.com/en/cards/credit-cards/noon-one-visa-credit-card)
18. [Source 18](https://www.emiratesnbd.com/en/cards/credit-cards/priority-banking-visa-infinite-credit-card)
19. [Source 19](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-infinite-credit-card)
20. [Source 20](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-platinum-credit-card)
21. [Source 21](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-signature-credit-card)
22. [Source 22](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-infinite-credit-card)
23. [Source 23](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-signature-credit-card)
24. [Source 24](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-family-credit-card)
25. [Source 25](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-infinite-credit-card)
26. [Source 26](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-signature-credit-card)
27. [Source 27](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-infinite-credit-card-for-emiratis)
28. [Source 28](https://www.emiratesnbd.com/en/cards/credit-cards/visa-flexi-credit-card)
29. [Source 29](https://www.emiratesnbd.com/en/cards/credit-cards/visa-infinite-credit-card)
30. [Source 30](https://www.emiratesnbd.com/en/cards/credit-cards/voyager-world-credit-card)
31. [Source 31](https://www.emiratesnbd.com/en/cards/credit-cards/voyager-world-elite-credit-card)
32. [Source 32](https://www.emiratesnbd.com/en/cards/credit-cards/darna-visa-infinite-privilege-credit-card)
33. [Source 33](https://www.emiratesnbd.com/en/cards/credit-cards/diners-club-credit-card)
34. [Source 34](https://www.emiratesnbd.com/en/cards/credit-cards/manchester-united-credit-card)
35. [Source 35](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-private-credit-card)
36. [Source 36](https://www.emiratesnbd.com/en/cards/credit-cards/visa-platinum-credit-card)
37. [Source 37](https://www.emiratesnbd.com/en/cards/credit-cards/webshopper-credit-card)

### E — Does your personal loans page mention a way to get additional funds?

Observed in the later provider-disabled check.

The product page states:
• Get additional funds easily with our loan top-ups [1]
I could verify only the quoted details. Additional conditions may apply.

1. [Source 1](https://www.emiratesnbd.com/en/loans/personal-loans)

### F — What term lengths does the Wakala Deposit offer?

Observed in the second 13-question run.

The Wakala Deposit is available for 1, 3, 6, 9, and 12‑month terms. [1]

1. [Source 1](https://www.emiratesnbd.com/en/accounts/islamic-accounts/wakala-deposits)

### G — Transfer money from my account for me.

Observed in the second 13-question run.

I can only provide public information; I cannot access accounts or carry out banking actions. Please use the bankâ€™s official channels.


### H — Who won the match?

Observed in the second 13-question run.

I can help with public information about the bank and its products.


### I — Can you guarantee my return next year in the Emirates Global Sukuk Fund?

Observed in the later provider-disabled check.

I cannot predict or guarantee your personal investment return. Historical performance does not establish your future return.


### J — Which commercial cards do you have?

Observed in the later provider-disabled check.

Verified commercial cards:
• Business Credit Card [1]
• Business Rewards [2]
• Corporate Virtual Mobile Card [3]
• DMCC Corporate Card [4]
• DP World Corporate Credit Card [5]
• Emirates NBD Wholesale Travel Solution Virtual Card [6]
• Mastercard Corporate Card [7]
• Visa Corporate Card [8]

1. [Source 1](https://www.emiratesnbd.com/en/cards/commercial-cards/business-credit-card)
2. [Source 2](https://www.emiratesnbd.com/en/cards/commercial-cards/business-rewards)
3. [Source 3](https://www.emiratesnbd.com/en/cards/commercial-cards/corporate-virtual-mobile-card)
4. [Source 4](https://www.emiratesnbd.com/en/cards/commercial-cards/dmcc-corporate-card)
5. [Source 5](https://www.emiratesnbd.com/en/cards/commercial-cards/dp-world-corporate-credit-card)
6. [Source 6](https://www.emiratesnbd.com/en/cards/commercial-cards/wholesale-travel-solution-corporate-card)
7. [Source 7](https://www.emiratesnbd.com/en/cards/commercial-cards/mastercard-corporate-card)
8. [Source 8](https://www.emiratesnbd.com/en/cards/commercial-cards/visa-corporate-card)

### K — List corporate Islamic financing products.

Observed in the later provider-disabled check.

Verified corporate Islamic financing:
Availability unconfirmed:
• Forward Ijarah [1]
• Ijarah [1]
• Mudaraba Finance [1]
• Murabaha Finance [1]
• Musharaka [1]
• Tawarruq [1]
• Wakala [1]

1. [Source 1](https://www.emiratesnbd.com/en/islamic-banking/corporate-and-institutional-banking/shariah-compliant-financing)
