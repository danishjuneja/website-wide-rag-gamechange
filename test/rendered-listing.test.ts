import {test} from 'node:test';import {strict as assert} from 'node:assert';import {extractRenderedCards} from '../src/ingest/rendered-listing.ts';
test('extracts product evidence from rendered card listing without claiming completeness',()=>{
 const html='<div id="card-listing"><div><h3>Example Card</h3><a href="/en/cards/credit-cards/example">Know more</a></div></div>';
 const result=extractRenderedCards(html,'https://www.emiratesnbd.com/en/cards/credit-cards');
 assert.deepEqual(result.products,[{name:'Example Card',url:'https://www.emiratesnbd.com/en/cards/credit-cards/example',status:'unknown'}]);
 assert.equal(result.reconciled,false);
});
