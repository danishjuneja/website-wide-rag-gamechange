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

test('distinguishes an inventory request from a fact request and a filter', () => {
 assert.equal(isFilteredDiscovery('Which commercial cards do you have?'),false);
 assert.equal(discoveryCategory('Which commercial cards do you have?'),'commercial cards');
 assert.equal(isFilteredDiscovery('Which business cards have lounge access?'),true);
 assert.equal(isDiscoveryRequest('Show me the annual fee for the Cedar credit card.'),false);
 assert.equal(discoveryCategory('List the trade finance products.'),'trade finance');
});
