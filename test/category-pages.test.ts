import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {referencedCategoryName} from '../src/rag/category-pages.ts';
test('only resolves an explicitly named catalogue page',()=>{
 assert.equal(referencedCategoryName('Does the corporate financing page describe collateral?'),'corporate financing');
 assert.equal(referencedCategoryName('Which corporate financing products do you offer?'),null);
 assert.equal(referencedCategoryName('Does your unrelated page discuss this?'),'unrelated');
});
