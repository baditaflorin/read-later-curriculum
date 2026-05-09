import { normalizeDraft } from "./articleSchema";
import { parseImportBytes, parseImportFile } from "./importers";
import type { Article, ImportResult } from "../../shared/types";

export interface ArticleImportSummary {
  importedArticles: Article[];
  importedFileCount: number;
  acceptedCount: number;
  warnedCount: number;
  rejectedCount: number;
  warnings: string[];
  errors: string[];
}

function appendResult(
  result: ImportResult,
  readingSpeedWpm: number,
  summary: ArticleImportSummary,
) {
  summary.importedFileCount += 1;
  if (result.status === "accepted") {
    summary.acceptedCount += 1;
  } else if (result.status === "warned") {
    summary.warnedCount += 1;
  } else {
    summary.rejectedCount += 1;
  }

  summary.warnings.push(...result.warnings);
  summary.errors.push(...result.errors);
  summary.importedArticles.push(
    ...result.articles.map((draft) => normalizeDraft(draft, readingSpeedWpm)),
  );
}

export function emptyImportSummary(): ArticleImportSummary {
  return {
    importedArticles: [],
    importedFileCount: 0,
    acceptedCount: 0,
    warnedCount: 0,
    rejectedCount: 0,
    warnings: [],
    errors: [],
  };
}

export async function importArticleFiles(
  files: File[],
  readingSpeedWpm: number,
) {
  const summary = emptyImportSummary();
  for (const file of files) {
    appendResult(await parseImportFile(file), readingSpeedWpm, summary);
  }
  return summary;
}

export function importArticleText(
  text: string,
  filename: string,
  readingSpeedWpm: number,
) {
  const summary = emptyImportSummary();
  const bytes = new TextEncoder().encode(text);
  appendResult(parseImportBytes(bytes, filename), readingSpeedWpm, summary);
  return summary;
}
