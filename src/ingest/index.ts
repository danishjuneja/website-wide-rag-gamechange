import {EXTRACTOR_VERSION} from './version.ts';
import { readFile,writeFile } from 'node:fs/promises';
import { randomUUID,createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { embed } from '../rag/providers.ts';
import { chunkBlocks, type Block } from './chunk.ts';
import { removeEmails } from './privacy.ts';
import { batchDigest } from './batch.ts';

type Page = {url:string; canonicalUrl?:string; title?:string; status:string; extractorVersion?:number; fetchedAt?:string; lastModified?:string; blocks?:Block[]};
const path=process.argv[2] ?? 'data/crawl.json';
const approved=process.argv.includes('--approve-api');
const file=JSON.parse(await readFile(path,'utf8')) as {pages:Page[]};
let reviewBlocks=0,excludedTables=0;
type Row={source_url:string;title:string;section:string;content:string;fetched_at?:string;source_last_modified?:string};
const rows:Row[]=file.pages.filter(p=>p.status==='extracted-unverified' && p.extractorVersion===EXTRACTOR_VERSION).flatMap(p=>{const safeBlocks=(p.blocks||[]).filter(b=>!b.heading.some(h=>/\b(testimonials?|customer (reviews?|stories)|what (our )?customers? (are )?saying)\b/i.test(h)));const result=chunkBlocks(safeBlocks);reviewBlocks+=result.review.length;excludedTables+=safeBlocks.filter(b=>b.kind==='table').length;return result.chunks.filter(c=>c.kind!=='table').map(c=>({source_url:p.canonicalUrl||p.url,title:p.title||p.url,section:c.heading.join(' > '),content:c.text,fetched_at:p.fetchedAt,source_last_modified:p.lastModified}))});
try {
 const reviewed=JSON.parse(await readFile('data/verified-pdf.json','utf8')) as {documents:{url:string;title:string;page:number;section:string;text:string;verified:boolean}[]};
 for(const doc of reviewed.documents){
  const u=new URL(doc.url); if(u.protocol!=='https:'||!['www.emiratesnbd.com','cdn.emiratesnbd.com'].includes(u.hostname)||doc.verified!==true||!Number.isInteger(doc.page)||doc.page<1||!doc.text.trim())throw new Error('Invalid verified PDF item');
  const result=chunkBlocks([{heading:[removeEmails(doc.title),removeEmails(doc.section),`Page ${doc.page}`],text:removeEmails(doc.text),kind:'paragraph'}]);reviewBlocks+=result.review.length;
  for(const c of result.chunks)rows.push({source_url:`${u.origin}${u.pathname}#page=${doc.page}`,title:removeEmails(doc.title),section:c.heading.join(' > '),content:c.text});
 }
} catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT') throw error;}
try {
 const reviewed=JSON.parse(await readFile('data/verified-html.json','utf8')) as {excerpts:{url:string;title:string;section:string;text:string;verified:boolean}[]};
 for(const doc of reviewed.excerpts){
  const u=new URL(doc.url);if(u.protocol!=='https:'||u.hostname!=='www.emiratesnbd.com'||doc.verified!==true||!doc.text.trim())throw new Error('Invalid verified HTML excerpt');u.search='';
  const result=chunkBlocks([{heading:[removeEmails(doc.title),removeEmails(doc.section)],text:removeEmails(doc.text),kind:'paragraph'}]);reviewBlocks+=result.review.length;
  for(const c of result.chunks)rows.push({source_url:u.toString(),title:removeEmails(doc.title),section:c.heading.join(' > '),content:c.text});
 }
} catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT') throw error;}
const registerPath=process.argv.find(arg=>arg.startsWith('--inventory='))?.slice('--inventory='.length);
if(registerPath){
 const reviewed=JSON.parse(await readFile(registerPath,'utf8')) as {products:{source_url:string}[]};
 const sources=new Set(rows.map(row=>row.source_url));
 const missing=[...new Set(reviewed.products.map(p=>p.source_url).filter(url=>!sources.has(url)))];
 if(missing.length)throw new Error('Missing reviewed sources before embedding:\n'+missing.join('\n'));
}
const batchSize=96;
const model=process.env.COHERE_EMBED_MODEL||'embed-english-v3.0';
const batchId=batchDigest(model,rows);
const summary={batchId,provider:'Cohere',purpose:'document embeddings',model,inputs:rows.length,requests:Math.ceil(rows.length/batchSize),characters:rows.reduce((sum,x)=>sum+x.content.length,0),oversizedBlocksForReview:reviewBlocks,unverifiedHtmlTablesExcluded:excludedTables,data:'Extracted public page text and manually verified HTML/PDF excerpts; unverified tables excluded',cost:'Depends on account tier; inspect quota before approval'};
console.log(JSON.stringify(summary,null,2));
if (!approved) { await writeFile('data/latest-estimate.json',JSON.stringify(summary,null,2)); console.log('No API calls made. Review this estimate, then rerun with --approve-api and --batch-id=<batchId>.'); process.exit(0); }
if(!process.argv.includes(`--batch-id=${batchId}`))throw new Error('Batch hash differs or is missing; re-estimate and obtain approval for this exact batch');
if (!rows.length) throw new Error('No eligible chunks to index');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.COHERE_API_KEY) throw new Error('Missing server credentials');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const progressPath=process.argv.includes('--versioned-progress')?`data/index-progress-${batchId}.json`:'data/index-progress.json';
let progress:{batchId:string;version:string;offset:number}|undefined;
try{progress=JSON.parse(await readFile(progressPath,'utf8'))}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error}
if(progress && progress.batchId!==batchId)throw new Error('A different staged batch has progress; preserve or clear its progress file before starting another');
let version=progress?.version||randomUUID();
if (process.argv.includes('--extend-preview')) {
  const preview=process.env.RAG_PREVIEW_VERSION;
  if (!preview || (progress && progress.version !== preview)) throw new Error('Preview version mismatch');
  const active=await db.from('rag_active_version').select('version_id').eq('singleton',true).maybeSingle();
  if (active.error || active.data?.version_id === preview) throw new Error('Cannot extend an active or unknown index');
  if (!progress) {
    const urls=[...new Set(rows.map(row=>row.source_url))];
    for(let i=0;i<urls.length;i+=20) {
      const existing=await db.from('rag_chunks').select('id').eq('version_id',preview).in('source_url',urls.slice(i,i+20)).limit(1);
      if(existing.error || existing.data?.length) throw new Error('Source already indexed or preflight failed');
    }
  }
  version=preview;
}
for(let i=progress?.offset||0;i<rows.length;i+=batchSize) {
  const started=Date.now();
  const batch=rows.slice(i,i+batchSize);
  const vectors=await embed(batch.map(x=>`${x.title}\n${x.section}\n${x.content}`),'search_document');
  const {error}=await db.from('rag_chunks').insert(batch.map((row,j)=>({...row,version_id:version,embedding:vectors[j],embedding_model:process.env.COHERE_EMBED_MODEL||'embed-english-v3.0',source_hash:createHash('sha256').update(row.content).digest('hex')})));
  if(error) throw new Error(`Index upload failed after ${i} chunks: ${error.message}`);
  await writeFile(progressPath,JSON.stringify({batchId,version,offset:i+batch.length},null,2));
  console.log(`Staged ${Math.min(i+batchSize,rows.length)}/${rows.length}`);
  if(i+batchSize<rows.length)await new Promise(resolve=>setTimeout(resolve,Math.max(0,13000-(Date.now()-started))));
}
console.log(`Staged index version ${version}. It is NOT active. Verify coverage and tests before manual promotion.`);
