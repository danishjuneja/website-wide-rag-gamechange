export async function readLimited(response:Response, maxBytes:number):Promise<Uint8Array> {
  const declared=Number(response.headers.get('content-length')||0);
  if(declared>maxBytes)throw new Error('Response exceeds size limit');
  if(!response.body) return new Uint8Array();
  const reader=response.body.getReader(); const parts:Uint8Array[]=[]; let total=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxBytes){await reader.cancel();throw new Error('Response exceeds size limit')}parts.push(value)}}finally{reader.releaseLock()}
  const joined=new Uint8Array(total);let offset=0;for(const part of parts){joined.set(part,offset);offset+=part.byteLength}return joined;
}
