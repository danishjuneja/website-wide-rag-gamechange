import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readLimited} from '../src/ingest/body.ts';
test('reads a small response and rejects an oversized body',async()=>{
 assert.equal(new TextDecoder().decode(await readLimited(new Response('small'),5)),'small');
 await assert.rejects(()=>readLimited(new Response('too long'),3),/size limit/);
});
