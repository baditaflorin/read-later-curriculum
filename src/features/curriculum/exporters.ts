import type { Article, CurriculumPlan } from "../../shared/types";
import { APP_NAME, REPOSITORY_URL } from "../../shared/constants";
import { formatDateTime } from "../../shared/text";

export function exportPlanJson(plan: CurriculumPlan, articles: Article[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: APP_NAME,
      repository: REPOSITORY_URL,
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
