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

test('former and latter follow mention order even when catalogue order differs',()=>{
 const q='Compare North Infinite versus North Signature';
 for(const [reference,name] of [['former','North Infinite'],['latter','North Signature']]){
   const turn=catalogueTurn(history(q,'What is the fee for the '+reference+'?'),items);
   assert.ok(turn && !turn.ambiguous);
   assert.ok(turn.products[0].name.startsWith(name));
 }
 assert.equal(catalogueTurn(history('Cedar Deposit','What about personal loans?'),items),null);
});

test('general continuations resolve a single subject and clarify multiple subjects',()=>{
 const plan=catalogueTurn(history('Tell me about Cedar Deposit','Tell me more'),items);
 assert.ok(plan && !plan.ambiguous);assert.equal(plan.products[0].name,'Cedar Deposit Account');
 assert.deepEqual(catalogueTurn(history('Compare North Infinite and North Signature','Tell me more'),items),{ambiguous:true});
});


test('comparison mentions are linked independently across unequal name lengths',()=>{
 const catalogue=['Harbor World Elite Credit Card','Harbor World Credit Card'].map((name,i)=>({name,source_url:'https://bank.test/harbor/'+i}));
 for(const question of ['Compare Harbor World Elite Credit Card and Harbor World Credit Card','Compare Harbor World Elite versus Harbor World']){
  const plan=catalogueTurn(history(question),catalogue);
  assert.ok(plan && !plan.ambiguous);assert.equal(plan.products.length,2);assert.equal(plan.queries.length,3);
  assert.deepEqual(plan.products.map(p=>p.source_url),catalogue.map(p=>p.source_url));
  const latter=catalogueTurn(history(question,'What is the fee for the latter?'),catalogue);
  assert.ok(latter && !latter.ambiguous);assert.equal(latter.products[0].source_url,catalogue[1].source_url);
 }
});
