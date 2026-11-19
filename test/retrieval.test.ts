import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {pageCandidates,selectEvidence} from '../src/rag/retrieval.ts';
import {linkProducts} from '../src/rag/product-link.ts';
test('partial identity outranks a shared token and unrelated queries abstain',()=>{
 const catalogue=[{name:'Cedar Pay Consolidation Loan',source_url:'a'},{name:'Pay',source_url:'b'},{name:'Cedar Pay Premium Loan',source_url:'c'}];
 assert.equal(linkProducts('Tell me about cedar pay consolidation',catalogue)[0].product.source_url,'a');
 assert.ok(linkProducts('cedar pay',catalogue).length>1);
 assert.equal(linkProducts('How do volcanoes erupt?',catalogue).length,0);
});
test('source coverage and one total evidence budget are preserved',()=>{
 const products=[{name:'Alpha',source_url:'a'},{name:'Beta',source_url:'b'}];
 const rows=Array.from({length:40},(_,i)=>({id:i,source_url:i<20?'a':'b',title:'Product',section:'Terms',content:'Minimum salary is EUR '+i+' for salaried applicants.'}));
 const candidates=pageCandidates('Compare minimum salaries',products,rows);
 const ranks=candidates.map((_,index)=>({index,relevance_score:1-index/100}));
 const selected=selectEvidence(ranks,candidates,['a','b'],500);
 for(const source of ['a','b'])assert.ok(selected.some(r=>r.source_url===source));
 assert.ok(selected.reduce((sum,r)=>sum+r.content.length,0)<=500);assert.ok(selected.length<=10);
});


test('one evidence document preserves headings and source body together',async()=>{
 const {passageText}=await import('../src/rag/retrieval.ts');
 const text=passageText({title:'Cedar deposit',section:'Quarterly interest payout',content:'Minimum tenor is 6 months'});
 assert.ok(text.includes('Quarterly interest payout'));assert.ok(text.includes('Minimum tenor is 6 months'));
});


test('support-page evidence retains adjacent qualifications without a product identity',()=>{
 const rows=[
  {id:1,source_url:'https://bank.test/support',title:'Support',section:'Withdrawals',content:'Withdrawals are permitted.'},
  {id:2,source_url:'https://bank.test/support',title:'Support',section:'Withdrawals',content:'An additional charge applies after the monthly allowance.'}
 ];
 const selected=selectEvidence([{index:0,relevance_score:0.9}],[rows[0]],[],12000,rows);
 assert.deepEqual(selected.map(row=>row.id),[1,2]);
});


test('a requested field remains searchable when it is also in the product name',()=>{
 const product={name:'Salary Transfer Loan',source_url:'https://bank.test/salary-loan'};
 const rows=Array.from({length:20},(_,id)=>({id,source_url:product.source_url,title:product.name,section:'Details',content:id===19?'Salary threshold: AED 5000.':'Visit a branch to learn more.'}));
 assert.ok(pageCandidates('What is the salary for Salary Transfer Loan?',[product],rows).some(row=>row.id===19));
});
