import {linkProducts,type ProductIdentity} from './product-link.ts';
type HistoryMessage={role:'user'|'assistant';content:string};
const reference=/\b(?:it|its|this|that|they|them|their|these|those|both|former|latter)\b|^(?:and |tell me more|more details|what (?:is|are) (?:the )?(?:fee|benefit|eligibility|minimum)|how (?:much|do I))/i;
export function needsSubjectResolution(question:string){return reference.test(question)}
export function catalogueTurn(history:HistoryMessage[],catalogue:ProductIdentity[]) {
  const latest=history.at(-1)?.content;
  if(!latest)return null;
  const candidates=linkProducts(latest,catalogue).sort((a,b)=>a.position-b.position);
  let products=candidates.filter(c=>c.confident).map(c=>c.product);
  if(!products.length && reference.test(latest)){
    const previous=history.slice(0,-1).filter(m=>m.role==='user').reverse();
    for(const message of previous){
      const prior=linkProducts(message.content,catalogue).filter(c=>c.confident).sort((a,b)=>a.position-b.position);
      if(!prior.length){if(!reference.test(message.content))break;continue}
      const named=linkProducts(latest,prior.map(p=>p.product)).filter(c=>c.confident);
      const ordinal=latest.match(/\b(former|latter)\b/i);
      if(ordinal && prior.length===2){
        products=[prior[ordinal[1].toLowerCase()==='former'?0:1].product];
      }else if(/\b(?:they|them|their|these|those|both)\b/i.test(latest))products=prior.map(candidate=>candidate.product);
      else if(named.length===1)products=[named[0].product];
      else if(prior.length===1 && !/\b(?:switch|instead|another|different)\b/i.test(latest))products=[prior[0].product];
      else return {ambiguous:true as const};
      break;
    }
  }
  if(!products.length){
    return null;
  }
  // Different catalogue labels for one page supply one retrieval hint.
  products=[...new Map(products.map(p=>[p.source_url,p])).values()];
  // Entity matches are page hints, not a reason to reject an explicit question.
  const contextual=!candidates.some(candidate=>candidate.confident);
  const primary=contextual?latest+'\nSubject: '+products.map(p=>p.name).join(' and '):latest;
  const queries=products.length>1
    ? [primary,...products.map(product=>'Product: '+product.name+'\nQuestion: '+latest)].slice(0,4)
    : [primary];
  return {ambiguous:false as const,primary,products,queries};
}
