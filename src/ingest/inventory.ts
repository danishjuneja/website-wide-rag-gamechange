import { readFile, writeFile } from 'node:fs/promises';
type Page={url:string; title?:string;status:string;links?:string[]};
const input=process.argv[2]||'data/crawl.json';
const raw=JSON.parse(await readFile(input,'utf8')) as {pages:Page[]};
const candidates=new Map<string,{url:string;title:string;status:string;reviewed:boolean}>();
const productPath=/\/en\/(cards|accounts|loans|business-banking|corporate-and-institutional-banking|priority-banking|private-banking|islamic-banking|banking-packages|asset-management\/our-funds|wealth)(\/|$)/i;
for(const page of raw.pages) {
  if(page.status==='extracted-unverified' && productPath.test(new URL(page.url).pathname)) candidates.set(page.url,{url:page.url,title:page.title||'',status:'unknown',reviewed:false});
  for(const link of page.links||[]) {const u=new URL(link); if(u.hostname==='www.emiratesnbd.com' && productPath.test(u.pathname) && !candidates.has(link)) candidates.set(link,{url:link,title:'',status:'unknown',reviewed:false});}
}
await writeFile('data/product-candidates.json',JSON.stringify({generatedAt:new Date().toISOString(),complete:false,warning:'Candidates are not verified products. Reconcile against category listings before use.',candidates:[...candidates.values()]},null,2));
console.log(`${candidates.size} unreviewed candidates written to data/product-candidates.json`);
