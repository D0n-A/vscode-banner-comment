import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Box drawing characters for different styles
 */
interface BoxChars {
    topLeft: string
    topRight: string
    bottomLeft: string
    bottomRight: string
    horizontal: string
    vertical: string
}

/**
 * Available box styles with their corresponding characters
 */
const BOX_STYLES: Record<string, BoxChars> = {
    unicode: {
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
        horizontal: '═',
        vertical: '║'
    },
    ascii: {
        topLeft: '+',
        topRight: '+',
        bottomLeft: '+',
        bottomRight: '+',
        horizontal: '-',
        vertical: '|'
    },
    rounded: {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│'
    },
    heavy: {
        topLeft: '┏',
        topRight: '┓',
        bottomLeft: '┗',
        bottomRight: '┛',
        horizontal: '━',
        vertical: '┃'
    }
}

const languageConfigLineCommentCache = new Map<string, string | null>()

function stripUtf8Bom(text: string): string {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

function stripJsonComments(text: string): string {
    let result = ''

    let inString = false
    let stringChar: '"' | "'" | '' = ''
    let inLineComment = false
    let inBlockComment = false

    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const next = i + 1 < text.length ? text[i + 1] : ''

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false
                result += char
            }
            continue
        }

        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false
                i++
                continue
            }
            if (char === '\n') {
                result += '\n'
            }
            continue
        }

        if (inString) {
            result += char
            if (char === '\\') {
                if (i + 1 < text.length) {
                    result += text[i + 1]
                    i++
                }
                continue
            }
            if (char === stringChar) {
                inString = false
                stringChar = ''
            }
            continue
        }

        if (char === '"' || char === "'") {
            inString = true
            stringChar = char
            result += char
            continue
        }

        if (char === '/' && next === '/') {
            inLineComment = true
            i++
            continue
        }

        if (char === '/' && next === '*') {
            inBlockComment = true
            i++
            continue
        }

        result += char
    }

    return result
}

function getLineCommentPrefixFromLanguageConfiguration(languageId: string): string | null {
    const cached = languageConfigLineCommentCache.get(languageId)
    if (cached !== undefined) {
        return cached
    }

    for (const extension of vscode.extensions.all) {
        const packageJson: unknown = extension.packageJSON as unknown
        if (!packageJson || typeof packageJson !== 'object') {
            continue
        }

        const contributes = (packageJson as { contributes?: unknown }).contributes
        if (!contributes || typeof contributes !== 'object') {
            continue
        }

        const languages = (contributes as { languages?: unknown }).languages
        if (!Array.isArray(languages)) {
            continue
        }

        for (const langEntry of languages) {
            if (!langEntry || typeof langEntry !== 'object') {
                continue
            }

            const id = (langEntry as { id?: unknown }).id
            if (id !== languageId) {
                continue
            }

            const configuration = (langEntry as { configuration?: unknown }).configuration
            if (typeof configuration !== 'string' || configuration.length === 0) {
                continue
            }

            const configPath = path.join(extension.extensionPath, configuration)
            try {
                const raw = stripUtf8Bom(fs.readFileSync(configPath, 'utf8'))
                const parsed = JSON.parse(stripJsonComments(raw))
                const lineComment = parsed?.comments?.lineComment
                if (typeof lineComment === 'string') {
                    const normalized = lineComment.trim()
                    if (normalized.length > 0) {
                        languageConfigLineCommentCache.set(languageId, normalized)
                        return normalized
                    }
                }
            } catch {
                // ignore and keep searching other providers for the same languageId
            }
        }
    }

    languageConfigLineCommentCache.set(languageId, null)
    return null
}

/**
 * Returns the comment prefix for the given language ID
 * @param languageId The VS Code language identifier
 * @returns The comment prefix (e.g., "//", "#", "--")
 */
function getCommentPrefix(languageId: string): string {
    switch (languageId) {
        case 'javascript':
        case 'typescript':
        case 'javascriptreact':
        case 'typescriptreact':
        case 'java':
        case 'c':
        case 'cpp':
        case 'csharp':
        case 'objective-c':
        case 'go':
        case 'rust':
        case 'jsonc':
        case 'swift':
        case 'kotlin':
        case 'php':
        case 'dart':
            return '//'
        case 'python':
        case 'shellscript':
        case 'yaml':
        case 'dockerfile':
        case 'makefile':
        case 'perl':
        case 'ruby':
        case 'powershell':
        case 'r':
        case 'elixir':
            return '#'
        case 'sql':
        case 'lua':
        case 'haskell':
        case 'ada':
            return '--'
        case 'clojure':
        case 'lisp':
        case 'scheme':
            return ';;'
        case 'tex':
        case 'latex':
        case 'matlab':
            return '%'
        case 'bat':
            return 'REM'
        default:
            return '#'
    }
}

/**
 * Extracts the original text from a banner comment
 * @param text The text that might be a banner
 * @param prefix The comment prefix to check for
 * @returns The original text without banner formatting
 */
function extractTextFromBanner(text: string, prefix: string): string {
    const trimmed = text.trim()

    // Check if it starts with the prefix
    if (!startsWithCommentPrefixToken(trimmed, prefix)) {
        return trimmed
    }

    // Support optional mirrored suffix: "... <prefix>"
    const suffixToken = ` ${prefix}`
    let normalized = trimmed
    if (normalized.endsWith(suffixToken)) {
        normalized = normalized.substring(0, normalized.length - suffixToken.length).trimEnd()
    }

    // Remove the prefix and any whitespace
    const withoutPrefix = normalized.substring(prefix.length).trim()

    // If it's empty after removing prefix, return empty
    if (withoutPrefix.length === 0) {
        return ''
    }

    // If it's a pure padding line (e.g. "--------"), treat as empty text
    if (/^([^a-zA-Z0-9А-Яа-я\s])\1*$/.test(withoutPrefix)) {
        return ''
    }

    // Check if it's a banner pattern: starts and ends with the same non-alphanumeric character
    // and has text in the middle surrounded by spaces
    if (withoutPrefix.length >= 2) {
        const firstChar = withoutPrefix.charAt(0)
        const lastChar = withoutPrefix.charAt(withoutPrefix.length - 1)

        // If first and last characters are the same and are padding characters
        if (firstChar === lastChar && /[^a-zA-Z0-9А-Яа-я\s]/.test(firstChar)) {
            // Try to find the pattern: padding + space + text + space + padding
            let start = 0
            let end = withoutPrefix.length - 1

            // Find where the padding ends on the left
            while (start < withoutPrefix.length && withoutPrefix.charAt(start) === firstChar) {
                start++
            }

            // Find where the padding starts on the right
            while (end >= 0 && withoutPrefix.charAt(end) === lastChar) {
                end--
            }

            // Extract the middle part
            if (start <= end) {
                const middlePart = withoutPrefix.substring(start, end + 1).trim()
                if (middlePart.length > 0) {
                    return middlePart
                }
            }
        }
    }

    // If not a banner pattern, return the text without prefix
    return withoutPrefix
}

function startsWithCommentPrefixToken(text: string, prefix: string): boolean {
    if (!text.startsWith(prefix)) {
        return false
    }

    if (text.length === prefix.length) {
        return true
    }

    const nextChar = text.charAt(prefix.length)
    if (/\s/.test(nextChar)) {
        return true
    }

    // For word-like prefixes (e.g. "REM") require a boundary to avoid matching "REMOVED".
    const lastPrefixChar = prefix.charAt(prefix.length - 1)
    if (/[a-zA-Z0-9]/.test(lastPrefixChar)) {
        return false
    }

    // For symbol prefixes like //, #, -- allow no-space variants like //TODO or #TODO.
    return true
}

/**
 * Validates and normalizes configuration values
 * @param lineWidth The configured line width
 * @param paddingCharacter The configured padding character
 * @returns Normalized configuration object
 */
function validateConfiguration(lineWidth: number, paddingCharacter: string): {
    lineWidth: number
    paddingCharacter: string
} {
    // Validate line width
    let normalizedWidth = lineWidth
    if (!Number.isInteger(normalizedWidth) || normalizedWidth < 10) {
        normalizedWidth = 80
        vscode.window.showWarningMessage(
            `Invalid line width: ${lineWidth}. Using default value: 80`
        )
    }
    if (normalizedWidth > 200) {
        normalizedWidth = 200
        vscode.window.showWarningMessage(
            `Line width too large: ${lineWidth}. Using maximum value: 200`
        )
    }

    // Validate padding character
    let normalizedPadding = paddingCharacter
    if (!normalizedPadding || normalizedPadding.length === 0) {
        normalizedPadding = '-'
        vscode.window.showWarningMessage(
            'Empty padding character. Using default: "-"'
        )
    }
    if (normalizedPadding.length > 1) {
        normalizedPadding = normalizedPadding.charAt(0)
        vscode.window.showWarningMessage(
            `Padding character too long: "${paddingCharacter}". Using first character: "${normalizedPadding}"`
        )
    }

    return {
        lineWidth: normalizedWidth,
        paddingCharacter: normalizedPadding
    }
}

type BannerTarget = 'selection' | 'line' | 'auto'

function normalizeBannerTarget(target: string | undefined): BannerTarget {
    if (target === 'selection' || target === 'line' || target === 'auto') {
        return target
    }
    return 'selection'
}

function getDocumentEol(document: vscode.TextDocument): string {
    return document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n'
}

function getLineIndentation(text: string): string {
    const match = text.match(/^\s*/)
    return match ? match[0] : ''
}

function indentMultilineText(text: string, indent: string, eol: string): string {
    if (!indent) {
        return text
    }
    return text.split(/\r?\n/).map(line => indent + line).join(eol)
}

function indentMultilineTextAfterFirstLine(text: string, indent: string, eol: string): string {
    if (!indent) {
        return text
    }

    const lines = text.split(/\r?\n/)
    if (lines.length <= 1) {
        return text
    }

    return [lines[0], ...lines.slice(1).map(line => indent + line)].join(eol)
}

interface BannerOperation {
    range: vscode.Range
    rawText: string
    indent: string
    indentMode: 'all' | 'afterFirst'
}

/**
 * Builds a string of the form
 * <PREFIX> --------------- TITLE ---------------
 * @param text The text to put in the banner
 * @param width The total width of the banner line
 * @param fill The character to use for padding
 * @param prefix The comment prefix to use
 * @param mirrorCommentPrefix Whether to append a mirrored prefix at the end
 * @returns The formatted banner string
 */
function buildBanner(
    text: string,
    width: number,
    fill: string,
    prefix: string,
    mirrorCommentPrefix: boolean
): string {
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim()
    const prefixStr = `${prefix} `
    const suffixStr = mirrorCommentPrefix ? ` ${prefix}` : ''

    // Handle empty text - create a simple line
    if (cleanText.length === 0) {
        const bodyWidth = width - prefixStr.length - suffixStr.length
        const body = fill.repeat(Math.max(0, bodyWidth))
        return `${prefixStr}${body}${suffixStr}`
    }

    const core = ` ${cleanText} ` // Add spaces around the text
    const targetBodyWidth = width - prefixStr.length - suffixStr.length

    // Check if text is too long for the specified width
    if (core.length >= targetBodyWidth) {
        // If text is too long, truncate it properly
        const availableSpace = Math.max(0, targetBodyWidth)
        const truncatedCore = core.substring(0, availableSpace)
        return `${prefixStr}${truncatedCore}${suffixStr}`
    }

    // Calculate padding for perfect centering
    const totalPadding = targetBodyWidth - core.length
    const leftPadding = Math.floor(totalPadding / 2)
    const rightPadding = totalPadding - leftPadding

    const body = fill.repeat(leftPadding) + core + fill.repeat(rightPadding)
    return `${prefixStr}${body}${suffixStr}`
}

/**
 * Builds a box-style banner comment with a frame around the text
 * @param text The text to put in the banner
 * @param width The total width of the banner line
 * @param boxStyle The style of box to use (unicode, ascii, rounded, heavy)
 * @param prefix The comment prefix to use
 * @param mirrorCommentPrefix Whether to append a mirrored prefix at the end
 * @param eol The line ending to use for multi-line output
 * @returns The formatted box banner string (multiple lines)
 */
function buildBoxBanner(
    text: string,
    width: number,
    boxStyle: string,
    prefix: string,
    mirrorCommentPrefix: boolean,
    eol: string
): string {
    const chars = BOX_STYLES[boxStyle] || BOX_STYLES.unicode
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim()

    const prefixStr = `${prefix} `
    const suffixStr = mirrorCommentPrefix ? ` ${prefix}` : ''
    const innerWidth = width - prefixStr.length - suffixStr.length - 2 // -2 for left and right border chars

    // Ensure minimum width for the text
    const effectiveInnerWidth = Math.max(innerWidth, 0)

    // Build top line: // ╔════════════════════════════════════╗
    const topLine = `${prefixStr}${chars.topLeft}${chars.horizontal.repeat(effectiveInnerWidth)}${chars.topRight}${suffixStr}`

    // Build middle line with centered text: // ║         TEXT         ║
    let middleContent: string
    if (cleanText.length === 0) {
        middleContent = ' '.repeat(effectiveInnerWidth)
    } else if (cleanText.length >= effectiveInnerWidth) {
        // Text too long, truncate it
        middleContent = cleanText.substring(0, effectiveInnerWidth)
    } else {
        // Center the text
        const totalPadding = effectiveInnerWidth - cleanText.length
        const leftPad = Math.floor(totalPadding / 2)
        const rightPad = totalPadding - leftPad
        middleContent = ' '.repeat(leftPad) + cleanText + ' '.repeat(rightPad)
    }
    const middleLine = `${prefixStr}${chars.vertical}${middleContent}${chars.vertical}${suffixStr}`

    // Build bottom line: // ╚════════════════════════════════════╝
    const bottomLine = `${prefixStr}${chars.bottomLeft}${chars.horizontal.repeat(effectiveInnerWidth)}${chars.bottomRight}${suffixStr}`

    return [topLine, middleLine, bottomLine].join(eol)
}

/**
 * Checks if the given text is a box-style banner and extracts the original text
 * @param text The text that might be a box banner
 * @param prefix The comment prefix to check for
 * @returns The original text if it's a box banner, or null if not
 */
function extractTextFromBoxBanner(text: string, prefix: string): string | null {
    const normalizedText = text.replace(/(?:\r?\n)+$/, '')
    const lines = normalizedText.split(/\r?\n/)
    if (lines.length !== 3) {
        return null
    }

    const prefixStr = `${prefix} `
    const suffixToken = ` ${prefix}`

    // Allow indentation before prefix (line-mode preserves indentation)
    const normalizedLines = lines.map(line => line.trimStart())

    // Check if all lines start with the prefix
    if (!normalizedLines.every(line => line.startsWith(prefixStr))) {
        return null
    }

    // Get content after prefix for each line
    const contents = normalizedLines.map(line => {
        let content = line.substring(prefixStr.length)
        if (content.endsWith(suffixToken)) {
            content = content.substring(0, content.length - suffixToken.length)
        }
        return content
    })

    // Check for any known box style
    for (const style of Object.values(BOX_STYLES)) {
        // Check top line pattern
        if (contents[0].startsWith(style.topLeft) && contents[0].endsWith(style.topRight)) {
            // Check middle line pattern
            if (contents[1].startsWith(style.vertical) && contents[1].endsWith(style.vertical)) {
                // Check bottom line pattern
                if (contents[2].startsWith(style.bottomLeft) && contents[2].endsWith(style.bottomRight)) {
                    // Extract text from middle line
                    const innerText = contents[1].substring(1, contents[1].length - 1).trim()
                    return innerText
                }
            }
        }
    }

    return null
}

function normalizeRangeToAvoidTrailingNewline(range: vscode.Range, document: vscode.TextDocument): vscode.Range {
    // If a selection ends at column 0 of a later line, it likely includes the newline(s)
    // after the previous line. Replacing such a range with a non-newline-terminated string
    // can accidentally glue the next line onto the last banner line.
    if (range.end.character === 0 && range.end.line > range.start.line) {
        const previousLine = document.lineAt(range.end.line - 1)
        return new vscode.Range(range.start, previousLine.range.end)
    }
    return range
}

function isWhitespaceOnly(text: string): boolean {
    return /^\s*$/.test(text)
}

/**
 * Extension activation function. Called the first time a command from the extension is run.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    // Register the command bannerComment.make and bind it to the makeBanner function.
    const disposable = vscode.commands.registerCommand(
        'bannerComment.make',
        makeBanner
    )

    context.subscriptions.push(disposable)
}

/**
 * Extension deactivation function. Called when VS Code is shut down
 * or the extension is uninstalled/disabled.
 */
export function deactivate() {}

/**
 * Main command function.
 * Creates a banner from the selected text or the current line (depending on settings).
 */
function makeBanner() {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showWarningMessage('No active text editor.')
        return
    }

    const document = editor.document
    const eol = getDocumentEol(document)

    const configuration = vscode.workspace.getConfiguration('bannerComment')
    const target = normalizeBannerTarget(configuration.get<string>('target', 'selection'))
    const commentPrefixOverrideRaw = configuration.get<string>('commentPrefix', '')
    const preferLineCommentFromLanguageConfig = configuration.get<boolean>('preferLineCommentFromLanguageConfig', true)
    const rawLineWidth = configuration.get<number>('lineWidth', 80)
    const rawPaddingCharacter = configuration.get<string>('paddingCharacter', '-')
    const bannerStyle = configuration.get<string>('style', 'simple')
    const boxStyle = configuration.get<string>('boxStyle', 'unicode')
    const mirrorCommentPrefix = configuration.get<boolean>('mirrorCommentPrefix', false)

    // Validate and normalize configuration
    const { lineWidth, paddingCharacter } = validateConfiguration(rawLineWidth, rawPaddingCharacter)

    // Determine comment prefix based on language
    const commentPrefixOverride = (commentPrefixOverrideRaw ?? '').trim()

    let commentPrefix: string
    if (commentPrefixOverride.length > 0) {
        commentPrefix = commentPrefixOverride
    } else if (preferLineCommentFromLanguageConfig) {
        commentPrefix = getLineCommentPrefixFromLanguageConfiguration(document.languageId) ?? getCommentPrefix(document.languageId)
    } else {
        commentPrefix = getCommentPrefix(document.languageId)
    }

    const nonEmptySelections = editor.selections
        .map(sel => normalizeRangeToAvoidTrailingNewline(sel, document))
        .filter(range => document.getText(range).trim().length > 0)

    let operations: BannerOperation[] = []

    if (target === 'selection') {
        if (nonEmptySelections.length === 0) {
            vscode.window.showWarningMessage('Please select some text to create a banner.')
            return
        }

        if (bannerStyle === 'box') {
            const unsafe = nonEmptySelections.find(range => {
                const startLine = document.lineAt(range.start.line).text
                const endLine = document.lineAt(range.end.line).text
                const before = startLine.substring(0, range.start.character)
                const after = endLine.substring(range.end.character)
                return !isWhitespaceOnly(before) || !isWhitespaceOnly(after)
            })

            if (unsafe) {
                vscode.window.showWarningMessage(
                    'Box banners can only replace selections that occupy whole line content (besides indentation). Use bannerComment.target = "line" / "auto" or select only the line text.'
                )
                return
            }
        }

        operations = nonEmptySelections.map(range => {
            const indent = bannerStyle === 'box'
                ? document.lineAt(range.start.line).text.substring(0, range.start.character)
                : ''

            return {
                range,
                rawText: document.getText(range),
                indent,
                indentMode: bannerStyle === 'box' ? 'afterFirst' : 'all'
            }
        })
    } else if (target === 'auto' && nonEmptySelections.length > 0) {
        if (bannerStyle === 'box') {
            const unsafe = nonEmptySelections.find(range => {
                const startLine = document.lineAt(range.start.line).text
                const endLine = document.lineAt(range.end.line).text
                const before = startLine.substring(0, range.start.character)
                const after = endLine.substring(range.end.character)
                return !isWhitespaceOnly(before) || !isWhitespaceOnly(after)
            })

            if (unsafe) {
                vscode.window.showWarningMessage(
                    'Box banners can only replace selections that occupy whole line content (besides indentation). Use bannerComment.target = "line" / "auto" or select only the line text.'
                )
                return
            }
        }

        operations = nonEmptySelections.map(range => {
            const indent = bannerStyle === 'box'
                ? document.lineAt(range.start.line).text.substring(0, range.start.character)
                : ''

            return {
                range,
                rawText: document.getText(range),
                indent,
                indentMode: bannerStyle === 'box' ? 'afterFirst' : 'all'
            }
        })
    } else {
        const lineNumbers = new Set<number>()
        editor.selections.forEach(sel => lineNumbers.add(sel.active.line))

        operations = Array.from(lineNumbers).map(lineNumber => {
            const line = document.lineAt(lineNumber)
            return {
                range: line.range,
                rawText: line.text,
                indent: getLineIndentation(line.text),
                indentMode: 'all'
            }
        })
    }

    // Sort descending to avoid range shifting issues when inserting multi-line banners
    operations.sort((a, b) => {
        if (a.range.start.line !== b.range.start.line) {
            return b.range.start.line - a.range.start.line
        }
        return b.range.start.character - a.range.start.character
    })

    // Process all operations in a single edit operation for better undo support
    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        for (const op of operations) {
            // Try to extract text from existing banner (box or simple)
            let originalText: string

            // First, try to detect if it's a box banner
            const boxText = extractTextFromBoxBanner(op.rawText, commentPrefix)
            if (boxText !== null) {
                originalText = boxText
            } else {
                // Normalize text and try simple banner extraction
                const normalizedText = op.rawText.replace(/[\r\n]+/g, ' ')
                originalText = extractTextFromBanner(normalizedText, commentPrefix)
            }

            // Create banner based on selected style
            let banner: string
            if (bannerStyle === 'box') {
                banner = buildBoxBanner(
                    originalText,
                    lineWidth,
                    boxStyle,
                    commentPrefix,
                    mirrorCommentPrefix,
                    eol
                )
            } else {
                banner = buildBanner(
                    originalText,
                    lineWidth,
                    paddingCharacter,
                    commentPrefix,
                    mirrorCommentPrefix
                )
            }

            banner = op.indentMode === 'afterFirst'
                ? indentMultilineTextAfterFirstLine(banner, op.indent, eol)
                : indentMultilineText(banner, op.indent, eol)
            editBuilder.replace(op.range, banner)
        }
    }).then((success) => {
        if (!success) {
            vscode.window.showErrorMessage('Failed to create banner comment.')
        }
    })
}
