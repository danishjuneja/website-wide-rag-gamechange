# Manual review formats

Copy these files into the ignored `data/` directory before filling them in. Do not mark a source as verified without checking it against the original page or document.

`reviewed-inventory.json` takes a `products` array. Each record needs `name`, `category`, `status` (`active`, `legacy`, or `unknown`), `source_url` and `verified: true`. Use the category names in `src/rag/inventory.ts`. The `categories` array records whether each product category has been reconciled. Candidate URLs are leads, not verified products.

`verified-pdf.json` takes a `documents` array. Each record needs `url` (official PDF URL), `title`, `page` (one-based), `section`, `text` and `verified: true`. Enter only text checked against the PDF page, preserving table labels, units and conditions. The indexer uses a PDF page fragment in the citation. Do not enter table values whose row and column mapping is uncertain.

`verified-html.json` takes an `excerpts` array. Each record needs an official `url`, `title`, `section`, `text` and `verified: true`. Use it for manually checked HTML tables, keeping each value with its product, heading, units and conditions.
