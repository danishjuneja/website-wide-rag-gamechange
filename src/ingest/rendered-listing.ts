import * as cheerio from 'cheerio';

export function extractRenderedCards(html:string, listingUrl:string) {
  const $=cheerio.load(html);
  const listing=new URL(listingUrl);
  const directory=listing.pathname.replace(/\/$/,'')+'/';
  if(listing.origin!=='https://www.emiratesnbd.com' || !/^\/en\/cards\/[\w-]+\/$/.test(directory)) throw new Error('Expected an official card listing URL');
  const products:{name:string;url:string;status:'unknown'}[]=[];
  const seen=new Set<string>();
  $('#card-listing > div').each((_,element)=>{
    const item=$(element);
    const name=item.find('h3').first().text().replace(/\s+/g,' ').trim();
    if(!name) return;
    for(const link of item.find('a[href]').toArray()) {
      const href=$(link).attr('href');
      if(!href || !URL.canParse(href,listing)) continue;
      const url=new URL(href,listing);
      if(url.origin!==listing.origin || !url.pathname.startsWith(directory) || !url.pathname.slice(directory.length).replace(/\/$/,'') || url.username || url.password) continue;
      const canonical=url.origin+url.pathname.replace(/\/$/,'');
      if(!seen.has(canonical)) products.push({name,url:canonical,status:'unknown'});
      seen.add(canonical);
      break;
    }
  });
  return {listingUrl,products,reconciled:false};
}
