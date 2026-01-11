# AGENTS.md

This file guides code agents in this repository.

## Repository Overview
- Turborepo monorepo.
- `packages/domet`: npm package (React scroll-spy hook).
- `website`: Next.js + Fumadocs site.
- `scripts`: internal scripts (including doc sync).

## Main Commands (root)
- `npm run dev`: start all servers.
- `npm run build`: build all packages.
- `npm run lint`: global lint.
- `npm run test`: global tests.

## Package Commands `packages/domet`
- `npm run build`: compile TypeScript.
- `npm run dev`: watch mode.
- `npm test`: Vitest tests.
- `npm test -- --watch`: Vitest watch.
- `npm test -- useDomet.test.tsx`: run a single test file.

## Commands `website`
- `npm run dev`: Next.js dev (Turbopack).
- `npm run build`: production build.

## Tests (Vitest)
- Tests in `packages/domet/src/__tests__`.
- `jsdom` environment.
- Mock `IntersectionObserver` and `getBoundingClientRect` to simulate scroll.
- Tests should cover non-obvious behaviors (explicit names for edge cases).

## General Style
- TypeScript + React, `.ts`/`.tsx` files.
- Use small, readable functions.
- Avoid unnecessary complexity.
- Do not add comments in code.
- Do not add TODOs without explicit agreement.

## Imports
- Standard order: React/external → types → internal.
- Use `import type` for types.
- Group related imports (no random imports).
- Avoid circular imports.

## Formatting
- Double quotes `"`.
- Semicolons.
- 2-space indentation.
- Trailing commas in multiline objects/arrays.
- Readable multiline JSX, avoid long attributes on a single line.

## Types
- Favor explicit types when readability depends on it.
- Prefer unions/dedicated types over magic strings.
- Keep exported types in `packages/domet/src/types.ts`.
- Use `Record`, `Map` and `Set` when relevant.

## Naming
- `camelCase` for variables/functions.
- `PascalCase` for React components.
- `SCREAMING_SNAKE_CASE` for constants.
- Avoid single-letter names.

## Hooks & React
- Stabilize handlers with `useCallback` if necessary.
- Stabilize derived lists with `useMemo`.
- Use `useRef` for mutable values outside render.
- Avoid unnecessary effects and missing dependencies.

## Scroll Handling (hook `useDomet`)
- Algorithm based on visibility scores + trigger line proximity.
- Hysteresis to prevent oscillations.
- Uses `requestAnimationFrame` for calculation.
- Configurable throttle (default 10 ms).
- Properly handle container changes (`ref.current`).

## Error Messages and Warnings
- Always in English.
- Format: `[context] Description.` or `Description.`.
- No jargon, no long sentences.
- Examples:
  - `[domet] Invalid offset value: ${value}. Using default.`
  - `Invalid format. Use a number (e.g. 100) or percentage (e.g. 10%).`
  - `Value clamped to ±${max}px.`

## Documentation (website/content/documentation.mdx)
- In `## Examples`, each example with a title must have a description.
- Code block ≤2 lines: no `showLineNumbers`.
- Code block >2 lines: add `showLineNumbers`.

## Auto-Generated Files (DO NOT EDIT)
- `README.md`
- `website/public/llms.txt`
- `packages/domet/README.md`
- `website/config/site.ts` (only `APP_NAME`/`APP_DESCRIPTION`)
- Edit `website/content/documentation.mdx`, then run the sync script.

## Best Practices for Modifications
- Fix the root cause (no superficial patches).
- Do not fix bugs outside scope.
- Keep changes minimal and targeted.
- Align style with neighboring files.

## Release / Package
- Public exports are in `packages/domet/src/index.ts`.
- Maintain API compatibility when modifying signatures.
- Document public changes in docs before release.

## Security & Quality
- No secrets in the repo.
- Do not commit `.env` files or equivalents.
- Do not modify auto-generated files.

## Points of Attention
- The docs site (`website`) may not reflect the package if docs are not synced.
- Prefer targeted unit tests for any non-trivial logic.

## Quick Reminder
- Always check rules in `AGENTS.md`.
- Use `npm test -- useDomet.test.tsx` for an isolated test.
- Keep user messages clear and in English.
