import {EXTRACTOR_VERSION} from './version.ts';
import {readFile,writeFile} from 'node:fs/promises';
type Block={heading:string[];text:string;kind:string};type Page={url:string;canonicalUrl?:string;title?:string;status:string;extractorVersion?:number;blocks?:Block[]};
const crawl=JSON.parse(await readFile(process.argv[2]||'data/crawl.json','utf8')) as {pages:Page[]};
const tables=crawl.pages.filter(p=>p.status==='extracted-unverified'&&p.extractorVersion===EXTRACTOR_VERSION).flatMap(p=>(p.blocks||[]).filter(b=>b.kind==='table').map(b=>({url:p.canonicalUrl||p.url,title:p.title,section:b.heading.join(' > '),text:b.text,verified:false})));
await writeFile('data/table-review.json',JSON.stringify({generatedAt:new Date().toISOString(),warning:'Never mark a table verified without comparing row, column, product, units and conditions against the original page.',tables},null,2));
console.log(`${tables.length} unverified tables written to data/table-review.json`);
