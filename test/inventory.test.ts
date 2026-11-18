import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {discoveryCategory,formatProducts,isDiscoveryRequest,isFilteredDiscovery} from '../src/rag/inventory.ts';
test('recognizes a category discovery request',()=>assert.equal(discoveryCategory('Which credit cards do you offer?'),'credit cards'));
test('broad product lists are treated as discovery rather than free-form answers',()=>assert.equal(isDiscoveryRequest('What types of accounts are available?'),true));
test('a product fact question does not trigger product discovery',()=>assert.equal(isDiscoveryRequest('What is the minimum balance for a savings account?'),false));
test('filtered discovery does not silently return the entire category',()=>assert.equal(isFilteredDiscovery('Which credit cards have no annual fee?'),true));
test('separates unknown status and warns when category is incomplete',()=>{
 const r=formatProducts('credit cards',[{name:'Card A',status:'active',source_url:'https://bank.test/a'},{name:'Card B',status:'unknown',source_url:'https://bank.test/b'}],false)!;
 assert.match(r.answer,/Availability unconfirmed/); assert.match(r.answer,/may be incomplete/); assert.equal(r.citations.length,2);
});
