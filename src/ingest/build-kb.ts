import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {readLimited} from './body.ts';
import {parseSitemap} from './sitemap.ts';

const args=process.argv.slice(2);
const [input,limit]=args.filter(arg=>!arg.startsWith('--'));
if(!input)throw new Error('Supply the assigned website URL or a saved English sitemap');
const register=args.find(arg=>arg.startsWith('--inventory='))?.slice('--inventory='.length) || 'docs/submission/product-register.json';
const approval=args.find(arg=>arg.startsWith('--batch-id='));
const inventory=JSON.parse(await readFile(register,'utf8')) as {products:{source_url:string}[]};
if(!inventory.products?.length) throw new Error('Reviewed inventory is empty');
let sitemap=input;
if(!approval) {
if (input.startsWith('https://')) {
  const site=new URL(input);
  if(site.origin!=='https://www.emiratesnbd.com') throw new Error('Unsupported site');
  const response=await fetch(new URL('/sitemap-en.xml',site.origin),{redirect:'error',signal:AbortSignal.timeout(20000),headers:{'user-agent':'WebsiteRAGAssignmentBot'}});
  if(!response.ok)throw new Error('Sitemap unavailable. Supply a saved English sitemap to continue.');
  const xml=new TextDecoder().decode(await readLimited(response,16*1024*1024));
  parseSitemap(xml);
  await mkdir('data',{recursive:true});
  sitemap='data/sitemap-en.xml';
  await writeFile(sitemap,xml);
}
 const entries=parseSitemap(await readFile(sitemap,'utf8'));
 const combined=new Map(entries.map(entry=>[entry.url,entry]));
 for(const {source_url} of inventory.products){
   const source=new URL(source_url);
   if(source.origin==='https://www.emiratesnbd.com' && !source.hash && !combined.has(source.href))combined.set(source.href,{url:source.href});
 }
 const xmlEscape=(v:string)=>v.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const xml='<urlset>'+[...combined.values()].map(e=>'<url><loc>'+xmlEscape(e.url)+'</loc>'+(e.lastModified?'<lastmod>'+xmlEscape(e.lastModified)+'</lastmod>':'')+'</url>').join('')+'</urlset>';
 await mkdir('data',{recursive:true});
 sitemap='data/catalogue-sitemap.xml';
 await writeFile(sitemap,xml);
 await run('src/ingest/crawl.ts',[sitemap,limit || String(combined.size)]);
 await run('src/ingest/inventory.ts');
}
async function run(file:string,args:string[]=[]){
 const child=spawn(process.execPath,[file,...args],{stdio:'inherit',env:process.env});
 const status=await new Promise<number>((resolve,reject)=>{child.on('error',reject);child.on('close',code=>resolve(code??1))});
 if(status!==0)throw new Error(`${file} failed (${status})`);
}
await run('src/ingest/index.ts',['data/crawl.json','--inventory='+register]);
if(args.includes('--estimate-only')) process.exit(0);
const estimate=JSON.parse(await readFile('data/latest-estimate.json','utf8')) as {batchId:string};
if(approval && approval!==`--batch-id=${estimate.batchId}`) throw new Error('The saved snapshot differs from the approved batch.');
if(!approval) {
 if(!stdin.isTTY) throw new Error('Review the estimate, then pass --batch-id=<approved fingerprint> to build:kb.');
 const prompt=createInterface({input:stdin,output:stdout});
 const answer=await prompt.question('Approve the Cohere embedding batch shown above? Type YES to send it: ');prompt.close();
 if(answer.trim()!=='YES')throw new Error('Build cancelled before embedding.');
}
await run('src/ingest/index.ts',['data/crawl.json','--approve-api','--versioned-progress','--inventory='+register,`--batch-id=${estimate.batchId}`]);
const progress=JSON.parse(await readFile(`data/index-progress-${estimate.batchId}.json`,'utf8')) as {version:string};
await run('src/ingest/upload-inventory.ts',[register,progress.version]);
console.log(`Staged knowledge base ready. Use RAG_PREVIEW_VERSION=${progress.version} for local review.`);
