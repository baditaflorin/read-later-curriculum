import { describe, expect, it } from "vitest";
import {
  APP_STATE_KIND,
  APP_STATE_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  DEFAULT_UI_STATE,
} from "../../shared/constants";
import { normalizeDraft } from "../articles/articleSchema";
import {
  createAppStateExport,
  decodeAppStateShare,
  encodeAppStateShare,
  parseAppStateJson,
  serializeAppState,
} from "./appState";

describe("appState", () => {
  it("round-trips a full workspace export", () => {
    const article = normalizeDraft(
      {
        title: "Local-first planning",
        content:
          "A saved article with enough text to survive normalization and state export without losing any meaningful fields for the user journey.",
        tags: ["planning"],
      },
      DEFAULT_SETTINGS.readingSpeedWpm,
      {
        now: "2026-05-09T10:00:00.000Z",
        idSeed: "phase3-roundtrip",
      },
    );

    const state = createAppStateExport({
      articles: [article],
      plan: null,
      settings: DEFAULT_SETTINGS,
      uiState: {
        ...DEFAULT_UI_STATE,
        query: "planning",
        pastedContent: "<html><body>clip</body></html>",
        pastedFilename: "clip.html",
        manualDraft: {
          title: "Draft title",
          sourceUrl: "https://example.com",
          tags: "draft",
          content:
            "Draft body text that should survive a reload because strangers should not lose unsaved work.",
        },
      },
    });

    expect(state.kind).toBe(APP_STATE_KIND);
    expect(state.schemaVersion).toBe(APP_STATE_SCHEMA_VERSION);

    const restored = parseAppStateJson(
      serializeAppState(state),
      DEFAULT_SETTINGS.readingSpeedWpm,
    );

    expect(restored.articles).toHaveLength(1);
    expect(restored.articles[0].id).toBe(article.id);
    expect(restored.uiState.query).toBe("planning");
    expect(restored.uiState.manualDraft.title).toBe("Draft title");
    expect(restored.settings.freeSlots).toHaveLength(
      DEFAULT_SETTINGS.freeSlots.length,
    );
  });

  it("round-trips a share payload", () => {
    const state = createAppStateExport({
      articles: [],
      plan: null,
      settings: DEFAULT_SETTINGS,
      uiState: DEFAULT_UI_STATE,
    });

    const encoded = encodeAppStateShare(state);
    const restored = decodeAppStateShare(
      encoded,
      DEFAULT_SETTINGS.readingSpeedWpm,
    );

    expect(restored.kind).toBe(APP_STATE_KIND);
    expect(restored.schemaVersion).toBe(APP_STATE_SCHEMA_VERSION);
    expect(restored.articles).toEqual([]);
  });
});
