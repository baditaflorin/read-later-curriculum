import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BookOpenCheck,
  CalendarClock,
  Check,
  Database,
  Download,
  FileJson,
  Heart,
  Import,
  Library,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import "./App.css";
import {
  APP_NAME,
  APP_VERSION,
  BUILT_AT,
  COMMIT_SHA,
  DEFAULT_SETTINGS,
  LIVE_URL,
  PAYPAL_URL,
  REPOSITORY_URL,
  WEEKDAYS,
} from "./shared/constants";
import type {
  Article,
  BuildProgress,
  FreeSlot,
  UserSettings,
} from "./shared/types";
import { downloadFile, formatDateTime, formatDuration } from "./shared/text";
import {
  draftFromManualInput,
  parseImportFile,
} from "./features/articles/importers";
import { normalizeDraft } from "./features/articles/articleSchema";
import {
  clearArticles,
  deleteArticle,
  getLatestPlan,
  getSettings,
  listArticles,
  saveArticles,
  savePlan,
  saveSettings,
  updateArticle,
} from "./features/storage/db";
import { searchArticles } from "./features/search/searchEngine";
import {
  buildCurriculum,
  previewNextReading,
} from "./features/curriculum/buildCurriculum";
import {
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
const emptyArticles: Article[] = [];

function showError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function slotLabel(slot: FreeSlot) {
  return `${WEEKDAYS[slot.weekday]} ${slot.startTime} · ${slot.minutes}m`;
}

function App() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<Toast | null>(null);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [progress, setProgress] = useState<BuildProgress>({
    phase: "idle",
    detail: "",
    completed: 0,
    total: 0,
  });

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
      const built = await buildCurriculum(articles, settings, setProgress);
      return savePlan(built);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planQueryKey });
      setToast({ tone: "success", message: "Curriculum generated." });
    },
    onError: (error) => setToast({ tone: "error", message: showError(error) }),
  });

  async function handleAddArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = draftFromManualInput({ title, sourceUrl, tags, content });
    const article = normalizeDraft(draft, settings.readingSpeedWpm);
    await saveArticlesMutation.mutateAsync([article]);
    setTitle("");
    setSourceUrl("");
    setTags("");
    setContent("");
  }

  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (files.length === 0) {
      return;
    }

    const imported: Article[] = [];
    const warnings: string[] = [];
    for (const file of files) {
      const result = await parseImportFile(file);
      warnings.push(...result.warnings);
      imported.push(
        ...result.articles.map((draft) =>
          normalizeDraft(draft, settings.readingSpeedWpm),
        ),
      );
    }
    await saveArticlesMutation.mutateAsync(imported);
    if (warnings.length > 0) {
      setToast({ tone: "info", message: warnings.slice(0, 2).join(" ") });
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
    const raw = (await response.json()) as Array<{
      title: string;
      sourceUrl?: string;
      author?: string;
      content: string;
      tags?: string[];
    }>;
    const imported = raw.map((draft) =>
      normalizeDraft(draft, settings.readingSpeedWpm),
    );
    await saveArticlesMutation.mutateAsync(imported);
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

  async function handleClear() {
    await clearArticles();
    await queryClient.invalidateQueries({ queryKey: articleQueryKey });
    await queryClient.invalidateQueries({ queryKey: planQueryKey });
    setToast({ tone: "success", message: "Local library cleared." });
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

  function exportJson() {
    if (!plan) {
      setToast({ tone: "error", message: "Build a curriculum first." });
      return;
    }
    downloadFile(
      "read-later-curriculum-v1.json",
      exportPlanJson(plan, articles),
      "application/json",
    );
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
        <section className="panel import-panel" aria-labelledby="add-article">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2 id="add-article">Add Reading</h2>
            </div>
            <label className="icon-button" title="Import files">
              <Import size={18} aria-hidden="true" />
              <span className="sr-only">Import files</span>
              <input
                type="file"
                accept=".txt,.md,.markdown,.html,.htm,.json"
                multiple
                onChange={handleFileImport}
              />
            </label>
          </div>

          <form className="article-form" onSubmit={handleAddArticle}>
            <label>
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>
            <label>
              <span>URL</span>
              <input
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
              />
            </label>
            <label>
              <span>Tags</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="ai, systems, research"
              />
            </label>
            <label>
              <span>Article text</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                minLength={40}
              />
            </label>
            <div className="button-row">
              <button type="submit" disabled={saveArticlesMutation.isPending}>
                <Plus size={17} aria-hidden="true" />
                Add
              </button>
              <button
                type="button"
                className="secondary"
                onClick={handleLoadSample}
              >
                <Database size={17} aria-hidden="true" />
                Demo Set
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
              title="Clear local library"
              onClick={handleClear}
            >
              <Trash2 size={18} aria-hidden="true" />
              <span className="sr-only">Clear local library</span>
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
                onChange={(event) =>
                  patchSettings({
                    embeddingMode: event.target
                      .value as UserSettings["embeddingMode"],
                  })
                }
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
              <button
                type="button"
                className="secondary"
                onClick={exportMarkdown}
              >
                <Download size={17} aria-hidden="true" />
                MD
              </button>
              <button type="button" className="secondary" onClick={exportJson}>
                <FileJson size={17} aria-hidden="true" />
                JSON
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
