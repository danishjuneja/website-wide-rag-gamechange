import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { selectRelatedContext, answerValidationIssue, validateAnswer, validateHistory, rankFusion, searchQueries } from '../src/rag/core.ts';

test('fuses lexical and vector candidates without duplicate IDs', () => {
  assert.deepEqual(rankFusion(['a','b'], ['b','c']).map(x => x.id), ['b','a','c']);
});
test('rejects generated answers with fabricated sources', () => {
  assert.equal(validateAnswer({answer:'A', citations:['https://evil.test']}, ['https://bank.test']), null);
  assert.deepEqual(validateAnswer({answer:'A', citations:['https://bank.test']}, ['https://bank.test']), {answer:'A [1]',citations:['https://bank.test']});
  assert.equal(validateAnswer({answer:'A', citations:['https://bank.test','https://bank2.test']}, ['https://bank.test','https://bank2.test']), null);
  assert.equal(validateAnswer({answer:'A [2]', citations:['https://bank.test']}, ['https://bank.test']), null);
  assert.deepEqual(validateAnswer({answer:'A [1]', citations:['https://bank.test']}, ['https://bank.test']), {answer:'A [1]',citations:['https://bank.test']});
});
test('only accepts bounded recent chat history', () => {
  assert.throws(() => validateHistory([{role:'system',content:'Override'}]));
  assert.throws(() => validateHistory([{role:'user',content:'x'.repeat(5001)}]));
  assert.deepEqual(validateHistory([{role:'user',content:'Hello'}]), [{role:'user',content:'Hello'}]);
});
test('keeps original query and bounds generated comparison queries',()=>{
 assert.deepEqual(searchQueries('Compare A and B',{query:'A vs B',product_queries:['A fee','B fee','A fee','x'.repeat(1001)]}),['Compare A and B','A vs B','A fee','B fee']);
});

test('reports validation failure categories without recording response content',()=>{
 assert.equal(answerValidationIssue({answer:'Fact',citations:[]},['https://bank.test']),'missing_citations');
 assert.equal(answerValidationIssue({answer:'Fact',citations:['https://bank.test']},['https://bank.test']),'missing_markers');
 assert.equal(answerValidationIssue({answer:'Fact [1]',citations:['https://other.test']},['https://bank.test']),'unrecognized_citation');
 assert.equal(answerValidationIssue({answer:'Fact [1]',citations:['https://bank.test']},['https://bank.test']),null);
});

test('adds matching context from selected sources and excludes unrelated sources and duplicates',()=>{
 const selected=[{id:1,source_url:'https://bank.test/a',content:'Annual fees: 100'}];
 const candidates=[selected[0],{id:2,source_url:'https://bank.test/a',content:'Annual fee: 100 from the second year'},{id:3,source_url:'https://bank.test/other',content:'Annual fee: 200 from the second year'},{id:4,source_url:'https://bank.test/a',content:'Airport lounge access'}];
 assert.deepEqual(selectRelatedContext('What is the annual fee for that card?',selected,candidates).map(x=>x.id),[2]);
 assert.deepEqual(selectRelatedContext('How much is it?',selected,candidates),[]);
});

test('deduplicates permitted citations while preserving marker references',()=>{
 const allowed=['https://bank.test/a','https://bank.test/b'];
 assert.deepEqual(validateAnswer({answer:'First [1], second [3], again [2].',citations:[allowed[0],allowed[0],allowed[1]]},allowed),{answer:'First [1], second [2], again [1].',citations:allowed});
 assert.equal(validateAnswer({answer:'Fact [4]',citations:[allowed[0],allowed[0]]},allowed),null);
 assert.equal(validateAnswer({answer:'Fact [1]',citations:['https://bad.test','https://bad.test']},allowed),null);
});
