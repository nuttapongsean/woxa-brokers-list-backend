# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**woxa-brokers-list-backend** is a NestJS + TypeScript REST API backend for managing financial brokers.

## Commands

```bash
# Development
npm run start:dev        # watch mode (preferred for dev)
npm run start:debug      # watch mode with debugger attached
npm run start:prod       # run compiled dist

# Build
npm run build            # compile to dist/

# Lint & Format
npm run lint             # eslint --fix
npm run format           # prettier --write

# Tests
npm run test             # unit tests (jest)
npm run test:watch       # watch mode
npm run test:cov         # coverage report
npm run test:e2e         # e2e tests (test/jest-e2e.json)

# Run a single test file
npx jest src/modules/brokers/brokers.service.spec.ts
npx jest --testNamePattern="BrokersService"
```

## Project Structure

```
src/
├── common/                        # NestJS infrastructure shared across all modules
│   ├── decorators/
│   │   ├── public.decorator.ts    # @Public() — opts a route out of JwtAuthGuard
│   │   └── current-user.decorator.ts  # @CurrentUser() — extracts req.user
│   ├── filters/
│   │   └── i18n-exception.filter.ts  # Global APP_FILTER — translates HttpException messages
│   ├── guards/
│   │   └── jwt-auth.guard.ts      # Applied globally via APP_GUARD in AuthModule
│   ├── interceptors/
│   │   └── logging.interceptor.ts # Logs METHOD URL status +Xms for every request
│   └── pipes/
├── config/                        # AppConfigModule, env validation, namespaced configs
├── database/
│   ├── data-source.ts             # TypeORM CLI entry point (reads .env directly)
│   ├── migrations/                # Migration files — never delete or edit after running
│   └── database.module.ts         # TypeORM forRootAsync setup
├── i18n/
│   ├── en/common.json             # English translations
│   └── th/common.json             # Thai translations
├── modules/
│   ├── auth/                      # Authentication only — no entity, imports UsersModule
│   │   ├── dto/
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts    # Passport JWT strategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts        # Uses UsersService, no direct DB access
│   │   └── auth.module.ts
│   ├── users/                     # Owns the User entity and all user DB operations
│   │   ├── dto/
│   │   │   ├── user-profile.dto.ts
│   │   │   └── update-profile.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts       # findByEmail, findById, getProfile, updateProfile, etc.
│   │   └── users.module.ts        # exports UsersService
│   ├── brokers/
│   │   ├── dto/
│   │   ├── entities/
│   │   │   └── broker.entity.ts
│   │   ├── brokers.controller.ts
│   │   ├── brokers.service.ts
│   │   ├── brokers.module.ts
│   │   └── brokers.service.spec.ts
│   ├── reviews/                   # Join example: reviews → users + brokers
│   │   ├── dto/
│   │   ├── entities/
│   │   │   └── review.entity.ts   # @ManyToOne User, @ManyToOne Broker
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts
│   │   └── reviews.module.ts
│   └── healthcheck/               # GET /health — DB ping via @nestjs/terminus
│       ├── healthcheck.controller.ts
│       └── healthcheck.module.ts
├── shared/                        # Cross-feature reusable services/modules (e.g. MailModule)
├── utils/
│   └── slugify.ts                 # Pure utility functions (no DI, no side effects)
├── app.module.ts
└── main.ts
```

## Module Dependency Graph

```
AppModule
├── AuthModule      → UsersModule → User entity
├── UsersModule     → User entity
├── BrokersModule   → Broker entity
├── ReviewsModule   → Review entity (relations: User, Broker via TypeORM)
└── HealthcheckModule → TerminusModule
```

`AuthModule` has no direct access to the User entity — it uses `UsersService` exclusively.

## Environment Files

Copy `.env.example` to `.env` and fill in your values. `.env` is gitignored; `.env.example` is committed.

```bash
cp .env.example .env
```

**Key env vars:**

| Variable | Notes |
|---|---|
| `NODE_ENV` | `development` / `test` / `production` |
| `DB_HOST` | `localhost` for local dev; `postgres` when running inside Docker |
| `REDIS_HOST` | `localhost` for local dev; `redis` when running inside Docker |
| `CORS_ORIGIN` | Comma-separated allowed origins, or `*` for any |

## Database Migrations

`synchronize` is always `false` — schema changes are managed via migrations only.

```bash
# After changing an entity — generate a migration from the diff
npm run migration:generate -- src/database/migrations/<MigrationName>

# Apply all pending migrations
npm run migration:run

# Roll back the last migration
npm run migration:revert

# Create an empty migration file (for manual SQL)
npm run migration:create -- src/database/migrations/<MigrationName>
```

**Workflow for entity changes:**
1. Edit the entity in `src/modules/<feature>/entities/`
2. `npm run migration:generate -- src/database/migrations/<DescriptiveName>`
3. Review the generated file — confirm SQL looks correct before running
4. `npm run migration:run`

## Adding a New Feature Module

```
src/modules/<feature>/
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
├── entities/
│   └── <feature>.entity.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.module.ts
└── <feature>.service.spec.ts
```

Register in `app.module.ts` imports, then generate and run a migration.

## API Endpoints

All routes prefixed with `API_PREFIX` (default `api/v1`).

### Auth `/auth`
| Method | Route | Auth | Rate limit |
|---|---|---|---|
| POST | `/auth/register` | public | 5/min |
| POST | `/auth/login` | public | 10/min |
| POST | `/auth/logout` | JWT | — |
| POST | `/auth/refresh` | public | — |
| POST | `/auth/forgot-password` | public | 3/min |
| POST | `/auth/reset-password` | public | — |

### Users `/users`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Get own profile |
| PATCH | `/users/me` | JWT | Update fullName |
| DELETE | `/users/me` | JWT | Soft-delete own account |

### Brokers `/brokers`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/brokers` | public | List (paginated, filterable by type) — brokers table only |
| GET | `/brokers/slugs` | public | All broker slugs — for static generation |
| GET | `/brokers/types` | public | Distinct broker types that have at least one broker |
| GET | `/brokers/:slug` | public | Detail with LEFT JOIN features, metrics, markets |
| POST | `/brokers` | JWT | Create (optional nested features/metrics/markets) |
| PATCH | `/brokers/:id` | JWT | Update (replaces features if provided; upserts metrics/markets) |
| DELETE | `/brokers/:id` | JWT | Soft-delete |

### Reviews `/reviews`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/reviews/broker/:brokerId` | public | All reviews for a broker (join user.fullName) |
| GET | `/reviews/:id` | public | Single review (join user + broker) |
| POST | `/reviews` | JWT | Create review (1 per user per broker) |
| PATCH | `/reviews/:id` | JWT | Update own review |
| DELETE | `/reviews/:id` | JWT | Soft-delete own review |

### Health

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | DB liveness check |

## Entity Schemas

```
users
├── id               uuid PK
├── fullName         varchar
├── email            varchar UNIQUE
├── password         varchar (bcrypt, cost 12)
├── refreshTokenHash varchar | null
├── passwordResetTokenHash  varchar | null
├── passwordResetExpiresAt  timestamp | null
├── createdAt        timestamp
├── updatedAt        timestamp
└── deletedAt        timestamp | null  (soft delete)

brokers
├── id               uuid PK
├── name             varchar
├── slug             varchar UNIQUE
├── description      text
├── logoUrl          varchar
├── website          varchar
├── brokerType       enum: cfd | bond | stock | crypto
├── imageUrl         varchar | null  (BrokerCard cover photo)
├── badge            varchar | null  (e.g. "Premium TIER")
├── tag              varchar | null  (e.g. "SEC Regulated")
├── icon             varchar | null  (lucide icon key)
├── grade            varchar | null  (e.g. "SOVEREIGN GRADE A+")
├── rating           smallint | null (1–5, cached/editorial)
├── prospectusUrl    varchar | null
├── longDescription  text | null
├── contactAddress   varchar | null
├── contactEmail     varchar | null
├── createdAt        timestamp
├── updatedAt        timestamp
└── deletedAt        timestamp | null  (soft delete)

broker_features  (one-to-many → brokers)
├── id         uuid PK
├── brokerId   uuid FK → brokers.id  ON DELETE CASCADE
├── title      varchar
├── description text
└── sortOrder  smallint DEFAULT 0

broker_metrics  (one-to-one → brokers, brokerId is PK)
├── brokerId             uuid PK+FK → brokers.id
├── aumGrowthYoY         varchar | null  (e.g. "+34.2%")
├── liquidityAccess      varchar | null  (e.g. "$18.4B")
├── liquidityAccessSub   varchar | null  (e.g. "Daily Average")
├── clientRetention      varchar | null  (e.g. "94.7%")
└── clientRetentionPeriod varchar | null

broker_markets  (one-to-one → brokers, brokerId is PK)
├── brokerId      uuid PK+FK → brokers.id
├── forexPairs    int DEFAULT 0
├── indices       int DEFAULT 0
├── commodities   int DEFAULT 0
├── equities      int DEFAULT 0
├── sovereignBonds int DEFAULT 0
└── cryptoEtps    int DEFAULT 0

reviews
├── id        uuid PK
├── rating    smallint (1–5)
├── comment   text | null
├── userId    uuid FK → users.id
├── brokerId  uuid FK → brokers.id
├── createdAt timestamp
├── updatedAt timestamp
└── deletedAt timestamp | null  (soft delete)
UNIQUE (userId, brokerId)
```

## Key Patterns

### Global JWT guard + @Public()
```ts
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Post('register')
register() { ... }
```

### @CurrentUser() decorator
```ts
import { CurrentUser } from '../../common/decorators/current-user.decorator';

logout(@CurrentUser() user: { id: string }): Promise<void>
```

### TypeORM joins — two approaches
```ts
// relations option: simple, loads full related entity
const review = await reviewRepo.findOne({
  where: { id },
  relations: { user: true, broker: true },
});

// QueryBuilder: selective columns (avoid exposing password)
const reviews = await reviewRepo
  .createQueryBuilder('review')
  .leftJoin('review.user', 'user')
  .addSelect(['user.id', 'user.fullName'])
  .where('review.brokerId = :brokerId', { brokerId })
  .getMany();
```

### Soft delete behavior
`find()` automatically adds `WHERE deletedAt IS NULL`. To include deleted rows:
```ts
await repo.find({ withDeleted: true })
```

### Rate limiting
```ts
@Throttle({ default: { limit: 5, ttl: 60000 } })
```

### Config access (never use process.env directly)
```ts
constructor(private readonly configService: ConfigService) {}
const db = this.configService.get<DatabaseConfig>('database')!;
```

Exception: `CORS_ORIGIN` is read directly from `process.env` in `main.ts` bootstrap (before NestJS DI is available).

### Utility functions
Pure functions with no dependencies live in `src/utils/`. Import directly (no DI):
```ts
import { slugify } from '../../utils/slugify';
```

### DTO and Entity properties
Required properties use `!` — `ValidationPipe` / TypeORM populate them at runtime.
Optional fields with validation need `@IsOptional()`.
```ts
class CreateBrokerDto {
  @IsString() name!: string;
  @IsOptional() @IsString() slug?: string;
}
```

### JWT config time values
`expiresIn` in `@nestjs/jwt` v11 requires `StringValue` from `ms`. Cast once at the env boundary in `jwt.config.ts`:
```ts
accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as StringValue,
```

## Internationalisation (i18n)

Uses `nestjs-i18n` v10. Language detected from `Accept-Language` header (fallback: `en`) or `?lang=th` query param.

Translation files live in `src/i18n/<lang>/common.json` — copied to `dist/` by nest-cli via `"assets": ["i18n/**/*"]` in `nest-cli.json`.

**Module setup** (`app.module.ts`):
```ts
I18nModule.forRoot({
  fallbackLanguage: 'en',
  loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
  resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver],
}),
```

**`main.ts`** — `I18nValidationPipe` replaces `ValidationPipe`. No separate validation exception filter — `I18nExceptionFilter` (registered as `APP_FILTER`) handles both validation errors and runtime `HttpException`s.

**`common/filters/i18n-exception.filter.ts`** — catches every `HttpException`, attempts to translate `exception.message` as a translation key; falls back to the raw message if the key doesn't exist:
```ts
const message = this.i18n.t(raw, { lang, defaultValue: raw });
```

**In services** — throw with the translation key as the message, no `I18nService` needed:
```ts
throw new NotFoundException('common.USER_NOT_FOUND');
throw new ConflictException('common.SLUG_ALREADY_TAKEN');
```

**Adding a new key:** add to both `src/i18n/en/common.json` and `src/i18n/th/common.json`, then throw `new XxxException('common.YOUR_KEY')`.

**Current keys** (`common.*`): `USER_NOT_FOUND`, `BROKER_NOT_FOUND`, `REVIEW_NOT_FOUND`, `EMAIL_ALREADY_EXISTS`, `ALREADY_REVIEWED`, `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN`, `INVALID_RESET_TOKEN`, `PASSWORDS_DO_NOT_MATCH`, `SLUG_ALREADY_TAKEN`, `REVIEW_FORBIDDEN_EDIT`, `REVIEW_FORBIDDEN_DELETE`.

## JWT Auth Flow

Access token (15 min) + refresh token (1 day, stored as SHA-256 hash in DB). On refresh, token is rotated. On reuse detection, all sessions are revoked.

**Forgot password:** In dev, reset token is logged via NestJS `Logger`. Replace the `logger.warn` block in `auth.service.ts → forgotPassword()` with Nodemailer/SendGrid for production.

## Path Aliases

| Alias | Resolves to |
|---|---|
| `@config/*` | `src/config/*` |
| `@common/*` | `src/common/*` |
| `@shared/*` | `src/shared/*` |
| `@database/*` | `src/database/*` |
| `@modules/*` | `src/modules/*` |
| `@utils/*` | `src/utils/*` |

## Docker

```bash
# Start infra only (postgres + redis) — for local dev
docker compose up postgres redis -d

# Full stack (build image → run migrations → start app)
docker compose up --build

# With pgAdmin UI at http://localhost:5050
docker compose --profile tools up --build
```

**Services in `docker-compose.yml`:**
| Service | Description |
|---|---|
| `postgres` | PostgreSQL 16, with healthcheck |
| `redis` | Redis 7 |
| `migrate` | Runs `migration:run` once using compiled `dist/database/data-source.js`, then exits |
| `app` | NestJS app — starts only after `migrate` completes successfully |
| `pgadmin` | pgAdmin 4 (profile: `tools`) — `http://localhost:5050` |

The `migrate` and `app` services both load `.env` via `env_file`. For Docker, set `DB_HOST=postgres` and `REDIS_HOST=redis` in that file (container hostnames, not `localhost`).

**Migration in production** uses the compiled data-source:
```
node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
```

`data-source.ts` auto-detects dev vs prod via `__filename.endsWith('.ts')` to set the correct file extension for entity/migration globs.

## Railway Deployment

Railway runs a single container — no separate migrate service. The Dockerfile `CMD` runs migrations then starts the app in one shot:

```dockerfile
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js && node dist/main"]
```

**Environment variables on Railway** — use the Postgres plugin variable references:

```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}
NODE_ENV=production
```

Set `REDIS_HOST`, `REDIS_PORT`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and other secrets as plain Railway environment variables.

## API Documentation (Swagger)

Available at `/docs` in `development` and `test` environments (disabled in production).

## TypeScript Config Notes

- `target: ES2023`, `module: nodenext`, `moduleResolution: nodenext`, `isolatedModules: true`.
- Interfaces used in decorated constructor/method parameters must use `import type`.
- `emitDecoratorMetadata` and `experimentalDecorators` are required for NestJS DI.

## Code Style

- Single quotes, trailing commas (prettier).
- `@typescript-eslint/no-explicit-any` is off project-wide.
- `.vscode/settings.json` configures format-on-save and ESLint auto-fix — requires ESLint + Prettier extensions.

## Documentation Maintenance

Always update `CLAUDE.md` and `README.md` in the same task whenever any of the following changes. Do not wait to be asked.

| Change type | What to update |
|---|---|
| Add / remove a module | Project structure tree, Module dependency graph, API endpoints table |
| Add / remove an API endpoint | API endpoints table in both files |
| Add / remove a dependency (`package.json`) | Stack section in README, relevant section in CLAUDE.md |
| Change entity schema | Entity schemas section |
| Change env variables | Environment files section in both files, `.env.example` |
| Change Docker / deployment setup | Docker and Railway sections in both files |
| Add / remove i18n keys | Current keys list in Internationalisation section |
| Change auth flow or security behaviour | JWT Auth Flow section |
| Add a new shared pattern or utility | Key Patterns section |
