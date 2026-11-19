import register from '../../docs/submission/product-register.json' with {type:'json'};
export function legacyListing(category:string) {
  return register.categories.find(row=>row.category===category)?.listing_url;
}
