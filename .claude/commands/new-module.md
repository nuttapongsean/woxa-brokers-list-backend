---
description: Scaffold a complete new NestJS feature module for this project
argument-hint: <module-name> e.g. "categories" or "watchlist"
---

# New Feature Module: $ARGUMENTS

Scaffold a complete new feature module named **$ARGUMENTS** following this project's exact conventions.

## Files to create

```
src/modules/$ARGUMENTS/
├── dto/
│   ├── create-$ARGUMENTS.dto.ts
│   └── update-$ARGUMENTS.dto.ts
├── entities/
│   └── $ARGUMENTS.entity.ts
├── $ARGUMENTS.controller.ts
├── $ARGUMENTS.service.ts
├── $ARGUMENTS.module.ts
└── $ARGUMENTS.service.spec.ts
```

## Rules to follow

**Entity** (`$ARGUMENTS.entity.ts`):
- Extend with `@Entity()`, `@PrimaryGeneratedColumn('uuid')`, `@CreateDateColumn`, `@UpdateDateColumn`, `@DeleteDateColumn` (soft delete)
- Place in `src/modules/$ARGUMENTS/entities/`

**DTOs**:
- `Create$ArgumentsDto` — required fields with `!`, optional with `@IsOptional()`
- `Update$ArgumentsDto` — extend `PartialType(Create$ArgumentsDto)`
- Use `class-validator` decorators (`@IsString()`, `@IsUUID()`, etc.)

**Service** (`$ARGUMENTS.service.ts`):
- Inject the repository via `@InjectRepository($ArgumentsEntity)`
- Methods: `create`, `findAll`, `findOne`, `update`, `remove` (soft delete via `softRemove` or `softDelete`)
- Throw i18n translation keys for errors — e.g. `throw new NotFoundException('common.$ARGUMENTS_NOT_FOUND')`
- No `I18nService` in constructor — the global `I18nExceptionFilter` handles translation

**Controller** (`$ARGUMENTS.controller.ts`):
- Prefix: `@Controller('$ARGUMENTS')`
- Public routes: annotate with `@Public()` from `@common/decorators/public.decorator`
- Protected routes: JWT guard is global, no extra annotation needed
- Use `@CurrentUser()` from `@common/decorators/current-user.decorator` where needed
- Add `@Throttle()` on sensitive routes if applicable

**Module** (`$ARGUMENTS.module.ts`):
- Import `TypeOrmModule.forFeature([$ArgumentsEntity])`
- Export the service if other modules need it

**Spec** (`$ARGUMENTS.service.spec.ts`):
- Use `@nestjs/testing` `Test.createTestingModule`
- Mock the repository using `getRepositoryToken($ArgumentsEntity)`

## After creating files

1. Register the module in `src/app.module.ts` imports array
2. Add i18n key `$ARGUMENTS_NOT_FOUND` to both `src/i18n/en/common.json` and `src/i18n/th/common.json`
3. Remind me to run: `npm run migration:generate -- src/database/migrations/Add$ArgumentsTable`

## Path aliases to use

- `@common/*` → `src/common/*`
- `@modules/*` → `src/modules/*`
- `@utils/*` → `src/utils/*`
