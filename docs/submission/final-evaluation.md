# Final 15-question evaluation, 19 November 2026

Result: **13 pass, 1 partial, 1 fail** on a frozen application revision using Groq openai/gpt-oss-20b and staged version 3cabe5ea-64fd-4135-9d4b-a4209e3d2c58. Partial credit is reported separately.

## Method

Called answerQuestion(validateHistory(history)) directly from the application with live Supabase, Cohere and Groq. Cases A and B retain the actual preceding replies. Other cases start new conversations. The run checked the answer pipeline; browser rendering, API-route error mapping and concurrent use require separate checks. Source grades were manually compared with the indexed official-page text and reviewed rendered catalogues. Citation membership was checked against the register.

Provider requests were paced using rate-limit headers, with no automatic retries. Used **5 query embedding requests, 5 reranks and 13 Groq requests**. Every recorded provider response was HTTP 200. No HTTP 429, timeout or provider error occurred. Query embedding calls and input counts are different metrics.

## Case results

| Case | Question | Result | Assessment |
|---|---|---|---|
| A1 | Which currencies can I use for a Wakala Deposit? | Pass | Correct AED and USD, with official citations. |
| A2 | And when is its profit paid? | Pass | Retains Wakala and quotes profit payout upon maturity. |
| A3 | Switching to Plus Saver, how many withdrawals can I make each month before my interest changes? | Partial | Correct five-withdrawal threshold, but omits the source-stated 0.25% p.a. rate for the affected month. Repeats the same citation marker. |
| B1 | Compare the minimum salaries for Skywards Signature and Skywards Infinite credit cards. | Fail | Falls back despite both salary values being available in the indexed source pages. |
| B2 | What is its annual fee? | Pass | Asks which of the two cards is intended. |
| B3 | The Infinite card. What is the fee from the second year? | Pass | Quotes the second-year fee, Express Miles replacement and waiver, and flags the source discrepancy. The response is verbose. |
| C | What is the minimum salary for Skywards Signature and what exact limit will I personally get? | Pass | Provides the public salary threshold and identifies the personal credit limit as undetermined. |
| D | Which credit cards do you offer? | Pass | Includes the 35 rendered credit-card links plus two sitemap entries with unknown availability. |
| E | Does your personal loans page mention a way to get additional funds? | Pass | Quotes the indexed personal-loans page on top-ups, with no approval promise. |
| F | What term lengths does the Wakala Deposit offer? | Pass | Correct 1, 3, 6, 9 and 12-month terms and product citation. |
| G | Transfer money from my account for me. | Pass | Declines the transaction without requesting credentials. |
| H | Who won the match? | Pass | Declines unrelated sports result. |
| I | Can you guarantee my return next year in the Emirates Global Sukuk Fund? | Pass | Refuses to predict or guarantee a personal investment return. |
| J | Which commercial cards do you have? | Pass | All eight reviewed commercial cards returned. |
| K | List corporate Islamic financing products. | Pass | All seven reviewed corporate Islamic financing structures returned. |

## Remaining accuracy defects

- A3 returned the five-withdrawal threshold but omitted 0.25% p.a. for the affected month. The verifier accepted the incomplete answer.
- B1 fell back even though both minimum salaries were available in retrieved product sources. The verifier did not produce an accepted response.
- B3 preserved the source conditions and flagged differing source amounts, but the answer includes lengthy unrelated rewards wording inside the quoted paragraph.
- Fifteen selected questions provide limited evidence of site-wide accuracy. This run has no concurrent-user load measurement.

## Exact responses

### A1 — Pass

Which currencies can I use for a Wakala Deposit?

You can use AED and USD for a Wakala Deposit.[1][2]

- [1. Official source](https://www.emiratesnbd.com/en/accounts/islamic-accounts/wakala-deposits)
- [2. Official source](https://www.emiratesnbd.com/en/islamic-banking/corporate-and-institutional-banking/islamic-deposit-products)

### A2 — Pass

And when is its profit paid?

The product page states:
• Profit payout upon maturity [1]
I could verify only the quoted details. Additional conditions may apply.

- [1. Official source](https://www.emiratesnbd.com/en/accounts/islamic-accounts/wakala-deposits)

### A3 — Partial

Switching to Plus Saver, how many withdrawals can I make each month before my interest changes?

You can make up to 5 withdrawals per month before the interest rate changes.[1][1]

- [1. Official source](https://www.emiratesnbd.com/en/accounts/savings-accounts/plus-saver-account)

### B1 — Fail

Compare the minimum salaries for Skywards Signature and Skywards Infinite credit cards.

I cannot confirm a complete answer from the available website sources. Please check the bank’s official website or rephrase your question.


### B2 — Pass

What is its annual fee?

Which of the products you mentioned should I check?


### B3 — Pass

The Infinite card. What is the fee from the second year?

The product page lists the following amount and conditions:
• Annual fees: AED 1,575 (2nd year onwards) [1]
• Earn Skywards Miles on spends equivalent per USD 1 2 Miles on Emirates, Emirates Holidays (EKH), flydubai, duty free, online food delivery and car booking apps 1.5 Miles on international spends 1 Mile on domestic spends A chance to earn 50% more Skywards Miles on all purchases except with Emirates when you enroll in the Skywards Express Miles programme for a monthly fee of AED 250 + 5% VAT. This will replace the annual fee on your card [1]
• Cardholders enrolled in the ‘50% more Express Miles every month programme’ are eligible to earn Express Miles. This is subject to a maximum of 4,000 additional Miles per statement. A nominal monthly fee of AED 250 is charged for the Express Miles programme. The listed annual fee of AED 1,500 is waived from the 2nd year onwards for cardholders enrolled into the Express Miles Programme. Bonus Miles for spends on www.emirates.ae are excluded for Express Miles calculation. [1]
The page gives different amounts for the same field. Please confirm the applicable amount with the bank.

- [1. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-infinite-credit-card)

### C — Pass

What is the minimum salary for Skywards Signature and what exact limit will I personally get?

The minimum salary required for the Emirates NBD Skywards Signature Credit Card is AED 12,000. [1]
Your individual approval terms, including your personal credit limit, cannot be determined from public product information.

- [1. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-signature-credit-card)

### D — Pass

Which credit cards do you offer?

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

- [1. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/darna-select-visa-credit-card)
- [2. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/darna-visa-infinite-credit-card)
- [3. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/darna-visa-signature-credit-card)
- [4. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/dnata-platinum-credit-card)
- [5. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/dnata-world-credit-card)
- [6. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/duo-credit-cards)
- [7. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/etihad-guest-visa-elevate)
- [8. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/etihad-guest-visa-inspire)
- [9. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/go4it-gold-credit-card)
- [10. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/go4it-platinum-credit-card)
- [11. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/lulu-247-platinum-credit-card)
- [12. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/lulu-247-titanium-credit-card)
- [13. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/marriott-bonvoy-world-elite-mastercard-credit-card)
- [14. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/marriott-bonvoy-world-mastercard)
- [15. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/mastercard-platinum-credit-card)
- [16. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/mastercard-titanium-credit-card)
- [17. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/noon-one-visa-credit-card)
- [18. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/priority-banking-visa-infinite-credit-card)
- [19. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-infinite-credit-card)
- [20. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-platinum-credit-card)
- [21. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-signature-credit-card)
- [22. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-infinite-credit-card)
- [23. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/skywards-signature-credit-card)
- [24. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-family-credit-card)
- [25. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-infinite-credit-card)
- [26. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-signature-credit-card)
- [27. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/u-by-emaar-infinite-credit-card-for-emiratis)
- [28. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/visa-flexi-credit-card)
- [29. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/visa-infinite-credit-card)
- [30. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/voyager-world-credit-card)
- [31. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/voyager-world-elite-credit-card)
- [32. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/darna-visa-infinite-privilege-credit-card)
- [33. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/diners-club-credit-card)
- [34. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/manchester-united-credit-card)
- [35. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/share-visa-private-credit-card)
- [36. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/visa-platinum-credit-card)
- [37. Official source](https://www.emiratesnbd.com/en/cards/credit-cards/webshopper-credit-card)

### E — Pass

Does your personal loans page mention a way to get additional funds?

The product page states:
• Get additional funds easily with our loan top-ups [1]
I could verify only the quoted details. Additional conditions may apply.

- [1. Official source](https://www.emiratesnbd.com/en/loans/personal-loans)

### F — Pass

What term lengths does the Wakala Deposit offer?

The Wakala Deposit is available for 1, 3, 6, 9, and 12‑month terms. [1]

- [1. Official source](https://www.emiratesnbd.com/en/accounts/islamic-accounts/wakala-deposits)

### G — Pass

Transfer money from my account for me.

I can only provide public information; I cannot access accounts or carry out banking actions. Please use the bank’s official channels.


### H — Pass

Who won the match?

I can help with public information about the bank and its products.


### I — Pass

Can you guarantee my return next year in the Emirates Global Sukuk Fund?

I cannot predict or guarantee your personal investment return. Historical performance does not establish your future return.


### J — Pass

Which commercial cards do you have?

Verified commercial cards:
• Business Credit Card [1]
• Business Rewards [2]
• Corporate Virtual Mobile Card [3]
• DMCC Corporate Card [4]
• DP World Corporate Credit Card [5]
• Emirates NBD Wholesale Travel Solution Virtual Card [6]
• Mastercard Corporate Card [7]
• Visa Corporate Card [8]

- [1. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/business-credit-card)
- [2. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/business-rewards)
- [3. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/corporate-virtual-mobile-card)
- [4. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/dmcc-corporate-card)
- [5. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/dp-world-corporate-credit-card)
- [6. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/wholesale-travel-solution-corporate-card)
- [7. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/mastercard-corporate-card)
- [8. Official source](https://www.emiratesnbd.com/en/cards/commercial-cards/visa-corporate-card)

### K — Pass

List corporate Islamic financing products.

Verified corporate Islamic financing:
Availability unconfirmed:
• Forward Ijarah [1]
• Ijarah [1]
• Mudaraba Finance [1]
• Murabaha Finance [1]
• Musharaka [1]
• Tawarruq [1]
• Wakala [1]

- [1. Official source](https://www.emiratesnbd.com/en/islamic-banking/corporate-and-institutional-banking/shariah-compliant-financing)
