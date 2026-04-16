# Architecture

`wwai-page-builder` is an AI-powered website builder: users describe their business and the system generates a complete, styled website that can be edited visually and published to a CDN. It is not a general-purpose CMS — it is scoped to generating and publishing single-business landing sites.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11, FastAPI, SQLAlchemy (async), Alembic |
| Frontend | React 18, TypeScript, Vite, MUI v6, TanStack Query |
| Relational DB | PostgreSQL (users, subscriptions, websites, generations) |
| Document DB | MongoDB (template JSON, form submissions, media metadata) |
| Cache / Streaming | Redis (generation progress, WebSocket state) |
| Payments | Stripe (subscriptions + one-time credit packs) |
| File Storage | AWS S3 (published HTML, media, previews) |
| CDN | AWS CloudFront |
| AI Workflows | LangGraph orchestration service (separate process) |
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
  │           ├── GenerationService (provision DB records) ── PostgreSQL
  │           ├── MongoDB (store workflow input)
  │           ├── Redis (initialize progress state)
  │           └── OrchestrationClient ──► LangGraph service
  │                                            │
  │                     ◄── callback (compiled template JSON)
  │                                            │
  │                                       MongoDB (store template)
  │
  ├─ Edit in Browser
  │     └── GET /api/template/{id} → compiled template → Puck editor (React)
  │
  ├─ Publish
  │     └── POST /api/publishing/publish-from-editor
  │           ├── HTML processing + MD5 hash
  │           ├── boto3 → S3 (hashed folder path)
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
        ├── models.py    # Website, WebsitePage, GenerationVersion, PagePublishHistory
        ├── config/      # AWS, GCP, plans registration
        ├── controllers/ # generation, publishing, template management, media
        └── services/    # generation, publishing, media, analytics

frontend/src/
├── apps/           # App entry point
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
| `app/core/auth_backend.py` | Starlette middleware that validates JWT from cookie on every request |
| `app/core/permissions.py` | Maps `PlanType` (FREE / BASIC / CUSTOM) → `FeaturePermission` set |
| `app/core/access_control.py` | `PlanChecker.require_permission()` decorator; reads active subscription to enforce plan gates |
| `app/shared/models.py` | All PostgreSQL ORM tables — single source of truth for the data schema |
| `app/shared/services/auth/users_service.py` | Signup, login, email verification, password reset, Google OAuth merge, JWT creation |
| `app/shared/services/payments/payment_manager.py` | Wraps Stripe SDK: checkout sessions, subscription management, customer portal |
| `app/shared/services/payments/credit_service.py` | Credit ledger: `get_balance()`, `add_credits()`, `deduct_credits()`, audit trail |
| `app/shared/services/payments/webhook_handler.py` | Validates and routes all Stripe webhook events; grants credits on subscription |
| `app/products/page_builder/services/generation/page_generation/service.py` | `GenerationService` facade: credit check → asset provisioning → workflow dispatch → credit deduction |
| `app/products/page_builder/services/publishing/publishing_service.py` | HTML hash → S3 upload (hashed path) → CloudFront invalidation → DB update |
| `app/shared/services/orchestration/orchestration_client.py` | HTTP client to the LangGraph orchestration service; handles auth and callback registration |
| `app/shared/services/streaming/generation_redis_service.py` | Writes generation progress to Redis; consumed by WebSocket endpoint for live UI updates |

---

## Key Abstractions

| Name | Module | What it is |
|------|--------|-----------|
| `Business` | `app/shared/models.py` | Top-level multi-tenancy unit. All websites, credits, and analytics are scoped to a `business_id`. Users belong to businesses via `BusinessUser` (many-to-many with roles). |
| `BusinessCredits` | `app/shared/models.py` | Single mutable credit balance per business. All changes produce an immutable `CreditTransaction` row for auditing. |
| `GenerationVersion` | `app/products/page_builder/models.py` | Immutable record of one generation attempt: scope (create-site / regenerate-section / etc.), status (pending → processing → completed / failed), and reference to the LangGraph `workflow_run_id`. |
| `WebsitePage` | `app/products/page_builder/models.py` | Per-page publishing metadata: last S3 path, CloudFront URL, invalidation ID, publish count. The storage path is deterministic: `hashed/{md5[:8]}/{business_id}/{page_id}/index.html`. |
| `PlanType / FeaturePermission` | `app/core/permissions.py` | Enum-based plan-to-feature mapping. `PLAN_FEATURES[PlanType.BASIC]` returns the list of permitted `FeaturePermission` values. All gating goes through `PlanChecker`. |
| `PaymentManager` | `app/shared/services/payments/payment_manager.py` | Single façade for all Stripe operations. No other module calls Stripe directly. |
| `GenerationService` | `app/products/page_builder/services/generation/page_generation/service.py` | Façade that coordinates four submodules (credits, provisioning, workflow, completion) so controllers have a single call surface. |
| `payment_config` | `app/shared/config/payments.py` | Singleton registry of all Stripe products and prices. Products register themselves at app startup via `register()`. |

---

## Core Data Flows

### Generation (AI → Editor)

| Phase | Input | Output |
|-------|-------|--------|
| Credit check | `business_id`, trigger type | Pass / 402 |
| Asset provisioning | `business_name`, `website_intention` | `Website`, `WebsitePage`, `GenerationVersion` rows in PostgreSQL |
| Workflow input storage | `generation_version_id`, business context | Document in MongoDB (`template_generation` db) |
| Progress init | `generation_version_id` | Redis keys `generation:{id}:status = "pending"` (TTL 7 days) |
| Workflow dispatch | `LandingPageInput` + callback URLs | LangGraph `{run_id, thread_id}` |
| Streaming updates | Node execution events from orchestration | Redis progress keys; consumed by WebSocket endpoint |
| Callback | Compiled template JSON | Stored in MongoDB; `GenerationVersion.status = "completed"` |
| Credit deduction | `generation_version_id` | `BusinessCredits.balance -= 10`; `CreditTransaction` row created |

### Publishing (Editor → CDN)

| Phase | Input | Output |
|-------|-------|--------|
| HTML validation | Raw HTML file (≤10 MB) | Validated bytes |
| HTML processing | Raw HTML | Injected base CSS |
| Content hash | Processed HTML | MD5 hash (determines S3 path) |
| S3 upload | HTML + favicon + CSS | Objects at `hashed/{hash[:8]}/{business_id}/{page_id}/` |
| CloudFront invalidation | Distribution ID, old path | Invalidation ID |
| DB update | S3 path, CloudFront URL, invalidation ID | `WebsitePage` updated; `PagePublishHistory` row created |

### Billing (Stripe → Credits)

| Phase | Input | Output |
|-------|-------|--------|
| Checkout | `product_id` | Stripe Checkout URL |
| Stripe processes payment | — | `charge.succeeded` webhook |
| Webhook: subscription created | Stripe customer ID | `Subscription` row; `User.current_plan = BASIC` |
| Credit grant | `business_id`, grant amount | `BusinessCredits.balance += 100`; `CreditTransaction` row |
| Monthly renewal | `invoice.payment_succeeded` webhook | Repeat credit grant |

---

## External Services

| Service | Purpose | Required Env Vars |
|---------|---------|-------------------|
| PostgreSQL | Users, businesses, subscriptions, websites, generation records | `DATABASE_URL` |
| MongoDB | Template JSON, form submissions, media metadata, synced documents | `MONGODB_CONNECTION_URL`, `MONGODB_DATABASE` |
| Redis | Generation progress state, WebSocket streaming | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| AWS S3 | Published HTML, user media uploads, preview images | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `S3_MEDIA_BUCKET_NAME` |
| AWS CloudFront | CDN distribution for published sites | `CLOUDFRONT_DISTRIBUTION_ID`, `CLOUDFRONT_DOMAIN` |
| Stripe | Subscription billing, one-time credit packs, webhook events | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Google OAuth2 | Optional social login; merges with email accounts | `GOOGLE_OAUTH2_CLIENT_ID`, `GOOGLE_OAUTH2_SECRET`, `GOOGLE_OAUTH2_REDIRECT_URI` |
| SendGrid | Transactional email (verification, password reset) | `SENDGRID_API_KEY` |
| LangGraph Orchestration | AI workflow execution (separate service) | `ORCHESTRATION_SERVICE_URL` |
| Nango | Third-party OAuth connectors (Google Drive, etc.) | `NANGO_BASE_URL`, `NANGO_SECRET_KEY`, `NANGO_WEBHOOK_SECRET` |
| Google BigQuery | Website visitor analytics | `GCP_PROJECT_ID`, `BIGQUERY_DATASET` |

---

## Multi-tenancy Model

```
User  ──(BusinessUser)──  Business
                              │
                         ┌────┴────┐
                      Website   BusinessCredits
                         │
                     WebsitePage(s)
                         │
                  GenerationVersion(s)
```

- A `User` can belong to multiple `Business` accounts via `BusinessUser` (with role: owner / editor / viewer).
- All page builder resources (`Website`, `WebsitePage`, `GenerationVersion`) are scoped to a `business_id`.
- Credits (`BusinessCredits`) are per-business, not per-user.
- Plan enforcement reads the `Subscription` linked to the `User` who owns the business.

---

## Authentication

All API routes (except `/api/auth/*` and `/health`) require a valid JWT stored in an httpOnly cookie. The `JWTAuthenticationBackend` Starlette middleware validates the cookie on every request and injects the authenticated `User` into the request scope.

Plan-gated endpoints additionally call `PlanChecker(user, db).require_permission(FeaturePermission.X)`, which reads the user's active `Subscription` to determine their `PlanType`.
