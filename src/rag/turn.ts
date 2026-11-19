import {linkProducts,type ProductIdentity} from './product-link.ts';
import { searchQueries, type Message } from './core.ts';

const normalized = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function resolveTurn(question: string, history: Message[], raw: unknown, catalogue:ProductIdentity[]=[]) {
  if (!raw || typeof raw !== 'object') return null;
  const plan = raw as Record<string, unknown>;
  if (plan.ambiguous !== false || typeof plan.query !== 'string' || !plan.query.trim() || plan.query.length > 1000) return null;
  if (!Array.isArray(plan.subjects) || plan.subjects.some(s => typeof s !== 'string' || !normalized(s))) return null;
  const messages = [...history.map(m => normalized(m.content)), normalized(question)];
  let primary = plan.query.trim();
  const products:ProductIdentity[]=[];
  for (const subject of plan.subjects as string[]) {
    const name = ' ' + normalized(subject) + ' ';

    const linked=linkProducts(subject,catalogue).filter(candidate=>candidate.confident);
    const contextual=linked.filter(candidate=>history.some(message=>linkProducts(message.content,catalogue).some(match=>match.confident&&match.product.source_url===candidate.product.source_url)));
    const literal=messages.some(m=>(' '+m+' ').includes(name));
    if(!literal&&!contextual.length)return null;
    if(!(' '+normalized(primary)+' ').includes(name))primary+='\nSubject: '+subject;
    products.push(...contextual.map(candidate=>candidate.product));

  }
  if (/\b(it|its|that one|that product|the former|the latter)\b/i.test(question) && !plan.subjects.length) return null;
  // Ground each product-specific search in a subject from the validated plan.
  const subjects = (plan.subjects as string[]).map(normalized);
  const productQueries = Array.isArray(plan.product_queries)
    ? plan.product_queries.filter((q): q is string =>
        typeof q === 'string' && subjects.some(name => (' ' + normalized(q) + ' ').includes(' ' + name + ' ')))
    : [];
  const latest = normalized(question);
  const previousUser = history.filter(message => message.role === 'user' && message.content !== question).at(-1);
  const singularReference = /\b(it|its|that one|that product)\b/i.test(question);
  const priorComparison = previousUser && /\b(compare|versus|vs|difference between)\b/i.test(previousUser.content);
  if (singularReference && priorComparison && !subjects.some(name => (' ' + latest + ' ').includes(' ' + name + ' '))) {
    return null;
  }
  return {primary, products:[...new Map(products.map(p=>[p.source_url,p])).values()], queries: searchQueries(primary, {product_queries:productQueries})};
}
