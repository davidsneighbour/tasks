# Tasks (T)

A local-first PWA providing a richer interface on top of Google Tasks. See [AGENTS.md](AGENTS.md) for the project overview and agent working instructions.

## Development

```bash
cp .env.example .env   # then fill in Google OAuth credentials
npm install
npm run db:migrate
npm run dev
```

## Project layout

* [src/server/](src/server/) — Fastify server: Google Tasks client ([google/](src/server/google/)), sync and reconciliation ([sync/](src/server/sync/)), SQLite schema and migrations ([db/](src/server/db/)), task, label, and star services, views, and API routes ([api/](src/server/api/)).
* [src/client/](src/client/) — React PWA: app shell, task list and detail panel, label and star pickers, and sync status.
* [src/shared/](src/shared/) — types and constants shared by the server and the client (API types, label palette, star types).

## Container

```bash
docker compose up --build
```

Serves on port `3070`, reachable from any device on the LAN by default (set `HOST=127.0.0.1` in `.env` to restrict to localhost only — this app has no auth in front of it). Persistent data lives in `./data/tasks.sqlite` on the host.
