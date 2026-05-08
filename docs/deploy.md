# Deploy

Live URL:

https://baditaflorin.github.io/read-later-curriculum/

Repository:

https://github.com/baditaflorin/read-later-curriculum

## Publishing Strategy

GitHub Pages serves from `main/docs`.

Build locally:

```sh
make build
git add docs package.json package-lock.json src scripts
git commit -m "feat: update pages build"
git push origin main
```

## Enable Pages

Pages source should be:

- Branch: `main`
- Folder: `/docs`

The repository can be configured with:

```sh
gh api repos/baditaflorin/read-later-curriculum/pages \
  --method POST \
  --field source.branch=main \
  --field source.path=/docs
```

If Pages already exists, update it with:

```sh
gh api repos/baditaflorin/read-later-curriculum/pages \
  --method PUT \
  --field source.branch=main \
  --field source.path=/docs
```

## Rollback

Revert the publishing commit and push:

```sh
git revert <commit>
git push origin main
```

## Custom Domain

Add `docs/CNAME` containing the domain, then configure DNS with a CNAME to:

```text
baditaflorin.github.io
```

GitHub Pages does not support `_headers` or `_redirects`. SPA fallback is
handled by copying `docs/index.html` to `docs/404.html`.
