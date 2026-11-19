export type ProductIdentity={name:string;source_url:string};
const ignored=new Set('a an the and or of for in on with bank emirates nbd uae banking account accounts card cards loan loans credit debit visa mastercard product products fund funds deposit deposits investment investments'.split(' '));
const normalize=(text:string):string[]=>text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
type Span={start:number;end:number};
function localSpans(signature:string[],tokens:{term:string;index:number}[]):Span[]{
  if(!signature.length)return [];
  return tokens.flatMap((token,index)=>signature.every((term,offset)=>tokens[index+offset]?.term===term)
    ? [{start:token.index,end:tokens[index+signature.length-1].index}]:[]);
}
export function linkProducts(text:string,catalogue:ProductIdentity[]) {
  const entries=[...new Map(catalogue.map(product=>[product.source_url+'|'+product.name,product])).values()].map(product=>{
    const terms=[...new Set(normalize(product.name).filter(term=>!ignored.has(term)))];
    return {product,terms,fullTerms:[...new Set(normalize(product.name))]};
  });
  const frequencies=new Map<string,Set<string>>();
  for(const entry of entries)for(const term of entry.fullTerms){
    const urls=frequencies.get(term)||new Set<string>();urls.add(entry.product.source_url);frequencies.set(term,urls);
  }
  const queryTokens=normalize(text);
  const query=new Set(queryTokens);
  const indexedTokens=queryTokens.map((term,index)=>({term,index}));
  const identityTokens=indexedTokens.filter(token=>!ignored.has(token.term));
  const weight=(term:string)=>Math.log(1+entries.length/(frequencies.get(term)?.size||1));
  const ranked=entries.map(entry=>{
    const matched=entry.terms.filter(term=>query.has(term));
    const matchedFull=entry.fullTerms.filter(term=>query.has(term));
    const context=matchedFull.filter(term=>ignored.has(term)).reduce((sum,term)=>sum+weight(term),0);
    const value=matched.reduce((sum,term)=>sum+weight(term),0);
    const coverage=value/Math.max(1,entry.terms.reduce((sum,term)=>sum+weight(term),0));
    const exact=(' '+normalize(text).join(' ')+' ').includes(' '+normalize(entry.product.name).join(' ')+' ');
    const fullSpans=localSpans(normalize(entry.product.name),indexedTokens);
    const spans=fullSpans.length?fullSpans:localSpans(entry.terms,identityTokens);
    const matchedSpans=localSpans(matched,identityTokens);
    const positions=matched.map(term=>queryTokens.indexOf(term));
    const position=spans[0]?.start ?? Math.max(...positions);
    return {...entry,matched,matchedFull,value,coverage,exact,spans,matchedSpans,position,score:value*(0.5+0.5*coverage)+0.6*context};
  }).filter(entry=>entry.exact || entry.matched.length>=2 || entry.matched.length===1 && entry.matched[0].length>=4);
  ranked.sort((a,b)=>b.score-a.score || b.coverage-a.coverage);
  if(!ranked.length)return [];
  // Preserve independent mentions even when one product has a much shorter name.
  // A nested alias is not a second mention; a later standalone occurrence is.
  const survivingSpans=(entry:typeof ranked[number])=>entry.spans.filter(span=>!ranked.some(other=>{
    if(other===entry || other.product.source_url===entry.product.source_url)return false;
    const includes=entry.matched.every(term=>other.matched.includes(term));
    if(!includes)return false;
    return other.spans.some(larger=>larger.start<=span.start && larger.end>=span.end && larger.end-larger.start>span.end-span.start)
      || !other.spans.length && other.score>entry.score && other.matched.length>entry.matched.length &&
        other.matchedSpans.some(larger=>larger.start<=span.start && larger.end>=span.end);
  }));
  const cutoff=ranked[0].score*0.75;
  return ranked.map(entry=>({...entry,mentions:survivingSpans(entry)}))
    .filter(entry=>(!entry.spans.length || entry.mentions.length>0) && (entry.score>=cutoff || entry.mentions.length>0)).slice(0,8).map(entry=>({
    product:entry.product,score:entry.score,position:entry.mentions[0]?.start ?? entry.position,
    confident:entry.exact || entry.coverage>=0.5 && (entry.matched.length>=2 || entry.matchedFull.length>=2 ||
      (entry.matched[0].length>=6 && frequencies.get(entry.matched[0])?.size===1 && entry.coverage>=0.45)),
  }));
}
