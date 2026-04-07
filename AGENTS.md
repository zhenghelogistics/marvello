<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git & PR Protocol

**Never push directly to `main`.** All changes must go through a pull request so CodeRabbit can review before merging.

## Workflow for every change

1. Create a feature branch: `git checkout -b feat/your-feature-name`
2. Make changes and commit
3. Push the branch: `git push origin feat/your-feature-name`
4. Open a PR on GitHub targeting `main`
5. Wait for CodeRabbit to post its review
6. Address any critical findings, then merge

## Branch naming
- `feat/` — new features
- `fix/` — bug fixes
- `chore/` — config, deps, cleanup
- `refactor/` — code restructuring without behavior change

## Commit style
Keep commit messages short and imperative: `feat: add campaign delete`, `fix: resolve 60s timeout in pipeline`
