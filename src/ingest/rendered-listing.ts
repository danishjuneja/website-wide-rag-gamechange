import * as cheerio from 'cheerio';
export function extractRenderedCards(html:string,listingUrl:string) {
 const $=cheerio.load(html);const products:{name:string;url:string;status:'unknown'}[]=[];
 $('#card-listing > div').each((_,element)=>{
  const item=$(element), name=item.find('h3').first().text().replace(/\s+/g,' ').trim(),href=item.find('a[href]').first().attr('href');
  if(!name||!href)return;try {const url=new URL(href,listingUrl);if(url.origin==='https://www.emiratesnbd.com' && url.pathname.startsWith('/en/cards/credit-cards/'))products.push({name,url:url.toString(),status:'unknown'})}catch{}
 });
 return {listingUrl,products,reconciled:false};
}
