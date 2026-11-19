export type Message = { role: 'user' | 'assistant'; content: string };
export type Answer = { answer: string; citations: string[] };
export function searchQueries(original:string, rewrite:unknown):string[] {
 const obj=rewrite && typeof rewrite==='object'?rewrite as Record<string,unknown>:{};
 const candidates=[original,obj.query,...(Array.isArray(obj.product_queries)?obj.product_queries:[])];
 return [...new Set(candidates.filter((x):x is string=>typeof x==='string' && !!x.trim() && x.length<=1000).map(x=>x.trim()))].slice(0,4);
}

export function validateHistory(input: unknown): Message[] {
  if (!Array.isArray(input) || input.length > 12) throw new Error('Invalid conversation');
  return input.map(item => {
    if (!item || !['user','assistant'].includes(item.role) || typeof item.content !== 'string' || !item.content.trim() || item.content.length > 5000) throw new Error('Invalid message');
    return {role:item.role, content:item.content};
  });
}
export function answerValidationIssue(input: unknown, allowed: string[]): string | null {
  if (!input || typeof input !== 'object') return 'invalid_object';
  const item = input as Record<string, unknown>;
  if (typeof item.answer !== 'string' || !item.answer.trim() || item.answer.length > 10000) return 'invalid_answer_text';
  if (/https?:\/\//i.test(item.answer)) return 'url_in_answer';
  if (!Array.isArray(item.citations) || item.citations.length === 0) return 'missing_citations';
  if (item.citations.some(x => typeof x !== 'string' || !allowed.includes(x))) return 'unrecognized_citation';
  if (new Set(item.citations).size !== item.citations.length) return 'duplicate_citations';
  const markers=[...item.answer.matchAll(/\[(\d+)\]/g)].map(x=>Number(x[1]));
  if (!markers.length) return 'missing_markers';
  if (markers.some(n=>n < 1 || n > (item.citations as unknown[]).length)) return 'invalid_marker';
  return null;
}
export function validateAnswer(input: unknown, allowed: string[]): Answer | null {
  let item = input as Answer;
  // Deduplicate only valid supplied URLs, remapping markers so they retain their meaning.
  if (answerValidationIssue(input, allowed) === 'duplicate_citations') {
    const citations=[...new Set(item.citations)];
    const markers=[...item.answer.matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1]));
    if (markers.some(n=>n < 1 || n > item.citations.length)) return null;
    const original=item.citations;
    item={answer:item.answer.replace(/\[(\d+)\]/g,(_,n:string)=>`[${citations.indexOf(original[Number(n)-1])+1}]`),citations};
  }
  const issue=answerValidationIssue(item, allowed);
  // A sole approved citation can safely be attached to an otherwise unmarked answer.
  if (issue === 'missing_markers' && item.citations.length === 1) return {answer:`${item.answer.trim()} [1]`,citations:item.citations};
  if (issue) return null;
  return {answer:item.answer, citations:item.citations};
}
