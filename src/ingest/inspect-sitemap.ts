import { readFile } from 'node:fs/promises';
import { parseSitemap } from './sitemap.ts';

const filename = process.argv[2];
if (!filename) throw new Error('Usage: npm run inspect:sitemap -- <path-to-sitemap.xml>');
const entries = parseSitemap(await readFile(filename, 'utf8'));
const counts = new Map<string, number>();
for (const entry of entries) {
  const key = new URL(entry.url).pathname.split('/').filter(Boolean).slice(0, 2).join('/');
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
console.log(JSON.stringify({ count: entries.length, sections: Object.fromEntries([...counts].sort((a,b) => b[1]-a[1])) }, null, 2));
