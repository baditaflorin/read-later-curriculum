import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BookOpenCheck,
  CalendarClock,
  Check,
  Clipboard,
  Database,
  Download,
  FileJson,
  Heart,
  Import,
  Library,
  Link2,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import "./App.css";
import {
  APP_NAME,
  APP_VERSION,
  BUILT_AT,
  COMMIT_SHA,
  DEFAULT_MANUAL_DRAFT,
  DEFAULT_SETTINGS,
  DEFAULT_UI_STATE,
  LIVE_URL,
  PAYPAL_URL,
  REPOSITORY_URL,
  WEEKDAYS,
} from "./shared/constants";
import type {
  AppStateExport,
  Article,
  BuildProgress,
  FreeSlot,
  ManualDraftState,
  UiState,
  UserSettings,
} from "./shared/types";
import {
  copyText,
  downloadFile,
  formatDateTime,
  formatDuration,
} from "./shared/text";
import { draftFromManualInput } from "./features/articles/importers";
import {
  importArticleFiles,
  importArticleText,
} from "./features/articles/importWorkflow";
import {
  exportedArticleSchema,
  normalizeDraft,
  reviveArticle,
} from "./features/articles/articleSchema";
import {
  clearAllData,
  deleteArticle,
  getLatestPlan,
  getSettings,
  getUiState,
  listArticles,
  replaceAllData,
  saveArticles,
  savePlan,
  saveSettings,
  saveUiState,
  updateArticle,
} from "./features/storage/db";
import {
  createAppStateExport,
  decodeAppStateShare,
  encodeAppStateShare,
  parseAppStateJson,
  serializeAppState,
} from "./features/storage/appState";
import { searchArticles } from "./features/search/searchEngine";
import {
  buildCurriculum,
  previewNextReading,
} from "./features/curriculum/buildCurriculum";
import {
  exportPlanHtml,
  exportPlanJson,
  exportPlanMarkdown,
} from "./features/curriculum/exporters";

interface Toast {
  tone: "success" | "error" | "info";
  message: string;
}

const articleQueryKey = ["articles"];
const planQueryKey = ["plan"];
const settingsQueryKey = ["settings"];
const uiStateQueryKey = ["ui-state"];
const emptyArticles: Article[] = [];

function showError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function slotLabel(slot: FreeSlot) {
  return `${WEEKDAYS[slot.weekday]} ${slot.startTime} · ${slot.minutes}m`;
}

function describeImportSummary(summary: {
  importedArticles: Article[];
  importedFileCount: number;
  acceptedCount: number;
  warnedCount: number;
  rejectedCount: number;
  warnings: string[];
  errors: string[];
}) {
  const parts: string[] = [];
  if (summary.importedArticles.length > 0) {
    parts.push(
      `Saved ${summary.importedArticles.length} article${summary.importedArticles.length === 1 ? "" : "s"} from ${summary.importedFileCount} input${summary.importedFileCount === 1 ? "" : "s"}.`,
    );
  }
  if (summary.warnedCount > 0) {
    parts.push(
      `${summary.warnedCount} import${summary.warnedCount === 1 ? " was" : "s were"} saved with warnings.`,
    );
  }
  if (summary.rejectedCount > 0) {
    parts.push(
      `${summary.rejectedCount} import${summary.rejectedCount === 1 ? " was" : "s were"} rejected.`,
    );
  }
  if (summary.errors.length > 0) {
    parts.push(summary.errors[0]);
  } else if (summary.warnings.length > 0) {
    parts.push(summary.warnings[0]);
  }
  return parts.join(" ");
}

function inferFilename(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "pasted-article.txt";
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "pasted-export.json";
  }
  if (
    trimmed.startsWith("<?xml") ||
    trimmed.includes("<rss") ||
    trimmed.includes("<feed")
  ) {
    return "pasted-feed.xml";
  }
  if (trimmed.startsWith("<") && trimmed.includes("</")) {
    return "pasted-article.html";
  }
  if (trimmed.startsWith("#")) {
    return "pasted-article.md";
  }
  if (trimmed.includes(",") && trimmed.toLowerCase().includes("title")) {
    return "pasted-links.csv";
  }
  return "pasted-article.txt";
}

function sanitizeStateForShare(state: AppStateExport) {
  return createAppStateExport({
    articles: state.articles,
    plan: state.plan,
    settings: state.settings,
    uiState: {
      ...state.uiState,
      manualDraft: DEFAULT_MANUAL_DRAFT,
      pastedContent: "",
    },
  });
}

function App() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<Toast | null>(null);
  const [query, setQuery] = useState("");
  const [manualDraft, setManualDraft] =
    useState<ManualDraftState>(DEFAULT_MANUAL_DRAFT);
  const [pastedContent, setPastedContent] = useState("");
  const [pastedFilename, setPastedFilename] = useState(
    DEFAULT_UI_STATE.pastedFilename,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<BuildProgress>({
    phase: "idle",
    detail: "",
    completed: 0,
    total: 0,
  });
  const abortRef = useRef<AbortController | null>(null);
  const uiHydratedRef = useRef(false);
  const shareHandledRef = useRef(false);
  const stateFileInputRef = useRef<HTMLInputElement | null>(null);
  const articleFileInputRef = useRef<HTMLInputElement | null>(null);

  const articlesQuery = useQuery({
    queryKey: articleQueryKey,
    queryFn: listArticles,
  });
  const planQuery = useQuery({
    queryKey: planQueryKey,
    queryFn: getLatestPlan,
  });
  const settingsQuery = useQuery({
    queryKey: settingsQueryKey,
    queryFn: getSettings,
  });
  const uiStateQuery = useQuery({
    queryKey: uiStateQueryKey,
    queryFn: getUiState,
  });

  const articles = articlesQuery.data ?? emptyArticles;
  const plan = planQuery.data ?? null;
  const settings = settingsQuery.data ?? DEFAULT_SETTINGS;
  const visibleArticles = useMemo(
    () => searchArticles(articles, query),
    [articles, query],
  );
  const nextReading = useMemo(
    () => previewNextReading(plan, articles),
    [articles, plan],
  );
  const completedCount = articles.filter(
    (article) => article.status === "done",
  ).length;
  const debugEnabled =
    new URLSearchParams(window.location.search).get("debug") === "1";

  const saveArticlesMutation = useMutation({
    mutationFn: saveArticles,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: articleQueryKey });
      setToast({ tone: "success", message: "Library updated." });
    },
    onError: (error) => setToast({ tone: "error", message: showError(error) }),
  });

  const updateArticleMutation = useMutation({
    mutationFn: updateArticle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: articleQueryKey });
      void queryClient.invalidateQueries({ queryKey: planQueryKey });
    },
    onError: (error) => setToast({ tone: "error", message: showError(error) }),
  });

  const settingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
    onError: (error) => setToast({ tone: "error", message: showError(error) }),
  });

  const buildMutation = useMutation({
    mutationFn: async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const built = await buildCurriculum(
          articles,
          settings,
          setProgress,
          controller.signal,
        );
        return savePlan(built);
      } finally {
        abortRef.current = null;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planQueryKey });
      setToast({ tone: "success", message: "Curriculum generated." });
    },
    onError: (error) => setToast({ tone: "error", message: showError(error) }),
  });

  function applyUiState(uiState: UiState) {
    setQuery(uiState.query);
    setPastedContent(uiState.pastedContent);
    setPastedFilename(uiState.pastedFilename);
    setManualDraft(uiState.manualDraft);
  }

  function currentUiState(): UiState {
    return {
      query,
      pastedContent,
      pastedFilename,
      manualDraft,
    };
  }

  function currentAppState(): AppStateExport {
    return createAppStateExport({
      settings,
      uiState: currentUiState(),
      articles,
      plan,
    });
  }

  useEffect(() => {
    if (uiHydratedRef.current || !uiStateQuery.data) {
      return;
    }
    uiHydratedRef.current = true;
    applyUiState(uiStateQuery.data);
  }, [uiStateQuery.data]);

  useEffect(() => {
    if (!uiHydratedRef.current) {
      return;
    }
    void saveUiState({
      query,
      pastedContent,
      pastedFilename,
      manualDraft,
    });
  }, [manualDraft, pastedContent, pastedFilename, query]);

  useEffect(() => {
    if (shareHandledRef.current || settingsQuery.isPending) {
      return;
    }
    shareHandledRef.current = true;
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const params = new URLSearchParams(hash);
    const encoded = params.get("state");
    if (!encoded) {
      return;
    }

    const hydrateFromShare = async () => {
      try {
        const restored = decodeAppStateShare(encoded, settings.readingSpeedWpm);
        await replaceAllData(restored);
        applyUiState(restored.uiState);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: articleQueryKey }),
          queryClient.invalidateQueries({ queryKey: planQueryKey }),
          queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
          queryClient.invalidateQueries({ queryKey: uiStateQueryKey }),
        ]);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        setToast({
          tone: "success",
          message: "Shared workspace loaded from the URL.",
        });
      } catch (error) {
        setToast({ tone: "error", message: showError(error) });
      }
    };

    void hydrateFromShare();
  }, [queryClient, settings.readingSpeedWpm, settingsQuery.isPending]);

  async function saveImportedArticles(summary: {
    importedArticles: Article[];
    importedFileCount: number;
    acceptedCount: number;
    warnedCount: number;
    rejectedCount: number;
    warnings: string[];
    errors: string[];
  }) {
    if (summary.importedArticles.length > 0) {
      await saveArticlesMutation.mutateAsync(summary.importedArticles);
    }
    const message = describeImportSummary(summary);
    setToast({
      tone:
        summary.errors.length > 0 && summary.importedArticles.length === 0
          ? "error"
          : summary.errors.length > 0 || summary.warnings.length > 0
            ? "info"
            : "success",
      message:
        message ||
        "No readable articles were found. Try a different export or paste cleaner text.",
    });
  }

  async function handleArticleFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }
    const summary = await importArticleFiles(files, settings.readingSpeedWpm);
    await saveImportedArticles(summary);
  }

  async function handleAddArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = draftFromManualInput(manualDraft);
    const article = normalizeDraft(draft, settings.readingSpeedWpm);
    await saveArticlesMutation.mutateAsync([article]);
    setManualDraft(DEFAULT_MANUAL_DRAFT);
  }

  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    await handleArticleFiles(files);
    event.target.value = "";
  }

  async function handleStateImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const json = await file.text();
      const restored = parseAppStateJson(json, settings.readingSpeedWpm);
      await replaceAllData(restored);
      applyUiState(restored.uiState);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: articleQueryKey }),
        queryClient.invalidateQueries({ queryKey: planQueryKey }),
        queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: uiStateQueryKey }),
      ]);
      setToast({
        tone: "success",
        message: "Workspace restored from state export.",
      });
    } catch (error) {
      setToast({ tone: "error", message: showError(error) });
    }
    event.target.value = "";
  }

  async function handleLoadSample() {
    const response = await fetch(
      `${import.meta.env.BASE_URL}data/v1/sample-articles.json`,
    );
    if (!response.ok) {
      throw new Error("Sample articles are missing. Run make data.");
    }
    const raw = exportedArticleSchema
      .array()
      .parse((await response.json()) as unknown);
    const imported = raw.map((draft) =>
      reviveArticle(draft, settings.readingSpeedWpm),
    );
    await saveArticlesMutation.mutateAsync(imported);
  }

  async function handleImportPastedContent() {
    if (!pastedContent.trim()) {
      setToast({
        tone: "error",
        message:
          "Paste some article content, HTML, JSON, CSV, or feed XML first.",
      });
      return;
    }
    const filename = pastedFilename.trim() || inferFilename(pastedContent);
    const summary = importArticleText(
      pastedContent,
      filename,
      settings.readingSpeedWpm,
    );
    await saveImportedArticles(summary);
    setPastedContent("");
    setPastedFilename(inferFilename(""));
  }

  async function handleReadClipboard() {
    try {
      let payload = "";
      if ("read" in navigator.clipboard) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes("text/html")) {
            payload = await (await item.getType("text/html")).text();
            setPastedFilename("clipboard.html");
            break;
          }
          if (item.types.includes("text/plain")) {
            payload = await (await item.getType("text/plain")).text();
          }
        }
      }
      if (!payload) {
        payload = await navigator.clipboard.readText();
      }
      if (!payload.trim()) {
        throw new Error("Clipboard is empty.");
      }
      setPastedContent(payload);
      setPastedFilename(inferFilename(payload));
      setToast({
        tone: "success",
        message: "Clipboard content loaded into the paste importer.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Clipboard access failed. Paste into the box instead.",
      });
    }
  }

  function patchSettings(patch: Partial<UserSettings>) {
    settingsMutation.mutate({ ...settings, ...patch });
  }

  function patchSlot(slotId: string, patch: Partial<FreeSlot>) {
    patchSettings({
      freeSlots: settings.freeSlots.map((slot) =>
        slot.id === slotId ? { ...slot, ...patch } : slot,
      ),
    });
  }

  function addSlot() {
    patchSettings({
      freeSlots: [
        ...settings.freeSlots,
        {
          id: `slot_${Date.now().toString(36)}`,
          weekday: 2,
          startTime: "18:30",
          minutes: 30,
        },
      ],
    });
  }

  async function handleDeleteArticle(id: string) {
    await deleteArticle(id);
    await queryClient.invalidateQueries({ queryKey: articleQueryKey });
    setToast({ tone: "success", message: "Article removed." });
  }

  async function handleStartFresh() {
    await clearAllData();
    applyUiState(DEFAULT_UI_STATE);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: articleQueryKey }),
      queryClient.invalidateQueries({ queryKey: planQueryKey }),
      queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
      queryClient.invalidateQueries({ queryKey: uiStateQueryKey }),
    ]);
    setToast({
      tone: "success",
      message:
        "Workspace reset. Library, plan, settings, and draft state were cleared.",
    });
  }

  function exportMarkdown() {
    if (!plan) {
      setToast({ tone: "error", message: "Build a curriculum first." });
      return;
    }
    downloadFile(
      "curriculum.md",
      exportPlanMarkdown(plan, articles),
      "text/markdown",
    );
  }

  function exportPlanData() {
    if (!plan) {
      setToast({ tone: "error", message: "Build a curriculum first." });
      return;
    }
    downloadFile(
      "read-later-plan-v1.json",
      exportPlanJson(plan, articles),
      "application/json",
    );
  }

  function exportStateData() {
    downloadFile(
      "read-later-workspace-v1.json",
      serializeAppState(currentAppState()),
      "application/json",
    );
  }

  async function copyMarkdownOutput() {
    if (!plan) {
      setToast({ tone: "error", message: "Build a curriculum first." });
      return;
    }
    await copyText(exportPlanMarkdown(plan, articles));
    setToast({ tone: "success", message: "Curriculum Markdown copied." });
  }

  async function copyStateOutput() {
    await copyText(serializeAppState(currentAppState()));
    setToast({ tone: "success", message: "Workspace JSON copied." });
  }

  async function shareWorkspace() {
    const sharable = sanitizeStateForShare(currentAppState());
    const encoded = encodeAppStateShare(sharable);
    const url = `${LIVE_URL}#state=${encoded}`;
    if (url.length > 3500) {
      setToast({
        tone: "error",
        message:
          "This workspace is too large for a share URL. Export the state JSON instead.",
      });
      return;
    }
    await copyText(url);
    setToast({ tone: "success", message: "Share URL copied." });
  }

  function printPlan() {
    if (!plan) {
      setToast({ tone: "error", message: "Build a curriculum first." });
      return;
    }
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      setToast({
        tone: "error",
        message: "Pop-up blocked. Allow pop-ups to print the plan.",
      });
      return;
    }
    popup.document.write(exportPlanHtml(plan, articles));
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function updateDraftField<K extends keyof ManualDraftState>(
    key: K,
    value: ManualDraftState[K],
  ) {
    setManualDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local-first synthesis</p>
          <h1>{APP_NAME}</h1>
        </div>
        <nav aria-label="Project links" className="topbar-actions">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="icon-link"
            title="Star on GitHub"
          >
            <Star size={18} aria-hidden="true" />
            <span>Star</span>
          </a>
          <a
            href={PAYPAL_URL}
            target="_blank"
            rel="noreferrer"
            className="icon-link"
            title="Support on PayPal"
          >
            <Heart size={18} aria-hidden="true" />
            <span>PayPal</span>
          </a>
        </nav>
      </header>

      <section className="summary-strip" aria-label="Library summary">
        <Stat label="Saved" value={articles.length.toString()} />
        <Stat label="Done" value={completedCount.toString()} />
        <Stat label="Topics" value={(plan?.topics.length ?? 0).toString()} />
        <Stat
          label="Scheduled"
          value={formatDuration(
            plan?.sessions.reduce(
              (sum, session) => sum + session.loadMinutes,
              0,
            ) ?? 0,
          )}
        />
        <Stat label="Version" value={`v${APP_VERSION}`} />
        <Stat label="Commit" value={COMMIT_SHA} />
      </section>

      <div className="workspace-grid">
        <section
          className={`panel import-panel ${isDragging ? "is-dragging" : ""}`}
          aria-labelledby="add-article"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (
              event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              return;
            }
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const files = [...event.dataTransfer.files];
            void handleArticleFiles(files);
          }}
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2 id="add-article">Add Reading</h2>
            </div>
            <div className="button-row compact">
              <label className="icon-button" title="Import article files">
                <Import size={18} aria-hidden="true" />
                <span className="sr-only">Import article files</span>
                <input
                  ref={articleFileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,.html,.htm,.csv,.xml,.rss,.atom,.json,.pdf"
                  multiple
                  onChange={handleFileImport}
                />
              </label>
              <label className="icon-button" title="Import workspace state">
                <Upload size={18} aria-hidden="true" />
                <span className="sr-only">Import workspace state</span>
                <input
                  ref={stateFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleStateImport}
                />
              </label>
            </div>
          </div>

          <div className="drop-target">
            <strong>Drop article exports here</strong>
            <span>
              Files, drag-drop, paste, clipboard, and full-state restore all
              work locally.
            </span>
          </div>

          <div className="import-helpers">
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() => void handleReadClipboard()}
              >
                <Clipboard size={17} aria-hidden="true" />
                Read Clipboard
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void handleImportPastedContent()}
              >
                <Plus size={17} aria-hidden="true" />
                Import Paste
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void handleLoadSample()}
              >
                <Database size={17} aria-hidden="true" />
                Demo Set
              </button>
            </div>
            <label>
              <span>Pasted content filename hint</span>
              <input
                value={pastedFilename}
                onChange={(event) => setPastedFilename(event.target.value)}
                placeholder="pasted-article.html"
              />
            </label>
            <label>
              <span>Paste article text, HTML, CSV, RSS/XML, or JSON</span>
              <textarea
                value={pastedContent}
                onChange={(event) => setPastedContent(event.target.value)}
                className="paste-box"
              />
            </label>
            <p className="helper-text">
              Direct URL import stays out of scope in this static build. Paste
              the rendered article or import an exported file instead.
            </p>
          </div>

          <form className="article-form" onSubmit={handleAddArticle}>
            <label>
              <span>Title</span>
              <input
                value={manualDraft.title}
                onChange={(event) =>
                  updateDraftField("title", event.target.value)
                }
                required
              />
            </label>
            <label>
              <span>URL</span>
              <input
                type="url"
                value={manualDraft.sourceUrl}
                onChange={(event) =>
                  updateDraftField("sourceUrl", event.target.value)
                }
              />
            </label>
            <label>
              <span>Tags</span>
              <input
                value={manualDraft.tags}
                onChange={(event) =>
                  updateDraftField("tags", event.target.value)
                }
                placeholder="ai, systems, research"
              />
            </label>
            <label>
              <span>Article text</span>
              <textarea
                value={manualDraft.content}
                onChange={(event) =>
                  updateDraftField("content", event.target.value)
                }
                required
                minLength={40}
              />
            </label>
            <div className="button-row">
              <button type="submit" disabled={saveArticlesMutation.isPending}>
                <Plus size={17} aria-hidden="true" />
                Add
              </button>
            </div>
          </form>
        </section>

        <section
          className="panel library-panel"
          aria-labelledby="library-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Search</p>
              <h2 id="library-heading">Library</h2>
            </div>
            <button
              type="button"
              className="icon-button danger"
              title="Start fresh"
              onClick={() => void handleStartFresh()}
            >
              <RotateCcw size={18} aria-hidden="true" />
              <span className="sr-only">Start fresh</span>
            </button>
          </div>
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search articles</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, text, or tag"
            />
          </label>
          <div className="article-list" aria-live="polite">
            {visibleArticles.length === 0 ? (
              <div className="empty-state">
                <Library size={26} aria-hidden="true" />
                <p>No articles in this view.</p>
              </div>
            ) : (
              visibleArticles.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onDone={() =>
                    updateArticleMutation.mutate({
                      ...article,
                      status: article.status === "done" ? "saved" : "done",
                      completedAt:
                        article.status === "done"
                          ? undefined
                          : new Date().toISOString(),
                    })
                  }
                  onArchive={() =>
                    updateArticleMutation.mutate({
                      ...article,
                      status: "archived",
                    })
                  }
                  onDelete={() => void handleDeleteArticle(article.id)}
                />
              ))
            )}
          </div>
        </section>

        <section
          className="panel settings-panel"
          aria-labelledby="settings-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Calendar</p>
              <h2 id="settings-heading">Free Time</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              title="Add slot"
              onClick={addSlot}
            >
              <Plus size={18} aria-hidden="true" />
              <span className="sr-only">Add slot</span>
            </button>
          </div>

          <div className="settings-grid">
            <label>
              <span>WPM</span>
              <input
                type="number"
                min={120}
                max={600}
                value={settings.readingSpeedWpm}
                onChange={(event) =>
                  patchSettings({ readingSpeedWpm: Number(event.target.value) })
                }
              />
            </label>
            <label>
              <span>Days</span>
              <input
                type="number"
                min={3}
                max={90}
                value={settings.daysToPlan}
                onChange={(event) =>
                  patchSettings({ daysToPlan: Number(event.target.value) })
                }
              />
            </label>
            <label>
              <span>Embeddings</span>
              <select
                value={settings.embeddingMode}
                onChange={(event) => {
                  const nextMode = event.target.value;
                  if (nextMode === "fast" || nextMode === "semantic") {
                    patchSettings({ embeddingMode: nextMode });
                  }
                }}
              >
                <option value="fast">Fast local</option>
                <option value="semantic">Sentence-transformers</option>
              </select>
            </label>
          </div>

          <div className="slot-list">
            {settings.freeSlots.map((slot) => (
              <div key={slot.id} className="slot-row">
                <select
                  value={slot.weekday}
                  onChange={(event) =>
                    patchSlot(slot.id, { weekday: Number(event.target.value) })
                  }
                >
                  {WEEKDAYS.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(event) =>
                    patchSlot(slot.id, { startTime: event.target.value })
                  }
                />
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={slot.minutes}
                  onChange={(event) =>
                    patchSlot(slot.id, { minutes: Number(event.target.value) })
                  }
                />
                <button
                  type="button"
                  className="icon-button danger"
                  title={`Remove ${slotLabel(slot)}`}
                  onClick={() =>
                    patchSettings({
                      freeSlots: settings.freeSlots.filter(
                        (item) => item.id !== slot.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span className="sr-only">Remove {slotLabel(slot)}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section
          className="panel curriculum-panel"
          aria-labelledby="curriculum-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Synthesis</p>
              <h2 id="curriculum-heading">Curriculum</h2>
            </div>
            <div className="button-row compact">
              <button
                type="button"
                onClick={() => buildMutation.mutate()}
                disabled={buildMutation.isPending || articles.length === 0}
              >
                <Sparkles size={17} aria-hidden="true" />
                Build
              </button>
              {buildMutation.isPending && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => abortRef.current?.abort()}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="secondary"
                onClick={exportMarkdown}
              >
                <Download size={17} aria-hidden="true" />
                Markdown
              </button>
              <button
                type="button"
                className="secondary"
                onClick={exportPlanData}
              >
                <FileJson size={17} aria-hidden="true" />
                Plan JSON
              </button>
              <button
                type="button"
                className="secondary"
                onClick={exportStateData}
              >
                <Database size={17} aria-hidden="true" />
                State JSON
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void copyMarkdownOutput()}
              >
                <Clipboard size={17} aria-hidden="true" />
                Copy MD
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void copyStateOutput()}
              >
                <Clipboard size={17} aria-hidden="true" />
                Copy State
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void shareWorkspace()}
              >
                <Link2 size={17} aria-hidden="true" />
                Share URL
              </button>
              <button type="button" className="secondary" onClick={printPlan}>
                <Printer size={17} aria-hidden="true" />
                Print
              </button>
            </div>
          </div>

          {buildMutation.isPending && (
            <div className="progress-block" role="status">
              <div>
                <span>{progress.phase}</span>
                <strong>{progress.detail}</strong>
              </div>
              <progress
                value={progress.completed}
                max={Math.max(progress.total, 1)}
              />
            </div>
          )}

          {nextReading && (
            <div className="next-reading">
              <CalendarClock size={20} aria-hidden="true" />
              <div>
                <p className="eyebrow">Next</p>
                <strong>{formatDateTime(nextReading.session.startsAt)}</strong>
                <span>
                  {nextReading.articles
                    .map((article) => article.title)
                    .join(" · ")}
                </span>
              </div>
            </div>
          )}

          {plan?.inputWarnings && plan.inputWarnings.length > 0 && (
            <div className="warning-block" role="status">
              <strong>Input warnings</strong>
              <ul>
                {plan.inputWarnings.slice(0, 5).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {!plan ? (
            <div className="empty-state">
              <BookOpenCheck size={28} aria-hidden="true" />
              <p>Build once articles are saved.</p>
            </div>
          ) : (
            <div className="curriculum-layout">
              <div className="topic-list">
                {plan.topics.map((topic, index) => (
                  <article key={topic.id} className="topic-item">
                    <div className="topic-index">{index + 1}</div>
                    <div>
                      <h3>{topic.label}</h3>
                      <p>{topic.summary}</p>
                      <span>
                        {formatDuration(topic.readingMinutes)} ·{" "}
                        {topic.articleIds.length} readings
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              <div className="session-list">
                {plan.sessions.slice(0, 12).map((session) => (
                  <article key={session.id} className="session-item">
                    <span>{formatDateTime(session.startsAt)}</span>
                    <strong>{formatDuration(session.loadMinutes)}</strong>
                    <p>
                      {session.articleIds
                        .map(
                          (id) =>
                            articles.find((article) => article.id === id)
                              ?.title,
                        )
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <span>{LIVE_URL}</span>
        <span>v{APP_VERSION}</span>
        <span>{COMMIT_SHA}</span>
        <span>{new Date(BUILT_AT).toLocaleString()}</span>
      </footer>

      {debugEnabled && (
        <section className="debug-panel" aria-label="Debug import state">
          <h2>Debug</h2>
          <pre>
            {JSON.stringify(
              {
                uiState: currentUiState(),
                articles: articles.map((article) => ({
                  id: article.id,
                  title: article.title,
                  shape: article.importMeta?.shape,
                  confidence: article.importMeta?.confidence,
                  diagnostics: article.importMeta?.diagnostics,
                })),
                plan: plan
                  ? {
                      id: plan.id,
                      lowConfidenceArticleIds: plan.lowConfidenceArticleIds,
                      inputWarnings: plan.inputWarnings,
                    }
                  : null,
              },
              null,
              2,
            )}
          </pre>
        </section>
      )}

      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button
            type="button"
            className="icon-button"
            title="Dismiss"
            onClick={() => setToast(null)}
          >
            <Check size={16} aria-hidden="true" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ArticleRow({
  article,
  onDone,
  onArchive,
  onDelete,
}: {
  article: Article;
  onDone: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`article-row ${article.status === "done" ? "is-done" : ""}`}
    >
      <div>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="article-meta">
          <span>{formatDuration(article.readingMinutes)}</span>
          <span>{article.wordCount} words</span>
          {article.importMeta && (
            <span
              className={`confidence ${article.importMeta.confidence.label}`}
            >
              {article.importMeta.confidence.label} confidence
            </span>
          )}
          {article.importMeta?.shape && <span>{article.importMeta.shape}</span>}
          {article.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="article-actions">
        <button
          type="button"
          className="icon-button"
          title="Toggle done"
          onClick={onDone}
        >
          <Check size={17} aria-hidden="true" />
          <span className="sr-only">Toggle done</span>
        </button>
        <button
          type="button"
          className="icon-button"
          title="Archive"
          onClick={onArchive}
        >
          <Archive size={17} aria-hidden="true" />
          <span className="sr-only">Archive</span>
        </button>
        <button
          type="button"
          className="icon-button danger"
          title="Delete"
          onClick={onDelete}
        >
          <Trash2 size={17} aria-hidden="true" />
          <span className="sr-only">Delete</span>
        </button>
      </div>
    </article>
  );
}

export default App;
