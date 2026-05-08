.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-merge hooks-post-checkout

help:
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## wire .githooks into git
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev: ## run the frontend dev server
	npm run dev

build: ## build GitHub Pages output into docs/
	npm run build
	node scripts/check-pages-build.mjs

data: ## regenerate static sample data artifacts
	npm run data

test: ## run unit tests
	npm run test

test-integration: ## run integration tests
	npm run test-integration

smoke: ## build, serve docs/, and run Playwright smoke tests
	npm run smoke

lint: ## run linters and type checks
	npm run lint

fmt: ## autoformat source files
	npm run fmt

pages-preview: ## serve docs/ locally like GitHub Pages
	npm run pages-preview

release: ## tag a local release after checks
	$(MAKE) data
	$(MAKE) test
	$(MAKE) build
	$(MAKE) smoke
	git tag v$$(node -p "require('./package.json').version")

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	.githooks/commit-msg .git/COMMIT_EDITMSG

hooks-pre-push:
	.githooks/pre-push

hooks-post-merge:
	.githooks/post-merge

hooks-post-checkout:
	.githooks/post-checkout

clean: ## remove local build/test output
	rm -rf coverage playwright-report test-results dist dist-ssr node_modules/.tmp
