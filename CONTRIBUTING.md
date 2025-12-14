# Contributing

Thanks for your interest in improving **Banner Comment**!

## Development

- `npm ci`
- `npm test` (runs TypeScript compile + eslint)
- `npm run watch` (TypeScript watch mode)

## Release checklist (docs-first)

Before bumping the version, make sure documentation is complete and structured:

- [ ] **README**: settings list is up-to-date (all new configuration keys documented)
- [ ] **CHANGELOG**: all user-facing changes are listed under **[Unreleased]**
- [ ] **Version bump**: update `package.json` and `package-lock.json`
- [ ] **Move changelog section**: rename **[Unreleased]** to the new version and date, then create a fresh **[Unreleased]**
- [ ] `npm test`
- [ ] `npx vsce ls` (sanity-check packaged files)


