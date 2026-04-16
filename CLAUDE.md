# Wordsworth AI Page Builder — AI context

Essential project facts. **Deeper Python/React/RBAC style** lives in `.claude/rules/` (path-scoped). This file is loaded for Cursor workspace rules and Claude Code at conversation start.

## Overview

SaaS page builder: FastAPI + SQLModel (PostgreSQL) + Alembic; React 18 + TS + Vite + MUI v6; JWT + Google OAuth; Stripe. Product lives under `app/products/page_builder/`.

**Stack:** TanStack Query, generated OpenAPI client (`frontend/src/client`), Poetry, Task runner, auto-loaded `local.env`.

## Commands

```bash
# Dev
poetry install && poetry run uvicorn main:app --reload --port 8020
cd frontend && npm install && npm run dev

# DB
docker-compose up -d
task db:migrate-up
task db:migrate-create -- "description"
task db:user-create -- --email you@example.com

# After backend API changes
task frontend:generate-client

# Quality
task quality:lint
task quality:test
poetry run pytest
cd frontend && npm run test
```

## Repo layout (short)

**Backend**

```
app/
├── core/           # DB, auth, config, Mongo client
├── shared/         # User, billing, shared routers
├── products/
│   └── page_builder/
main.py             # Routers + product loading
orchestration_service/   # LangGraph AI workflow microservice (port 8081)
```

**Frontend**

```
frontend/src/
├── pages/, components/, hooks/api/   # Shared | PageBuilder
├── client/                           # generated API client
└── theme/, context/, utils/
```

**Config:** `local.env`, `prod.env`, `Taskfile.yml`, `docker-compose.yml`, `alembic.ini`.

## Pitfalls (non-obvious)

| Area | Rule |
|------|------|
| DB | Use `AsyncSession`, not sync `Session` |
| API | Regenerate TS client after OpenAPI changes |
| Auth tokens | Prefer httpOnly cookies — not `localStorage` |
| Migrations | Autogenerate, then **review** before apply |
| OAuth | Redirect URI must match Google Cloud exactly |
| Stripe webhooks | Verify signature with webhook secret |

## Before committing

1. `task quality:lint` and `task quality:test`
2. If backend API changed: `task frontend:generate-client`
3. If models changed: migration created and applied

## Modular rules on disk

| File | Scope |
|------|--------|
| `.claude/rules/backend.md` | Python in `app/`, tests, migrations |
| `.claude/rules/frontend.md` | `frontend/**` |
| `.claude/rules/permissions.md` | RBAC, `PermissionGuard`, `FeaturePermission` |
