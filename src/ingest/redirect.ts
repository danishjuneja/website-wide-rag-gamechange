export function safeRedirect(current:string,location:string,allowedOrigin:string):string {
 const next=new URL(location,current);
 if(next.origin!==allowedOrigin || next.protocol!=='https:') throw new Error('Redirect leaves the allowed origin');
 next.hash='';return next.toString();
}
