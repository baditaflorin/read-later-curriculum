const STOP_WORDS = new Set([
  "a",
  "about",
  "after",
  "all",
  "also",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "more",
  "most",
  "new",
  "not",
  "of",
  "on",
  "or",
  "our",
  "should",
  "so",
  "than",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "up",
  "use",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
]);

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function tokenize(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ""))
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function countWords(value: string) {
  const words = normalizeWhitespace(value).match(/\b[\p{L}\p{N}'-]+\b/gu);
  return words?.length ?? 0;
}

export function estimateReadingMinutes(value: string, wordsPerMinute: number) {
  return Math.max(
    1,
    Math.ceil(countWords(value) / Math.max(120, wordsPerMinute)),
  );
}

export function makeExcerpt(value: string, maxLength = 220) {
  const cleaned = normalizeWhitespace(value);
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

export function splitSentences(value: string) {
  return normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

export function topTerms(values: string[], limit = 6) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const seen = new Set<string>();
    for (const token of tokenize(value)) {
      if (seen.has(token)) {
        continue;
      }
      seen.add(token);
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }
  if (aMagnitude === 0 || bMagnitude === 0) {
    return 0;
  }
  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

export function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}

export function compactTitle(value: string) {
  const cleaned = normalizeWhitespace(value);
  return cleaned.length > 78
    ? `${cleaned.slice(0, 78).replace(/\s+\S*$/, "")}...`
    : cleaned;
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function stableId(prefix: string) {
  if ("randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function slugify(value: string) {
  const slug = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "untitled";
}

export function stableContentId(prefix: string, label: string, seed: string) {
  return `${prefix}_${slugify(label)}_${hashString(seed)}`;
}

export function normalizeInputText(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2000-\u200a\u202f\u205f\u3000]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...");
}
