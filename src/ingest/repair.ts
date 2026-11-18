import {readFile,writeFile} from 'node:fs/promises';
import robotsParser from 'robots-parser';
import {extractPage} from './extract.ts';
import {chunkBlocks} from './chunk.ts';
import {readLimited} from './body.ts';
import {retryDelay} from './retry.ts';
import {safeRedirect} from './redirect.ts';

const path='data/crawl.json',base='https://www.emiratesnbd.com',agent='WebsiteRAGAssignmentBot';
const data=JSON.parse(await readFile(path,'utf8')) as {pages:Record<string,any>[]};
const robotUrl=base+'/robots.txt', robotResponse=await fetch(robotUrl,{headers:{'user-agent':agent},signal:AbortSignal.timeout(15000)});
if(!robotResponse.ok)throw new Error('Unable to verify robots.txt');
const robots=robotsParser(robotUrl,await robotResponse.text());
const order=(url:string)=>/\/en\/cards\//i.test(url)?0:/\/en\/accounts\//i.test(url)?1:/\/en\/loans\//i.test(url)?2:3;
const candidates=data.pages.filter(p=>['extracted-unverified','reextract-failed','fetch-failed'].includes(p.status) && p.extractorVersion!==3).sort((a,b)=>order(a.url)-order(b.url));
let count=0;console.log(`Re-extracting ${candidates.length} pages; one request per second or slower.`);
for(const page of candidates){
 const started=Date.now();
 try{
  let url=page.canonicalUrl||page.url;if(new URL(url).origin!==base||robots.isAllowed(url,agent)!==true)throw new Error('Source not allowed');
  let response=await fetch(url,{headers:{'user-agent':agent},redirect:'manual',signal:AbortSignal.timeout(20000)});
  for(let n=0;[301,302,303,307,308].includes(response.status);n++){
   if(n>=3)throw new Error('Too many redirects');const location=response.headers.get('location');if(!location)throw new Error('Missing redirect location');url=safeRedirect(url,location,base);if(robots.isAllowed(url,agent)!==true)throw new Error('Redirect blocked');await new Promise(r=>setTimeout(r,1000));response=await fetch(url,{headers:{'user-agent':agent},redirect:'manual',signal:AbortSignal.timeout(20000)});
  }
  if(!response.ok){if(response.status===429||response.status===503){let delay=retryDelay(response.headers.get('retry-after'));while(delay>0){const wait=Math.min(delay,60000);await new Promise(r=>setTimeout(r,wait));delay-=wait}}throw new Error(`HTTP ${response.status}`)}
  if(!response.headers.get('content-type')?.includes('text/html'))throw new Error('Unsupported content');
  const extracted=extractPage(new TextDecoder().decode(await readLimited(response,5*1024*1024)),url), chunked=chunkBlocks(extracted.blocks);
  Object.assign(page,{canonicalUrl:url,status:chunked.chunks.length?'extracted-unverified':'empty',extractorVersion:3,fetchedAt:new Date().toISOString(),...extracted,...chunked});
 }catch(error){page.status='reextract-failed';page.reextractError=error instanceof Error?error.message:'Unknown error';}
 finally{count++;if(count%10===0||count===candidates.length){await writeFile(path,JSON.stringify(data,null,2));console.log(`Re-extracted ${count}/${candidates.length}`)}await new Promise(r=>setTimeout(r,Math.max(0,1000-(Date.now()-started))))}
}
