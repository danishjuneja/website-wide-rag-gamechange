import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {verifyAnswerWithFeedback} from '../src/rag/verification.ts';
const url='https://bank.test/card';
const draft={answer:'Annual fee AED 100. [1]',citations:[url]};
const passages=[{source_url:url,content:'Annual fee AED 100 from the second year. Waived for programme members.'}];
const conditions=[{source_url:url,quote:'Annual fee AED 100 from the second year.'},{source_url:url,quote:'Waived for programme members.'}];
const assessment={supported:true,complete:false,evidence:[{source_url:url,quote:'Annual fee AED 100 from the second year.'}],conditions:[{index:0,relevant:true,covered:false,answer_quote:''},{index:1,relevant:true,covered:false,answer_quote:''}]};
function mock(first,second){let i=0;return async()=>JSON.stringify(i++ ? second : first)}
test('returns source-validated missing conditions for a supported but incomplete draft',async()=>{
 assert.deepEqual(await verifyAnswerWithFeedback('Annual fee?',draft,passages,mock({conditions},assessment)),{verified:false,missingConditions:conditions});
});
test('does not supply repair hints for unsupported claims or invalid evidence',async()=>{
 assert.deepEqual(await verifyAnswerWithFeedback('Annual fee?',draft,passages,mock({conditions},{...assessment,supported:false})),{verified:false,missingConditions:[]});
 assert.deepEqual(await verifyAnswerWithFeedback('Annual fee?',draft,passages,mock({conditions:[{source_url:url,quote:'fabricated condition'}]},assessment)),{verified:false,missingConditions:[]});
});

test('requests repair when a supported draft has an uncovered condition despite a complete summary verdict',async()=>{
 const feedback=await verifyAnswerWithFeedback('Annual fee?',draft,passages,mock({conditions},{...assessment,complete:true}));
 assert.deepEqual(feedback,{verified:false,missingConditions:conditions});
});


test('an uncited retrieved condition remains available for repair',async()=>{
 const {verifyAnswerWithFeedback}=await import('../src/rag/verification.ts');
 const passages=[{source_url:'a',content:'Annual fee is EUR 100.'},{source_url:'b',content:'The annual fee is waived for enrolled members.'}];
 let calls=0;
 const result=await verifyAnswerWithFeedback('What is the annual fee?',{answer:'Annual fee is EUR 100. [1]',citations:['a']},passages,async()=>{
   calls++;
   return JSON.stringify(calls===1?{conditions:[{source_url:'b',quote:passages[1].content}]}:
     {supported:true,complete:false,evidence:[{source_url:'a',quote:passages[0].content}],conditions:[{index:0,relevant:true,covered:false,answer_quote:''}]});
 });
 assert.equal(result.verified,false);assert.equal(result.missingConditions[0]?.source_url,'b');assert.equal(calls,2);
});


test('passage IDs validate quotes against their exact passage and allow uncited evidence',async()=>{
 const {verifyAnswerWithFeedback}=await import('../src/rag/verification.ts');
 const passages=[{source_url:'a',content:'Annual fee is EUR 100.'},{source_url:'b',content:'The annual fee is waived for enrolled members.'}];
 let calls=0;
 const result=await verifyAnswerWithFeedback('What is the annual fee?',{answer:'Annual fee is EUR 100. [1]',citations:['a']},passages,async(_messages,_system,shape)=>{
   assert.ok(shape&&typeof shape==='object'&&!Array.isArray(shape));
   return JSON.stringify(++calls===1?{conditions:[{passage_id:1,quote:passages[1].content}]}:
     {supported:true,complete:false,evidence:[{passage_id:0,quote:passages[0].content},{passage_id:1,quote:passages[1].content}],conditions:[{index:0,relevant:true,covered:false,answer_quote:''}]});
 });
 assert.equal(result.verified,false);assert.equal(result.missingConditions[0]?.source_url,'b');
});


test('heading evidence remains verifiable with its qualifying body',async()=>{
 const {passageText}=await import('../src/rag/retrieval.ts');
 const content=passageText({title:'Cedar Deposit',section:'Quarterly payout',content:'Minimum tenor is six months.'});
 let calls=0;
 const result=await verifyAnswerWithFeedback('When is interest paid?',{answer:'Quarterly payout [1] requires a minimum tenor of six months. [1]',citations:['a']},[{source_url:'a',content}],async()=>JSON.stringify(++calls===1?
 {conditions:[{passage_id:0,quote:'Minimum tenor is six months.'}]}:
 {supported:true,complete:true,evidence:[{passage_id:0,quote:'Quarterly payout'}],conditions:[{index:0,relevant:true,covered:true,answer_quote:'requires a minimum tenor of six months.'}]}));
 assert.equal(result.verified,true);
});


test('a verifier cannot discard an independently extracted material qualification',async()=>{
 let calls=0;
 const result=await verifyAnswerWithFeedback('When is interest paid?',{answer:'Quarterly. [1]',citations:['a']},[{source_url:'a',content:'Quarterly payout requires a minimum tenor of six months.'}],async()=>JSON.stringify(++calls===1?
 {conditions:[{passage_id:0,quote:'Quarterly payout requires a minimum tenor of six months.'}]}:
 {supported:true,complete:true,evidence:[{passage_id:0,quote:'Quarterly payout requires a minimum tenor of six months.'}],conditions:[{index:0,relevant:false,covered:false,answer_quote:''}]}));
 assert.equal(result.verified,false);assert.equal(result.missingConditions.length,1);
});
