import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
type Item={name:string;category:string;status:'active'|'legacy'|'unknown';source_url:string;verified:boolean};
const [filename,version]=process.argv.slice(2);
if(!filename||!version)throw new Error('Usage: npm run inventory:upload -- <reviewed.json> <staged-version-uuid>');
if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Missing database credentials');
const input=JSON.parse(await readFile(filename,'utf8')) as {products:Item[];categories:{category:string;reconciled:boolean}[]};
if(!Array.isArray(input.products)||!Array.isArray(input.categories))throw new Error('Expected products and categories arrays');
for(const p of input.products){const u=new URL(p.source_url);if(u.protocol!=='https:' || !['www.emiratesnbd.com','cdn.emiratesnbd.com'].includes(u.hostname) || !p.name || !p.category || !['active','legacy','unknown'].includes(p.status) || p.verified!==true)throw new Error('Inventory contains an invalid or unverified product')}
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
if(input.products.length){const {error}=await db.from('rag_products').insert(input.products.map(p=>({...p,version_id:version})));if(error)throw new Error(error.message)}
if(input.categories.length){const {error}=await db.from('rag_categories').insert(input.categories.map(c=>({...c,version_id:version})));if(error)throw new Error(error.message)}
console.log(`Uploaded ${input.products.length} verified products. No index was promoted.`);
