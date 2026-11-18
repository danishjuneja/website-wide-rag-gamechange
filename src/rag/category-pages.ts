import register from '../../docs/submission/product-register.json' with {type:'json'};
export function referencedCategoryName(question:string) {
  return question.match(/\b(?:the|your|its)\s+([a-z][a-z -]{1,50}?)\s+page\b/i)?.[1].trim() ?? null;
}

export function legacyListing(category:string) {
  return register.categories.find(row=>row.category===category)?.listing_url;
}
