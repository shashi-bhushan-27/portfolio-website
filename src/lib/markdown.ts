/**
 * Markdown helpers shared by the public article page and the admin editor.
 * Everything here is isomorphic (no server-only imports) so the editor can
 * compute the same TOC / reading time / heading ids the site will publish.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import type { Root, Heading } from 'mdast';
import type { TocItem } from '@/lib/types';

/**
 * Article titles are rendered as the page <h1>, so an in-body `# Heading`
 * would compete with it. If a document uses any level-1 headings we shift
 * every heading down one level; documents that start at `##` are untouched.
 * This keeps older posts (which mix `#` and `##`) hierarchically correct.
 */
export function remarkShiftHeadings() {
  return (tree: Root) => {
    let hasH1 = false;
    visit(tree, 'heading', (node: Heading) => {
      if (node.depth === 1) hasH1 = true;
    });
    if (!hasH1) return;
    visit(tree, 'heading', (node: Heading) => {
      node.depth = Math.min(node.depth + 1, 6) as Heading['depth'];
    });
  };
}

/**
 * Table of contents for h2/h3. Ids are produced with github-slugger over
 * *every* heading in document order — the same algorithm rehype-slug uses —
 * so the anchors line up with the rendered page.
 */
export function extractToc(markdown: string): TocItem[] {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkShiftHeadings);
  const tree = processor.runSync(processor.parse(markdown)) as Root;
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];

  visit(tree, 'heading', (node: Heading) => {
    const text = toString(node).trim();
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      toc.push({ id, text, depth: node.depth });
    }
  });

  return toc;
}

export function wordCount(markdown: string) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ');
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu);
  return words ? words.length : 0;
}

/** Minutes at 225 wpm, plus a little for each code block (code is read slower). */
export function readingTime(markdown: string) {
  const codeBlocks = (markdown.match(/```/g)?.length ?? 0) / 2;
  return Math.max(1, Math.round(wordCount(markdown) / 225 + codeBlocks * 0.3));
}

export function slugify(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** First real paragraph of the body, used to suggest an excerpt. */
export function suggestExcerpt(markdown: string, max = 220) {
  const para = markdown
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^(#|>|-|\*|\d+\.|\||!\[|<)/.test(p));
  if (!para) return '';
  const plain = para
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ');
  if (plain.length <= max) return plain;
  return plain.slice(0, plain.lastIndexOf(' ', max)).replace(/[,;:]$/, '') + '…';
}
