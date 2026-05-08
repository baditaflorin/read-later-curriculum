import FlexSearch from "flexsearch";
import type { Article } from "../../shared/types";

interface SearchDoc {
  id: string;
  title: string;
  content: string;
  tags: string;
}

interface EnrichedSearchResult {
  field: string;
  result: Array<{ id: string }>;
}

interface FlexDocument {
  add(document: SearchDoc): void;
  search(
    query: string,
    options: { enrich: true; limit: number },
  ): EnrichedSearchResult[];
}

const FlexDocumentCtor = (
  FlexSearch as unknown as {
    Document: new (options: unknown) => FlexDocument;
  }
).Document;

export function searchArticles(articles: Article[], query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return articles;
  }

  const index = new FlexDocumentCtor({
    tokenize: "forward",
    document: {
      id: "id",
      index: ["title", "content", "tags"],
    },
  });

  for (const article of articles) {
    index.add({
      id: article.id,
      title: article.title,
      content: `${article.excerpt} ${article.content.slice(0, 8000)}`,
      tags: article.tags.join(" "),
    });
  }

  const ids = new Set(
    index
      .search(trimmed, { enrich: true, limit: 100 })
      .flatMap((group) => group.result.map((result) => result.id)),
  );

  return articles.filter((article) => ids.has(article.id));
}
