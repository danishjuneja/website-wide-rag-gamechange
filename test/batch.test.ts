import {test} from 'node:test';import {strict as assert} from 'node:assert';import {batchDigest} from '../src/ingest/batch.ts';
test('batch approval fingerprint changes when text or model changes',()=>{
 const a=batchDigest('m',[{content:'a'}]);assert.equal(a,batchDigest('m',[{content:'a'}]));assert.notEqual(a,batchDigest('m',[{content:'b'}]));assert.notEqual(a,batchDigest('other',[{content:'a'}]));
});
