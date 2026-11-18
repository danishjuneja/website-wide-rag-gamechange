import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {embed,rerank} from '../src/rag/providers.ts';

test('embedding sends query input type and validates vectors',async()=>{
 const oldFetch=globalThis.fetch, oldKey=process.env.COHERE_API_KEY;
 process.env.COHERE_API_KEY='test-only';
 globalThis.fetch=async (_url,init)=>{
  const body=JSON.parse(String(init?.body)); assert.equal(body.input_type,'search_query'); assert.equal(body.truncate,'NONE'); assert.deepEqual(body.texts,['question']);
  return new Response(JSON.stringify({embeddings:{float:[Array(1024).fill(0.1)]}}));
 };
 try {assert.equal((await embed(['question'],'search_query'))[0].length,1024)} finally {globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.COHERE_API_KEY;else process.env.COHERE_API_KEY=oldKey}
});
test('reranker returns valid result indices',async()=>{
 const oldFetch=globalThis.fetch, oldKey=process.env.COHERE_API_KEY; process.env.COHERE_API_KEY='test-only';
 globalThis.fetch=async()=>new Response(JSON.stringify({results:[{index:1},{index:0}]}));
 try{assert.deepEqual(await rerank('q',['a','b']),[1,0])}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.COHERE_API_KEY;else process.env.COHERE_API_KEY=oldKey}
});
