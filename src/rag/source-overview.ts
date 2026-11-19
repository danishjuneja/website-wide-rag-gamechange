type Product={name:string;source_url:string};
type Passage={source_url:string;content:string;section:string};

// Quote complete introductory blocks from the resolved product page.
export function sourceOverview(question:string,product:Product,passages:Passage[],previousAnswers:string[] = []) {
  const request=question.toLowerCase().replace(product.name.toLowerCase(),'').trim().replace(/[?.!]+$/,'');
  const bare=question.toLowerCase().replace(/[?.!]+$/,'').trim()===product.name.toLowerCase();
  if(!bare && !/^(?:(?:please )?(?:tell me (?:more )?about|tell me more|give me (?:an? )?(?:overview|summary) of|describe|more details(?: about)?))(?:\s|$)/i.test(request)) return null;
  const words=(text:string)=>text.toLowerCase().match(/[a-z0-9]+/g)||[];
  const remainder=request.replace(/^(?:please )?(?:tell me (?:more )?about|tell me more|give me (?:an? )?(?:overview|summary) of|describe|more details(?: about)?)/i,'');
  const permitted=new Set([...words(product.name),'it','this','that','the','one','product']);
  if(!bare && words(remainder).some(word=>!permitted.has(word))) return null;
  const specifics=/\b(?:fees?|charges?|costs?|rates?|eligib\w*|salary|requirements?|documents?|compare|versus|without|except|waiv\w*|withdraw\w*|limits?)\b/i;
  if(specifics.test(request)) return null;
  const paragraphs=passages.filter(p=>p.source_url===product.source_url &&
    !/\b(?:documents?|required|faq|apply|contact|terms|insurance|shield)\b/i.test(p.section))
    .map(p=>p.content.trim()).filter(text=>/^[\p{L}]/u.test(text) && text.length>=35 && text.length<=700 &&
      !/https?:\/\/|\[\d+\]|\|/.test(text));
  const chosen=[...new Set(paragraphs)].filter(text=>!previousAnswers.some(answer=>answer.includes(text))).slice(0,3);
  if(!chosen.length)return null;
  return {answer:product.name+'\nFrom the product page:\n'+chosen.map(p=>'“'+p+'” [1]').join('\n\n')+
    '\nWhich feature would you like to know more about?',citations:[product.source_url]};
}
