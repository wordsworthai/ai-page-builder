# Architecture

`wwai-page-builder` is an AI-powered website builder: users describe their business and the system generates a complete, styled website that can be edited visually and published to a CDN. It is not a general-purpose CMS — it is scoped to generating and publishing single-business landing sites.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.12, FastAPI, SQLAlchemy (async), Alembic |
| Frontend | React 18, TypeScript, Vite, MUI v6, TanStack Query |
| Relational DB | PostgreSQL (users, subscriptions, websites, generations) |
| Document DB | MongoDB (media metadata, generation metrics, orchestration artifacts) |
| Cache / Streaming | Redis (generation progress, real-time node updates) |
| Payments | Stripe (subscriptions + one-time credit packs) |
| File Storage | AWS S3 (published HTML, media, previews, backups) |
| CDN | AWS CloudFront |
| AI Workflows | LangGraph orchestration service (separate process, port 8081) |
| AI Image Generation | Google Gemini (real-time and batch) |
| Auth | JWT (httpOnly cookies) + Google OAuth2 |
| Email | SendGrid |

---

## System Overview

```
User
  │
  ├─ Auth (JWT / Google OAuth)
  │     └── UserService → PostgreSQL (User, Business, BusinessUser)
  │
  ├─ Generate Site
  │     └── POST /api/generations/trigger
  │           ├── CreditService (check balance) ──────────── PostgreSQL
  │           ├── GenerationService (provision DB records) ── PostgreSQL + MongoDB
  │           ├── Redis (initialize progress state)
  │           └── OrchestrationClient ──► LangGraph service (port 8081)
  │                                            │
  │                         node-update webhooks (streaming to Redis)
  │                                            │
  │                        compile-preview webhook (HTML → S3 preview)
  │                                            │
  │                     ◄── completion callback (status, tokens, cost)
  │
  ├─ Media Management
  │     └── Upload / Gemini AI generate / Shutterstock ingest
  │           ├── Binary assets → S3
  │           └── Metadata → MongoDB
  │
  ├─ Edit in Browser
  │     └── Puck editor (React) reads generated HTML preview from S3
  │
  ├─ Publish
  │     └── POST /api/publishing/publish-from-editor
  │           ├── HTML processing (inject Tailwind, meta, CSS)
  │           ├── boto3 → S3 (deterministic hashed folder path)
  │           ├── boto3 → CloudFront (cache invalidation)
  │           └── PostgreSQL (Website, WebsitePage, PagePublishHistory)
  │
  └─ Billing
        └── Stripe Checkout → webhook → Subscription + CreditTransaction
```

---

## Repository Layout

```
app/
├── core/           # DB engines, auth middleware, config, permissions, Redis config
├── shared/         # User/Business models, auth services, payments, connectors
│   ├── models.py   # All PostgreSQL ORM tables
│   ├── router.py   # Aggregated shared routers (/api/auth, /api/payments, ...)
│   ├── config/     # Stripe + credit system configuration
│   ├── controllers/
│   └── services/   # auth, payments, orchestration, streaming, connectors
└── products/
    └── page_builder/
        ├── router.py    # Aggregated page builder routers
        ├── models.py    # Website, WebsitePage, Generation, PagePublishHistory
        ├── config/      # AWS, GCP, plans registration, credit costs
        ├── controllers/ # generation, publishing, media
        └── services/    # generation, publishing, media (upload, Gemini, Shutterstock)

orchestration_service/   # Standalone FastAPI microservice (port 8081)
├── main.py              # App bootstrap; pre-sets env vars before package imports
├── config.py            # Settings (MongoDB, Redis, LLM keys, AWS)
├── routers/             # Workflow trigger endpoints
└── services/            # LangGraph workflow runner with webhook callbacks

frontend/src/
├── pages/          # Route-level components
├── components/     # Shared + PageBuilder-specific UI components
├── hooks/api/      # TanStack Query hooks (generated from OpenAPI)
├── client/         # Generated TypeScript API client
└── config/env.ts   # Centralized env var access

main.py             # FastAPI app: registers middleware, routers, lifespan hooks
```

---

## Key Modules

| Module | Responsibility |
|--------|---------------|
| `app/core/config.py` | Loads all env vars at startup; provides `config` singleton used everywhere |
| `app/core/auth_backend.py` | Starlette middleware that validates JWT from httpOnly cookie on every request |
| `app/core/permissions.py` | Maps `PlanType` (FREE / BASIC / CUSTOM) → `FeaturePermission` set |
| `app/core/access_control.py` | `@require_permission` / `@require_plan` decorators; `PlanChecker` utility for service-layer checks |
| `app/shared/models.py` | All PostgreSQL ORM tables — single source of truth for the data schema |
| `app/shared/services/auth/users_service.py` | Signup, login, email verification, password reset, Google OAuth account merging, JWT creation |
| `app/shared/services/payments/payment_manager.py` | Wraps Stripe SDK: checkout sessions, subscription management, customer portal |
| `app/shared/services/payments/credit_service.py` | Credit ledger: balance queries, credit grants, `deduct_credits_for_operation()`, full audit trail |
| `app/shared/services/payments/webhook_handler.py` | Validates Stripe signatures and routes all webhook events; grants credits on subscription |
| `app/shared/services/orchestration/orchestration_client.py` | HTTP client singleton to the LangGraph service; Google ID token auth in Cloud Run |
| `app/products/page_builder/controllers/generation/internal.py` | Webhook receiver: node updates → Redis, completion callback → DB + credits, preview HTML → S3 |
| `app/products/page_builder/services/publishing/publishing_service.py` | HTML processing → S3 upload (hashed path) → CloudFront invalidation → DB update |
| `app/products/page_builder/services/media/media_service.py` | Media upload (images/video), Shutterstock stock ingestion, S3 + MongoDB storage |
| `app/products/page_builder/services/media/gemini_service.py` | Gemini AI image generation: real-time and batch APIs; deduplication; S3 + MongoDB storage |

---

## Key Abstractions

| Name | Module | What it is |
|------|--------|-----------|
| `Business` | `app/shared/models.py` | Top-level multi-tenancy unit. All websites, credits, and analytics are scoped to a `business_id`. Users belong to businesses via `BusinessUser` (many-to-many with roles). |
| `BusinessCredits` | `app/shared/models.py` | Single mutable credit balance per business. All changes produce an immutable `CreditTransaction` row for auditing. |
| `Generation` | `app/products/page_builder/models.py` | Immutable record of one generation attempt: trigger type, status (pending → processing → completed / failed), tokens used, cost. |
| `WebsitePage` | `app/products/page_builder/models.py` | Per-page publishing metadata: last S3 path, CloudFront URL, invalidation ID, publish count. Storage path is a deterministic hash of the subdomain. |
| `PlanType / FeaturePermission` | `app/core/permissions.py` | Enum-based plan-to-feature mapping. `PLAN_FEATURES[PlanType.BASIC]` returns the set of permitted `FeaturePermission` values. All gating goes through `PlanChecker`. |
| `payment_config` | `app/shared/config/payments.py` | Singleton registry of all Stripe products and prices. Product modules register themselves at startup via `register_products()` — adding a new product requires no changes to payment infrastructure. |
| `WorkflowTriggerType` | `app/products/page_builder/config/credits.py` | Enum mapping workflow operations to credit cost, transaction type, and display label — single source of truth for pricing. |
| `PaymentManager` | `app/shared/services/payments/payment_manager.py` | Single façade for all Stripe operations. No other module calls Stripe directly. |

---

## Core Data Flows

### Generation (AI → Editor)

| Phase | Input | Output |
|-------|-------|--------|
| Credit check | `business_id`, trigger type | Pass / HTTP 402 |
| Asset provisioning | Business context, generation params | `Generation`, `Website`, `WebsitePage` rows in PostgreSQL; workflow input in MongoDB |
| Progress init | `generation_version_id` | Redis key `generation:{id}` with status=pending (TTL 3600s) |
| Workflow dispatch | `LandingPageInput` + callback URLs | Async POST to orchestration service; returns immediately |
| Streaming updates | Node completion events from orchestration service | Appended to Redis execution log; frontend polls `/status` |
| Preview compile | HTML file from orchestration | Processed HTML uploaded to S3 preview bucket; `preview_link` set in DB + Redis |
| Completion callback | Status, tokens, cost from orchestration | `Generation.status = completed`; credits deducted; metrics persisted to MongoDB |

### Publishing (Editor → CDN)

| Phase | Input | Output |
|-------|-------|--------|
| Subdomain check | Subdomain string | Available / HTTP 409 |
| HTML processing | Raw HTML (≤10 MB) | Tailwind, meta tags, favicon, and base CSS injected |
| S3 upload | Processed HTML + favicon + CSS boilerplate | Objects at `{hash(subdomain)}/index.html` (deterministic path) |
| Backup | Previous version | Copy at `backups/{business_id}/{timestamp}/` |
| CloudFront invalidation | Distribution ID, page path | Invalidation ID; CDN serves new version |
| DB update | S3 path, CloudFront URL | `WebsitePage` updated; `PagePublishHistory` row created |

### Billing (Stripe → Credits)

| Phase | Input | Output |
|-------|-------|--------|
| Checkout | `product_id` | Stripe-hosted checkout URL |
| Payment complete | Stripe `charge.succeeded` webhook | Signature validated |
| Subscription created | Stripe customer ID | `Subscription` row; `User.current_plan = BASIC` |
| Credit grant | `business_id`, grant amount | `BusinessCredits.balance += 100`; `CreditTransaction` audit row |
| Monthly renewal | `invoice.payment_succeeded` webhook | Repeat credit grant (idempotent via `reference_id`) |

---

## External Services

| Service | Purpose | Required Env Vars |
|---------|---------|-------------------|
| PostgreSQL | Users, businesses, subscriptions, websites, generation records | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` |
| MongoDB | Media metadata, generation performance metrics, orchestration workflow artifacts | `MONGODB_URL`, `AGENT_MONGODB_URL` |
| Redis | Real-time generation progress and node execution log | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| AWS S3 | Published HTML, media uploads, preview HTML, page backups | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `S3_MEDIA_BUCKET_NAME`, `S3_PREVIEW_BUCKET_NAME` |
| AWS CloudFront | CDN distribution for published sites | `CLOUDFRONT_DISTRIBUTION_ID`, `CLOUDFRONT_DOMAIN` |
| Stripe | Subscription billing, one-time credit packs, webhook events | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Google Gemini | AI image generation for media library (real-time and batch) | `GEMINI_API_KEY` |
| Google OAuth2 | Optional social login; merges with email accounts | `GOOGLE_OAUTH2_CLIENT_ID`, `GOOGLE_OAUTH2_SECRET`, `GOOGLE_OAUTH2_REDIRECT_URI` |
| SendGrid | Transactional email (verification, password reset) | `SENDGRID_API_KEY` |
| LangGraph Orchestration | AI workflow execution (separate service) | `ORCHESTRATION_SERVICE_URL` |
| Nango | Third-party OAuth connectors (Google Drive sync) | `NANGO_BASE_URL`, `NANGO_SECRET_KEY`, `NANGO_WEBHOOK_SECRET` |
| Google BigQuery | Website visitor analytics queries | `GCP_PROJECT_ID`, `BIGQUERY_DATASET` |

---

## Multi-tenancy Model

```
User  ──(BusinessUser)──  Business
                              │
                    ┌─────────┴──────────┐
                 Website          BusinessCredits
                    │
              WebsitePage(s)
                    │
             Generation(s)
```

- A `User` can belong to multiple `Business` accounts via `BusinessUser` (role: owner / editor / viewer).
- All page builder resources (`Website`, `WebsitePage`, `Generation`) are scoped to a `business_id`.
- Credits (`BusinessCredits`) are per-business, not per-user.
- Plan enforcement reads the `Subscription` linked to the `User` who owns the business.

---

## Authentication

All API routes (except `/api/auth/*` and `/health`) require a valid JWT stored in an httpOnly cookie. The `JWTAuthenticationBackend` Starlette middleware validates the cookie on every request and injects the authenticated `User` into the request scope.

Plan-gated endpoints additionally call `PlanChecker(user, db).require_permission(FeaturePermission.X)`, which reads the user's active `Subscription` to determine their `PlanType`.

The orchestration service uses Google Cloud ID tokens for authentication when running in Cloud Run; no auth is required in local development.
