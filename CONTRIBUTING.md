# Contributing

Thanks for your interest in improving **Banner Comment**!

## Development

- `npm ci`
- `npm test` (runs TypeScript compile + eslint)
- `npm run watch` (TypeScript watch mode)

## About `out/`

This project is written in TypeScript. The compiled JavaScript is emitted into `out/`.

- `out/` is a **build artifact** and is **ignored by git** (`.gitignore`).
- The published VSIX **does include** `out/` (the package uses `out/` as the extension entrypoint).
- Before packaging/publishing, make sure the extension is compiled (the `vscode:prepublish` script runs `npm run compile`).

## Release checklist (docs-first)

Before bumping the version, make sure documentation is complete and structured:

- [ ] **README**: settings list is up-to-date (all new configuration keys documented)
- [ ] **CHANGELOG**: all user-facing changes are listed under **[Unreleased]**
- [ ] **Version bump**: update `package.json` and `package-lock.json`
- [ ] **Move changelog section**: rename **[Unreleased]** to the new version and date, then create a fresh **[Unreleased]**
- [ ] `npm test`
- [ ] `npx vsce ls` (sanity-check packaged files)
