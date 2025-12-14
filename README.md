# Banner Comment

A Visual Studio Code extension that lets you quickly create neat banner comments from the selected text or the current line.
It is handy for visually separating code blocks, adding headings to configuration files, or simply leaving eye-catching comments.

## Features

- Converts the selected text (or current line) into a styled banner.
- **Two banner styles:**
  - **Simple** — single-line banner: `// --- TEXT ---`
  - **Box** — framed multi-line banner with 4 border styles
- **Auto-detects language comment style:**
  - `//` for JavaScript, TypeScript, Java, C#, Go, Rust, etc.
  - `#` for Python, Ruby, Shell, YAML, Dockerfile, etc.
  - `--` for SQL, Lua, Haskell, etc.
  - `;;` for Clojure, Lisp.
  - `%` for LaTeX.
  - `REM` for Batch files.
- **Handles multiline selections** (flattens them into a single line).
- **Configurable conversion target**: selection / current line / auto.
- **Optional mirrored suffix** for symmetric banners (e.g. `// --- TEXT --- //`).
- User-defined keyboard shortcut via standard VS Code settings.
- Customizable width and padding characters.

## How to Use

1. **Select text** — highlight the word or phrase you want to turn into a banner
   (or place the cursor on a line when using `bannerComment.target: "line"` or `"auto"`).
2. **Run the command**
    - **Command Palette:** press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS), start typing “Create Banner Comment” and choose the command.
    - **Keyboard shortcut:** by default press `Ctrl+Alt+B` (Windows / Linux) or `Cmd+Alt+B` (macOS).

After execution the selected text is replaced with a banner appropriate for the current file language.

**JavaScript/TypeScript Example:**
```javascript
// ----------------- YOUR SELECTED TEXT -----------------
```

**Python Example:**
```python
# ----------------- YOUR SELECTED TEXT -----------------
```

**Box Style Examples:**

Unicode (default):
```javascript
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                           YOUR SELECTED TEXT                             ║
// ╚══════════════════════════════════════════════════════════════════════════╝
```

Rounded:
```python
# ╭──────────────────────────────────────────────────────────────────────────╮
# │                           YOUR SELECTED TEXT                             │
# ╰──────────────────────────────────────────────────────────────────────────╯
```

Heavy:
```typescript
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                           YOUR SELECTED TEXT                             ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

ASCII:
```python
# +--------------------------------------------------------------------------+
# |                           YOUR SELECTED TEXT                             |
# +--------------------------------------------------------------------------+
```

(The exact appearance depends on the configured width and style)

## Configuration

This extension provides the following settings that can be configured in your VS Code User or Workspace settings:

- `bannerComment.target`: What to convert into a banner.
  - Type: `string`
  - Values: `"selection"`, `"line"`, `"auto"`
  - Default: `"selection"`
- `bannerComment.lineWidth`: The total width of the banner comment line.
  - Type: `integer`
  - Default: `80`
- `bannerComment.paddingCharacter`: The character used to pad the banner comment (for simple style).
  - Type: `string`
  - Default: `"-"`
- `bannerComment.style`: The style of banner to create.
  - Type: `string`
  - Values: `"simple"`, `"box"`
  - Default: `"simple"`
- `bannerComment.mirrorCommentPrefix`: Append the comment prefix at the end for symmetric banners.
  - Type: `boolean`
  - Default: `false`
- `bannerComment.boxStyle`: The style of box border (when using box style).
  - Type: `string`
  - Values: `"unicode"`, `"ascii"`, `"rounded"`, `"heavy"`
  - Default: `"unicode"`

Example `settings.json` for simple style:

```json
{
    "bannerComment.lineWidth": 100,
    "bannerComment.paddingCharacter": "*"
}
```

Example `settings.json` for box style:

```json
{
    "bannerComment.style": "box",
    "bannerComment.boxStyle": "rounded",
    "bannerComment.lineWidth": 80
}
```

Example `settings.json` for line/auto mode with a mirrored suffix:

```json
{
    "bannerComment.target": "auto",
    "bannerComment.mirrorCommentPrefix": true
}
```

## Customizing Keybindings

You can customize the keybinding for the "Create banner comment" command to your preference.
By default, it is bound to `Ctrl+Alt+B` (or `Cmd+Alt+B` on macOS).

To change this:

1. Open the Keyboard Shortcuts editor:
    - Menu: `File > Preferences > Keyboard Shortcuts` (`Code > Preferences > Keyboard Shortcuts` on macOS).
    - Command Palette: `Preferences: Open Keyboard Shortcuts`.
    - Shortcut: `Ctrl+K Ctrl+S`.
2. In the search bar of the Keyboard Shortcuts editor, type `bannerComment.make` (which is the command ID) or "Create banner comment".
3. You will see the "Create banner comment" command. You can then click the pencil icon next to it to change its keybinding, or right-click and select "Change Keybinding...".
4. Enter your desired key combination and press Enter.

Alternatively, you can directly edit your `keybindings.json` file. You can open this file by running "Preferences: Open Keyboard Shortcuts (JSON)" from the Command Palette. Add an entry like this, replacing `"your.desired.keys"` with your chosen key combination:

```json
{
    "key": "your.desired.keys",
    "command": "bannerComment.make",
    "when": "editorTextFocus"
}
```

## Feedback and Suggestions

Found a bug or have an idea? Feel free to open an issue or reach out.
