# GitHub ingestion and Vercel hosting

GitHub Actions runs ingestion. Vercel builds and serves Next.js and the chat API. Supabase stores the versioned index. Chat calls from Vercel still consume Cohere and Groq quotas. GitHub runner minutes and artifact storage have their own limits.

## GitHub

Add Actions secrets COHERE_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The manual Knowledge base workflow runs on the default branch with a 180-minute timeout, read-only repository permissions and seven-day artifact retention.

Run phase prepare. It uses pipeline/sitemap-en.xml, the saved user-supplied English sitemap, plus the reviewed catalogue URLs. Update the saved sitemap from the official site when refreshing discovery. Preparation crawls and checks source coverage before creating crawl-estimate. It has no provider credentials. On failure inspect pipeline-result and resolve missing sources before indexing.

Inspect latest-estimate.json in crawl-estimate. Run phase stage on the same commit with source_run set to the successful prepare run ID and batch_id set to the approved fingerprint. The job verifies artifact provenance, embeds the frozen batch and uploads the staged inventory. Its result artifact contains the staged version UUID. Promotion is a separate reviewed operation.

A new stage invocation can spend another batch. After partial failure preserve its checkpoint and inspect the database before resuming. The indexer cannot safely perform blind retries when a database upload succeeds just before a network failure.

Rendered pages and reviewed excerpts may need ingestion repair before the source preflight passes. A saved sitemap does not bypass robots rules. Review financial terms and product completeness before release.

Application checks runs tests and the production build on main pushes and pull requests without provider credentials.

## Vercel

Import the repository as Next.js using Node 24. The committed vercel.json runs npm ci and npm run build. Add server environment values SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COHERE_API_KEY and GROQ_API_KEY. GROQ_MODEL defaults to openai/gpt-oss-20b. Keep credentials free of the NEXT_PUBLIC prefix.

The chat route declares maxDuration=300. Enable Fluid Compute for the corresponding platform allowance. Ingestion runs exclusively from the manual GitHub workflow.

Production reads the active Supabase version. Review the staged version locally, substitute its UUID in supabase/promote.sql and execute that SQL after accepting the evaluation. The script explicitly accepts the agreed funds completeness limitation and blocks other unreconciled categories. Fund lists retain the incomplete coverage disclosure.

To reduce preview builds, select Only build previews for pull requests in Vercel's Ignored Build Step settings. Keep the checked-in product register because legacy category lookup uses it.

Before sharing the link, test chat, a follow-up and source links on the actual deployment. The measured pipeline evaluation passed thirteen of fifteen cases, with one partial and one failure. Hosting does not resolve those defects.

## References

- [GitHub artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Vercel project settings](https://vercel.com/docs/project-configuration/project-settings)
