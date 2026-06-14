# woxa-brokers-list-backend

REST API for managing financial brokers, built with NestJS + TypeScript + PostgreSQL.

## Stack

- **Framework**: NestJS 11 + Express
- **Language**: TypeScript (ES2023, NodeNext modules)
- **Database**: PostgreSQL 16 via TypeORM (migrations only, no `synchronize`)
- **Cache / sessions**: Redis 7
- **Auth**: JWT (access 15 min + refresh 7 days, refresh token rotation)
- **i18n**: nestjs-i18n v10 (English + Thai)
- **Docs**: Swagger at `/docs` (dev/test only)

## Prerequisites

- Node.js 22+
- PostgreSQL 16
- Redis 7
- Docker + Docker Compose (optional, for containerised setup)

## Running Locally

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Postgres + Redis)

### Step-by-step

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Open `.env` and replace the three secrets — the app will refuse to start if they are missing or shorter than 32 characters:

```dotenv
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
JWT_REFRESH_SECRET=<different value, same command>
SESSION_SECRET=<different value, same command>
```

> **Important:** Docker Compose reads `.env` to create the Postgres user and database. Set up `.env` _before_ starting Docker. If you change credentials after the volume exists, run `docker compose down -v` to reset.

**3. Start Postgres and Redis**

```bash
docker compose up postgres redis -d
```

Wait ~10 seconds for the Postgres healthcheck to pass before continuing.

**4. Run database migrations**

```bash
npm run migration:run
```

**5. (Optional) Seed mock broker data**

```bash
npm run seed   # inserts 5 brokers — safe to run multiple times
```

**6. Start the app**

```bash
npm run start:dev
```

**7. Verify**

| Resource | URL |
|---|---|
| Health check | http://localhost:4000/api/v1/health |
| Swagger UI | http://localhost:4000/docs |
| API base | http://localhost:4000/api/v1 |

## npm Scripts

```bash
# Development
npm run start:dev          # watch mode
npm run start:debug        # watch mode with debugger

# Build & Production
npm run build              # compile to dist/
npm run start:prod         # run compiled dist/

# Code quality
npm run lint               # eslint --fix
npm run format             # prettier --write

# Tests
npm run test               # unit tests
npm run test:watch         # watch mode
npm run test:cov           # coverage report
npm run test:e2e           # end-to-end tests

# Database
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run      # apply pending migrations
npm run migration:revert   # roll back last migration
npm run migration:create -- src/database/migrations/<Name>

# Utilities
npm run seed               # insert mock broker data (idempotent)
npm run spec:generate      # export OpenAPI JSON files to api-spec/
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. `.env` is gitignored.

```dotenv
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3000   # comma-separated for multiple origins

DB_HOST=localhost                   # use "postgres" inside Docker
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=woxa_brokers

JWT_ACCESS_SECRET=<min 32 chars, random>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different secret, min 32 chars>
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost                # use "redis" inside Docker
REDIS_PORT=6379
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## API Endpoints

All routes are prefixed with `/api/v1` by default.

### Auth
| Method | Route | Auth | Rate limit |
|---|---|---|---|
| POST | `/auth/register` | public | 5/min |
| POST | `/auth/login` | public | 10/min |
| POST | `/auth/logout` | JWT | — |
| POST | `/auth/refresh` | public | — |
| POST | `/auth/forgot-password` | public | 3/min |
| POST | `/auth/reset-password` | public | — |

### Users
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Get own profile |
| PATCH | `/users/me` | JWT | Update fullName |
| DELETE | `/users/me` | JWT | Soft-delete own account |

### Brokers
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/brokers` | public | Paginated list, filterable by `brokerType` |
| GET | `/brokers/slugs` | public | All broker slugs (for static generation) |
| GET | `/brokers/types` | public | Distinct broker types that have brokers |
| GET | `/brokers/:slug` | public | Detail with features, metrics, and markets |
| POST | `/brokers` | JWT | Create (optional nested features/metrics/markets) |
| PATCH | `/brokers/:id` | JWT | Update (replaces features if provided; upserts metrics/markets) |
| DELETE | `/brokers/:id` | JWT | Soft-delete |

### Reviews
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/reviews/broker/:brokerId` | public | All reviews for a broker |
| GET | `/reviews/:id` | public | Single review |
| POST | `/reviews` | JWT | Create (1 per user per broker) |
| PATCH | `/reviews/:id` | JWT | Update own review |
| DELETE | `/reviews/:id` | JWT | Soft-delete own review |

### Health
| Method | Route | Description |
|---|---|---|
| GET | `/health` | DB liveness check |

## API Spec Export

Generate static OpenAPI JSON files (requires DB to be running):

```bash
npm run spec:generate
```

Output in `api-spec/`:
```
api-spec/
├── auth.json
├── users.json
├── brokers.json
├── reviews.json
├── health.json
└── openapi.json    # combined all modules
```

Import any file into Postman, Insomnia, or Swagger UI.

## Database Migrations

```bash
# Generate from entity diff
npm run migration:generate -- src/database/migrations/<Name>

# Apply pending migrations
npm run migration:run

# Roll back last migration
npm run migration:revert
```

Never delete or edit a migration file after it has been run.

**Workflow for entity changes:**
1. Edit the entity in `src/modules/<feature>/entities/`
2. `npm run migration:generate -- src/database/migrations/<DescriptiveName>`
3. Review the generated SQL
4. `npm run migration:run`

## Tests

```bash
npm run test          # unit tests
npm run test:watch    # watch mode
npm run test:cov      # coverage report
npm run test:e2e      # end-to-end tests
```

## Running with Docker Compose (full stack)

All services (Postgres, Redis, migrations, app) run as containers. No local Node.js or database install needed.

### Step-by-step

**1. Configure `.env`**

```bash
cp .env.example .env
```

Fill in the three secrets, then switch the host variables for the container network:

```dotenv
DB_HOST=postgres      # container hostname — NOT localhost
REDIS_HOST=redis      # container hostname — NOT localhost
```

**2. Build and start**

```bash
docker compose up --build
```

Docker will:
1. Start Postgres and wait for its healthcheck
2. Run `migration:run` inside a one-shot `migrate` container
3. Start the NestJS `app` container only after migrations succeed

**3. Verify**

| Resource | URL |
|---|---|
| Health check | http://localhost:4000/api/v1/health |
| Swagger UI | http://localhost:4000/docs |

> Swagger is disabled when `NODE_ENV=production`. Keep `NODE_ENV=development` in `.env` if you want it available.

**4. (Optional) Seed data**

The app container has `ts-node` available. Run seed from your host machine pointing at the running Postgres:

```bash
# Keep DB_HOST=localhost in a separate terminal (or use a second .env)
npm run seed
```

Or exec into the app container:

```bash
docker compose exec app node -e "require('./dist/scripts/seed')"
```

### Other Docker commands

```bash
# Infra only — use with npm run start:dev on the host
docker compose up postgres redis -d

# Include pgAdmin at http://localhost:5050
docker compose --profile tools up --build

# Stop and remove containers (keeps data volumes)
docker compose down

# Stop and wipe all data (fresh start)
docker compose down -v

# View app logs
docker compose logs -f app

# Rebuild after code changes
docker compose up --build app
```

## Deployment (Railway)

1. Push to GitHub and connect the repo in Railway.
2. Railway detects the `Dockerfile` and builds automatically.
3. Add a **Postgres** plugin and a **Redis** plugin to your Railway project.
4. Set environment variables in Railway's dashboard:

```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
NODE_ENV=production
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
SESSION_SECRET=<secret>
CORS_ORIGIN=https://your-frontend-domain.com
```

The container runs migrations automatically before starting the app — no separate migration step needed.

## Architecture

See [CLAUDE.md](CLAUDE.md) for the full project structure, module dependency graph, key patterns, and architecture decisions.
