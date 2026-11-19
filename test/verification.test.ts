import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {verifyAnswerWithFeedback} from '../src/rag/verification.ts';
const source='https://bank.test/card';
const answer={answer:'The annual fee is AED 100 from the second year. [1]',citations:[source]};
const evidence=[{source_url:source,content:'Annual fee: AED 100 (2nd year onwards)'}];
const extracted={conditions:[{source_url:source,quote:'Annual fee: AED 100 (2nd year onwards)'}]};
const judgment={supported:true,complete:true,evidence:[{source_url:source,quote:'Annual fee: AED 100 (2nd year onwards)'}],conditions:[{index:0,relevant:true,covered:true,answer_quote:'from the second year'}]};
function pair(a:unknown,b:unknown){let i=0;return async()=>JSON.stringify(i++===0?a:b)}
test('requires explicit coverage of independently extracted source conditions',async()=>{
 assert.equal((await verifyAnswerWithFeedback('annual fee?',answer,evidence,pair(extracted,judgment))).verified,true);
 for(const report of [{...judgment,conditions:[]},{...judgment,conditions:[{index:0,relevant:true,covered:false,answer_quote:''}]},{...judgment,conditions:[{index:0,relevant:true,covered:true,answer_quote:'from the first year'}]},{...judgment,conditions:[{index:9,relevant:true,covered:true,answer_quote:'from the second year'}]},{...judgment,supported:false},{...judgment,complete:false}]) assert.equal((await verifyAnswerWithFeedback('annual fee?',answer,evidence,pair(extracted,report))).verified,false);
});
test('rejects fabricated source quotes and uncited source conditions',async()=>{
 for(const bad of [{conditions:[{source_url:source,quote:'invented condition'}]},{conditions:[{source_url:'https://bad.test',quote:evidence[0].content}]},{conditions:'none'}]) assert.equal((await verifyAnswerWithFeedback('annual fee?',answer,evidence,pair(bad,judgment))).verified,false);
 assert.equal((await verifyAnswerWithFeedback('annual fee?',answer,evidence,pair(extracted,{...judgment,evidence:[{source_url:source,quote:'invented quote'}]}))).verified,false);
});
test('extractor does not see draft and verifier failures fail closed',async()=>{
 let calls=0;assert.equal((await verifyAnswerWithFeedback('annual fee?',answer,evidence,async(messages)=>{calls++;const payload=JSON.parse(messages[0].content);if(calls===1){assert.equal('draft' in payload,false);return JSON.stringify(extracted)}assert.equal(payload.draft.answer,answer.answer);throw new Error('offline')})).verified,false);
 assert.equal((await verifyAnswerWithFeedback('annual fee?',answer,evidence,async()=>'{')).verified,false);
});
test('handles unqualified facts without inventing conditions',async()=>{
 const simple={answer:'The product is available online. [1]',citations:[source]};
 const passages=[{source_url:source,content:'The product is available online.'}];
 const result={supported:true,complete:true,evidence:[{source_url:source,quote:'The product is available online.'}],conditions:[]};
 assert.equal((await verifyAnswerWithFeedback('How is it available?',simple,passages,pair({conditions:[]},result))).verified,true);
});
test('requires every condition to be accounted for exactly once',async()=>{
 const facts=[{source_url:source,content:'Annual fee: AED 100 from the second year. Available to residents only.'}];
 const conditions={conditions:[{source_url:source,quote:'Annual fee: AED 100 from the second year.'},{source_url:source,quote:'Available to residents only.'}]};
 const draft={answer:'The fee is AED 100 from the second year, and it is available to residents only. [1]',citations:[source]};
 const report={supported:true,complete:true,evidence:[{source_url:source,quote:facts[0].content}],conditions:[{index:0,relevant:true,covered:true,answer_quote:'from the second year'},{index:1,relevant:true,covered:true,answer_quote:'available to residents only'}]};
 assert.equal((await verifyAnswerWithFeedback('fee and eligibility?',draft,facts,pair(conditions,report))).verified,true);
 assert.equal((await verifyAnswerWithFeedback('fee and eligibility?',draft,facts,pair(conditions,{...report,conditions:[report.conditions[0],report.conditions[0]]}))).verified,false);
});


test('requires the extractor-selected conditions and rejects an omitted waiver',async()=>{
 const facts=[{source_url:source,content:'Joining fee: AED 50. Annual fee: AED 100 from the second year. The annual fee is waived for programme members.'}];
 const conditions={conditions:[{source_url:source,quote:'Annual fee: AED 100 from the second year.'},{source_url:source,quote:'The annual fee is waived for programme members.'}]};
 const draft={answer:'The annual fee is AED 100 from the second year. [1]',citations:[source]};
 const base={supported:true,complete:true,evidence:[{source_url:source,quote:facts[0].content}],conditions:[{index:0,relevant:true,covered:true,answer_quote:'from the second year'},{index:1,relevant:true,covered:false,answer_quote:''}]};
 assert.equal((await verifyAnswerWithFeedback('annual fee?',draft,facts,pair(conditions,base))).verified,false);
 const full={answer:'The annual fee is AED 100 from the second year and is waived for programme members. [1]',citations:[source]};
 const report={...base,conditions:[base.conditions[0],{index:1,relevant:true,covered:true,answer_quote:'waived for programme members'}]};
 assert.equal((await verifyAnswerWithFeedback('annual fee?',full,facts,pair(conditions,report))).verified,true);
 assert.equal((await verifyAnswerWithFeedback('annual fee?',full,facts,pair(conditions,{...report,conditions:[{index:0,covered:false},report.conditions[1],report.conditions[2]]}))).verified,false);
});
