export function renderStructuredAnswer(raw:unknown,sources:string[]) {
  if(!raw||typeof raw!=='object')throw new Error('Invalid structured answer');
  const value=raw as {statements?:unknown;unresolved?:unknown};
  if(!Array.isArray(value.statements)||!Array.isArray(value.unresolved)||value.statements.length>20)throw new Error('Invalid structured answer');
  const statements=value.statements as {text?:unknown;source_ids?:unknown}[];
  const used:number[]=[];
  for(const statement of statements) {
    if(typeof statement.text!=='string'||!statement.text.trim()||/https?:\/\/|\[\d+\]/.test(statement.text)||!Array.isArray(statement.source_ids)||!statement.source_ids.length)throw new Error('Invalid statement');
    for(const id of statement.source_ids){
      if(!Number.isInteger(id)||id<0||id>=sources.length)throw new Error('Invalid source reference');
      if(!used.includes(id))used.push(id);
    }
  }
  if(value.unresolved.some(text=>typeof text!=='string'||/https?:\/\/|\[\d+\]/.test(text)))throw new Error('Invalid unresolved question');
  const answer=statements.map(s=>String(s.text).trim()+' '+[...new Set(s.source_ids as number[])].map(id=>'['+(used.indexOf(id)+1)+']').join('')).join('\n');
  return JSON.stringify({answer:[answer,...value.unresolved].filter(Boolean).join('\n'),citations:used.map(id=>sources[id])});
}
