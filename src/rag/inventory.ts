const categories: [string,RegExp][]=[['business accounts',/\bbusiness accounts?\b/i],['business loans',/\bbusiness loans?\b/i],['business packages',/\bbusiness (?:banking )?packages?\b/i],['corporate Islamic deposits',/\bcorporate islamic deposits?\b/i],['working capital',/\bworking capital\b/i],['funds',/\bfunds?\b/i],['deposits',/\bdeposits?\b/i],['Islamic accounts',/\bislamic accounts?\b/i],['banking packages',/\bbanking packages?\b/i],['credit cards',/\bcredit cards?\b/i],['debit cards',/\bdebit cards?\b/i],['prepaid cards',/\bprepaid cards?\b/i],['savings accounts',/\bsavings? accounts?\b/i],['current accounts',/\bcurrent accounts?\b/i],['personal loans',/\bpersonal loans?\b/i],['home loans',/\b(home|mortgage) loans?\b/i],['auto loans',/\b(auto|car) loans?\b/i],
  ['investment banking', /\binvestment banking\b/i],
  ['foreign exchange', /\bforeign exchange\b/i],
  ['private banking services', /\bprivate banking services?\b/i],
  ['safe deposit lockers', /\bsafe deposit lockers?\b/i],
  ['commercial payment solutions', /\bcommercial payment solutions?\b/i],
  ['commercial cards', /\b(?:commercial|corporate|business) (?:credit )?cards?\b/i],
  ['corporate Islamic financing', /\bcorporate islamic financ(?:e|ing)\b/i],
  ['corporate financing', /\bcorporate financ(?:e|ing)\b/i],
  ['corporate digital banking', /\bcorporate digital banking\b/i],
  ['cash management', /\bcash management\b/i],
  ['trade finance', /\btrade financ(?:e|ing)\b/i],
  ['card financing', /\bcard financ(?:e|ing)\b/i],
  ['treasury products', /\btreasury products?\b/i],
  ['insurance plans', /\binsurance(?: plans?)?\b/i],
  ['overdrafts', /\boverdrafts?\b/i],
  ['money transfers', /\bmoney transfers?\b/i],
  ['private banking loans', /\bprivate banking loans?\b/i],
  ['investments', /\binvestments?\b/i],
];
function requestedList(text: string): string | null {
  const match = text.trim().match(/^(?:(?:please\s+)?(?:can|could|would) you\s+)?(?:please\s+)?(?:list|show(?: me)?|which|what(?: types? of| kinds? of)?|all)\s+(?:(?:me|the|your|all|available|our)\s+)*(.+)$/i);
  if (!match) return null;
  const subject = match[1];
  if (/^(?:is|are (?:the |my )?(?:fees?|benefits?|terms?)|does|do|can|will|fees?|annual fee|minimum|benefits?|requirements?|eligibility|terms?|interest|rate|limit|documents?)\b/i.test(subject)) return null;
  const first = categories.find(([, pattern]) => pattern.exec(subject)?.index === 0);
  return first || /^(?:(?:business|fixed|investment|banking)\s+)?(?:cards|accounts|loans|products|funds|deposits|packages)\b/i.test(subject) ? subject : null;
}
export function isDiscoveryRequest(text: string): boolean {
  return requestedList(text) !== null;
}
export function isFilteredDiscovery(text: string): boolean {
  const subject = requestedList(text);
  if (!subject) return false;
  const filter = subject.replace(/\b(?:do (?:you|they)|does (?:the bank|it)) (?:currently )?have\b/gi, '');
  return /\b(with|without|have|has|offering|earning|earn|free|under|above|below|salary|fees?|eligible|eligibility|cashback|rewards?|travel|lounge)\b/i.test(filter);
}
export function discoveryCategory(text: string): string | null {
  const subject = requestedList(text);
  return subject ? categories.find(([, pattern]) => pattern.exec(subject)?.index === 0)?.[0] ?? null : null;
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
