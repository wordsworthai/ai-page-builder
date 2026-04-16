# WWAI Orchestration Service

AI workflow microservice (SMB recommendation, template recommendation, media matching). Uses `wwai_agent_orchestration`, which requires **Redis** for LangGraph checkpointing.

## Redis (required for workflows)

SMB workflow trigger will fail with 503 if Redis is not running. Use the same host/port as your env (e.g. `REDIS_HOST`, `REDIS_PORT`; default often `localhost:6380`).

**Start Redis locally:**

```bash
# Default port 6379
redis-server

# Or port 6380 (if your env uses 6380)
redis-server --port 6380
```

**Docker:**

```bash
docker run -d -p 6380:6379 --name redis redis:alpine
```

Ensure `REDIS_HOST` and `REDIS_PORT` in the orchestration service env (e.g. `local.env` or `.env`) match the running Redis.

## MongoDB (required for section/template data)

The workflow reads section data from MongoDB (e.g. `developer_hub_prod` / `developer_hub_prod_sections`). The service uses **AGENT_MONGODB_URL first, secret fallback**: if `AGENT_MONGODB_URL` (or `MONGODB_URL`) is set in the env (e.g. prod.env), the orchestration package is configured with that URI before any DB access; otherwise it falls back to its env-based config (Secret Manager for prod/uat, or dev to localhost:27020).

**Set `AGENT_MONGODB_URL`** (or `MONGODB_URL`) in the orchestration service env to the **same** MongoDB connection the main backend uses for agent orchestration (e.g. the backend's `agent_mongodb_url`). If neither is set, the package uses Secret Manager (e.g. `mongodb-styling-ip-uat`) or local config, which may not have `developer_hub_prod` or ACTIVE sections, causing “No sections found” and workflow failure.

Optional: `MONGODB_DATABASE` (default `template_generation`) is used as the default db name for the connection; the package still accesses `developer_hub_prod` and other DBs on the same URI.

**HTML compilation (post-processing):** The workflow uses `ENVIRONMENT` and `NODE_SERVER_URL` (default `http://localhost:3002`) for template compilation. If you run post-processing, the Node server must be running on that URL; otherwise set `NODE_SERVER_URL` or disable post-processing in execution config.

## Stuck at "Finalizing autopopulation" or "Completing website"

The main app sends `enable_html_compilation=False` by default, so **html_compilation** and **screenshot_capture** are skipped. The graph goes `autopop_end → END`, the stream ends, and this service calls the completion callback (`POST` to the main app’s `callback_url`).

If the run stays "processing" with current node **"Finalizing autopopulation"** or **"Completing website"**, either (1) the workflow stream never ended (so the callback was never sent), or (2) the **completion callback failed** (main app never received it or returned an error).

**How to check:**

1. **Orchestration logs** – Search for:
   - `"Background workflow completed successfully"` → stream ended; then look for `"Callback webhook succeeded"` or `"Failed to send callback webhook"`.
   - `"Failed to send callback webhook"` → note the logged `error` and `callback_url`; the log also suggests checking `BACKEND_URL`.
2. **Callback URL** – Main app builds `callback_url` from **`BACKEND_URL`**. That URL must be reachable **from this service**. If orchestration runs in Docker/Cloud and the main app uses `http://localhost:8020`, the callback will fail (e.g. connection refused). Set `BACKEND_URL` in the main app env to the main app’s URL as seen from the orchestration host (e.g. `http://host.docker.internal:8020` for Docker, or the main app’s public URL).
3. **Main app logs** – If callback was sent, check main app for `"Callback received"` / `"Callback processed"` or `"Callback failed"` and fix any 500 or exception.

**Full step-by-step:** See [docs/TROUBLESHOOTING_STUCK_GENERATION.md](../docs/TROUBLESHOOTING_STUCK_GENERATION.md) in the repo root.

After fixing, new runs should complete; existing stuck runs will not auto-recover.

## Run

```bash
# From repo root
task dev   # runs backend + orchestration

# Or orchestration only (from repo root)
cd orchestration_service && PYTHONPATH=.. poetry run uvicorn orchestration_service.main:app --host 0.0.0.0 --port 8081 --reload
```
