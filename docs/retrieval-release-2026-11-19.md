# Retrieval release — 19 November 2026

This release replaces product-specific overview/field shortcuts with shared product linking, hybrid retrieval, page-level evidence selection and structured answer citations. Generation stays on openai/gpt-oss-20b. Follow-up queries explicitly carry validated subjects. The verifier uses the same heading/body representation as generation and requires coverage of independently extracted material conditions, with one bounded semantic repair and no provider retries.

Local verification: 73 tests passed and the Next.js production build passed. Historical 13/15 evaluation results refer to an earlier revision and are not acceptance evidence for this release. Recent live redesign evaluations still contain fallbacks, provider JSON errors and rate limits. This release is not a claim of full assignment acceptance.

Extractor version 4 excludes calculator defaults and quarantines table-dependent prose alongside unverified tables. Deploying code does not rebuild or promote the Supabase corpus. The existing active index remains in use until a separately reviewed and approved embedding batch is staged and promoted. Funds completeness remains unverified.

Deployment: push main through the existing Vercel integration, verify the commit's Vercel status and check the public homepage plus invalid-request handling without model calls. A new live answer evaluation requires a separately bounded provider batch.

Rollback: revert this release's commits and push main to redeploy the preceding application. There is no schema change or database promotion in this release.

Release review: Standards found no blocking violations. Spec review found comparison subject suppression and missing context loading for non-product sources. Both were corrected with generic regression coverage before release.
