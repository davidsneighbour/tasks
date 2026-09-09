# AGENTS.md

Canonical, tool-agnostic source of instructions for AI agents working in this repository. Agent-specific files (for example `CLAUDE.md`) are thin adapters that point back here; they must not duplicate this content.

## Project overview

**Name:** Tasks (short name: T)

Tasks is a local-first PWA that provides a richer interface on top of Google Tasks ("GT"). It is intended exclusively for personal local use.

Core points:

* Google Tasks is the single source of truth for tasks and task state. If GT and the local SQLite cache disagree on a GT-owned field, GT wins.
* The app maintains a local SQLite database containing a mirror of GT data (for fast rendering/filtering) plus T-specific metadata GT does not support (labels, colours, icons, stars, view configuration).
* Recommended stack: TypeScript, Node.js, React, Vite, React Router, `vite-plugin-pwa`, with a small Node server alongside the frontend and SQLite for storage.
* Explicitly out of scope: hosted SaaS, multi-user support, collaboration features, an alternative task backend, or offline-first conflict resolution.

The full design — data model, synchronisation model, sync locking, API structure, backend module layout — is written up in [scratch/plan.md](scratch/plan.md). Read it before implementing anything in this repository; it is the authoritative design reference until that content is promoted into proper project documentation (e.g. a `docs/` tree or `README.md`).

## Current repository state

As of this writing, the repository contains only this planning document — no `package.json`, source tree, tests, or CI have been scaffolded yet, and there are no commits. There are therefore no established build, test, lint, or commit-message conventions to follow yet.

When scaffolding the project for the first time, follow the stack and architecture described in `scratch/plan.md`. Once real tooling exists (package manager, test runner, linter, CI), this file and `.agents/instructions/` should be updated to document those conventions rather than leaving agents to guess or re-derive them each session.

## Agent-specific files

* `CLAUDE.md` — Claude Code adapter; imports this file and adds only genuinely Claude-specific instructions.
