# Website RAG chatbot

A browser chat application for questions about the assigned bank's public English product information. The evaluator can ask a product question, inspect the cited pages, and ask a follow-up in the same conversation. Public deployment is pending.

## Run locally

Use Node.js 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `COHERE_API_KEY` and `GROQ_API_KEY`. Credentials belong on the server. Apply `supabase/schema.sql` in your Supabase SQL editor. Use `npm run dev` for development. A staged version can be selected with `RAG_PREVIEW_VERSION` in development.

## Build the knowledge base

Run `npm run build:kb -- <assigned-website-URL>`. Alternatively pass the saved English sitemap path when the site does not serve XML to the crawler. The command crawls public pages, extracts product candidates, estimates the embedding batch and asks for confirmation before sending it. Inspect the source inventory, excluded tables, PDF reviews and failed fetches before publishing. The build uploads the bundled reviewed register after embedding. Pass `--inventory=<path>` for another reviewed register. Noninteractive runs require the approved `--batch-id=<fingerprint>`. Apply the current schema before building. Upload fails if the staged chunks lack a registered source. Reconcile categories, validate answers, then use the guarded promotion in `supabase/promote.sql`. The production app reads the active version. See README.ingestion.md for review scripts.

## Deployment and checks

Run `npm test` and `npm run build`. Use `npm start` for a local production server, or deploy the Next.js app with the same server environment and active Supabase version. No login is required. Refresh by building a separate snapshot, reviewing changes, and promoting it. Keep the previous version available for rollback.

Chat history is held in browser memory. Public sources and model judgments can be incomplete; the app can show verified answers, attributed excerpts, clarification or refusal. Source coverage and measured cases are documented with the submission artifacts.

AI assistance was used for implementation, regression tests, ingestion tooling, evaluation runs and preparation of submission materials.

The staged catalogue contains 352 product and service records across 35 categories. Of those categories, 34 have been reconciled against reviewed listings. See [category coverage](docs/submission/category-coverage.csv) and the [final 15-question evaluation](docs/submission/final-evaluation.md) for measured results, source limitations and the remaining release checks.

GitHub Actions runs ingestion. Vercel serves the application. See [deployment setup](docs/deployment.md) for the prepare/stage workflow, credentials and index activation.
