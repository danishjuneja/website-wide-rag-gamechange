import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {readLimited} from './body.ts';
import {parseSitemap} from './sitemap.ts';

const [input,limit='4578']=process.argv.slice(2);
if(!input)throw new Error('Supply the assigned website URL or a saved English sitemap');
let sitemap=input;
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
async function run(file:string,args:string[]=[]){
 const child=spawn(process.execPath,[file,...args],{stdio:'inherit',env:process.env});
 const status=await new Promise<number>((resolve,reject)=>{child.on('error',reject);child.on('close',code=>resolve(code??1))});
 if(status!==0)throw new Error(`${file} failed (${status})`);
}
await run('src/ingest/crawl.ts',[sitemap,limit]);
await run('src/ingest/inventory.ts');
await run('src/ingest/index.ts');
if(!stdin.isTTY){console.log('No interactive approval available. Indexing stopped before external AI calls.');process.exit(0)}
const prompt=createInterface({input:stdin,output:stdout});
const answer=await prompt.question('Approve the Cohere embedding batch shown above? Type YES to send it: ');prompt.close();
if(answer.trim()!=='YES'){console.log('Not approved; no AI calls made.');process.exit(0)}
const estimate=JSON.parse(await readFile('data/latest-estimate.json','utf8')) as {batchId:string};
await run('src/ingest/index.ts',['data/crawl.json','--approve-api',`--batch-id=${estimate.batchId}`]);
console.log('Index is staged, not active. Reconcile coverage and test before promotion.');
