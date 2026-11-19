export type Passage={id:number;source_url:string;title:string;section:string;content:string};
export type RankedPassage={index:number;relevance_score:number};
export function passageText(passage:{title?:string;section?:string;content:string}) {
  return [passage.title,passage.section,passage.content].filter(Boolean).join('\n\n');
}
const terms=(text:string):string[]=>text.toLowerCase().match(/[a-z0-9]+/g)||[];
const stop=new Set('a an the is are how what which when where for of to in on and or me my more tell about please product products card cards account accounts loan loans'.split(' '));
export function pageCandidates(question:string,products:{name:string;source_url:string}[],rows:Passage[]) {
  const names=new Set(products.flatMap(p=>terms(p.name)));
  const focus=[...new Set(terms(question).filter(t=>!stop.has(t)&&!names.has(t)))];
  const documents=rows.map(row=>({row,words:terms(row.content+' '+row.section)}));
  const average=documents.reduce((sum,d)=>sum+d.words.length,0)/Math.max(1,documents.length);
  const frequencies=new Map(focus.map(term=>[term,documents.filter(d=>d.words.includes(term)).length]));
  const ranked=documents.map(({row,words})=>{
    const score=focus.reduce((sum,term)=>{
      const count=words.filter(word=>word===term).length;
      const idf=Math.log(1+(documents.length-(frequencies.get(term)||0)+0.5)/((frequencies.get(term)||0)+0.5));
      return sum+idf*(count*2.2)/(count+1.2*(0.25+0.75*words.length/Math.max(1,average)));
    },0);
    return {row,score};
  });
  return products.flatMap(product=>{
    const page=ranked.filter(r=>r.row.source_url===product.source_url);
    // Introductory blocks retain overview candidates even for a terse selection.
    return [...new Map([...page.slice(0,3),...page.sort((a,b)=>b.score-a.score).slice(0,13)].map(p=>[p.row.id,p.row])).values()];
  });
}
export function selectEvidence(ranking:RankedPassage[],candidates:Passage[],productUrls:string[],maxCharacters=12000,contextRows:Passage[]=candidates) {
  const ranked=ranking.filter(r=>Number.isFinite(r.relevance_score)&&r.relevance_score>0).map(r=>candidates[r.index]).filter(Boolean);
  const selected:Passage[]=[];let size=0;
  const add=(row:Passage)=>{
    if(selected.some(r=>r.id===row.id)||size+row.content.length>maxCharacters||selected.length>=10)return;
    selected.push(row);size+=row.content.length;
  };
  for(const url of productUrls){
    const row=ranked.find(r=>r.source_url===url);
    if(row)add(row);
  }
  for(const row of ranked){if(selected.length>=8)break;add(row)}
  // Adjacent source context carries nearby definitions and qualifications.
  for(const row of [...selected]){
    const page=contextRows.filter(p=>p.source_url===row.source_url).sort((a,b)=>a.id-b.id);
    const at=page.findIndex(p=>p.id===row.id);
    const neighbours=[page[at-1],page[at+1]].filter((p):p is Passage=>!!p && (p.section===row.section || p.section.startsWith(row.section+' > ') || row.section.startsWith(p.section+' > ')));
    for(const neighbour of neighbours)add(neighbour);
  }
  return selected;
}
