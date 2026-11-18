import {readFile,writeFile} from 'node:fs/promises';
import {extractRenderedCards} from './rendered-listing.ts';
const file=process.argv[2];if(!file)throw new Error('Usage: npm run inventory:listing -- <saved-rendered-html> [listing URL]');
const result=extractRenderedCards(await readFile(file,'utf8'),process.argv[3] || 'https://www.emiratesnbd.com/en/cards/credit-cards');
if(!result.products.length)throw new Error('No rendered card entries found');
await writeFile('data/rendered-card-candidates.json',JSON.stringify(result,null,2));console.log(`${result.products.length} candidates recorded; manual verification required.`);
