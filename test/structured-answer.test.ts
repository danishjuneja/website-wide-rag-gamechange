import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {renderStructuredAnswer} from '../src/rag/structured-answer.ts';
test('maps source IDs to ordered citation markers without model-written URLs',()=>{
 const result=JSON.parse(renderStructuredAnswer({statements:[{text:'A fact.',source_ids:[1]},{text:'Another fact.',source_ids:[0,1]}],unresolved:['The remaining condition is not established.']},['a','b']));
 assert.deepEqual(result.citations,['b','a']);assert.match(result.answer,/A fact. \[1\]/);
 assert.match(result.answer,/Another fact. \[2\]\[1\]/);
 assert.throws(()=>renderStructuredAnswer({statements:[{text:'Bad reference',source_ids:[2]}],unresolved:[]},['a']));
 assert.throws(()=>renderStructuredAnswer({statements:[{text:'https://bad.test',source_ids:[0]}],unresolved:[]},['a']));
});
