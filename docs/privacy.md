# Privacy

Read Later Curriculum ships with no analytics.

Article text, reading progress, settings, search indexes, and generated plans
stay in the browser's IndexedDB unless the user exports them.

The app does not require accounts, cookies, API keys, server-side storage, or
secrets.

If the user selects sentence-transformers mode, the browser may fetch public
model assets from the package runtime. Article text is processed locally in the
browser. The fast local embedding mode does not fetch model assets.

GitHub Pages may receive ordinary static hosting logs as part of serving:

https://baditaflorin.github.io/read-later-curriculum/
