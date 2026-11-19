# Conversational request routing correction

The reported comparison named Salary Transfer Loans for Expats and UAE Nationals. Its paraphrases could be rejected as ambiguous before embedding search. The exact wording also reproduced a different error on the active catalogue: clause splitting discarded the shared salary-transfer context and selected Home Loans for UAE Nationals.

## Causes

- Multiple product candidates were treated as an ambiguous user request unless a limited comparison pattern matched.
- Splitting coordinated noun phrases destroyed shared context. This was entity resolution, before semantic retrieval.
- Product-specific query construction deleted all words present in product names, which could also delete a requested field such as salary.
- A failed conversational rewrite caused standalone questions to ask for clarification instead of continuing retrieval.

## Change

Use whole-question entity scoring and local mention spans as retrieval hints. Preserve independently mentioned short names without treating a name nested inside another mention as an extra subject. Allow multiple named subjects without requiring a comparison keyword. Embed and rerank the original question; extra product queries retain the complete original wording. Preserve requested-field terms in page ranking. Rewrite subject references only to supply conversational context, and clarify genuinely unresolved singular references. Plural references retain the discussed set. A failed rewrite of a standalone question can continue retrieval. Exact source excerpts use separate source identity hints instead of requiring a modified embedding query.

No product names, loan populations or example questions were added to application rules. They appear only in regression fixtures. No changes to embedding model, provider retries, corpus or Supabase schema are part of this fix.

## Verification

The frozen 56-case routing matrix across eight catalogue families improved from 16/56 correct product sets at 91c6b74 to 56/56, retaining the original question in all 56. Original shared-head regressions and abbreviated comparison cases are additional tests. These measure entity resolution and query routing, not final answer accuracy.

A fully simulated network test executes answerQuestion through Supabase lookups, query embeddings, hybrid search, reranking, answer rendering and verification. It checks that both intended loan pages are fetched, no home-loan page is fetched, the first embedding input is the original question, and all product query inputs preserve it. Another check ensures unmatched standalone requests can reach embedding search despite a failed rewrite. No live Cohere or Groq calls were made.

X-App-Revision on API responses exposes a validated commit SHA prefix in Vercel, allowing provider-free invalid-request smoke checks to confirm which revision the production alias serves. It contains no credentials or user content.

The usage-limit issue is separate. Live generative accuracy remains unverified for this revision. Historical passing cases cannot be treated as fresh acceptance results.
