import { Readability } from "@mozilla/readability";
import { XMLParser } from "fast-xml-parser";
import Papa from "papaparse";
import { jsonrepair } from "jsonrepair";
import { z } from "zod";
import type {
  ArticleDraft,
  ImportConfidence,
  ImportDiagnostic,
  ImportMetadata,
  ImportResult,
  InputShape,
} from "../../shared/types";
import {
  hashString,
  makeExcerpt,
  normalizeInputText,
  normalizeWhitespace,
  stableContentId,
} from "../../shared/text";
import { articleDraftSchema } from "./articleSchema";

const MIN_ARTICLE_CHARS = 40;
const MAX_FEED_ITEMS = 50;

const jsonExportSchema = z.union([
  z.array(z.unknown()),
  z.object({
    articles: z.array(z.unknown()),
  }),
]);

interface ParseContext {
  filename: string;
  lowerName: string;
  sourceIdentifier: string;
  bytes: Uint8Array;
  text: string;
}

interface ParserOutput {
  articles: ArticleDraft[];
  shape: InputShape;
  parser: string;
  confidence: ImportConfidence;
  diagnostics: ImportDiagnostic[];
  language?: string;
}

function confidence(score: number, reasons: string[]): ImportConfidence {
  return {
    score: Math.max(0, Math.min(1, Number(score.toFixed(2)))),
    label: score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low",
    reasons,
  };
}

function diagnostic(
  severity: ImportDiagnostic["severity"],
  code: string,
  what: string,
  why: string,
  nowWhat: string,
  field?: string,
): ImportDiagnostic {
  return { severity, code, what, why, nowWhat, field };
}

function makeResult(output: ParserOutput, context: ParseContext): ImportResult {
  const diagnostics = output.diagnostics;
  const errors = diagnostics
    .filter((item) => item.severity === "error")
    .map((item) => `${item.what} ${item.nowWhat}`);
  const warnings = diagnostics
    .filter((item) => item.severity === "warning")
    .map((item) => `${item.what} ${item.nowWhat}`);
  const status =
    output.articles.length === 0 || errors.length > 0
      ? "rejected"
      : warnings.length > 0 || output.confidence.label !== "high"
        ? "warned"
        : "accepted";

  return {
    articles: output.articles.map((article, index) => ({
      ...article,
      importMeta: attachMetadata(article.importMeta, output, context, index),
    })),
    status,
    shape: output.shape,
    confidence: output.confidence,
    diagnostics,
    warnings,
    errors,
    sourceIdentifier: context.sourceIdentifier,
  };
}

function attachMetadata(
  existing: ImportMetadata | undefined,
  output: ParserOutput,
  context: ParseContext,
  index: number,
): ImportMetadata {
  return {
    shape: existing?.shape ?? output.shape,
    parser: existing?.parser ?? output.parser,
    sourceFilename: context.filename,
    sourceUrl: existing?.sourceUrl,
    sourceIdentifier:
      existing?.sourceIdentifier ??
      stableContentId(
        "source",
        context.filename,
        `${context.sourceIdentifier}:${index}`,
      ),
    language: existing?.language ?? output.language,
    confidence: existing?.confidence ?? output.confidence,
    diagnostics: existing?.diagnostics ?? output.diagnostics,
  };
}

function withMetadata(
  draft: ArticleDraft,
  output: Pick<
    ParserOutput,
    "shape" | "parser" | "confidence" | "diagnostics" | "language"
  >,
  context: ParseContext,
  index: number,
  sourceUrl?: string,
): ArticleDraft {
  return {
    ...draft,
    importMeta: {
      shape: output.shape,
      parser: output.parser,
      sourceFilename: context.filename,
      sourceUrl,
      sourceIdentifier: stableContentId(
        "source",
        draft.title,
        `${context.sourceIdentifier}:${index}:${sourceUrl ?? ""}:${draft.content.slice(0, 240)}`,
      ),
      language: output.language,
      confidence: output.confidence,
      diagnostics: output.diagnostics,
    },
  };
}

function decodeBytes(bytes: Uint8Array) {
  if (bytes.length === 0) {
    return "";
  }

  try {
    return normalizeInputText(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
  } catch {
    return normalizeInputText(new TextDecoder("windows-1252").decode(bytes));
  }
}

function isPdf(bytes: Uint8Array, text: string, filename: string) {
  return (
    filename.toLowerCase().endsWith(".pdf") ||
    text.startsWith("%PDF-") ||
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  );
}

function isProbablyHtml(text: string, lowerName: string) {
  return (
    lowerName.endsWith(".html") ||
    lowerName.endsWith(".htm") ||
    /<\/?[a-z][\s\S]*>/i.test(text.slice(0, 5000))
  );
}

function isProbablyXml(text: string, lowerName: string) {
  const start = text.trimStart().slice(0, 400).toLowerCase();
  return (
    lowerName.endsWith(".xml") ||
    start.startsWith("<?xml") ||
    start.includes("<rss") ||
    start.includes("<feed")
  );
}

function isProbablyCsv(text: string, lowerName: string) {
  const firstLine = text.split("\n", 1)[0]?.toLowerCase() ?? "";
  return (
    lowerName.endsWith(".csv") ||
    (firstLine.includes("title") &&
      firstLine.includes("url") &&
      firstLine.includes(","))
  );
}

function detectLanguage(text: string) {
  const arabicMatches = text.match(/[\u0600-\u06ff]/g)?.length ?? 0;
  const latinMatches = text.match(/[a-z]/gi)?.length ?? 0;
  if (arabicMatches > Math.max(20, latinMatches * 0.2)) {
    return "ar";
  }
  return undefined;
}

function reject(
  context: ParseContext,
  shape: InputShape,
  code: string,
  what: string,
  why: string,
  nowWhat: string,
) {
  return makeResult(
    {
      articles: [],
      shape,
      parser: "guard",
      confidence: confidence(0, [why]),
      diagnostics: [diagnostic("error", code, what, why, nowWhat)],
    },
    context,
  );
}

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
    importMeta: {
      shape: "plain-text",
      parser: "manual",
      sourceIdentifier: stableContentId(
        "source",
        input.title,
        `${input.sourceUrl ?? ""}:${input.content.slice(0, 240)}`,
      ),
      sourceUrl: input.sourceUrl,
      confidence: confidence(0.8, [
        "User supplied the title and article text manually.",
      ]),
      diagnostics: [],
    },
  });
}

export function parsePlainText(
  text: string,
  filename = "article.txt",
): ArticleDraft {
  const normalized = normalizeWhitespace(text);
  const lines = text
    .split(/\n/)
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
  const heading =
    markdown.match(/^#\s+(.+)$/m)?.[1] ??
    markdown.match(/alt=["']([^"']*awesome[^"']*)["']/i)?.[1] ??
    markdown.match(/^<h1[^>]*>(.*?)<\/h1>/im)?.[1]?.replace(/<[^>]+>/g, "");
  const content = markdown
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ");
  return articleDraftSchema.parse({
    title: normalizeWhitespace(
      heading?.trim() || filename.replace(/\.[^.]+$/, ""),
    ),
    content: normalizeWhitespace(content),
    tags: ["markdown"],
  });
}

export function parseHtml(
  html: string,
  filename = "article.html",
): ArticleDraft {
  const document = new DOMParser().parseFromString(html, "text/html");
  return parseHtmlDocument(document, html, filename);
}

function parseHtmlDocument(
  document: Document,
  html: string,
  filename: string,
): ArticleDraft {
  const parsed = new Readability(document).parse();
  const title =
    parsed?.title ||
    document.querySelector("h1")?.textContent ||
    document.querySelector("title")?.textContent ||
    filename.replace(/\.[^.]+$/, "");
  const content =
    parsed?.textContent ||
    document.querySelector("article")?.textContent ||
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

function parseHtmlInput(context: ParseContext): ParserOutput {
  const document = new DOMParser().parseFromString(context.text, "text/html");
  const bodyText = normalizeWhitespace(document.body?.textContent ?? "");
  const title = normalizeWhitespace(
    document.querySelector("title")?.textContent ||
      document.querySelector("h1")?.textContent ||
      context.filename.replace(/\.[^.]+$/, ""),
  );
  const isHackerNews =
    context.text.includes("news.ycombinator.com") ||
    context.text.includes('class="athing"') ||
    context.text.includes('class="comment-tree"');
  const codeBlocks = document.querySelectorAll("code, pre").length;
  const detectedLanguage =
    document.documentElement.lang || detectLanguage(bodyText);
  const isTechnical =
    context.text.includes("developer.mozilla.org") ||
    (codeBlocks >= 8 && detectedLanguage !== "ar");
  const isPartial =
    bodyText.length < 220 ||
    (/<html/i.test(context.text) &&
      !/<\/(body|html)>/i.test(context.text) &&
      context.text.length < 2000);

  const shape: InputShape = isHackerNews
    ? "discussion-thread"
    : isPartial
      ? "partial-html"
      : isTechnical
        ? "technical-doc-html"
        : "article-html";
  const diagnostics: ImportDiagnostic[] = [];
  let score = 0.88;

  if (isHackerNews) {
    score = 0.55;
    diagnostics.push(
      diagnostic(
        "warning",
        "discussion_thread",
        "This looks like a discussion thread.",
        "The page has repeated comment/thread markers rather than one article body.",
        "Review before scheduling; comments may not belong in a curriculum.",
      ),
    );
  }
  if (isTechnical) {
    score = Math.min(score, 0.74);
    diagnostics.push(
      diagnostic(
        "warning",
        "technical_documentation",
        "Technical documentation was imported as one reading.",
        "Code examples and reference sections may be flattened into prose.",
        "Check the title and tags before building the curriculum.",
      ),
    );
  }
  if (isPartial) {
    score = Math.min(score, 0.42);
    diagnostics.push(
      diagnostic(
        "warning",
        "partial_html",
        "This looks like a partial article clip.",
        "The HTML is truncated or the readable body is very short.",
        "Replace it with the full article text when possible.",
      ),
    );
  }

  const draft = isHackerNews
    ? articleDraftSchema.parse({
        title,
        content: bodyText,
        tags: ["discussion", "thread"],
      })
    : parseHtmlDocument(document, context.text, context.filename);
  const output = {
    articles: [draft],
    shape,
    parser: "readability-html",
    confidence: confidence(score, [
      `Detected ${shape}.`,
      title ? `Found title "${title}".` : "No strong title found.",
    ]),
    diagnostics,
    language: detectedLanguage,
  };
  return {
    ...output,
    articles: [withMetadata(draft, output, context, 0)],
  };
}

function parseMarkdownInput(context: ParseContext): ParserOutput {
  const linkCount = context.text.match(/\[[^\]]+\]\([^)]+\)/g)?.length ?? 0;
  const bulletCount = context.text.match(/^\s*[-*+]\s+/gm)?.length ?? 0;
  const isResourceList =
    /awesome/i.test(context.text.slice(0, 2000)) ||
    (linkCount > 40 && bulletCount > 25);
  const diagnostics = isResourceList
    ? [
        diagnostic(
          "warning",
          "resource_list",
          "This looks like a resource list.",
          "It contains many links and repeated list items rather than one article narrative.",
          "Review whether it should be scheduled as one reading.",
        ),
      ]
    : [];
  const draft = parseMarkdown(context.text, context.filename);
  const shape: InputShape = isResourceList
    ? "markdown-resource-list"
    : "markdown";
  const output = {
    articles: [draft],
    shape,
    parser: "markdown",
    confidence: confidence(isResourceList ? 0.62 : 0.78, [
      isResourceList
        ? "Detected many Markdown links/list rows."
        : "Detected Markdown prose.",
    ]),
    diagnostics,
  };
  return {
    ...output,
    articles: [withMetadata(draft, output, context, 0)],
  };
}

function splitTags(value: unknown) {
  return String(value ?? "")
    .split(/[|,;]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function parseCsvInput(context: ParseContext): ParserOutput {
  const parsed = Papa.parse<Record<string, string>>(context.text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  const diagnostics: ImportDiagnostic[] = [];
  if (parsed.errors.length > 0) {
    diagnostics.push(
      diagnostic(
        "warning",
        "csv_anomaly",
        "Some CSV rows looked irregular.",
        parsed.errors[0]?.message ?? "The CSV parser reported a row mismatch.",
        "Imported readable rows and skipped unusable fields.",
      ),
    );
  }

  const rows = parsed.data.filter((row) => row.title || row.url);
  if (rows.length === 0) {
    return {
      articles: [],
      shape: "read-later-csv",
      parser: "papaparse-csv",
      confidence: confidence(0.15, [
        "CSV headers were present, but no article rows had title or URL.",
      ]),
      diagnostics: [
        diagnostic(
          "error",
          "csv_no_rows",
          "No readable saved links were found.",
          "The CSV did not contain rows with title or URL fields.",
          "Export again or check that the file has title and URL columns.",
        ),
      ],
    };
  }

  const outputBase = {
    shape: "read-later-csv" as const,
    parser: "papaparse-csv",
    confidence: confidence(0.92, [
      "Detected title/url columns from a read-later export.",
    ]),
    diagnostics,
  };

  const articles = rows.map((row, index) => {
    const sourceUrl = row.url || row.href;
    const title = normalizeWhitespace(
      row.title || row.name || sourceUrl || `Saved link ${index + 1}`,
    );
    const content = normalizeWhitespace(
      [
        row.excerpt,
        row.description,
        row.selection,
        `Saved link: ${title}.`,
        sourceUrl ? `Source URL: ${sourceUrl}.` : "",
        row.time_added ? `Added timestamp: ${row.time_added}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    return withMetadata(
      articleDraftSchema.parse({
        title,
        sourceUrl,
        content:
          content.length >= MIN_ARTICLE_CHARS
            ? content
            : `${content} Imported from a read-later CSV export.`,
        tags: splitTags(row.tags),
      }),
      outputBase,
      context,
      index,
      sourceUrl,
    );
  });

  return { ...outputBase, articles };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textValue(record["#text"] ?? record.__cdata ?? record.text ?? "");
  }
  return "";
}

function linkValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return linkValue(value[0]);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      String(record.href ?? record["@_href"] ?? record.url ?? "") || undefined
    );
  }
  return undefined;
}

function parseFeedInput(context: ParseContext): ParserOutput {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const xml = parser.parse(context.text) as Record<string, unknown>;
  const rss = xml.rss as { channel?: { item?: unknown } } | undefined;
  const atom = xml.feed as { entry?: unknown } | undefined;
  const rawItems = asArray(rss?.channel?.item)
    .concat(asArray(atom?.entry))
    .slice(0, MAX_FEED_ITEMS);

  if (rawItems.length === 0) {
    return {
      articles: [],
      shape: "feed-xml",
      parser: "fast-xml-parser",
      confidence: confidence(0.2, [
        "XML was detected, but no RSS/Atom entries were found.",
      ]),
      diagnostics: [
        diagnostic(
          "error",
          "feed_no_entries",
          "No feed entries were found.",
          "The XML did not contain RSS item or Atom entry elements.",
          "Use a valid RSS/Atom export or paste article text directly.",
        ),
      ],
    };
  }

  const outputBase = {
    shape: "feed-xml" as const,
    parser: "fast-xml-parser",
    confidence: confidence(0.86, [`Detected ${rawItems.length} feed entries.`]),
    diagnostics: [] as ImportDiagnostic[],
  };

  const articles = rawItems.flatMap((item, index) => {
    const record = item as Record<string, unknown>;
    const title = normalizeWhitespace(
      textValue(record.title) || `Feed item ${index + 1}`,
    );
    const sourceUrl = linkValue(record.link) ?? textValue(record.id);
    const content = normalizeWhitespace(
      textValue(record.content) ||
        textValue(record.summary) ||
        textValue(record.description) ||
        `Feed entry: ${title}. ${sourceUrl ? `Source URL: ${sourceUrl}.` : ""}`,
    ).replace(/<[^>]+>/g, " ");
    const safeContent =
      content.length >= MIN_ARTICLE_CHARS
        ? content
        : `${content} Imported from an RSS or Atom feed entry.`;
    const parsed = articleDraftSchema.safeParse({
      title,
      sourceUrl,
      content: safeContent,
      tags: ["feed"],
    });
    return parsed.success
      ? [withMetadata(parsed.data, outputBase, context, index, sourceUrl)]
      : [];
  });

  return { ...outputBase, articles };
}

export function parseJsonImport(
  json: string,
  context?: Partial<ParseContext>,
): ImportResult {
  const fallbackContext: ParseContext = {
    filename: context?.filename ?? "import.json",
    lowerName: context?.lowerName ?? "import.json",
    sourceIdentifier:
      context?.sourceIdentifier ??
      stableContentId("source", "import-json", json.slice(0, 500)),
    bytes: context?.bytes ?? new TextEncoder().encode(json),
    text: json,
  };
  let repaired: string;
  const diagnostics: ImportDiagnostic[] = [];
  try {
    repaired = jsonrepair(json);
    if (repaired !== json) {
      diagnostics.push(
        diagnostic(
          "warning",
          "json_repaired",
          "The JSON needed small repairs.",
          "The input used syntax such as trailing commas that strict JSON rejects.",
          "The repaired import was used; export again from the source app when possible.",
        ),
      );
    }
  } catch {
    return reject(
      fallbackContext,
      "json-export",
      "json_invalid",
      "The JSON export could not be read.",
      "It is not valid JSON and could not be safely repaired.",
      "Export the file again or paste article text directly.",
    );
  }

  try {
    const raw = JSON.parse(repaired) as unknown;
    const parsed = jsonExportSchema.parse(raw);
    const input = Array.isArray(parsed) ? parsed : parsed.articles;
    const articles: ArticleDraft[] = [];

    input.forEach((item, index) => {
      const result = articleDraftSchema.safeParse(item);
      if (result.success) {
        articles.push(
          withMetadata(
            result.data,
            {
              shape: "json-export",
              parser: "jsonrepair-json",
              confidence: confidence(0.84, [
                "Detected an app-compatible JSON article array.",
              ]),
              diagnostics,
            },
            fallbackContext,
            index,
            result.data.sourceUrl,
          ),
        );
      } else {
        diagnostics.push(
          diagnostic(
            "warning",
            "json_item_skipped",
            `Skipped JSON item ${index + 1}.`,
            result.error.issues[0]?.message ??
              "The item was missing article fields.",
            "Check that each article has title and content.",
          ),
        );
      }
    });

    return makeResult(
      {
        articles,
        shape: "json-export",
        parser: "jsonrepair-json",
        confidence: confidence(articles.length > 0 ? 0.84 : 0.2, [
          articles.length > 0
            ? `Imported ${articles.length} JSON articles.`
            : "No valid JSON articles found.",
        ]),
        diagnostics:
          articles.length > 0
            ? diagnostics
            : [
                ...diagnostics,
                diagnostic(
                  "error",
                  "json_no_articles",
                  "No valid articles were found in the JSON.",
                  "The JSON parsed, but the article records were missing title or content.",
                  "Export again or paste article text directly.",
                ),
              ],
      },
      fallbackContext,
    );
  } catch {
    return reject(
      fallbackContext,
      "json-export",
      "json_invalid",
      "The JSON export could not be read.",
      "The file did not match an article export shape.",
      "Export again or paste article text directly.",
    );
  }
}

function parsePlainTextInput(context: ParseContext): ParserOutput {
  const draft = parsePlainText(context.text, context.filename);
  const output = {
    articles: [draft],
    shape: "plain-text" as const,
    parser: "plain-text",
    confidence: confidence(0.66, [
      "Detected plain text with a plausible first-line title.",
    ]),
    diagnostics: [] as ImportDiagnostic[],
  };
  return { ...output, articles: [withMetadata(draft, output, context, 0)] };
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  return parseImportBytes(new Uint8Array(buffer), file.name);
}

export function parseImportBytes(
  bytes: Uint8Array,
  filename: string,
): ImportResult {
  const text = decodeBytes(bytes);
  const lowerName = filename.toLowerCase();
  const context: ParseContext = {
    filename,
    lowerName,
    sourceIdentifier: stableContentId(
      "source",
      filename,
      `${filename}:${hashString(text.slice(0, 8000))}:${bytes.length}`,
    ),
    bytes,
    text,
  };

  if (normalizeWhitespace(text).length === 0) {
    return reject(
      context,
      "empty",
      "empty_file",
      "This file is empty.",
      "There is no article text to save.",
      "Choose a non-empty export or paste the article text directly.",
    );
  }

  if (isPdf(bytes, text, filename)) {
    return reject(
      context,
      "unsupported-pdf",
      "unsupported_pdf",
      "This is an unsupported PDF.",
      "The browser app cannot safely extract PDF text in Phase 2.",
      "Use the article HTML, Markdown, or pasted text instead.",
    );
  }

  if (lowerName.endsWith(".json")) {
    return parseJsonImport(text, context);
  }

  try {
    const output = isProbablyCsv(text, lowerName)
      ? parseCsvInput(context)
      : isProbablyXml(text, lowerName)
        ? parseFeedInput(context)
        : lowerName.endsWith(".md") || lowerName.endsWith(".markdown")
          ? parseMarkdownInput(context)
          : isProbablyHtml(text, lowerName)
            ? parseHtmlInput(context)
            : parsePlainTextInput(context);

    return makeResult(output, context);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The parser failed unexpectedly.";
    return reject(
      context,
      "unknown",
      "import_failed",
      "The import could not be completed.",
      message,
      "Try a cleaner export, paste the article text, or file an issue with this input.",
    );
  }
}
