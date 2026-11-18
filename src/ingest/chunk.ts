export type Block = { heading: string[]; text: string; kind: 'paragraph' | 'list' | 'faq' | 'table' };
type Chunk = { heading: string[]; text: string; kind: Block['kind'] };

// Keep structured blocks intact. An overlong table or FAQ is flagged for review,
// not split into potentially misleading fragments.
export function chunkBlocks(blocks: Block[], maxChars = 1400): { chunks: Chunk[]; review: Block[] } {
  if (maxChars < 1) throw new Error('maxChars must be positive');
  const chunks: Chunk[] = [];
  const review: Block[] = [];
  for (const block of blocks) {
    const text = block.text.trim();
    if (!text) continue;
    if (text.length > maxChars) {
      if (block.kind === 'table' || block.kind === 'faq') { review.push(block); continue; }
      const sentences = text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map(s=>s.trim()).filter(Boolean) || [];
      if (!sentences.length || sentences.some(s=>s.length>maxChars)) { review.push(block); continue; }
      const split = chunkBlocks(sentences.map(sentence=>({...block,text:sentence})), maxChars);
      chunks.push(...split.chunks); review.push(...split.review); continue;
    }
    const previous = chunks.at(-1);
    if (previous && previous.kind === block.kind && previous.heading.join('\0') === block.heading.join('\0') && previous.text.length + text.length + 2 <= maxChars && block.kind !== 'faq' && block.kind !== 'table') {
      previous.text += '\n\n' + text;
    } else {
      chunks.push({ heading: [...block.heading], text, kind: block.kind });
    }
  }
  return { chunks, review };
}
