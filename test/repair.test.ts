import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {resolveVerifiedAnswer} from '../src/rag/repair.ts';
const url='https://bank.test/a';
const sources=[url], evidence=[{source_url:url,content:'Annual fee AED 100 from the second year.'}];
const first=JSON.stringify({answer:'Annual fee AED 100 [1]',citations:sources});
const repaired=JSON.stringify({answer:'Annual fee AED 100 from the second year [1]',citations:sources});
const missing=[{source_url:url,quote:'Annual fee AED 100 from the second year.'}];
test('repairs one supported incomplete answer and verifies the replacement',async()=>{
 let checks=0,generations=0;
 const output=await resolveVerifiedAnswer(first,sources,'fee?',evidence,[], 'system',async(messages)=>{generations++;assert.match(messages.at(-1).content,/second year/);return repaired},async()=>++checks===1?{verified:false,missingConditions:missing}:{verified:true,missingConditions:[]});
 assert.equal(output?.answer,'Annual fee AED 100 from the second year [1]');assert.equal(checks,2);assert.equal(generations,1);
});
test('fails closed without repair on unsupported feedback and after a rejected repair',async()=>{
 let calls=0;const gen=async()=>{calls++;return repaired};
 assert.equal(await resolveVerifiedAnswer(first,sources,'fee?',evidence,[],'system',gen,async()=>({verified:false,missingConditions:[]})),null);assert.equal(calls,0);
 assert.equal(await resolveVerifiedAnswer(first,sources,'fee?',evidence,[],'system',gen,async()=>({verified:false,missingConditions:missing})),null);assert.equal(calls,1);
});
test('never accepts a repaired answer with unrecognized sources',async()=>{
 const raw=JSON.stringify({answer:'Unsupported [1]',citations:['https://bad.test']});
 assert.equal(await resolveVerifiedAnswer(first,sources,'fee?',evidence,[],'system',async()=>raw,async()=>({verified:false,missingConditions:missing})),null);
});
