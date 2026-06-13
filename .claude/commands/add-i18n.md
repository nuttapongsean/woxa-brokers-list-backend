---
description: Add a new i18n translation key to both English and Thai files
argument-hint: <KEY> <English message> | e.g. "BROKER_SUSPENDED Broker account is suspended"
---

# Add i18n Key: $ARGUMENTS

Parse the argument as: first word = key name, rest = English message.

## Files to update

- `src/i18n/en/common.json` — add the English translation
- `src/i18n/th/common.json` — add the Thai translation

## Rules

- Key must be `SCREAMING_SNAKE_CASE`
- Add alphabetically within the file to keep keys organised
- For Thai: translate the English message naturally (don't transliterate)
- Both files must have identical key sets — adding to one means adding to both

## After updating files

Show the throw statement to use in a service:
```ts
throw new XxxException('common.<KEY>');
```

Replace `XxxException` with the appropriate NestJS HTTP exception (`NotFoundException`, `ConflictException`, `UnauthorizedException`, `ForbiddenException`, `BadRequestException`).

## Current keys for reference

!`cat src/i18n/en/common.json`
