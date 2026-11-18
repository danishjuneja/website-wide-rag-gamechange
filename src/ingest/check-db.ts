import {createClient} from '@supabase/supabase-js';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('SUPABASE_URL and server key are required');
const db=createClient(url,key,{auth:{persistSession:false}});
for(const table of ['rag_active_version','rag_chunks','rag_products','rag_categories']){
 const {error}=await db.from(table).select('*',{count:'exact',head:true});
 if(error){console.error(`${table}: unavailable (${error.code||'unknown'})`);process.exitCode=1}else console.log(`${table}: reachable`);
}
const {error}=await db.rpc('hybrid_search',{query_text:'test',query_embedding:[1,...Array(1023).fill(0)],query_model:process.env.COHERE_EMBED_MODEL||'embed-english-v3.0',match_count:1,preview_version:null});
if(error){console.error(`hybrid_search: unavailable (${error.code||'unknown'}): ${error.message}`);process.exitCode=1}else console.log('hybrid_search: reachable');
