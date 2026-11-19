import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {registerHooks} from 'node:module';
import register from '../docs/submission/product-register.json' with {type:'json'};

// Node's test runner needs the extensions that Next's bundler resolves in chat.ts.
const hooks=registerHooks({resolve(specifier,context,next){
 if(context.parentURL?.startsWith(new URL('../src/',import.meta.url).href)&&specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier))return next(specifier+'.ts',context);
 return next(specifier,context);
}});
const {answerQuestion}=await import('../src/rag/chat.ts');
hooks.deregister();
const catalogue=register.products.filter(product=>product.verified);
const products=catalogue.filter(product=>/^Salary Transfer Loans for (Expats|UAE Nationals)$/.test(product.name));
const rows=products.map((p,index)=>({id:index+1,source_url:p.source_url,title:p.name,section:'Eligibility',content:index===0?'The minimum salary is AED 5000.':'The minimum salary is AED 10000.'}));

test('natural comparison reaches embedding, both source pages and answer verification',async()=>{
 const native=globalThis.fetch;const oldUrl=process.env.SUPABASE_URL;const oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://database.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test-key';
 const savedCohere=process.env.COHERE_API_KEY,savedGroq=process.env.GROQ_API_KEY;
 process.env.COHERE_API_KEY='test-key';process.env.GROQ_API_KEY='test-key';
 const requests:{url:string;body:any}[]=[];
 const restore=(key:string,value:string|undefined)=>{if(value===undefined)delete process.env[key];else process.env[key]=value};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input:input.url);
  const body=init?.body?JSON.parse(String(init.body)):null;requests.push({url:url.href,body});
  if(url.hostname==='database.test'){
   if(url.pathname.endsWith('/rag_active_version'))return Response.json({version_id:'00000000-0000-0000-0000-000000000001'});
   if(url.pathname.endsWith('/rag_products'))return Response.json(catalogue);
   if(url.pathname.endsWith('/rag_chunks')){
    const source=url.searchParams.get('source_url')?.replace(/^eq\./,'');
    return Response.json(rows.filter(row=>!source||row.source_url===source));
   }
   if(url.pathname.endsWith('/hybrid_search'))return Response.json(rows);
  }
  if(url.hostname==='api.cohere.com'){
   if(url.pathname.endsWith('/embed'))return Response.json({embeddings:{float:body.texts.map(()=>Array(1024).fill(0.01))}});
   if(url.pathname.endsWith('/rerank'))return Response.json({results:body.documents.map((_:unknown,index:number)=>({index,relevance_score:0.9-index/100}))});
  }
  if(url.hostname==='api.groq.com'){
   const shape=body.response_format.json_schema.name;let content;
   if(shape==='resolved_turn')content={ambiguous:true,query:'',subjects:[],product_queries:[]};
   else if(shape==='cited_answer')content={statements:rows.map((row,source_id)=>({text:row.content,source_ids:[source_id]})),unresolved:[]};
   else if(shape==='conditions')content={conditions:[]};
   else if(shape==='judgment')content={supported:true,complete:true,evidence:rows.map((row,passage_id)=>({passage_id,quote:row.content})),conditions:[]};
   else throw Error('Unexpected generation schema: '+shape);
   return Response.json({choices:[{message:{content:JSON.stringify(content)}}]});
  }
  throw Error('Unexpected network request: '+url.origin+url.pathname);
 };
 try{
  for(const question of [
   'whats the difference between salary transfer loans for expats and UAE nationals',
   'How do the salary transfer loans for expats and UAE nationals differ?',
   'What are the minimum salaries for salary transfer loans for expats and UAE nationals?'
  ]){
   requests.length=0;
   const result=await answerQuestion([{role:'user',content:'How can I learn about personal loans?'},{role:'assistant',content:'Salary Transfer Loans for Expats; Salary Transfer Loans for UAE Nationals'},{role:'user',content:question}]);
   assert.equal(result.citations.length,2,'Must retrieve both loan sources rather than clarify');
   const embedding=requests.find(request=>request.url.endsWith('/embed'));
   assert.equal(embedding?.body.texts[0],question);
   assert.ok(embedding.body.texts.every((text:string)=>text.includes(question)));
   const pageRequests=requests.filter(request=>request.url.includes('/rag_chunks?'));
   for(const product of products)assert.ok(pageRequests.some(request=>new URL(request.url).searchParams.get('source_url')==='eq.'+product.source_url));
   assert.ok(!pageRequests.some(request=>request.url.includes('home-loans')));
   assert.ok(requests.some(request=>request.body?.response_format?.json_schema?.name==='judgment'));
  }
  requests.length=0;
  await answerQuestion([{role:'user',content:'Tell me about a different account'},{role:'assistant',content:'Please ask a public product question.'},{role:'user',content:'Where can I find the missing Meridian Plan terms?'}]);
  assert.equal(requests.find(request=>request.url.endsWith('/embed'))?.body.texts[0],'Where can I find the missing Meridian Plan terms?');
 }finally{
  globalThis.fetch=native;restore('SUPABASE_URL',oldUrl);restore('SUPABASE_SERVICE_ROLE_KEY',oldKey);restore('COHERE_API_KEY',savedCohere);restore('GROQ_API_KEY',savedGroq);
 }
});
