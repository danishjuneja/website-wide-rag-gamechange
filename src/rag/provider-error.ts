export class ProviderError extends Error {
  readonly provider:string;
  readonly status:number;
  readonly code:string|undefined;
  readonly retryAfter:number|undefined;
  constructor(provider:string,status:number,code:string|undefined,retryAfter:number|undefined) {
    super('Provider request failed');
    this.provider=provider;
    this.status=status;
    this.code=code;
    this.retryAfter=retryAfter;
  }
}
export function providerResponse(error:ProviderError) {
  if(error.status===429) return {status:429,code:'provider_rate_limit',error:'The answer service has reached its usage limit. Please try again'+(error.retryAfter?' in '+error.retryAfter+' seconds.':' shortly.'),retryAfter:error.retryAfter};
  if(error.status===408 || error.status===504) return {status:504,code:'provider_timeout',error:'The answer service took too long to respond. Please try again.'};
  return {status:502,code:'provider_failure',error:'The answer service could not complete this response. Please try again.'};
}
