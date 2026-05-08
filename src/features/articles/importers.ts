import { Readability } from "@mozilla/readability";
import { z } from "zod";
import type { ArticleDraft, ImportResult } from "../../shared/types";
import { makeExcerpt, normalizeWhitespace } from "../../shared/text";
import { articleDraftSchema } from "./articleSchema";

const jsonExportSchema = z.union([
  z.array(z.unknown()),
  z.object({
    articles: z.array(z.unknown()),
  }),
]);

export function draftFromManualInput(input: {
  title: string;
  sourceUrl?: string;
  content: string;
  tags?: string;
}): ArticleDraft {
  const tags =
    input.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];

  return articleDraftSchema.parse({
    title: input.title,
    sourceUrl: input.sourceUrl,
    content: input.content,
    tags,
  });
}

export function parsePlainText(
  text: string,
  filename = "article.txt",
): ArticleDraft {
  const normalized = normalizeWhitespace(text);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => line.length > 4 && line.length < 140);
  return articleDraftSchema.parse({
    title: heading ?? filename.replace(/\.[^.]+$/, ""),
    content: normalized,
    tags: [],
  });
}

export function parseMarkdown(
  markdown: string,
  filename = "article.md",
): ArticleDraft {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  const content = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ");
  return articleDraftSchema.parse({
    title: heading?.trim() || filename.replace(/\.[^.]+$/, ""),
    content: normalizeWhitespace(content),
    tags: ["markdown"],
  });
}

export function parseHtml(
  html: string,
  filename = "article.html",
): ArticleDraft {
  const document = new DOMParser().parseFromString(html, "text/html");
  const parsed = new Readability(document).parse();
  const title =
    parsed?.title ||
    document.querySelector("title")?.textContent ||
    filename.replace(/\.[^.]+$/, "");
  const content =
    parsed?.textContent ||
    document.body?.textContent ||
    document.documentElement.textContent ||
    makeExcerpt(html, 500);
  return articleDraftSchema.parse({
    title,
    author: parsed?.byline ?? undefined,
    content: normalizeWhitespace(content),
    tags: ["html"],
  });
}

export function parseJsonImport(json: string): ImportResult {
  const raw = JSON.parse(json) as unknown;
  const parsed = jsonExportSchema.parse(raw);
  const input = Array.isArray(parsed) ? parsed : parsed.articles;
  const warnings: string[] = [];
  const articles: ArticleDraft[] = [];

  input.forEach((item, index) => {
    const result = articleDraftSchema.safeParse(item);
    if (result.success) {
      articles.push(result.data);
    } else {
      warnings.push(
        `Skipped item ${index + 1}: ${result.error.issues[0]?.message ?? "invalid article"}`,
      );
    }
  });

  return { articles, warnings };
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const text = await file.text();
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".json")) {
    return parseJsonImport(text);
  }

  const article =
    lowerName.endsWith(".html") || lowerName.endsWith(".htm")
      ? parseHtml(text, file.name)
      : lowerName.endsWith(".md") || lowerName.endsWith(".markdown")
        ? parseMarkdown(text, file.name)
        : parsePlainText(text, file.name);

  return { articles: [article], warnings: [] };
}
