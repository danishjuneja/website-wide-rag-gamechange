const groups: [string,RegExp][]=[['business accounts',/\bbusiness accounts?\b/i],['business loans',/\bbusiness loans?\b/i],['business packages',/\bbusiness (?:banking )?packages?\b/i],['corporate Islamic deposits',/\bcorporate islamic deposits?\b/i],['working capital',/\bworking capital\b/i],['funds',/\bfunds?\b/i],['deposits',/\bdeposits?\b/i],['Islamic accounts',/\bislamic accounts?\b/i],['banking packages',/\bbanking packages?\b/i],['credit cards',/\bcredit cards?\b/i],['debit cards',/\bdebit cards?\b/i],['prepaid cards',/\bprepaid cards?\b/i],['savings accounts',/\bsavings? accounts?\b/i],['current accounts',/\bcurrent accounts?\b/i],['personal loans',/\bpersonal loans?\b/i],['home loans',/\b(home|mortgage) loans?\b/i],['auto loans',/\b(auto|car) loans?\b/i]];
export function isDiscoveryRequest(text:string):boolean {
  const nouns=/\b(cards?|accounts?|loans?|products?|funds?|deposits?|packages?)\b/i;
  if(/\b(?:list|which|what)\b.*\bworking capital (?:products|solutions|facilities)\b/i.test(text)) return true;
  if(!nouns.test(text)) return false;
  return /\b(?:list|show me|what types? of|what kinds? of)\b/i.test(text)
    || /\b(?:what|which|all)\s+(?:(?:business|corporate islamic|credit|debit|prepaid|savings?|current|personal|home|auto|investment|banking|islamic|fixed)\s+)?(?:cards|accounts|loans|products|funds|deposits|packages)\b/i.test(text);
}
export function isFilteredDiscovery(text:string):boolean {return isDiscoveryRequest(text) && /\b(with|without|have|has|offering|earning|earn|free|under|above|below|salary|fees?|eligible|eligibility|cashback|rewards?|travel|lounge)\b/i.test(text);}
export function discoveryCategory(text:string):string|null {
  if (!isDiscoveryRequest(text)) return null;
  return groups.find(([,pattern])=>pattern.test(text))?.[0] || null;
}
export type Product={name:string;status:'active'|'legacy'|'unknown';source_url:string};
export function formatProducts(category:string,products:Product[],complete:boolean) {
  const active=products.filter(p=>p.status==='active'); const unknown=products.filter(p=>p.status==='unknown');
  if(!active.length && !unknown.length) return null;
  const chosen=[...active,...unknown]; const citations=[...new Set(chosen.map(p=>p.source_url))];
  const label=(p:Product)=>`• ${p.name} [${citations.indexOf(p.source_url)+1}]`;
  const parts=[`Verified ${category}:`,...active.map(label)];
  if(unknown.length) parts.push('Availability unconfirmed:',...unknown.map(label));
  if(!complete) parts.push('This list may be incomplete; the category has not been fully reconciled.');
  return {answer:parts.join('\n'),citations};
}
