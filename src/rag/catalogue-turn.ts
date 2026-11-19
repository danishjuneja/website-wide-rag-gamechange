import {linkProducts,type ProductIdentity} from './product-link.ts';
type HistoryMessage={role:'user'|'assistant';content:string};
const tokens=(s:string):string[]=>s.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
const comparison=/\b(?:compare|versus|vs|difference between)\b/i;
const reference=/\b(?:it|its|this|that|former|latter)\b|^(?:and |tell me more|more details|what (?:is|are) (?:the )?(?:fee|benefit|eligibility|minimum)|how (?:much|do I))/i;
// Compare each mention locally so a longer name cannot suppress another subject.
function linkMentions(text:string,catalogue:ProductIdentity[]){
  if(!comparison.test(text))return linkProducts(text,catalogue);
  const mentions=text.split(/\b(?:compare|versus|vs|and|with|against|difference between)\b/i).filter(part=>part.trim());
  let offset=0;
  const linked=mentions.flatMap(mention=>{
    const position=text.indexOf(mention,offset);offset=position+mention.length;
    const matches=linkProducts(mention,catalogue);
    if(!matches.length)return [];
    const best=matches[0];
    const tied=matches.filter(match=>match.score>=best.score/1.35 && match.confident);
    return (tied.length>1?tied:[best]).map(match=>({...match,position}));
  });
  return [...new Map(linked.map(match=>[match.product.source_url,match])).values()];
}
export function catalogueTurn(history:HistoryMessage[],catalogue:ProductIdentity[]) {
  const latest=history.at(-1)?.content;
  if(!latest)return null;
  let candidates=linkMentions(latest,catalogue);
  if(comparison.test(latest)) candidates.sort((a,b)=>a.position-b.position);
  if(!comparison.test(latest) && candidates.length>1 && candidates[0].queryCoverage>=0.75 && candidates[0].score<candidates[1].score*1.35)return {ambiguous:true as const};
  let products=candidates.filter(c=>c.confident).map(c=>c.product);
  if(!products.length && reference.test(latest)){
    const previous=history.slice(0,-1).filter(m=>m.role==='user').reverse();
    for(const message of previous){
      const prior=linkMentions(message.content,catalogue).filter(c=>c.confident).sort((a,b)=>a.position-b.position);
      if(!prior.length){if(!reference.test(message.content))break;continue}
      const named=linkProducts(latest,prior.map(p=>p.product)).filter(c=>c.confident);
      const ordinal=latest.match(/\b(former|latter)\b/i);
      if(ordinal && prior.length===2){
        products=[prior[ordinal[1].toLowerCase()==='former'?0:1].product];
      }else if(named.length===1)products=[named[0].product];
      else if(prior.length===1 && !/\b(?:switch|instead|another|different)\b/i.test(latest))products=[prior[0].product];
      else return {ambiguous:true as const};
      break;
    }
  }
  if(!products.length){
    if(candidates.length>1 && candidates[0].queryCoverage>=0.75)return {ambiguous:true as const};
    return null;
  }
  // Different labels for one page identify one source, but separate pages need disambiguation.
  products=[...new Map(products.map(p=>[p.source_url,p])).values()];
  if(products.length>1 && !comparison.test(latest))return {ambiguous:true as const};
  const primary=latest+'\nProducts: '+products.map(p=>p.name).join(' and ');
  const names=new Set(products.flatMap(p=>tokens(p.name)));
  const focus=tokens(latest).filter(t=>!names.has(t)&&!['compare','versus','vs','and','between','for','the','difference'].includes(t)).join(' ');
  return {ambiguous:false as const,primary,products,queries:[primary,...(products.length>1?products.map(p=>p.name+' '+focus):[])].slice(0,4)};
}
