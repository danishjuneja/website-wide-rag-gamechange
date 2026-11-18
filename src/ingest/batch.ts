import {createHash} from 'node:crypto';
export function batchDigest(model:string,rows:unknown[]):string{return createHash('sha256').update(JSON.stringify({model,rows})).digest('hex')}
