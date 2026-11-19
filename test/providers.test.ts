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
 globalThis.fetch=async()=>new Response(JSON.stringify({results:[{index:1,relevance_score:0.9},{index:0,relevance_score:0.6}]}));
 try{assert.deepEqual((await rerank('q',['a','b'])).map(r=>r.index),[1,0])}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.COHERE_API_KEY;else process.env.COHERE_API_KEY=oldKey}
});


test('provider limits retain safe status and cooldown without exposing response content',async()=>{
 const {ProviderError,providerResponse}=await import('../src/rag/provider-error.ts');
 const oldFetch=globalThis.fetch,oldKey=process.env.COHERE_API_KEY;
 process.env.COHERE_API_KEY='test-only';
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'rate_limit_exceeded',message:'sensitive provider payload'}}),{status:429,headers:{'retry-after':'12'}});
 try {
   await assert.rejects(embed(['q'],'search_query'),error=>{
     assert.ok(error instanceof ProviderError);
     assert.equal(error.status,429);assert.equal(error.retryAfter,12);
     assert.equal(providerResponse(error).status,429);
     assert.equal(error.message.includes('sensitive'),false);
     return true;
   });
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.COHERE_API_KEY;else process.env.COHERE_API_KEY=oldKey;}
});
