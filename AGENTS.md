# AGENTS.md

Canonical, tool-agnostic source of instructions for AI agents working in this repository. Current Claude Code and Codex releases read this file natively; no per-agent adapter file is required.

## Project overview

**Name:** Tasks (short name: T)

Tasks is a local-first PWA that provides a richer interface on top of Google Tasks ("GT"). It is intended exclusively for personal local use.

Core points:

* Google Tasks is the single source of truth for tasks and task state. If GT and the local SQLite cache disagree on a GT-owned field, GT wins.
* The app maintains a local SQLite database containing a mirror of GT data (for fast rendering/filtering) plus T-specific metadata GT does not support (labels, colours, icons, stars, view configuration).
* Recommended stack: TypeScript, Node.js, React, Vite, React Router, `vite-plugin-pwa`, with a small Node server alongside the frontend and SQLite for storage.
* Explicitly out of scope: hosted SaaS, multi-user support, collaboration features, an alternative task backend, or offline-first conflict resolution.

## Current repository state

The project is scaffolded: TypeScript, React, Vite, Fastify (server), Drizzle (SQLite), ESLint, and Vitest/Playwright are in place. There is no CI configured yet.

Key npm scripts (see `package.json` for the full list):

* `npm run dev` — run client and server together for local development (runs DB migrations first).
* `npm run check` — lint and type-check; run this before considering a change done.
* `npm test` — Vitest unit tests; `npm run test:e2e` — Playwright end-to-end tests.
* `npm run db:generate` / `npm run db:migrate` — Drizzle schema and migrations.

Conventions:

* Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` all on) — keep new code compatible with these settings.
* ESM throughout (`"type": "module"`).
* Node `>=26` (see `engines` in `package.json`).
* Commit messages follow Conventional Commits (see `git log`).

There are no established commit-message scope conventions beyond Conventional Commits, and no CI pipeline yet. When either is added, update this section and `.agents/instructions/` accordingly rather than leaving agents to guess.
