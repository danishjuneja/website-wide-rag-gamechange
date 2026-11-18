import * as cheerio from 'cheerio';
import type { Block } from './chunk.ts';
import { removeEmails } from './privacy.ts';

export function extractPage(html: string, url: string): { title: string; blocks: Block[]; links: string[] } {
  const $ = cheerio.load(html);
  $('script,style,nav,header,footer,form,noscript,iframe,blockquote,[role=navigation],[aria-hidden=true],[class*="testimonial" i],[id*="testimonial" i],.site_header,.footer-main,.footer-segments').remove();
  const root = $('main').first().length ? $('main').first() : $('[role=main]').first().length ? $('[role=main]').first() : $('body');
  const title = removeEmails($('title').first().text().replace(/\s+/g, ' ').trim());
  const heading: string[] = [];
  const blocks: Block[] = [];
  let skippedHeadingLevel = 0;
  const clean = (text: string) => removeEmails(text.replace(/\uEADF/g,'AED ').replace(/\s+/g, ' ').trim());
  root.find('h1,h2,h3,h4,p,li,table,.cards-slider__info-title').each((_, element) => {
    const node = $(element);
    const tag = element.tagName.toLowerCase();
    if(tag==='div' && node.parents('p,li,table').length) return;
    if (node.parents('table').length) return;
    if (/^h[1-4]$/.test(tag)) {
      const level = Number(tag[1]);
      if(skippedHeadingLevel && level <= skippedHeadingLevel) skippedHeadingLevel=0;
      if(/\b(testimonials?|customer (reviews?|stories)|what (our )?customers? (are )?saying)\b/i.test(clean(node.text()))) skippedHeadingLevel=level;
      if(skippedHeadingLevel) return;
      heading.length = level - 1;
      heading[level - 1] = clean(node.text());
      return;
    }
    if(skippedHeadingLevel) return;
    if (tag === 'li' && node.parents('li').length) return;
    if (tag === 'table') {
      // Tables require visual verification before their values can be used.
      const text = node.find('tr').toArray().map(row => $(row).find('th,td').toArray().map(cell => clean($(cell).text())).join(' | ')).join('\n');
      if (text.trim()) blocks.push({ heading: heading.filter(Boolean), text, kind: 'table' });
      return;
    }
    const text = clean(cheerio.load((node.html()||'').replace(/<br\s*\/?\s*>/gi,' ')).text());
    if (text) blocks.push({ heading: heading.filter(Boolean), text, kind: tag === 'li' ? 'list' : 'paragraph' });
  });
  const links = new Set<string>();
  root.find('a[href]').each((_, element) => {
    try { const target = new URL($(element).attr('href')!, url); if (['http:', 'https:'].includes(target.protocol) && !target.username && !target.password && !/@|%40/i.test(target.pathname+target.search)) { target.hash = ''; links.add(target.toString()); } } catch {}
  });
  return { title, blocks, links: [...links] };
}
