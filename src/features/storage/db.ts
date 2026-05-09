import Dexie, { type EntityTable } from "dexie";
import { DEFAULT_SETTINGS, DEFAULT_UI_STATE } from "../../shared/constants";
import type {
  AppStateExport,
  Article,
  CurriculumPlan,
  UiState,
  UserSettings,
} from "../../shared/types";

interface StoredSetting {
  key: "user-settings";
  value: UserSettings;
}

interface StoredUiState {
  key: "ui-state";
  value: UiState;
}

export const db = new Dexie("read-later-curriculum") as Dexie & {
  articles: EntityTable<Article, "id">;
  plans: EntityTable<CurriculumPlan, "id">;
  settings: EntityTable<StoredSetting, "key">;
  uiState: EntityTable<StoredUiState, "key">;
};

db.version(1).stores({
  articles: "id, title, status, createdAt, updatedAt, *tags",
  plans: "id, generatedAt",
  settings: "key",
});

db.version(2).stores({
  articles: "id, title, status, createdAt, updatedAt, *tags",
  plans: "id, generatedAt",
  settings: "key",
  uiState: "key",
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

export async function clearAllData() {
  await db.transaction(
    "rw",
    db.articles,
    db.plans,
    db.settings,
    db.uiState,
    async () => {
      await db.articles.clear();
      await db.plans.clear();
      await db.settings.clear();
      await db.uiState.clear();
    },
  );
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

export async function getUiState() {
  const stored = await db.uiState.get("ui-state");
  return stored?.value ?? DEFAULT_UI_STATE;
}

export async function saveUiState(uiState: UiState) {
  await db.uiState.put({ key: "ui-state", value: uiState });
  return uiState;
}

export async function replaceAllData(state: AppStateExport) {
  await db.transaction(
    "rw",
    db.articles,
    db.plans,
    db.settings,
    db.uiState,
    async () => {
      await db.articles.clear();
      await db.plans.clear();
      await db.settings.clear();
      await db.uiState.clear();
      if (state.articles.length > 0) {
        await db.articles.bulkPut(state.articles);
      }
      if (state.plan) {
        await db.plans.put(state.plan);
      }
      await db.settings.put({
        key: "user-settings",
        value: state.settings ?? DEFAULT_SETTINGS,
      });
      await db.uiState.put({
        key: "ui-state",
        value: state.uiState ?? DEFAULT_UI_STATE,
      });
    },
  );
}
