import type { Article, CurriculumPlan } from "../../shared/types";
import {
  APP_NAME,
  APP_VERSION,
  COMMIT_SHA,
  REPOSITORY_URL,
  SCHEMA_VERSION,
} from "../../shared/constants";
import { formatDateTime } from "../../shared/text";

export function exportPlanJson(plan: CurriculumPlan, articles: Article[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: APP_NAME,
      appVersion: APP_VERSION,
      commit: COMMIT_SHA,
      schemaVersion: SCHEMA_VERSION,
      repository: REPOSITORY_URL,
      provenance: {
        articleCount: articles.length,
        lowConfidenceArticleIds: plan.lowConfidenceArticleIds,
        inputWarnings: plan.inputWarnings,
        parameters: plan.settings,
      },
      articles,
      plan,
    },
    null,
    2,
  );
}

export function exportPlanMarkdown(plan: CurriculumPlan, articles: Article[]) {
  const articlesById = new Map(
    articles.map((article) => [article.id, article]),
  );
  const lines = [
    `# ${APP_NAME}`,
    "",
    `Generated: ${plan.generatedAt}`,
    `App version: ${APP_VERSION}`,
    `Commit: ${COMMIT_SHA}`,
    `Articles: ${plan.articleCount}`,
    `Reading time: ${plan.totalReadingMinutes} minutes`,
    `Embedding provider: ${plan.embeddingProvider}`,
    `Repository: ${REPOSITORY_URL}`,
    "",
    "## Topics",
    "",
  ];

  for (const topic of plan.topics) {
    lines.push(`### ${topic.label}`, "", topic.summary, "");
    if (topic.prerequisiteTopicIds.length > 0) {
      lines.push(
        `Prerequisite topic: ${topic.prerequisiteTopicIds.join(", ")}`,
        "",
      );
    }
    for (const articleId of topic.articleIds) {
      const article = articlesById.get(articleId);
      if (!article) {
        continue;
      }
      lines.push(
        `- ${article.title} (${article.readingMinutes}m)${article.sourceUrl ? ` - ${article.sourceUrl}` : ""}`,
      );
    }
    lines.push("");
  }

  if (plan.inputWarnings.length > 0) {
    lines.push("## Input Warnings", "");
    for (const warning of plan.inputWarnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  lines.push("## Schedule", "");
  for (const session of plan.sessions) {
    const titles = session.articleIds
      .map((id) => articlesById.get(id)?.title)
      .filter(Boolean)
      .join("; ");
    lines.push(
      `- ${formatDateTime(session.startsAt)}: ${titles} (${session.loadMinutes}m in ${session.durationMinutes}m slot)`,
    );
  }

  lines.push(
    "",
    "## Pandoc",
    "",
    "This Markdown is Pandoc-ready:",
    "",
    "```sh",
    "pandoc curriculum.md -o curriculum.pdf",
    "```",
    "",
  );
  return lines.join("\n");
}

export function exportPlanHtml(plan: CurriculumPlan, articles: Article[]) {
  const markdown = exportPlanMarkdown(plan, articles)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${APP_NAME} Print View</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        color: #171513;
        background: #fffdf8;
        font: 15px/1.6 "Iowan Old Style", "Palatino Linotype", serif;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 30px;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        font: inherit;
      }
    </style>
  </head>
  <body>
    <h1>${APP_NAME}</h1>
    <pre>${markdown}</pre>
  </body>
</html>`;
}
