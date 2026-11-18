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
