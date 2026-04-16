# Usage

## Prerequisites

- Python 3.12+
- Node.js 18+
- Docker (for PostgreSQL, MongoDB, Redis)
- [Task](https://taskfile.dev) runner (`brew install go-task` on macOS)
- [Poetry](https://python-poetry.org/) (`pip install poetry`)

## Installation

```bash
git clone <repository-url>
cd wwai-page-builder

# Backend
poetry install

# Frontend
cd frontend && npm install && cd ..

# Environment
task setup-env          # copies local.env.example → local.env
# Edit local.env with your values (see Configuration below)
```

Or use the all-in-one setup:

```bash
task full-setup
```

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL + MongoDB + Redis)
task db:docker-start          # starts containers + runs migrations

# 2. Start all services (backend + orchestration + Redis)
task dev

# 3. Start frontend (separate terminal)
task frontend:run             # React dev server at http://localhost:5173

# 4. Create an admin account
task db:user-create -- --email you@example.com --password yourpassword --full_name "Your Name"
```

The backend API docs are at http://localhost:8020/docs.

---

## Running Services

The app has three services. Run each in a separate terminal, or use `task dev` for the backend pair.

### Backend API

```bash
task backend:run              # FastAPI on port 8020 (auto-reloads, loads local.env)
```

### Orchestration Service

```bash
task orchestration:run        # LangGraph workflows on port 8081 (auto-reloads)
```

Requires its own `poetry install` in `orchestration_service/`:

```bash
task orchestration:install
```

### Frontend

```bash
task frontend:run             # Vite dev server on port 5173
```

For development with the Puck editor in watch mode (auto-rebuilds on Puck changes):

```bash
task dev-fe
```

### All Backend Services at Once

```bash
task dev                      # starts Redis, orchestration (8081), and backend (8020)
task stop-dev                 # kills both backend and orchestration processes
```

---

## Database

PostgreSQL, MongoDB, and Redis run via Docker Compose.

```bash
task db:docker-start          # start all containers + apply migrations
task db:mongo-start           # start MongoDB only
task start-redis              # start Redis only (port 6380)
```

### Migrations (Alembic)

```bash
task db:migrate-up                    # apply all pending migrations
task db:migrate-create -- "description"   # create new migration
task db:migrate-down                  # rollback one migration
task db:migrate-current               # show current version
task db:migrate-history               # show full migration history
```

### Superuser

```bash
task db:user-create -- --email admin@example.com --password secret --full_name "Admin"
```

---

## Payments (Stripe)

### Setup

1. Create a [Stripe](https://stripe.com) account (use test mode)
2. Copy your API keys into `local.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Create products and prices:
   ```bash
   task payments:products-create
   ```
   This prints the Stripe price IDs. Copy them into `local.env`:
   ```
   STRIPE_PRICE_PB_BASIC=price_...
   STRIPE_PRICE_PB_CREDITS_100=price_...
   ```
4. Verify the setup:
   ```bash
   task payments:test-integration
   ```

### Webhook Events

Configure your Stripe webhook endpoint (`https://yourdomain.com/api/payments/webhook`) to receive:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `charge.succeeded`
- `charge.refunded`

For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:8020/api/payments/webhook
```

---

## API Client Generation

After changing backend API endpoints, regenerate the TypeScript client:

```bash
task frontend:generate-client
```

This reads the OpenAPI spec from the running backend and writes to `frontend/src/client/`.

---

## Testing

```bash
task quality:test              # run all tests (backend + frontend)
task quality:test-backend      # backend only (pytest)
task quality:test-frontend     # frontend only (vitest)
```

---

## Frontend Build

```bash
task frontend:build            # production build → frontend/dist/
task frontend:preview          # preview production build locally
```

---

## Configuration

All backend configuration loads from `local.env` (dev) or `prod.env` (production) via Pydantic Settings. See `local.env.example` for all variables with inline comments.

### Required (Day 1)

| Variable | Purpose | Default |
|----------|---------|---------|
| `db_username` | PostgreSQL user | `pagebuilder` |
| `db_password` | PostgreSQL password | `pagebuilder` |
| `db_host` | PostgreSQL host | `localhost` |
| `db_port` | PostgreSQL port | `54323` |
| `db_database` | PostgreSQL database | `pagebuilder` |
| `mongodb_url` | MongoDB connection URI | `mongodb://localhost:27020` |
| `mongodb_database` | MongoDB database name | `businesses` |
| `secret_key` | JWT signing secret | `dev-secret-key-...` |
| `domain` | Frontend URL (for CORS + cookies) | `http://localhost:5173` |
| `BACKEND_URL` | Backend URL | `http://localhost:8020` |
| `redirect_after_login` | Post-login redirect URL | `http://localhost:5173/dashboard` |

### Payments (required for billing features)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret API key (`sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_PB_BASIC` | Price ID for BASIC plan |
| `STRIPE_PRICE_PB_CREDITS_100` | Price ID for 100-credit pack |

### Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `google_oauth2_client_id` | Google OAuth client ID | _(disabled)_ |
| `google_oauth2_secret` | Google OAuth secret | _(disabled)_ |
| `SENDGRID_API_KEY` | SendGrid for transactional email | _(emails disabled)_ |
| `NANGO_SECRET_KEY` | Nango connectors (Google Drive, etc.) | _(connectors disabled)_ |
| `SHUTTERSTOCK_API_TOKEN` | Stock photo search | _(disabled)_ |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6380` |

### AWS (required for publishing)

| Variable | Purpose |
|----------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (default: `us-east-1`) |
| `S3_BUCKET_NAME` | S3 bucket for published HTML |
| `S3_MEDIA_BUCKET_NAME` | S3 bucket for media uploads |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `CLOUDFRONT_DOMAIN` | CloudFront domain |

### Frontend

Frontend env vars are set in `frontend/.env` (prefixed with `VITE_`):

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8020` |
| `VITE_API_BASE_URL` | API v1 base URL | `http://localhost:8000/api/v1` |
| `VITE_AGENTIC_BASE_URL` | API v2 base URL | `http://localhost:8000/api/v2` |
| `VITE_API_SECTION_URL` | Section API URL | `http://localhost:8030/api` |
| `VITE_PUBLISHING_DOMAIN` | Domain for published sites | `example.com` |

---

## Docker

### Development (databases only)

```bash
docker compose up -d          # PostgreSQL (54323), MongoDB (27020), Redis (6380)
docker compose down           # stop all
```

### Production (full backend)

```bash
task backend:docker-build     # build image
task backend:docker-run       # run on port 8020
task backend:docker-stop      # stop container
```

---

## Common Task Commands

| Command | Description |
|---------|-------------|
| `task help` | Show all available commands |
| `task dev` | Start Redis + backend + orchestration |
| `task frontend:run` | Start frontend dev server |
| `task db:docker-start` | Start DBs + apply migrations |
| `task db:user-create -- --email ...` | Create superuser |
| `task db:migrate-up` | Apply pending migrations |
| `task db:migrate-create -- "msg"` | Create new migration |
| `task frontend:generate-client` | Regenerate TypeScript API client |
| `task payments:products-create` | Create Stripe test products |
| `task quality:test` | Run all tests |
| `task health-check` | Check all service health |
| `task backend:config-test` | Validate configuration loading |
