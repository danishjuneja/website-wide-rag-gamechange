import {readFile,writeFile,rename} from 'node:fs/promises';
import {removeEmails} from './privacy.ts';
const path=process.argv[2]||'data/crawl.json';
const checkpoint=JSON.parse(await readFile(path,'utf8'));
const pattern=/\b(testimonials?|customer (reviews?|stories)|what (our )?customers? (are )?saying)\b/i;
let removed=0;
for(const page of checkpoint.pages){
 for(const field of ['blocks','chunks','review']) if(Array.isArray(page[field])) {
  const old=page[field]; page[field]=old.filter((b:{heading?:string[]})=>!(b.heading||[]).some(h=>pattern.test(h))).map((b:{heading?:string[];text?:string})=>({...b,heading:b.heading?.map(removeEmails),text:typeof b.text==='string'?removeEmails(b.text):b.text})); removed+=old.length-page[field].length;
 }
 if(typeof page.title==='string')page.title=removeEmails(page.title);
 if(Array.isArray(page.links))page.links=page.links.filter((link:unknown)=>typeof link==='string' && !/@|%40/i.test(link));
}
const temp=path+'.tmp';await writeFile(temp,JSON.stringify(checkpoint,null,2));await rename(temp,path);
console.log(`Removed ${removed} testimonial blocks from the checkpoint. Other personal data still requires review.`);
