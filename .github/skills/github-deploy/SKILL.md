---
name: github-deploy
description: "Set up GitHub Actions CI/CD and GitHub Pages for turbo-games. Use when: adding CI pipeline, setting up automated builds, deploying a game to GitHub Pages, configuring branch protection, adding test/lint/build workflows, publishing packages, setting up PR checks, automating releases. Covers workflow YAML authoring, Pages configuration, secrets, pnpm caching, monorepo filtering."
argument-hint: "Describe what you want to deploy or automate (e.g. 'deploy clicker to GitHub Pages', 'add CI for all packages')"
---

# github-deploy

Sets up GitHub Actions CI/CD workflows and GitHub Pages deployments for the **turbo-games** monorepo.

## When to Use

- Adding a new CI/CD pipeline (lint, typecheck, build)
- Deploying a game from `packages/games/<name>` to GitHub Pages
- Configuring PR status checks
- Publishing core packages to npm
- Setting up automated releases

## Repository Context

- **Monorepo tool**: pnpm 10.7 workspaces
- **Build**: `pnpm -r build` (all packages), `pnpm --filter @turbo-games/<name> build` (single)
- **Dev server**: Vite (games only)
- **Deploy output**: `packages/games/<name>/dist/`
- **GitHub repo**: `Mazot/turbo-games`
- **Pages source**: deploying `dist/` via the `github-pages` artifact

See [workflow templates](./references/workflows.md) for ready-to-use YAML.

## Procedure

### A. Add a CI workflow (lint + typecheck + build)

1. Read the current `package.json` scripts and existing `.github/workflows/` files to avoid duplication.
2. Create `.github/workflows/ci.yml` using the [CI template](./references/workflows.md#ci).
3. Key points for this monorepo:
   - Use `pnpm/action-setup@v4` with `version: 10.7.0`
   - Cache pnpm store: `~/.local/share/pnpm/store`
   - Run `pnpm install --frozen-lockfile`
   - Run `pnpm -r build` to build all packages
   - Run `pnpm -r lint` if lint scripts exist

### B. Deploy a game to GitHub Pages

1. Confirm the game's `vite.config.ts` has `base` set correctly:
   - For `https://mazot.github.io/turbo-games/`: `base: '/turbo-games/'`
   - For a custom domain: `base: '/'`
   - Add `base` to `vite.config.ts` if missing.
2. Enable GitHub Pages in the repository:
   - Source: **GitHub Actions** (not a branch)
   - Settings → Pages → Source → "GitHub Actions"
3. Create `.github/workflows/deploy-<game-name>.yml` using the [Pages deploy template](./references/workflows.md#pages-deploy).
4. The workflow must:
   - Trigger on push to `master` (or `main`)
   - Build only the target game: `pnpm --filter @turbo-games/<name> build`
   - Upload `packages/games/<name>/dist/` as a Pages artifact
   - Deploy via `actions/deploy-pages@v4`

### C. Add PR checks (branch protection)

1. Create `.github/workflows/pr-check.yml`:
   - Trigger: `pull_request` to `master`
   - Steps: install → build → lint
2. After the workflow exists, remind the user to enable branch protection in:
   - Settings → Branches → Add rule → require status checks to pass.

### D. Secrets and environment variables

- Secrets go in **Settings → Secrets and variables → Actions**.
- Reference in workflow: `${{ secrets.SECRET_NAME }}`
- Never hardcode secrets in workflow YAML.
- For Pages deployments, no extra secrets needed — the built-in `GITHUB_TOKEN` is sufficient.

## Quality Checks

Before finishing, verify:
- [ ] `pnpm/action-setup` version matches `packageManager` in root `package.json`
- [ ] `base` in `vite.config.ts` matches the Pages URL path
- [ ] Workflow triggers (`on:`) are correct for the use case
- [ ] `permissions: contents: read` + `pages: write` + `id-token: write` set for Pages jobs
- [ ] No hardcoded secrets

## Output

Produce the workflow YAML file(s) in `.github/workflows/`. If `vite.config.ts` needs a `base` update, apply that too. Summarize:
- What was created/changed
- The Pages URL the game will be available at
- Any manual steps required in GitHub Settings
