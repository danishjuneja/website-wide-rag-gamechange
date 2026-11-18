import {readFile,writeFile} from 'node:fs/promises';
const source=JSON.parse(await readFile('data/table-review.json','utf8')) as {tables:{text:string}[]};
const matches=source.tables.filter(t=>/\b(annual fee|joining fee|minimum balance|minimum salary|interest rate|eligibility)\b/i.test(t.text));
await writeFile('data/table-review-priority.json',JSON.stringify({warning:'Unverified: compare every value and condition against the original page.',tables:matches},null,2));
console.log(`Identified ${matches.length} financial-condition tables for source review.`);
