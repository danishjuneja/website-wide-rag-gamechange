import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {sourceOverview} from '../src/rag/source-overview.ts';
test('quotes complete introductory blocks and rejects compound or unknown requests',()=>{
 const product={name:'Cedar Select Card',source_url:'https://bank.test/cedar'};
 const rows=[{source_url:product.source_url,content:'Earn points at participating destinations. Conditions apply.',section:'Cedar Select Card > Rewards'}];
 assert.match(sourceOverview('Tell me more about Cedar Select Card',product,rows)?.answer||'',/Conditions apply/);
 assert.ok(sourceOverview('Tell me more',product,rows));
 for(const question of ['Tell me more about Cedar Select Card and guarantee my return','Tell me more about the annual fee','Tell me more about an unknown card'])assert.equal(sourceOverview(question,product,rows),null);
});

test('a continuation avoids passages already shown',()=>{
 const product={name:'Cedar Card',source_url:'https://bank.test/cedar'};
 const rows=['First feature with its complete qualification.','Another feature with a separate qualification.'].map(content=>({source_url:product.source_url,section:'Cedar Card > Features',content}));
 const result=sourceOverview('Tell me more',product,rows,[rows[0].content]);
 assert.ok(result?.answer.includes(rows[1].content));assert.equal(result?.answer.includes(rows[0].content),false);
});

test('selecting an exact product name produces its source overview',()=>{
 const product={name:'Cobalt Education Loan',source_url:'https://bank.test/cobalt'};
 const rows=[{source_url:product.source_url,content:'Study with flexible repayment terms, subject to the published eligibility criteria.',section:'Cobalt Education Loan > Overview'}];
 assert.ok(sourceOverview('Cobalt Education Loan',product,rows)?.citations.includes(product.source_url));
});
