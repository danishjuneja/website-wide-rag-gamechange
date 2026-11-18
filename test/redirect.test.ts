import {test} from 'node:test';import {strict as assert} from 'node:assert';import {safeRedirect} from '../src/ingest/redirect.ts';
test('only follows HTTPS redirects within the allowed origin',()=>{
 assert.equal(safeRedirect('https://bank.test/a','/b#x','https://bank.test'),'https://bank.test/b');
 assert.throws(()=>safeRedirect('https://bank.test/a','https://evil.test/b','https://bank.test'));
});
