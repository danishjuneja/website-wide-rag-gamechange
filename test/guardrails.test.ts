import {test} from 'node:test';import {strict as assert} from 'node:assert';import {requiresAccountAction} from '../src/rag/guardrails.ts';
test('detects explicit requests for account actions without blocking general information',()=>{
 assert.equal(requiresAccountAction('Transfer money for me'),true);
 assert.equal(requiresAccountAction('Check my account balance'),true);
 assert.equal(requiresAccountAction('How do I transfer money?'),false);
});

import {isUnrelatedRequest} from '../src/rag/guardrails.ts';
test('declines a sports result while keeping sports benefits and multipart requests in scope',()=>{
 assert.equal(isUnrelatedRequest('Who won the match?'),true);
 assert.equal(isUnrelatedRequest('Which card includes golf benefits?'),false);
 assert.equal(isUnrelatedRequest('Who won the match and does my card have ticket discounts?'),false);
});
import {separatePersonalDecision} from '../src/rag/guardrails.ts';
test('separates individual credit decisions from a public fact',()=>{
 assert.equal(separatePersonalDecision('What is the minimum salary for Card X and what exact credit limit will I personally receive?')?.publicQuestion,'What is the minimum salary for Card X');
 assert.equal(separatePersonalDecision('How can I view my credit limit?'),null);
});

test('separates an exact personal limit without repeating credit',()=>assert.equal(separatePersonalDecision('What is the minimum salary for Skywards Signature and what exact limit will I personally get?')?.publicQuestion,'What is the minimum salary for Skywards Signature'));

test('allows requests to show public facts and distinguishes a personal prediction from published terms',()=>{
 assert.equal(requiresAccountAction('Show me the annual fee for a Cedar credit card.'),false);
 assert.equal(requiresAccountAction('Show me my card balance.'),true);
 assert.equal(separatePersonalDecision('Can you predict my earnings next year?')?.publicQuestion,'');
 assert.equal(separatePersonalDecision('Does the contract guarantee my return?'),null);
});
