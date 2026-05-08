import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "docs", "data", "v1");

const topics = [
  [
    "Foundations of Attention",
    "attention",
    "A primer on why saved articles become cognitive debt and how deliberate queues create calmer reading loops.",
  ],
  [
    "What Makes a Good Reading Path?",
    "curriculum",
    "An overview of prerequisites, review moments, and varied reading lengths for self-directed study.",
  ],
  [
    "Search Indexes for Personal Libraries",
    "search",
    "A practical guide to inverted indexes, ranking, and why local search keeps private libraries useful.",
  ],
  [
    "Semantic Embeddings in the Browser",
    "embeddings",
    "A compact explanation of sentence embeddings, cosine distance, and browser WASM tradeoffs.",
  ],
  [
    "Local LLM Summaries Without Leaking Notes",
    "local-ai",
    "A privacy-first look at summarization using local models and deterministic fallback synthesis.",
  ],
  [
    "Scheduling Reading Around Real Time",
    "scheduling",
    "How to convert open calendar blocks into sessions that mix short pieces with deeper essays.",
  ],
  [
    "Exporting Curricula with Markdown",
    "pandoc",
    "Why plain Markdown remains a durable bridge to PDFs, EPUBs, notes, and Pandoc workflows.",
  ],
  [
    "Avoiding the Read-Later Trap",
    "workflow",
    "A systems view of why capture tools fail when they do not synthesize, order, and schedule work.",
  ],
  [
    "Dependency Ordering for Articles",
    "ordering",
    "A simple model for placing primers before specialized critiques and case studies.",
  ],
  [
    "Clustering Topics From Messy Saves",
    "clustering",
    "How keyword signals and vector proximity can turn a chaotic inbox into topical shelves.",
  ],
  [
    "Offline-First Knowledge Tools",
    "offline",
    "A short guide to IndexedDB, service workers, and user-owned reading state in the browser.",
  ],
  [
    "Measuring Whether Reading Happened",
    "metrics",
    "Useful local measures for completion, stale queues, session load, and curriculum freshness.",
  ],
];

const articles = topics.map(([title, tag, summary], index) => ({
  title,
  sourceUrl: `https://example.com/read-later/${index + 1}`,
  author: "Read Later Curriculum Demo",
  tags: [tag, index < 2 ? "foundation" : "synthesis"],
  content: `${summary} The article starts with the core concept, names the failure mode, and then gives a concrete practice that a reader can apply during the next session. It favors local-first software because private reading lists often include research, work notes, and unfinished thinking. The main takeaway is that saving is only useful when the system can cluster related items, identify prerequisites, balance reading effort, and reserve realistic time. A reader should finish with one sharper question and one next action.`,
}));

mkdirSync(outDir, { recursive: true });
const payload = `${JSON.stringify(articles, null, 2)}\n`;
writeFileSync(join(outDir, "sample-articles.json"), payload);

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", {
    cwd: root,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
} catch {
  commit = "uncommitted";
}

writeFileSync(
  join(outDir, "sample-articles.meta.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceCommit: commit,
      schemaVersion: "v1",
      inputChecksums: {
        inlineSampleSet: createHash("sha256").update(payload).digest("hex"),
      },
      count: articles.length,
    },
    null,
    2,
  )}\n`,
);
