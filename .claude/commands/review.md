---
description: Code review current branch changes against NestJS best practices
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*)
---

# Code Review

## Context

- Branch: !`git branch --show-current`
- Changed files: !`git diff main --name-only`
- Full diff: !`git diff main`
- Recent commits: !`git log main..HEAD --oneline`

## Review checklist

Go through each changed file and check:

### Security
- [ ] No secrets or credentials in code
- [ ] JWT-protected routes are correctly guarded (missing `@Public()` = protected by default)
- [ ] User can only access/modify their own resources (check `userId` filter in queries)
- [ ] No raw `process.env` access outside `main.ts` bootstrap
- [ ] Passwords never returned in responses

### NestJS patterns
- [ ] Services throw i18n keys (`'common.KEY'`), not raw messages
- [ ] No `I18nService` injected into services (filter handles translation)
- [ ] `@Public()` only on routes that should be publicly accessible
- [ ] `@CurrentUser()` used to extract user from token (not query params)
- [ ] Soft delete used consistently (`softRemove` / `softDelete`) — not hard delete
- [ ] Config read via `ConfigService`, not `process.env`

### TypeORM
- [ ] No `synchronize: true` anywhere
- [ ] Queries don't expose `password`, `refreshTokenHash`, or `passwordResetTokenHash`
- [ ] Relations loaded deliberately (not accidentally over-fetching)

### DTOs & validation
- [ ] Required fields use `!` suffix
- [ ] Optional fields have `@IsOptional()`
- [ ] `UpdateDto` extends `PartialType(CreateDto)`

### i18n
- [ ] New error keys added to both `en/common.json` and `th/common.json`

## Output format

For each issue found:
- **File**: path + line number
- **Severity**: Critical / Warning / Suggestion
- **Issue**: what's wrong
- **Fix**: what to change

End with a summary: total issues by severity, overall verdict (approve / needs changes).
