export type ProductIdentity={name:string;source_url:string};
const ignored=new Set('a an the and or of for in on with bank emirates nbd uae banking account accounts card cards loan loans credit debit visa mastercard product products fund funds deposit deposits investment investments'.split(' '));
const normalize=(text:string)=>text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
export function linkProducts(text:string,catalogue:ProductIdentity[]) {
  const entries=[...new Map(catalogue.map(product=>[product.source_url+'|'+product.name,product])).values()].map(product=>{
    const terms=[...new Set(normalize(product.name).filter(term=>!ignored.has(term)))];
    return {product,terms,fullTerms:[...new Set(normalize(product.name))]};
  });
  const frequencies=new Map<string,Set<string>>();
  for(const entry of entries)for(const term of entry.fullTerms){
    const urls=frequencies.get(term)||new Set<string>();urls.add(entry.product.source_url);frequencies.set(term,urls);
  }
  const query=new Set(normalize(text));
  const questionWords=new Set('tell me more about explain describe what which how when where why does do is are can could would please give information details simple terms the its it their benefits benefit work help offer offers'.split(' '));
  const informative=[...query].filter(term=>!ignored.has(term)&&!questionWords.has(term));

  const weight=(term:string)=>Math.log(1+entries.length/(frequencies.get(term)?.size||1));
  const ranked=entries.map(entry=>{
    const matched=entry.terms.filter(term=>query.has(term));
    const matchedFull=entry.fullTerms.filter(term=>query.has(term));
    const context=matchedFull.filter(term=>ignored.has(term)).reduce((sum,term)=>sum+weight(term),0);
    const value=matched.reduce((sum,term)=>sum+weight(term),0);
    const coverage=value/Math.max(1,entry.terms.reduce((sum,term)=>sum+weight(term),0));
    const exact=(' '+normalize(text).join(' ')+' ').includes(' '+normalize(entry.product.name).join(' ')+' ');
    const queryText=normalize(text).join(' ');
    const phrase=entry.terms.join(' ');
    const position=queryText.indexOf(phrase)>=0?queryText.indexOf(phrase):Math.min(...matched.map(term=>queryText.indexOf(term)));
    return {...entry,matched,matchedFull,value,coverage,exact,position,score:value*(0.5+0.5*coverage)+0.6*context};
  }).filter(entry=>entry.exact || entry.matched.length>=2 || entry.matched.length===1 && entry.matched[0].length>=4);
  ranked.sort((a,b)=>b.score-a.score || b.coverage-a.coverage);
  if(!ranked.length)return [];
  // A weak shorter name must not displace a stronger multi-token mention.
  const cutoff=ranked[0].score*0.75;
  return ranked.filter(entry=>entry.score>=cutoff).slice(0,6).map(entry=>({
    product:entry.product,score:entry.score,position:entry.position,queryCoverage:entry.matched.length/Math.max(1,informative.length),
    confident:entry.exact || entry.coverage>=0.5 && (entry.matched.length>=2 || entry.matchedFull.length>=2 ||
      (entry.matched[0].length>=6 && frequencies.get(entry.matched[0])?.size===1 && entry.coverage>=0.45)),
  }));
}
