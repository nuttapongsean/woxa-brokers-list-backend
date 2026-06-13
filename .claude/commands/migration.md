---
description: Run the full migration workflow after an entity change
argument-hint: <MigrationName> e.g. "AddCategoryTobrokers"
---

# Migration Workflow: $ARGUMENTS

## Context

- Current entity files: !`git diff HEAD -- src/modules/**/entities/*.entity.ts`
- Pending migration files: !`git status --short -- src/database/migrations/`
- Recent migrations: !`ls src/database/migrations/ | tail -10`

## Steps to follow

### 1. Review entity changes

Show me which entity was changed and summarise the schema diff (added/removed columns, new relations, changed types).

### 2. Generate the migration

Run:
```bash
npm run migration:generate -- src/database/migrations/$ARGUMENTS
```

### 3. Review the generated SQL

Read the newly created migration file and verify:
- `up()` adds/alters exactly what the entity change requires
- `down()` cleanly reverts it
- No unintended table drops or data-loss operations
- Foreign keys have correct `ON DELETE` behaviour

Flag anything suspicious before proceeding.

### 4. Confirm and run

If the SQL looks correct, ask for confirmation then run:
```bash
npm run migration:run
```

### Rules

- `synchronize` is always `false` — never suggest enabling it
- Never edit or delete a migration file that has already been run
- If the generated SQL looks wrong, explain the issue and suggest manual fixes before running
- For destructive changes (drop column, change type), warn explicitly and suggest adding a data-migration step if needed
