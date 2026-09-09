# Tasks (T)

A local-first PWA providing a richer interface on top of Google Tasks. See [scratch/plan.md](scratch/plan.md) for the full design, and [AGENTS.md](AGENTS.md) for agent working instructions.

## Development

```bash
cp .env.example .env   # then fill in Google OAuth credentials
npm install
npm run db:migrate
npm run dev
```

## Container

```bash
docker compose up --build
```

Serves on `127.0.0.1:3000`. Persistent data lives in `./data/tasks.sqlite` on the host.
