export function retryDelay(value:string|null,now=Date.now()):number {
 if(!value)return 10000;
 if(/^\d+$/.test(value.trim()))return Math.max(1000,Number(value.trim())*1000);
 const timestamp=Date.parse(value);return Number.isFinite(timestamp)?Math.max(1000,timestamp-now):10000;
}
