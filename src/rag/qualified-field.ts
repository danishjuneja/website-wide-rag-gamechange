import {hasSourceMarkup} from './excerpts.ts';
type PageRow={source_url:string;content:string};
const stem=(text:string)=>text.toLowerCase().replace(/\b(first|second|third|fourth|fifth)\b/g,(_,word:string)=>({first:'1',second:'2',third:'3',fourth:'4',fifth:'5'}[word]!)).replace(/\b(\d+)(?:st|nd|rd|th)\b/g,'$1').replace(/\b([a-z]{3,})s\b/g,'$1').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const clause=/\b(?:waiv\w*|replac\w*|unless|alternatively|exempt\w*|instead of)\b/i;

// Keep the source's time-qualified label together with any replacement or waiver
// stated on that same page. Do not calculate a price when excerpts disagree.
export function qualifiedField(question:string,rows:PageRow[]) {
 const urls=new Set(rows.map(r=>r.source_url));
 if(urls.size!==1 || /\b(?:compare|versus|and|or|if|without|why|difference)\b/i.test(question))return null;
 const query=' '+stem(question)+' ';
 const period=query.match(/\b\d+ (?:year|month|day|week)\b/)?.[0];
 if(!period)return null;
 const paragraphs=[...new Set(rows.flatMap(r=>r.content.split(/\n\s*\n/)).map(s=>s.trim()).filter(Boolean))];
 const request=stem(question.split(/[.!]/).filter(s=>s.trim()).at(-1)||question).replace(period,' ');
 const syntax=new Set('what which is are the my its that this from in for of on during starting onwards onward after how much will it cost be me tell please'.split(' '));
 const requestedTerms=request.split(' ').filter(t=>t && !syntax.has(t));
 if(!requestedTerms.length)return null;
 const fields=paragraphs.filter(s=>s.length<=180&&!s.includes('\n')).flatMap(line=>{
  const match=/^([\p{L} ]{3,45}):\s*([^:]+)$/u.exec(line);
  if(!match || !(' '+stem(match[2])+' ').includes(' '+period+' '))return [];
  const label=stem(match[1]);return requestedTerms.every(term=>label.split(' ').includes(term))?[{line,label}]:[];
 });
 if(fields.length!==1 || hasSourceMarkup(fields[0].line))return null;
 const field=fields[0];
 const related=paragraphs.filter(p=>clause.test(p)&&(' '+stem(p)+' ').includes(' '+field.label+' '));
 if(!related.length || related.length>3 || related.some(p=>p.length>1000||/https?:\/\/|\[\d+\]|\|/.test(p)))return null;
 const amount=/\b([A-Z]{3})\s*([\d,]+(?:\.\d+)?)\b/;
 const listed=field.line.match(amount);
 const differs=listed && related.some(paragraph=>paragraph.split(/[.!?]\s+/).some(sentence=>{
   const labelPattern=field.label.split(' ').map(word=>word+'s?').join('\\s+');
   const quoted=new RegExp('\\b'+labelPattern+'\\s+(?:of\\s+|is\\s+)?([A-Z]{3})\\s*([\\d,]+(?:\\.\\d+)?)\\b','i').exec(sentence);
   return quoted && quoted[1].toLowerCase()===listed[1].toLowerCase() && Number(quoted[2].replace(/,/g,''))!==Number(listed[2].replace(/,/g,''));

 }));
 const note=differs?'\nThe page gives different amounts for the same field. Please confirm the applicable amount with the bank.':'';
 return {answer:'The product page lists the following amount and conditions:\n'+[field.line,...related].map(p=>'• '+p+' [1]').join('\n')+note,citations:[...urls]};
}
