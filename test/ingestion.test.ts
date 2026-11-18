import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseSitemap } from '../src/ingest/sitemap.ts';
import { chunkBlocks } from '../src/ingest/chunk.ts';
import { extractPage } from '../src/ingest/extract.ts';

test('sitemap extracts metadata and deduplicates URLs', () => {
  const xml = '<urlset><url><loc>https://example.com/a?x=1&amp;y=2</loc><lastmod>2025-01-01</lastmod></url><url><loc>https://example.com/a?x=1&amp;y=2</loc></url></urlset>';
  assert.deepEqual(parseSitemap(xml), [{url:'https://example.com/a?x=1&y=2',lastModified:'2025-01-01'}]);
});
test('sitemap rejects unsafe or incomplete formats', () => {
  assert.throws(() => parseSitemap('<!DOCTYPE x><urlset></urlset>'));
  assert.throws(() => parseSitemap('<sitemapindex></sitemapindex>'));
  assert.throws(() => parseSitemap('<urlset><url><loc>https://example.com</loc></url>'));
});
test('chunking keeps different sections and structured blocks apart', () => {
  const result = chunkBlocks([
    {heading:['Card','Fees'],text:'Annual fee: AED 100.',kind:'paragraph'},
    {heading:['Card','Fees'],text:'Conditions apply.',kind:'paragraph'},
    {heading:['Card','Eligibility'],text:'Minimum salary: AED 5000.',kind:'paragraph'},
    {heading:['Card','Fees'],text:'Card | Fee\nA | AED 100',kind:'table'}
  ]);
  assert.equal(result.chunks.length, 3);
  assert.match(result.chunks[0].text, /Conditions apply/);
  assert.equal(result.chunks[2].kind, 'table');
});
test('oversized table is sent for review rather than split', () => {
  const result = chunkBlocks([{heading:['Fees'],text:'A'.repeat(30),kind:'table'}], 10);
  assert.equal(result.chunks.length, 0);
  assert.equal(result.review.length, 1);
});
test('long prose is split at sentence boundaries without losing conditions', () => {
  const block={heading:['Terms'],text:'First sentence. Second condition applies. Third sentence.',kind:'paragraph' as const};
  const result=chunkBlocks([block],35);
  assert.equal(result.review.length,0);
  assert.equal(result.chunks.map(c=>c.text).join(' ').replace(/\s+/g,' '),block.text);
});
test('extractor drops navigation, preserves headings and labels tables for review', () => {
  const html = '<title>Example</title><nav>Not product content</nav><main><h1>Example Card</h1><h2>Fees</h2><p>Terms apply.</p><table><tr><th>Type</th><th>Fee</th></tr><tr><td>Annual</td><td>AED 100</td></tr></table><a href="/terms.pdf">Terms</a></main>';
  const result = extractPage(html, 'https://example.com/card');
  assert.equal(result.title, 'Example');
  assert.equal(result.blocks.length, 2);
  assert.deepEqual(result.blocks[1].heading, ['Example Card','Fees']);
  assert.match(result.blocks[1].text, /Annual \| AED 100/);
  assert.deepEqual(result.links, ['https://example.com/terms.pdf']);
});
test('customer testimonial sections are not collected', () => {
 const html='<main><h1>Account</h1><h2>What our customers are saying</h2><p>Customer quote by Person</p><h2>Eligibility</h2><p>Age 21 or above.</p></main>';
 const result=extractPage(html,'https://example.com');
 assert.deepEqual(result.blocks.map(b=>b.text),['Age 21 or above.']);
});
test('email addresses are removed from extracted content',()=>{
 const result=extractPage('<main><h1>Help</h1><p>Email person@example.com for help.</p></main>','https://example.com');
 assert.doesNotMatch(result.blocks[0].text,/person@example\.com/);
});
test('extracts direct product fact divs and discards the site footer',()=>{
 const html='<main><h1>Card</h1><div class="cards-slider__info-title">Joining fees:  100<br>Annual fees:  50</div><div class="footer-main"><p>Bank securely anytime and from anywhere</p></div></main>';
 const result=extractPage(html,'https://www.emiratesnbd.com/en/card');
 assert.equal(result.blocks.length,1);
 assert.match(result.blocks[0].text,/Joining fees: AED 100/);
 assert.match(result.blocks[0].text,/Annual fees: AED 50/);
});
test('preserves text separation at line breaks in paragraphs',()=>{
 const result=extractPage('<main><h1>Card</h1><p>Joining fee: 100<br>Annual fee: 50</p></main>','https://www.emiratesnbd.com/en/card');
 assert.equal(result.blocks[0].text,'Joining fee: 100 Annual fee: 50');
});
