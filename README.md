# Page Builder

AI-powered website page builder. Users describe their business and the system generates a complete, styled website that can be edited visually and published to a CDN. Built with FastAPI, React, Stripe, and LangGraph.

- **[Architecture](docs/architecture.md)** — system design, data flows, external services
- **[Usage](docs/usage.md)** — installation, configuration, running services, CLI reference

## 🚀 **Quick Start**

Get up and running in minutes:

### Prerequisites

- [Python 3.12](https://www.python.org/downloads/) (not 3.14 — some C extensions don't compile yet)
- [Poetry](https://python-poetry.org/docs/#installation)
- [Docker](https://docs.docker.com/get-docker/)
- [Taskfile](https://taskfile.dev/#/installation)
- [Node.js 18+](https://nodejs.org/) (for frontend)
- [Yarn](https://yarnpkg.com/) (for Puck editor submodule)

### Setup

```bash
# 1. Clone repo and submodules
git clone <repository-url>
cd ai-page-builder
git clone --branch wwai_version https://github.com/wordsworthai/puck-weditor.git packages/webapp-libs/weditor/wwai_puck
git clone --branch main https://github.com/wordsworthai/liquid-compiler-service packages/liquid-compiler

# 2. Build the Puck editor (frontend depends on this)
cd packages/webapp-libs/weditor/wwai_puck && yarn install && cd packages/core && yarn build && cd ../../../../../..

# 3. Install dependencies
poetry env use python3.12 && poetry install
cd orchestration_service && poetry env use python3.12 && poetry lock && poetry install && cd ..
cd frontend && npm install && cd ..

# 4. Environment
cp local.env.example local.env          # edit with your API keys
cp frontend/.env.development.example frontend/.env.development

# 5. Start databases and apply migrations
docker compose up -d
task db:migrate-up

# 6. Create an account
task db:user-create -- --email you@example.com --password yourpassword --full_name "Your Name"
```

### Run

```bash
# Terminal 1 — backend + orchestration + Redis
task dev

# Terminal 2 — frontend
task run-frontend
```

**Access your app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8020
- API Docs: http://localhost:8020/docs

## 🏗 **Architecture**

### **Core Technologies**
- **Backend**: FastAPI + SQLModel + PostgreSQL + Alembic
- **Frontend**: React 18 + TypeScript + Vite + Material-UI  
- **Authentication**: JWT + OAuth (Google)
- **Payments**: Stripe integration
- **API Client**: Auto-generated TypeScript client from OpenAPI

### **Production Features**
- ✅ **Authentication**: JWT + Google OAuth + Password Reset
- ✅ **Stripe Payments**: Subscriptions + One-time + Webhooks + Customer Portal
- ✅ **Admin Panel**: SQLAdmin with Payment Analytics & User Insights dashboards
- ✅ **Analytics**: Basic, Advanced, Premium reporting + Team analytics
- ✅ **Integrations**: Webhook templates + Third-party catalog (Slack, Zapier, etc.)
- ✅ **RBAC System**: Feature permissions + Plan-based access control
- ✅ **Email**: Mailchimp Transactional (password reset, notifications)
- ✅ **Content**: Article CRUD with publish/draft status
- ✅ **UI**: Material-UI v6 + Dark Mode + Responsive layouts
- ✅ **Database**: PostgreSQL + SQLModel + Alembic migrations
- ✅ **Docker**: Full containerization + compose setup
- ✅ **Testing**: pytest + vitest + comprehensive fixtures

### **AI Development Assistant (EXCLUSIVE)**
- 🤖 **18 Optimized Cursor Rules** (<500 lines each, all with descriptions)
  - Frontend patterns, backend architecture, database, payments, RBAC, deployment
- 🤖 **Claude Code Package**:
  - `CLAUDE.md` - Comprehensive project context (~400 lines)
  - `.claude/settings.json` - Pre-configured tool permissions
  - `.claude/commands/` - 5 custom slash commands (new-api-endpoint, new-component, add-payment-feature, create-migration, run-tests, fix-lint)
  - `docs/claude-workflows/` - AI pair programming guides
- 🤖 **Dual AI Support**: Works perfectly with BOTH Cursor AND Claude Code
- 🤖 **Instant Productivity**: AI knows your codebase structure immediately
- 🤖 **Enforced Patterns**: Consistent code via AI rules

## 🚀 **Deployment**

Choose your deployment strategy:

```bash
# See all deployment options
task deploy-help

# Deploy to Railway (single Docker - simplest)
task deploy-railway-docker

# Deploy to Vercel + Railway (separate services - scalable)
task deploy-vercel-railway
```

**Supported platforms:**
- Railway (recommended)
- Vercel + Railway
- Render
- Digital Ocean
- Heroku

## 📖 **Documentation**

- **[Architecture](docs/architecture.md)** — system design, data flows, external services
- **[Usage](docs/usage.md)** — installation, configuration, running services, CLI reference

### **Quick Setup Guide**
```bash
# 1. Complete automated setup
task full-setup

# 2. Update environment files with your keys
# Edit local.env with your Stripe keys, database settings, etc.

# 3. Start development
task run-backend     # Terminal 1
task run-frontend    # Terminal 2
```

## 🔧 **Common Commands**

```bash
# Development
task full-setup          # Complete project setup
task run-backend         # Start backend
task run-frontend        # Start frontend  
task generate-client     # Sync API types

# Database
task alembic-revision-local -- "Migration name"
task alembic-upgrade-local

# Code Quality
task test-backend        # Run backend tests
task test-frontend       # Run frontend tests
task lint-backend        # Lint backend code
task format-backend      # Format backend code
```

## 🎯 **What's Included**

- **Authentication system** with Google OAuth
- **User dashboard** with modern UI
- **Article/content management** system
- **Payment processing** with Stripe
- **Admin interface** for monitoring users and payments
- **API documentation** auto-generated
- **Database migrations** with Alembic
- **Docker setup** for easy deployment
- **CI/CD workflows** ready to use

## 🤖 **AI-First Development**

This boilerplate is optimized for AI coding assistants:

### **Using Cursor** (Recommended)
- All 18 Cursor rules are automatically loaded
- Just start coding - Cursor knows the patterns
- Type `@` to reference rules by name

### **Using Claude Code**
```bash
# Install Claude Code CLI
curl -fsSL https://claude.ai/install.sh | sh

# Start Claude in your project
cd wwai-page-builder
claude

# Use custom commands
/new-api-endpoint GET /api/users/{id}/stats
/new-component UserStatsCard
/add-payment-feature lifetime deal purchase
/create-migration add email_verified to users
/run-tests
/fix-lint
```

See [Usage](docs/usage.md) for details on all task commands.

## 💡 **Next Steps**

1. **Setup**: Run `task full-setup` - complete automated installation
2. **Environment**: Update `local.env` with Stripe keys & Google OAuth
3. **Payment Setup**: Run `task payments:setup` to initialize Stripe products
4. **Create Admin**: Run `task db:user-create` for admin panel access
5. **Start Coding**: Use Cursor or Claude Code - they know your codebase!
6. **Customize**: Modify branding, add features - AI assists you
7. **Deploy**: Railway, Vercel, or Digital Ocean - see deployment guides

### **AI Coding Tips**
- Read `CLAUDE.md` to see what context AI has
- Check `.cursor/rules/` for all available patterns
- Use `/` in Claude Code to see custom commands
- AI knows: architecture, patterns, common commands, gotchas

### **Need Help?**
- **[Architecture](docs/architecture.md)** — understand the system design
- **[Usage](docs/usage.md)** — setup, configuration, and CLI reference

Happy building! 🚀
