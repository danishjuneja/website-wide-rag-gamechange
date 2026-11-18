import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {resolveTurn} from '../src/rag/turn.ts';
import {sourceExcerpts} from '../src/rag/excerpts.ts';

test('an unchanged comparison remains the primary query after deduplication',()=>{
 const q='Compare Alpha and Beta on maturity';
 const plan={ambiguous:false,query:q,subjects:['Alpha','Beta'],product_queries:['Alpha maturity','Beta maturity']};
 assert.equal(resolveTurn(q,[],plan)?.primary,q);
 assert.equal(resolveTurn(q,[],{...plan,subjects:['Gamma'] }),null);
});
test('a follow-up must ground its subject in conversation',()=>{
 const history=[{role:'user' as const,content:'Tell me about Cedar Deposit'}];
 const plan={ambiguous:false,query:'What is the Cedar Deposit maturity?',subjects:['Cedar Deposit']};
 assert.equal(resolveTurn('What is its maturity?',history,plan)?.primary,plan.query);
 assert.equal(resolveTurn('What is its maturity?',history,{...plan,subjects:[]}),null);
 assert.equal(resolveTurn('What is its maturity?',history,{...plan,ambiguous:true}),null);
});
test('source labels work with textual terms, percentages and durations; conflicting values fail closed',()=>{
 for(const [title,label,value] of [['Cedar Deposit','Maturity','18 months'],['Atlas Fund','Distribution frequency','Quarterly'],['Maple Loan','Interest rate','4% fixed']]){
 const q=title+' '+label+'?',row={source_url:'https://bank.test/detail/123',title,content:label+': '+value};
 assert.ok(sourceExcerpts(q,[row])?.answer.includes(row.content));
 assert.equal(sourceExcerpts(q,[row,{...row,content:label+': another value'}]),null);
 }
});

test('rejects a guessed pronoun after comparison and limits searches to grounded subjects',()=>{
 const history=[{role:'user' as const,content:'Compare Cedar Deposit versus Atlas Fund'}];
 const plan={ambiguous:false,query:'Cedar Deposit maturity',subjects:['Cedar Deposit'],product_queries:['Atlas Fund maturity','Cedar Deposit term']};
 assert.equal(resolveTurn('What is its maturity?',history,plan),null);
 assert.deepEqual(resolveTurn('For Cedar Deposit, what is its maturity?',history,plan)?.queries,['Cedar Deposit maturity','Cedar Deposit term']);
});
test('quotes an entire source paragraph including its withdrawal condition',()=>{
 const row={source_url:'https://bank.test/accounts/cedar',title:'Cedar Saver',content:'Five withdrawals are permitted. Exceeding that limit reduces interest for the period.'};
 assert.ok(sourceExcerpts('Cedar Saver: do withdrawals affect interest?', [row])?.answer.includes(row.content));
});

test('a follow-up excerpt uses only the latest requested fact', () => {
 const evidence=[{source_url:'https://bank.test/cedar',title:'Cedar Deposit',content:'Currencies: GBP and EUR'}];
 assert.equal(sourceExcerpts('Currencies and maturity of Cedar Deposit?',evidence,'When does it mature?'),null);
 assert.ok(sourceExcerpts('Currencies of Cedar Deposit?',evidence,'Which currencies does it support?'));
});


test('ranks a payout paragraph for a question about when a payment is made',()=>{
 const row={source_url:'https://bank.test/cedar',title:'Cedar Deposit',content:'Profit payout upon maturity'};
 assert.match(sourceExcerpts('Cedar Deposit', [row], 'When is its profit paid?')?.answer||'',/Profit payout upon maturity/);
});
