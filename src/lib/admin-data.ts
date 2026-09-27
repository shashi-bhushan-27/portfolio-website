import 'server-only';
import { prisma } from '@/lib/prisma';

/** Existing categories and tags, offered as suggestions in the editor. */
export async function editorSuggestions() {
  const rows = await prisma.article.findMany({ select: { category: true, tags: true } });
  const sort = (xs: Iterable<string>) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
  return {
    categories: sort(rows.map((r) => r.category)),
    tags: sort(rows.flatMap((r) => r.tags)),
  };
}
