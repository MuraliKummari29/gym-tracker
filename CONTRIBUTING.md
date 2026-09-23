# Contributing

## Setup

```bash
npm install
npx expo start
```

## Before opening a PR

```bash
npx tsc --noEmit
npx expo lint
npm test
```

## Conventions

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`.
- Screens live in `src/app/` only. Data access goes in `src/db/`, pure logic in `src/lib/`.
- Schema changes go through `src/db/migrations.ts` with a new `user_version` step. Never edit an existing step.
- Pure logic in `src/lib/` should have a test in `src/lib/__tests__/`.
