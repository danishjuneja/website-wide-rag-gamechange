export const hasSourceMarkup=(text:string)=>/https?:\/\/|\[\d+\]/i.test(text);
type Passage = {source_url:string; content:string; title?:string; section?:string};
const words = (s:string) => s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const roots = (s:string) => words(s).split(' ').map(w=>/^(pay|paid|pays|paying|payout|payments?)$/.test(w)?'pay':w.replace(/s$/,'')).join(' ');
const phrase = (text:string, label:string) => (' '+text+' ').includes(' '+label+' ');

// Quote complete labelled paragraphs from one identifiable page. Never combine values across products.
export function sourceExcerpts(question:string, evidence:Passage[], latestQuestion = question) {
  const query=words(question);
  const focus=words(latestQuestion);
  if (/\b(compare|versus|difference|cheaper|higher|lower|not|except|waived|without)\b/.test(focus) || /\b(compare|versus|difference)\b/.test(query)) return null;
  const pages=new Set<string>();
  for(const row of evidence){
    const names=[row.title?.split('|')[0],row.section?.split(' > ')[0],new URL(row.source_url).pathname.split('/').filter(Boolean).at(-1)];
    if(names.some(name=>name && words(name).length>=3 && phrase(query,words(name)))) pages.add(row.source_url);
  }
  if(pages.size!==1) return null;
  const [url]=pages;
  const facts=new Map<string,Set<string>>();
  for(const row of evidence.filter(p=>p.source_url===url)){
    for(const paragraph of row.content.split(/\n\s*\n/)){
      const line=paragraph.trim();
      const match=/^([^:\n]{2,64}):\s*(\S[\s\S]*)$/.exec(line);
      if(!match || line.length>350 || hasSourceMarkup(line)) continue;
      const label=words(match[1]).replace(/s$/,'');
      if(!label || !(phrase(focus,label)||phrase(focus,label+'s'))) continue;
      const values=facts.get(label) ?? new Set<string>();
      values.add(line);
      facts.set(label,values);
    }
  }
  const excerpts:string[]=[];
  for(const values of facts.values()){
    const detailed=[...values].filter(v=>![...values].some(other=>other.startsWith(v+' (')));
    if(detailed.length!==1) return null;
    excerpts.push(detailed[0]);
  }
  if (!excerpts.length) {
    // Preserve the complete paragraph including nearby limits and exceptions.
    const ignored=new Set('what which when where does will have this that with from before could would about tell page mention give some more please many each month information product account deposit loan card switching'.split(' '));
    const pageNames=evidence.filter(p=>p.source_url===url).flatMap(p=>[p.title?.split('|')[0]||'',p.section?.split(' > ')[0]||'']);
    const names=new Set(words(pageNames.join(' ')+' '+new URL(url).pathname).split(' '));
    const terms=[...new Set(focus.split(' ').filter(t=>t.length>=4 && !ignored.has(t) && !names.has(t)).map(roots))];
    const paragraphs=[...new Set(evidence.filter(p=>p.source_url===url).flatMap(p=>p.content.split(/\n\s*\n/)).map(s=>s.trim()))];
    const ranked=paragraphs.filter(s=>s.length>=20 && s.length<=420 && !/https?:\/\/|\[\d+\]|\|/i.test(s)).map(s=>{
      const content=roots(s);
      return {s,score:terms.filter(t=>phrase(content,t)).length};
    }).filter(x=>x.score>=2).sort((a,b)=>b.score-a.score);
    if(ranked.length && (!ranked[1] || ranked[0].score>ranked[1].score)) excerpts.push(ranked[0].s);
  }
  if(!excerpts.length || excerpts.length>5) return null;
  return {answer:'The product page states:\n'+excerpts.map(s=>'• '+s+' [1]').join('\n')+'\nI could verify only the quoted details. Additional conditions may apply.',citations:[url]};
}
