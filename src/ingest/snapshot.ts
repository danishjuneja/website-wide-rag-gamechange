import {readFile,writeFile} from 'node:fs/promises';
const source=JSON.parse(await readFile('data/crawl.json','utf8')) as {pages:{url:string;status:string;extractorVersion?:number}[]};
const pages=source.pages.filter(p=>p.status==='extracted-unverified'&&p.extractorVersion===3);
if(!pages.length)throw new Error('No corrected extracted pages are available');
await writeFile('data/priority-snapshot.json',JSON.stringify({generatedAt:new Date().toISOString(),pages},null,2));
console.log(`Frozen ${pages.length} corrected pages. This is an incomplete snapshot and requires review.`);
