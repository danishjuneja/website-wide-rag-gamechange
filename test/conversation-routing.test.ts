import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {catalogueTurn} from '../src/rag/catalogue-turn.ts';
import register from '../docs/submission/product-register.json' with {type:'json'};
const catalogue=register.products.filter(product=>product.verified);
const conversation=(question:string)=>[
 {role:'user' as const,content:'How can I learn about personal loans?'},
 {role:'assistant' as const,content:'Salary Transfer Loans for Expats; Salary Transfer Loans for UAE Nationals'},
 {role:'user' as const,content:question}
];
const loanQuestions=[
 'whats the difference between salary transfer loans for expats and UAE nationals',
 'How do the salary transfer loans for expats and UAE nationals differ?',
 'What are the fees for salary transfer loans for expats and UAE nationals?',
 'Tell me about salary transfer loans for UAE nationals and expats.',
 'Can you explain salary transfer loans for expats versus UAE nationals?',
];
for(const question of loanQuestions)test('keeps shared product context: '+question,()=>{
 const plan=catalogueTurn(conversation(question),catalogue);
 assert.ok(plan&&!plan.ambiguous,'Named subjects must reach retrieval');
 assert.deepEqual(plan.products.map(p=>p.name).sort(),['Salary Transfer Loans for Expats','Salary Transfer Loans for UAE Nationals'].sort());
 assert.equal(plan.primary,question,'Preserve the actual question for embedding and reranking');
 for(const query of plan.queries)assert.ok(query.includes(question),'Keep requested facts and qualifiers');
});
for(const [question,names] of [
 ['What are the annual fees for Skywards Signature and Skywards Infinite?',['Skywards Signature Credit Card','Skywards Infinite Credit Card']],
 ['How do Voyager World Elite and Voyager World differ?',['Voyager World Elite Credit Card','Voyager World Credit Card']],
 ['Tell me about RegulaReturns Fixed Deposits Account and Plus Saver Account.',['RegulaReturns Fixed Deposits Account','Plus Saver Account']],
] as const)test('multiple named products are not ambiguous: '+question,()=>{
 const plan=catalogueTurn([{role:'user',content:question}],catalogue);
 assert.ok(plan&&!plan.ambiguous);
 assert.deepEqual(plan.products.map(p=>p.name).sort(),[...names].sort());
 assert.equal(plan.primary,question);
});
test('a short product name inside a longer mention does not add another subject',()=>{
 const plan=catalogueTurn([{role:'user',content:'Tell me about Voyager World Elite'}],catalogue);
 assert.ok(plan&&!plan.ambiguous);
 assert.deepEqual(plan.products.map(p=>p.name),['Voyager World Elite Credit Card']);
});
test('unrecognized names proceed to retrieval instead of demanding a known catalogue entry',()=>{
 assert.equal(catalogueTurn([{role:'user',content:'What does the missing Meridian Plan cover?'}],catalogue),null);
});


test('natural multi-product phrasing across eight catalogue families preserves both subjects',()=>{
 const pairs=[
  ['Skywards Signature Credit Card','Skywards Infinite Credit Card'],
  ['Voyager World Elite Credit Card','Voyager World Credit Card'],
  ['Plus Saver Account','Currency Passport Savings Account'],
  ['RegulaReturns Fixed Deposits Account','Goal Recurring Deposit'],
  ['Gold Investment Account','Silver Investment Account'],
  ['DMCC Corporate Card','DP World Corporate Credit Card'],
  ['Salary Transfer Loans for Expats','Salary Transfer Loans for UAE Nationals'],
  ['Instant Interest Fixed Deposit','Steady Saver Deposit'],
 ];
 const phrases=[
  (a:string,b:string)=>`Compare ${a} and ${b}`,
  (a:string,b:string)=>`How do ${a} and ${b} differ?`,
  (a:string,b:string)=>`What fees apply to ${a} and ${b}?`,
  (a:string,b:string)=>`Explain ${a} versus ${b}`,
  (a:string,b:string)=>`Tell me more about ${a} and ${b}`,
  (a:string,b:string)=>`${a} or ${b}: what conditions apply?`,
  (a:string,b:string)=>`Which of ${a} and ${b} have the lower charge?`,
 ];
 for(const pair of pairs)for(const phrase of phrases){
  const [a,b]=pair.map(name=>name.replace(/ Credit Card$| Account$/,''));
  const question=phrase(a,b),plan=catalogueTurn([{role:'user',content:question}],catalogue);
  assert.ok(plan&&!plan.ambiguous,question);
  assert.deepEqual(plan.products.map(p=>p.name).sort(),[...pair].sort(),question);
  assert.equal(plan.primary,question);
 }
});


test('abbreviated second names do not swallow an independent first mention',()=>{
 for(const question of ['Compare Voyager World with the Voyager Elite card','Compare Voyager World with World Elite']){
  const plan=catalogueTurn([{role:'user',content:question}],catalogue);
  assert.ok(plan&&!plan.ambiguous);
  assert.deepEqual(plan.products.map(p=>p.name).sort(),['Voyager World Credit Card','Voyager World Elite Credit Card'].sort());
 }
});
