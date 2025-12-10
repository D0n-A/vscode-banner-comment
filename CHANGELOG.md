# Changelog

## [0.2.0] - 2025-12-11

### Added

- **Box-style banners** — new multi-line framed banner format with 4 border styles:
  - `unicode` — double-line Unicode box (`╔═══╗ ║ ╚═══╝`)
  - `ascii` — simple ASCII box (`+---+ | +---+`)
  - `rounded` — rounded corners (`╭───╮ │ ╰───╯`)
  - `heavy` — bold/heavy lines (`┏━━━┓ ┃ ┗━━━┛`)
- New configuration option `bannerComment.style` to switch between `simple` and `box` styles.
- New configuration option `bannerComment.boxStyle` to choose the box border style.
- Toggle support for box banners — selecting an existing box banner and running the command will extract the text and recreate it.

## [0.1.1] - 2025-06-21

### Added

- Automatic detection of comment style based on file language (supports `//`, `#`, `--`, `;;`, `%`, `REM`).
- Support for flattening multiline selections into a single-line banner.
- Improved handling of empty or whitespace-only selections.

## [0.0.2] - 2025-06-21

### Added

- Configuration option for banner line width (`bannerComment.lineWidth`).
- Configuration option for banner padding character (`bannerComment.paddingCharacter`), supporting various characters including Cyrillic.

## [0.0.1] – 2025-06-20

### Added

- Initial release of the extension.
- Command `bannerComment.make` for converting selected text into a banner.
- Banner format `# ----- TEXT -----`.
- Ability to launch the command from VS Code Command Palette.
- Default shortcuts: `Ctrl+Alt+B` (Windows / Linux) and `Cmd+Alt+B` (macOS).
