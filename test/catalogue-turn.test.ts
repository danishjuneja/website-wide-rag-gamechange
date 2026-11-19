import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {catalogueTurn} from '../src/rag/catalogue-turn.ts';
const items=['Cedar Deposit Account','Maple Saver Account','North Signature Credit Card','North Infinite Credit Card'].map((name,i)=>({name,source_url:'https://bank.test/'+i}));
const history=(...messages:string[])=>messages.map(content=>({role:'user' as const,content}));
test('keeps the latest fact when resolving a pronoun and an explicit switch',()=>{
 const a=catalogueTurn(history('What currencies can I use with Cedar Deposit?','When is its profit paid?'),items);
 assert.ok(a && !a.ambiguous);assert.match(a.primary,/Cedar Deposit Account/);assert.doesNotMatch(a.primary,/currencies/);
 const b=catalogueTurn(history('Cedar Deposit?','Switching to Maple Saver, what are its charges?'),items);
 assert.ok(b && !b.ambiguous);assert.match(b.primary,/Maple Saver/);assert.doesNotMatch(b.primary,/Cedar/);
});
test('resolves a named choice after comparison and keeps the two searches distinct',()=>{
 const q='Compare the salaries for North Signature and North Infinite credit cards.';
 const plan=catalogueTurn(history(q),items);assert.ok(plan && !plan.ambiguous);assert.equal(plan.queries.length,3);
 assert.doesNotMatch(plan.queries[1],/Infinite/);
 assert.deepEqual(catalogueTurn(history(q,'What is its fee?'),items),{ambiguous:true});
 const resolved=catalogueTurn(history(q,'What is its fee?','The Infinite card. What is its fee?'),items);
 assert.ok(resolved && !resolved.ambiguous);assert.match(resolved.primary,/North Infinite/);
});
test('does not carry a previous subject into a fresh unrelated subject',()=>{
 assert.equal(catalogueTurn(history('Cedar Deposit?','Tell me about a mystery product.'),items),null);
});

test('ranks the requested attribute within each resolved source',async()=>{
 const {productPassages}=await import('../src/rag/catalogue-turn.ts');
 const rows=[{id:1,source_url:'a',content:'Welcome to the bank'},{id:2,source_url:'a',content:'Minimum salary: EUR 2000'},{id:3,source_url:'b',content:'Minimum salary: EUR 3000'}];
 assert.deepEqual(productPassages('Compare their minimum salaries',['a','b'],rows).map(r=>r.id),[2,3]);
});

test('compares identical field labels across separate pages and rejects conflicts or unasked qualifiers',async()=>{
 const {compareLabelledFacts}=await import('../src/rag/catalogue-turn.ts');
 const items=[{name:'Cedar Loan',source_url:'a'},{name:'Maple Loan',source_url:'b'}];
 const rows=[{id:1,source_url:'a',content:'Grace period: 12 days'},{id:2,source_url:'b',content:'Grace period: 20 days'}];
 const q='Compare the grace periods for Cedar Loan and Maple Loan';
 assert.deepEqual(compareLabelledFacts(q,items,rows)?.citations,['a','b']);
 assert.equal(compareLabelledFacts(q+' when repaying early',items,rows),null);
 assert.equal(compareLabelledFacts(q,items,[...rows,{...rows[0],content:'Grace period: 15 days'}]),null);
});

test('former and latter follow mention order even when catalogue order differs',()=>{
 const q='Compare North Infinite versus North Signature';
 for(const [reference,name] of [['former','North Infinite'],['latter','North Signature']]){
   const turn=catalogueTurn(history(q,'What is the fee for the '+reference+'?'),items);
   assert.ok(turn && !turn.ambiguous);
   assert.ok(turn.products[0].name.startsWith(name));
 }
 assert.equal(catalogueTurn(history('Cedar Deposit','What about personal loans?'),items),null);
});

test('comparison routes qualified and source-marked values through verification',async()=>{
 const {compareLabelledFacts}=await import('../src/rag/catalogue-turn.ts');
 const products=items.slice(2);
 const rows=products.map((p,i)=>({id:i,source_url:p.source_url,content:'Annual fee: AED 100'}));
 const q='Compare annual fees for North Signature and North Infinite';
 for(const content of ['Annual fee: AED 100\n\nThe first year is waived.','Annual fee: AED 100 [2]','Annual fee: https://example.com']) {
   assert.equal(compareLabelledFacts(q,products,[{...rows[0],content},rows[1]]),null);
 }
});

test('general continuations resolve a single subject and clarify multiple subjects',()=>{
 const plan=catalogueTurn(history('Tell me about Cedar Deposit','Tell me more'),items);
 assert.ok(plan && !plan.ambiguous);assert.equal(plan.products[0].name,'Cedar Deposit Account');
 assert.deepEqual(catalogueTurn(history('Compare North Infinite and North Signature','Tell me more'),items),{ambiguous:true});
});
