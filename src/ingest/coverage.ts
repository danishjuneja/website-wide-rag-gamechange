import {readFile,writeFile} from 'node:fs/promises';
import {parseSitemap} from './sitemap.ts';
type Page={url:string;status:string;links?:string[];review?:unknown[]};
const sitemap=process.argv[2];if(!sitemap)throw new Error('Usage: npm run coverage -- <sitemap.xml>');
const entries=parseSitemap(await readFile(sitemap,'utf8'));
const crawl=JSON.parse(await readFile('data/crawl.json','utf8')) as {pages:Page[]};
const fetched=new Set(crawl.pages.map(p=>p.url));const status:Record<string,number>={};const sections:Record<string,{total:number;seen:number;failed:number}>={};
for(const e of entries){const section=new URL(e.url).pathname.split('/').filter(Boolean).slice(0,2).join('/')||'/';sections[section]||={total:0,seen:0,failed:0};sections[section].total++}
for(const p of crawl.pages){status[p.status]=(status[p.status]||0)+1;const section=new URL(p.url).pathname.split('/').filter(Boolean).slice(0,2).join('/')||'/';if(sections[section]){sections[section].seen++;if(!['extracted-unverified','audit-links-only'].includes(p.status))sections[section].failed++}}
const unseen=entries.filter(e=>!fetched.has(e.url)).length;
const pdfs=new Set(crawl.pages.flatMap(p=>p.links||[]).filter(url=>{try{return /\.pdf$/i.test(new URL(url).pathname)}catch{return false}}));
const report={generatedAt:new Date().toISOString(),sitemapUrls:entries.length,processedPages:crawl.pages.length,unseenPages:unseen,status,sections,discoveredPdfLinks:pdfs.size,oversizedBlocksForReview:crawl.pages.reduce((sum,p)=>sum+(p.review?.length||0),0),warning:'Page counts do not prove product coverage. Reconcile category listings and verify extracted facts.'};
await writeFile('data/coverage.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
