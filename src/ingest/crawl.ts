import { mkdir, readFile, writeFile } from 'node:fs/promises';
import robotsParser from 'robots-parser';
import { parseSitemap } from './sitemap.ts';
import { extractPage } from './extract.ts';
import { chunkBlocks } from './chunk.ts';
import { readLimited } from './body.ts';
import { retryDelay } from './retry.ts';
import { safeRedirect } from './redirect.ts';

const sitemap = process.argv[2];
const limit = Number(process.argv[3] ?? 10);
if (!sitemap || !Number.isSafeInteger(limit) || limit < 1) throw new Error('Usage: node src/ingest/crawl.ts <saved-sitemap.xml> [maximum-pages]');
const entries = parseSitemap(await readFile(sitemap, 'utf8'));
const base = 'https://www.emiratesnbd.com';
const userAgent = 'WebsiteRAGAssignmentBot';
const robotsUrl = `${base}/robots.txt`;
const robotsResponse = await fetch(robotsUrl, { headers: { 'user-agent': userAgent }, signal: AbortSignal.timeout(15000) });
if (!robotsResponse.ok) throw new Error(`Could not read robots.txt: ${robotsResponse.status}`);
const robots = robotsParser(robotsUrl, await robotsResponse.text());
const isPriorityPage = (url: string) => /^\/en\/(cards|accounts|loans|business-banking|corporate-and-institutional-banking|priority-banking|private-banking|islamic-banking|banking-packages|wealth|asset-management\/our-funds|invest-in-retail-sukuk|e20|smart-trade|globaltrades|emirates-nbd-pay|business-online|ruwad|help-and-support|KFS)(\/|$)/i.test(new URL(url).pathname);
const isProductOrSupport = (url:string) => isPriorityPage(url) || /^\/en\/(foreign-exchange|ways-of-banking|self-service|terms-and-conditions|schedule-of-fees-and-charges|digital-cards|emirati|sme)(\/|$)/i.test(new URL(url).pathname);
const selected = entries.filter(entry => new URL(entry.url).origin === base).sort((a,b)=>Number(isPriorityPage(b.url))-Number(isPriorityPage(a.url))).slice(0, limit);
const report: unknown[] = [];
await mkdir('data', { recursive: true });
if(process.argv.includes('--resume')) {
 const prior=JSON.parse(await readFile('data/crawl.json','utf8')) as {selected:number;pages:{url:string}[]};
 if(prior.selected!==selected.length || prior.pages.some((page,i)=>page.url!==selected[i]?.url)) throw new Error('Saved crawl does not match the current sitemap and limit');
 report.push(...prior.pages);
 console.log(`Resuming after ${report.length}/${selected.length} pages`);
}
for (const entry of selected.slice(report.length)) {
  if (robots.isAllowed(entry.url, userAgent) !== true) { report.push({ ...entry, status: 'robots-blocked-or-unknown' }); continue; }
  try {
    let current=entry.url;
    let response = await fetch(current, { headers: { 'user-agent': userAgent }, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    for(let redirects=0;[301,302,303,307,308].includes(response.status);redirects++) {
      if(redirects>=3)throw new Error('Too many redirects');
      const location=response.headers.get('location');if(!location)throw new Error('Redirect has no location');
      current=safeRedirect(current,location,base);
      if(robots.isAllowed(current,userAgent)!==true)throw new Error('Redirect blocked by robots.txt');
      await new Promise(resolve=>setTimeout(resolve,1000));
      response=await fetch(current,{headers:{'user-agent':userAgent},redirect:'manual',signal:AbortSignal.timeout(20000)});
    }
    if (!response.ok) { report.push({ ...entry, status: 'fetch-failed', httpStatus: response.status }); if(response.status===429 || response.status===503) { let delay=retryDelay(response.headers.get('retry-after')); console.log(`Server requested a ${Math.ceil(delay/1000)} second pause.`); while(delay>0){const slice=Math.min(delay,60000);await new Promise(resolve=>setTimeout(resolve,slice));delay-=slice} } continue; }
    if (!response.headers.get('content-type')?.includes('text/html')) { report.push({ ...entry, status: 'unsupported-content' }); continue; }
    const extracted = extractPage(new TextDecoder().decode(await readLimited(response,5*1024*1024)), current);
    if(!isProductOrSupport(entry.url) && !isProductOrSupport(current)) {
      const links=extracted.links.flatMap(link=>{const u=new URL(link); if(u.hostname!=='www.emiratesnbd.com')return [];u.search='';return [u.toString()]});
      report.push({...entry,status:'audit-links-only',fetchedAt:new Date().toISOString(),links:[...new Set(links)]});
    } else {
      const chunked = chunkBlocks(extracted.blocks);
      report.push({ ...entry, canonicalUrl:current, extractorVersion:3, status: chunked.chunks.length ? 'extracted-unverified' : 'empty', fetchedAt: new Date().toISOString(), ...extracted, ...chunked });
    }
  } catch (error) { report.push({ ...entry, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }); }
  finally { if(report.length%20===0 || report.length===selected.length) { await writeFile('data/crawl.json', JSON.stringify({ generatedAt: new Date().toISOString(), totalSitemapUrls: entries.length, selected: selected.length, pages: report }, null, 2)); console.log(`Processed ${report.length}/${selected.length}`); } await new Promise(resolve => setTimeout(resolve, 1000)); }
}
await writeFile('data/crawl.json', JSON.stringify({ generatedAt: new Date().toISOString(), totalSitemapUrls: entries.length, selected: selected.length, pages: report }, null, 2));
console.log(`Wrote ${report.length} page records to data/crawl.json; extraction is unverified.`);
