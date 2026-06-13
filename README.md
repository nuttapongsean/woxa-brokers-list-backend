# woxa-brokers-list-backend

REST API for managing financial brokers, built with NestJS + TypeScript + PostgreSQL.

## Stack

- **Framework**: NestJS 11 + Express
- **Language**: TypeScript (ES2023, NodeNext modules)
- **Database**: PostgreSQL 16 via TypeORM (migrations only, no `synchronize`)
- **Cache / sessions**: Redis 7
- **Auth**: JWT (access 15 min + refresh 1 day, refresh token rotation)
- **i18n**: nestjs-i18n v10 (English + Thai)
- **Docs**: Swagger at `/docs` (dev/test only)

## Prerequisites

- Node.js 22+
- PostgreSQL 16
- Redis 7
- Docker + Docker Compose (optional, for containerised setup)

## Quick Start (local)

```bash
# 1. Install dependencies
npm install

# 2. Start infra (postgres + redis)
docker compose up postgres redis -d

# 3. Create your env file
cp .env.example .env

# 4. Run migrations
npm run migration:run

# 5. Start in watch mode
npm run start:dev
```

API: `http://localhost:3000/api/v1`  
Swagger: `http://localhost:3000/docs`

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. `.env` is gitignored.

**Key variables:**

```dotenv
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3000   # comma-separated for multiple origins

DB_HOST=localhost                   # use "postgres" inside Docker
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=woxa_brokers

JWT_ACCESS_SECRET=<min 32 chars, random>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different secret, min 32 chars>
JWT_REFRESH_EXPIRES_IN=1d

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
| Method | Route | Auth |
|---|---|---|
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| POST | `/auth/logout` | JWT |
| POST | `/auth/refresh` | public |
| POST | `/auth/forgot-password` | public |
| POST | `/auth/reset-password` | public |

### Users
| Method | Route | Description |
|---|---|---|
| GET | `/users/me` | Get own profile |
| PATCH | `/users/me` | Update fullName |
| DELETE | `/users/me` | Soft-delete own account |

### Brokers
| Method | Route | Auth |
|---|---|---|
| GET | `/brokers` | public — paginated, filterable by `brokerType` |
| GET | `/brokers/:id` | public |
| POST | `/brokers` | JWT |
| PATCH | `/brokers/:id` | JWT |
| DELETE | `/brokers/:id` | JWT (soft-delete) |

### Reviews
| Method | Route | Auth |
|---|---|---|
| GET | `/reviews/broker/:brokerId` | public |
| GET | `/reviews/:id` | public |
| POST | `/reviews` | JWT — 1 review per user per broker |
| PATCH | `/reviews/:id` | JWT — own review only |
| DELETE | `/reviews/:id` | JWT — own review only |

### Health
| Method | Route |
|---|---|
| GET | `/health` |

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

## Tests

```bash
npm run test          # unit tests
npm run test:watch    # watch mode
npm run test:cov      # coverage report
npm run test:e2e      # end-to-end tests
```

## Docker (full stack)

```bash
# Start everything (postgres + redis + migrate + app)
docker compose up --build

# Infra only (for local dev against npm run start:dev)
docker compose up postgres redis -d

# Include pgAdmin at http://localhost:5050
docker compose --profile tools up --build
```

`docker-compose.yml` reads `.env`. When running the full stack, set `DB_HOST=postgres` and `REDIS_HOST=redis` in `.env`.

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
