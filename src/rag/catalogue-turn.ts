import {hasSourceMarkup} from './excerpts.ts';
type CatalogueItem = {name:string; source_url:string};
type HistoryMessage = {role:'user'|'assistant'; content:string};
const tokens = (s:string): string[] => s.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const generic = new Set('the by for of with and in a an emirates nbd bank banking account accounts credit debit prepaid card cards visa mastercard loan loans deposit deposits fund funds investment investments product products uae'.split(' '));
const referential = /\b(?:it|its|that one|this one|that product|the former|the latter)|^\s*(?:please\s+)?(?:tell me more|more details|what (?:are|is) (?:the )?(?:benefits|annual fee|eligibility|minimum salary)|how (?:much|do I apply))\b\b/i;
const comparison = /\b(?:compare|versus|vs|difference between)\b/i;

export function catalogueTurn(history:HistoryMessage[], catalogue:CatalogueItem[]) {
  const questions=history.filter(m=>m.role==='user').map(m=>m.content);
  const latest=questions.at(-1);
  if(!latest) return null;
  const entries=catalogue.map(p=>({item:p, terms:tokens(p.name).filter(t=>!generic.has(t))})).filter(e=>e.terms.length);
  function identify(question:string) {
    const text=' '+tokens(question).join(' ')+' ';
    const matches=entries.filter(e=>(e.terms.length>1 || tokens(e.item.name).length>1) && (text.includes(' '+tokens(e.item.name).join(' ')+' ') || text.includes(' '+e.terms.join(' ')+' ')));
    function specificity(e:typeof entries[number]) {
      const name=tokens(e.item.name);
      for(let n=name.length;n>0;n--) if(text.includes(' '+name.slice(0,n).join(' ')+' ')) return n;
      return e.terms.length;
    }
    const position=(entry:typeof entries[number])=>Math.min(...[tokens(entry.item.name),entry.terms].map(words=>text.indexOf(' '+words.join(' ')+' ')).filter(index=>index>=0));
    return matches.filter(e=>!matches.some(other=>other!==e &&
      (' '+other.terms.join(' ')+' ').includes(' '+e.terms.join(' ')+' ') &&
      (other.terms.length>e.terms.length || specificity(other)>specificity(e)))).sort((a,b)=>position(a)-position(b));

  }
  let selected=identify(latest);
  if((!selected.length || selected.length>1 && !comparison.test(latest)) && questions.length>1) {
    // "The premium one" may select one of the previously named products.
    let previous:typeof entries=[];
    for(const q of questions.slice(0,-1).reverse()) {
      previous=identify(q);
      if(previous.length) break;
      if(!referential.test(q) && !/^the\b/i.test(q)) return null;
    }
    const words=tokens(latest);
    const narrowed=previous.filter(e=>e.terms.some(t=>words.includes(t)));
    const ordinal=latest.match(/\b(?:the )?(former|latter)\b/i);
    if(ordinal && previous.length===2) selected=[previous[ordinal[1].toLowerCase()==='former'?0:1]];
    else if(narrowed.length===1) selected=narrowed;
    else if(referential.test(latest) && previous.length===1 && !/\b(?:switch|instead|another|different)\b/i.test(latest)) selected=previous;
    else if(referential.test(latest) && previous.length>1) return {ambiguous:true as const};
  }
  if(!selected.length || selected.length>1 && !comparison.test(latest)) return null;
  const names=selected.map(e=>e.item.name);
  const primary=latest+'\nProduct'+(names.length>1?'s':'')+': '+names.join(' and ');
  const subjectTerms = new Set(selected.flatMap(e=>tokens(e.item.name)));
  const focus = tokens(latest).filter(t=>!subjectTerms.has(t) && !['compare','versus','vs','and','between','for','the','difference'].includes(t)).join(' ');
  return {ambiguous:false as const,primary,products:selected.map(e=>e.item),queries:[primary,...(names.length>1?names.map(name=>name+' '+focus):[])].slice(0,4)};
}

type SourcePassage={id:number;source_url:string;content:string};
const normalizeTerm=(word:string)=>word.endsWith('ies')?word.slice(0,-3)+'y':word.length>4 && word.endsWith('s')?word.slice(0,-1):word;
export function productPassages<T extends SourcePassage>(question:string, urls:string[], rows:T[]):T[] {
  const stop=new Set('what which how can does the this that compare between many when where and for from before about its make have much switching each month will with versus'.split(' '));
  const terms=new Set(tokens(question).map(normalizeTerm).filter(t=>t.length>2 && !generic.has(t) && !stop.has(t)));
  return urls.flatMap(url=>{
    const ranked=rows.filter(r=>r.source_url===url).map(row=>{
    const text=new Set(tokens(row.content).map(normalizeTerm));
    const score=[...terms].filter(t=>text.has(t)).length;
    const qualification=score>0 && /\b(?:waiv\w*|unless|except(?:ion)?|instead|replace[sd]?|subject to|provided that)\b/i.test(row.content);
    return {row,score,qualification};
  }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score || a.row.content.length-b.row.content.length);
    return [...new Set([...ranked.slice(0,3),...ranked.filter(r=>r.qualification).slice(0,2)].map(r=>r.row))];
  });
}

// Answer a single named field from complete product-page extracts when each page
// supplies one unambiguous labelled value. Leave qualified and compound requests to verification.
export function compareLabelledFacts(question:string, products:CatalogueItem[], rows:SourcePassage[]) {
  if(products.length<2 || products.length>4 || new Set(products.map(p=>p.source_url)).size!==products.length || !comparison.test(question)) return null;
  const names=new Set(products.flatMap(p=>tokens(p.name)));
  const syntax=new Set('compare comparison between versus vs difference differences the their for and of on in what is are to me please'.split(' '));
  const focus=tokens(question).filter(t=>!names.has(t)&&!generic.has(t)&&!syntax.has(t)).map(normalizeTerm).join(' ');
  if(!focus || /\b(?:fee|charge|price|rate|cost|premium)\b/.test(focus)) return null;
  const excerpts:string[]=[];
  for(const product of products) {
    const values=new Set<string>();
    for(const row of rows.filter(r=>r.source_url===product.source_url)) {
      for(const line of row.content.split(/\n\s*\n/)) {
        const normalized=tokens(line).map(normalizeTerm);
        const pair=/^([^:\n]{2,60}):\s*([^:\n]{1,120})$/.exec(line.trim());
        if(pair && tokens(pair[1]).map(normalizeTerm).join(' ')===focus) {
          if(hasSourceMarkup(line)) return null;
          values.add(line.trim());
        } else if(normalized.includes(focus.split(' ').at(-1)!) || /\b(?:waiv\w*|unless|except\w*|instead|replac\w*|subject to|provided that)\b/i.test(line)) {
          return null;
        }
      }
    }
    if(values.size!==1) return null;
    excerpts.push(product.name+' — '+[...values][0]+' ['+(excerpts.length+1)+']');
  }
  return {answer:excerpts.join('\n'), citations:products.map(p=>p.source_url)};
}
