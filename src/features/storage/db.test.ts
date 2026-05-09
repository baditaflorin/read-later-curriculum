import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, DEFAULT_UI_STATE } from "../../shared/constants";
import { normalizeDraft } from "../articles/articleSchema";
import {
  clearAllData,
  getSettings,
  getUiState,
  listArticles,
  replaceAllData,
  saveArticles,
  saveSettings,
  saveUiState,
} from "./db";
import { createAppStateExport } from "./appState";

describe("db persistence", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("persists and reloads ui state", async () => {
    await saveUiState({
      ...DEFAULT_UI_STATE,
      query: "retrieval",
      pastedContent: "hello world",
      pastedFilename: "note.txt",
    });

    const stored = await getUiState();
    expect(stored.query).toBe("retrieval");
    expect(stored.pastedFilename).toBe("note.txt");
  });

  it("replaces the full workspace state", async () => {
    const article = normalizeDraft(
      {
        title: "Replace all data",
        content:
          "A complete workspace restore should preserve articles, settings, and ui state for actual strangers using the app.",
      },
      DEFAULT_SETTINGS.readingSpeedWpm,
      { idSeed: "replace-all-data" },
    );

    await saveArticles([article]);
    await saveSettings({
      ...DEFAULT_SETTINGS,
      readingSpeedWpm: 260,
    });

    await replaceAllData(
      createAppStateExport({
        articles: [article],
        plan: null,
        settings: {
          ...DEFAULT_SETTINGS,
          daysToPlan: 14,
        },
        uiState: {
          ...DEFAULT_UI_STATE,
          query: "replace",
        },
      }),
    );

    expect(await listArticles()).toHaveLength(1);
    expect((await getSettings()).daysToPlan).toBe(14);
    expect((await getUiState()).query).toBe("replace");
  });
});
