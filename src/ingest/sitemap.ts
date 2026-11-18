import { XMLParser, XMLValidator } from 'fast-xml-parser';
type SitemapEntry = { url: string; lastModified?: string };

// Reject DTDs and nested sitemaps rather than silently reporting incomplete coverage.
export function parseSitemap(xml: string): SitemapEntry[] {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('DTD and entities are not supported');
  if (XMLValidator.validate(xml) !== true) throw new Error('Invalid sitemap XML');
  const parsed = new XMLParser({ removeNSPrefix: true, trimValues: true, parseTagValue: false }).parse(xml);
  if (parsed.sitemapindex) throw new Error('Sitemap indexes require explicit expansion');
  if (!parsed.urlset) throw new Error('Expected a complete sitemap urlset');
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();
  const blocks = parsed.urlset.url ? [parsed.urlset.url].flat() : [];
  for (const body of blocks) {
    const loc = body.loc;
    if (!loc) throw new Error('Sitemap entry is missing a location');
    const location = new URL(String(loc).trim());
    if (!['http:', 'https:'].includes(location.protocol)) throw new Error('Unsupported sitemap URL protocol');
    location.hash = '';
    const url = location.toString();
    if (seen.has(url)) continue;
    seen.add(url);
    const lastModified = body.lastmod ? String(body.lastmod).trim() : undefined;
    entries.push(lastModified ? { url, lastModified } : { url });
  }
  if (entries.length === 0) throw new Error('No sitemap entries found');
  return entries;
}
