import { readFile,writeFile,mkdir } from 'node:fs/promises';
import robotsParser from 'robots-parser';
import { PDFParse } from 'pdf-parse';
import { readLimited } from './body.ts';
import { removeEmails } from './privacy.ts';

type Page={url:string;links?:string[]};
const source=JSON.parse(await readFile(process.argv[2]||'data/crawl.json','utf8')) as {pages:Page[]};
const limit=Number(process.argv[3]||'10');
if(!Number.isSafeInteger(limit)||limit<1) throw new Error('Expected a positive PDF limit');
const urls=[...new Set(source.pages.flatMap(p=>p.links||[]).filter(link=>{try{const u=new URL(link);return u.protocol==='https:' && (u.hostname==='www.emiratesnbd.com'||u.hostname==='cdn.emiratesnbd.com') && /\.pdf$/i.test(u.pathname)}catch{return false}}))].slice(0,limit);
const robots=new Map<string,ReturnType<typeof robotsParser>>(); const result:unknown[]=[];
await mkdir('data',{recursive:true});
for(const url of urls){
 const origin=new URL(url).origin;
 try {
  if(!robots.has(origin)){const robotsUrl=`${origin}/robots.txt`;const r=await fetch(robotsUrl,{headers:{'user-agent':'WebsiteRAGAssignmentBot'},signal:AbortSignal.timeout(15000),redirect:'manual'});if(!r.ok)throw new Error(`robots.txt unavailable (${r.status})`);robots.set(origin,robotsParser(robotsUrl,await r.text()));await new Promise(r=>setTimeout(r,1000));}
  if(robots.get(origin)!.isAllowed(url,'WebsiteRAGAssignmentBot')!==true){result.push({url,status:'robots-blocked-or-unknown'});continue;}
  const r=await fetch(url,{headers:{'user-agent':'WebsiteRAGAssignmentBot'},redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const bytes=await readLimited(r,15*1024*1024);
  const parser=new PDFParse({data:bytes});try {const text=await parser.getText();result.push({url,status:'unverified',pages:text.pages.map(p=>({page:p.num,text:removeEmails(p.text)}))});}finally{await parser.destroy()}
 }catch(error){result.push({url,status:'failed',error:error instanceof Error?error.message:'unknown error'})}
 finally{await writeFile('data/pdf-review.json',JSON.stringify({generatedAt:new Date().toISOString(),warning:'PDF text and tables require manual verification before use.',documents:result},null,2));await new Promise(r=>setTimeout(r,1000));}
}
console.log(`${result.length} PDF records written for manual review; none are indexed automatically.`);
