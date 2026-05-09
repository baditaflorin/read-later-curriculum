import { z } from "zod";
import type { Article, ArticleDraft } from "../../shared/types";
import {
  estimateReadingMinutes,
  makeExcerpt,
  normalizeWhitespace,
  stableContentId,
  stableId,
} from "../../shared/text";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const articleDraftSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  sourceUrl: optionalUrl,
  author: z.string().trim().optional(),
  content: z
    .string()
    .trim()
    .min(40, "Article text must be at least 40 characters"),
  tags: z.array(z.string().trim().min(1)).default([]),
  importMeta: z.custom<ArticleDraft["importMeta"]>().optional(),
});

export const articleSchema = articleDraftSchema.extend({
  id: z.string(),
  excerpt: z.string(),
  wordCount: z.number().int().nonnegative(),
  readingMinutes: z.number().int().positive(),
  status: z.enum(["saved", "scheduled", "reading", "done", "archived"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  importMeta: z.custom<Article["importMeta"]>().optional(),
});

export const exportedArticleSchema = articleSchema.partial({
  id: true,
  excerpt: true,
  wordCount: true,
  readingMinutes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export function normalizeDraft(
  input: ArticleDraft,
  readingSpeedWpm: number,
  options: { now?: string; idSeed?: string } = {},
): Article {
  const parsed = articleDraftSchema.parse(input);
  const now = options.now ?? new Date().toISOString();
  const content = normalizeWhitespace(parsed.content);
  const title = normalizeWhitespace(parsed.title);
  const tags = [...new Set(parsed.tags.map((tag) => tag.toLowerCase()))];
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const idSeed =
    options.idSeed ??
    parsed.importMeta?.sourceIdentifier ??
    `${parsed.sourceUrl ?? ""}\n${title}\n${content.slice(0, 2000)}`;
  return {
    id: stableContentId("article", title, idSeed) || stableId("article"),
    title,
    sourceUrl: parsed.sourceUrl,
    author: parsed.author ? normalizeWhitespace(parsed.author) : undefined,
    content,
    excerpt: makeExcerpt(content),
    tags,
    wordCount,
    readingMinutes: estimateReadingMinutes(content, readingSpeedWpm),
    status: "saved",
    createdAt: now,
    updatedAt: now,
    importMeta: parsed.importMeta,
  };
}

export function reviveArticle(
  input: unknown,
  readingSpeedWpm: number,
): Article {
  const partial = exportedArticleSchema.parse(input);
  const normalized = normalizeDraft(
    {
      title: partial.title,
      sourceUrl: partial.sourceUrl,
      author: partial.author,
      content: partial.content,
      tags: partial.tags,
    },
    readingSpeedWpm,
  );
  return articleSchema.parse({
    ...normalized,
    ...partial,
    excerpt: partial.excerpt ?? normalized.excerpt,
    wordCount: partial.wordCount ?? normalized.wordCount,
    readingMinutes: partial.readingMinutes ?? normalized.readingMinutes,
    status: partial.status ?? normalized.status,
    createdAt: partial.createdAt ?? normalized.createdAt,
    updatedAt: new Date().toISOString(),
  });
}
