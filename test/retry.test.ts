import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {retryDelay} from '../src/ingest/retry.ts';
test('honors seconds and HTTP-date retry-after values',()=>{
 assert.equal(retryDelay('120',0),120000);
 assert.equal(retryDelay('Thu, 01 Jan 1970 00:02:00 GMT',0),120000);
 assert.equal(retryDelay(null,0),10000);
});
