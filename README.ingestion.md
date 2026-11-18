# Website RAG chatbot

An in-progress TypeScript/Next.js banking-information demo. The chatbot searches a prebuilt snapshot of public website content; it does not crawl during chat. Product coverage and answer quality are not yet verified. Do not present this as a completed assignment.

## Setup

Requires Node 24+, a Supabase project with pgvector, Cohere and Groq API keys. Copy `.env.example` to `.env.local`, fill in server-only credentials, run `npm ci`, and apply `supabase/schema.sql` in the Supabase SQL editor. Never commit real keys. Run `npm run dev` and open `http://localhost:3000`.

## Ingestion and review

1. `npm run inspect:sitemap -- path/to/sitemap-en.xml` validates and counts a saved sitemap.
2. `npm run crawl -- path/to/sitemap-en.xml 50` fetches a limited sample after checking robots.txt. Results are written to ignored `data/crawl.json`. Redirects, failed pages, unverified extractions and oversized blocks need review. This is not yet a comprehensive production crawler.
3. `npm run inventory` generates unreviewed product candidates. Reconcile them with category listings and create a reviewed inventory in the format of `data.example/reviewed-inventory.json`.
4. `npm run pdf:review -- data/crawl.json 10` discovers linked PDFs on supported bank domains and writes unverified page text to `data/pdf-review.json`. Check tables and extracted values against the original. PDF content is not automatically indexed.
   Add checked excerpts to `data/verified-pdf.json` using the format described in `data.example/README.md`; only records marked verified are considered for indexing.
5. `npm run index:estimate` prints the provider, text volume and estimated request count without model calls. After the user approves the batch, run `npm run index:estimate -- data/crawl.json --approve-api --batch-id=<batchId>` to stage an index version. Replace `<batchId>` with the fingerprint from the approved estimate. This excludes tables, calls Cohere and writes to Supabase.
6. `npm run inventory:upload -- path/to/reviewed-inventory.json <staged-version-uuid>` uploads verified product records. After coverage and the 15-question evaluation pass, update `supabase/promote.sql` with the staged UUID and execute it to make that version active.

The current tooling does not yet prove coverage across every product or handle all document formats. Crawled pages need review. The discovery classifier supports a limited set of categories and asks for clarification on broader lists. Completion requires a full crawl, PDF and inventory review, model-backed evaluation, submission document, video and deployment.

## Privacy and operation

The UI keeps chat context in the tab only and clears it after 15 minutes of inactivity, reload or close. Recent messages are sent to the server and model providers for each answer; provider policies apply. No application-level conversation logging is implemented. External models and Supabase are required for live answers. If answer generation fails after retrieval, the app can show attributed excerpts. If the request cannot be served, the UI displays a retry message.

Run `npm test` for local fixtures and `npm run build` for the production build. Obtain approval before substantial external AI API batches.
