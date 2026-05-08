import type { Article } from "../../shared/types";
import { splitSentences, tokenize, topTerms } from "../../shared/text";

function rankSentences(text: string) {
  const terms = topTerms([text], 12);
  const termSet = new Set(terms);
  return splitSentences(text)
    .map((sentence, index) => {
      const score =
        tokenize(sentence).filter((token) => termSet.has(token)).length -
        index * 0.02;
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function extractiveSummary(text: string, sentenceCount = 2) {
  const ranked = rankSentences(text).slice(0, sentenceCount);
  if (ranked.length === 0) {
    return text.slice(0, 220);
  }
  return ranked
    .sort((a, b) => text.indexOf(a.sentence) - text.indexOf(b.sentence))
    .map((item) => item.sentence)
    .join(" ");
}

async function promptBrowserLocalModel(prompt: string) {
  const factory = window.ai?.languageModel ?? window.LanguageModel;
  if (!factory) {
    return null;
  }

  const availability = await factory.availability?.();
  if (availability && availability === "unavailable") {
    return null;
  }

  const session = await factory.create({
    systemPrompt:
      "Summarize reading material locally. Be concise, concrete, and never invent facts outside the supplied text.",
  });
  try {
    return await session.prompt(prompt);
  } finally {
    session.destroy?.();
  }
}

export async function summarizeArticle(article: Article) {
  const prompt = `Summarize this article in two crisp sentences, then add one reason it belongs in a reading curriculum.\n\nTitle: ${article.title}\n\n${article.content.slice(0, 6000)}`;
  try {
    const response = await promptBrowserLocalModel(prompt);
    if (response) {
      return response.trim();
    }
  } catch {
    return extractiveSummary(article.content, 2);
  }
  return extractiveSummary(article.content, 2);
}

export function summarizeCluster(articles: Article[], keywords: string[]) {
  const titleList = articles
    .slice(0, 4)
    .map((article) => article.title)
    .join("; ");
  const keywordText = keywords.slice(0, 4).join(", ");
  return `Focuses on ${keywordText || "related ideas"} through ${articles.length} reading${
    articles.length === 1 ? "" : "s"
  }: ${titleList}.`;
}
