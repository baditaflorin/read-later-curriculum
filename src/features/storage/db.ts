import Dexie, { type EntityTable } from "dexie";
import { DEFAULT_SETTINGS } from "../../shared/constants";
import type { Article, CurriculumPlan, UserSettings } from "../../shared/types";

interface StoredSetting {
  key: "user-settings";
  value: UserSettings;
}

export const db = new Dexie("read-later-curriculum") as Dexie & {
  articles: EntityTable<Article, "id">;
  plans: EntityTable<CurriculumPlan, "id">;
  settings: EntityTable<StoredSetting, "key">;
};

db.version(1).stores({
  articles: "id, title, status, createdAt, updatedAt, *tags",
  plans: "id, generatedAt",
  settings: "key",
});

export async function listArticles() {
  return db.articles.orderBy("createdAt").reverse().toArray();
}

export async function saveArticles(articles: Article[]) {
  await db.articles.bulkPut(articles);
  return listArticles();
}

export async function updateArticle(article: Article) {
  const updated = { ...article, updatedAt: new Date().toISOString() };
  await db.articles.put(updated);
  return updated;
}

export async function deleteArticle(id: string) {
  await db.articles.delete(id);
}

export async function clearArticles() {
  await db.articles.clear();
  await db.plans.clear();
}

export async function getLatestPlan() {
  return (await db.plans.orderBy("generatedAt").reverse().first()) ?? null;
}

export async function savePlan(plan: CurriculumPlan) {
  await db.plans.put(plan);
  return plan;
}

export async function getSettings() {
  const stored = await db.settings.get("user-settings");
  return stored?.value ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings) {
  await db.settings.put({ key: "user-settings", value: settings });
  return settings;
}
