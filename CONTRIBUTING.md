# Contributing

Keep changes focused on catalog-coordinate provenance. Read `docs/methodology.md` and `docs/scientific-limitations.md` before changing classifications or scientific language.

Run `uv sync --locked`, `pnpm install --frozen-lockfile`, `uv run pytest -q`, `pnpm test`, `pnpm typecheck` and `pnpm build`. Tests use bundled source data and require no remote catalog service.

For a data update, record the source revision and SHA-256, regenerate the snapshot and reports together, explain changed counts, and retain dataset attribution. Never edit normalized coordinates to remove placeholders. Include regression tests for rule changes and increment the rules version when semantics change.

For UI changes, verify keyboard operation and narrow screens, keep both maps aligned, preserve station markers independently, and distinguish full-catalog metrics from filtered selection counts. Include screenshots with visual changes.
