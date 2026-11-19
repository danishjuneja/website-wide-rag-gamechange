import {renderStructuredAnswer} from './structured-answer.ts';
import {ProviderError} from './provider-error.ts';
import type { Message } from './core.ts';

async function request(url: string, key: string, body: unknown) {
  const endpoint=new URL(url);
  let response:Response;
  try { response = await fetch(url, { method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(45000) }); } catch(error) {
    throw new ProviderError(endpoint.hostname,error instanceof Error && /Timeout|Abort/.test(error.name)?504:502,undefined,undefined);
  }
  if (!response.ok) {
    const retry=response.headers.get('retry-after');
    const seconds=retry && /^\d+$/.test(retry)?Number(retry):retry?Math.max(1,Math.ceil((Date.parse(retry)-Date.now())/1000)):undefined;
    const details=await response.json().catch(()=>null) as {error?:{code?:unknown}} | null;
    const code=typeof details?.error?.code==='string' && /^[a-z0-9_-]{1,80}$/i.test(details.error.code)?details.error.code:undefined;
    throw new ProviderError(endpoint.hostname,response.status,code,seconds && Number.isFinite(seconds)?Math.min(seconds,86400):undefined);

  }
  return response.json();
}
export async function embed(texts: string[], inputType: 'search_document'|'search_query'): Promise<number[][]> {
  const key=process.env.COHERE_API_KEY;
  if (!key) throw new Error('Embedding service is not configured');
  const data=await request('https://api.cohere.com/v2/embed',key,{model:process.env.COHERE_EMBED_MODEL || 'embed-english-v3.0',texts,input_type:inputType,embedding_types:['float'],truncate:'NONE'});
  const vectors=data.embeddings?.float;
  if (!Array.isArray(vectors) || vectors.length !== texts.length || vectors.some((v:unknown)=>!Array.isArray(v) || v.length !== 1024 || v.some(n=>typeof n !== 'number' || !Number.isFinite(n)))) throw new Error('Invalid embedding response');
  return vectors;
}
export async function rerank(query: string, documents: string[]): Promise<{index:number;relevance_score:number}[]> {
  const key=process.env.COHERE_API_KEY;
  if (!key) throw new Error('Reranking service is not configured');
  const data=await request('https://api.cohere.com/v2/rerank',key,{model:process.env.COHERE_RERANK_MODEL || 'rerank-v3.5',query,documents,top_n:documents.length});
  if (!Array.isArray(data.results)) throw new Error('Invalid reranking response');
  const seen=new Set<number>();
  return data.results.filter((item:{index:number;relevance_score:number})=>{
    if(!Number.isInteger(item.index)||item.index<0||item.index>=documents.length||!Number.isFinite(item.relevance_score)||item.relevance_score<0||item.relevance_score>1||seen.has(item.index))return false;
    seen.add(item.index);return true;
  });

}
export type GenerationShape=string[]|'turn'|{kind:'conditions'|'judgment';passageIds:number[]};
export async function generate(messages: Message[], system: string, shape?: GenerationShape): Promise<string> {
  const key=process.env.GROQ_API_KEY;
  if (!key) throw new Error('Generation service is not configured');
  const strings = { type: 'array', items: { type: 'string' } };
  const record=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
  const quote=typeof shape==='object' && !Array.isArray(shape)
    ? record({passage_id:{type:'integer',enum:shape.passageIds},quote:{type:'string'}}) : null;
  const properties = shape === 'turn'
    ? { ambiguous: { type: 'boolean' }, query: { type: 'string' }, subjects: strings, product_queries: strings }
    : Array.isArray(shape)
    ? {statements:{type:'array',items:record({text:{type:'string'},source_ids:{type:'array',items:{type:'integer',enum:shape.map((_,index)=>index)}}})},unresolved:strings}
    : shape?.kind==='conditions'
    ? {conditions:{type:'array',items:quote}}
    : {supported:{type:'boolean'},complete:{type:'boolean'},evidence:{type:'array',items:quote},
       conditions:{type:'array',items:record({index:{type:'integer'},covered:{type:'boolean'},answer_quote:{type:'string'}})}};
  const responseFormat = shape ? {
    type: 'json_schema',
    json_schema: {
      name: shape === 'turn' ? 'resolved_turn' : Array.isArray(shape)?'cited_answer':shape.kind,
      strict: true,
      schema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false },
    },
  } : { type: 'json_object' };
  const data=await request('https://api.groq.com/openai/v1/chat/completions',key,{model:process.env.GROQ_MODEL || 'openai/gpt-oss-20b',temperature:0,messages:[{role:'system',content:system},...messages],response_format:responseFormat});
  if (typeof data.choices?.[0]?.message?.content !== 'string') throw new Error('Invalid generation response');
  return Array.isArray(shape)?renderStructuredAnswer(JSON.parse(data.choices[0].message.content),shape):data.choices[0].message.content;
}
