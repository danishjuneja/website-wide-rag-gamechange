import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {qualifiedField} from '../src/rag/qualified-field.ts';
test('quotes a period-specific field together with its replacement condition',()=>{
 const rows=[{source_url:'a',content:'Service charges: EUR 80 (3rd year onwards)\n\nA member who enrols in the Plus plan pays a monthly amount instead of the service charge.'}];
 const result=qualifiedField('What is the charge from the third year?',rows);
 assert.match(result?.answer||'',/EUR 80/);assert.match(result?.answer||'',/instead of/);
 assert.equal(qualifiedField('What is the charge from year one?',rows),null);
 assert.equal(qualifiedField('What is the charge from the third year?',[...rows,{source_url:'b',content:'Other plan'}]),null);
});

test('flags a conflicting reference amount in the waiver wording',()=>{
 const rows=[{source_url:'a',content:'Service charges: EUR 80 (2nd year)\n\nThe service charge of EUR 75 is waived for enrolled members.'}];
 assert.match(qualifiedField('What is the service charge from the second year?',rows)?.answer||'',/different amounts/);
});

test('a different field modifier cannot match by its generic noun',()=>{
 const rows=[{source_url:'a',content:'Annual fees: EUR 80 (2nd year)\n\nThe annual fee of EUR 80 is waived for members.'}];
 assert.equal(qualifiedField('What is the monthly fee from the second year?',rows),null);
});
