import * as vscode from 'vscode'

/**
 * Extracts the original text from a banner comment
 * @param text The text that might be a banner
 * @returns The original text without banner formatting
 */
function extractTextFromBanner(text: string): string {
    const trimmed = text.trim()
    
    // Check if it starts with # (banner format)
    if (!trimmed.startsWith('#')) {
        return trimmed
    }
    
    // Remove the # prefix and any whitespace
    const withoutPrefix = trimmed.substring(1).trim()
    
    // If it's empty after removing #, return empty
    if (withoutPrefix.length === 0) {
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
    
    // If not a banner pattern, return the text without # prefix
    return withoutPrefix
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

/**
 * Builds a string of the form
 * # --------------- TITLE ---------------
 * @param text The text to put in the banner
 * @param width The total width of the banner line
 * @param fill The character to use for padding
 * @returns The formatted banner string
 */
function buildBanner(text: string, width: number, fill: string): string {
    const cleanText = text.trim()
    
    // Handle empty text - create a simple line
    if (cleanText.length === 0) {
        const bodyWidth = width - 2 // Account for "# "
        const body = fill.repeat(Math.max(0, bodyWidth))
        return `# ${body}`
    }
    
    const core = ` ${cleanText} ` // Add spaces around the text
    const targetBodyWidth = width - 2 // Account for "# "
    
    // Check if text is too long for the specified width
    if (core.length >= targetBodyWidth) {
        // If text is too long, truncate it properly
        const availableSpace = Math.max(1, targetBodyWidth)
        const truncatedCore = core.substring(0, availableSpace)
        return `# ${truncatedCore}`
    }
    
    // Calculate padding for perfect centering
    const totalPadding = targetBodyWidth - core.length
    const leftPadding = Math.floor(totalPadding / 2)
    const rightPadding = totalPadding - leftPadding
    
    const body = fill.repeat(leftPadding) + core + fill.repeat(rightPadding)
    return `# ${body}`
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
 * Gets the selected text from the active editor and replaces it with a banner.
 */
function makeBanner() {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showWarningMessage('No active text editor.')
        return
    }

    // Check if there are any valid selections
    const hasValidSelection = editor.selections.some(sel => {
        const text = editor.document.getText(sel)
        return text.trim().length > 0
    })
    
    if (!hasValidSelection) {
        vscode.window.showWarningMessage('Please select some text to create a banner.')
        return
    }

    const configuration = vscode.workspace.getConfiguration('bannerComment')
    const rawLineWidth = configuration.get<number>('lineWidth', 80)
    const rawPaddingCharacter = configuration.get<string>('paddingCharacter', '-')
    
    // Validate and normalize configuration
    const { lineWidth, paddingCharacter } = validateConfiguration(rawLineWidth, rawPaddingCharacter)

    // Process all selections in a single edit operation for better undo support
    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        editor.selections.forEach((sel: vscode.Selection) => {
            const rawText = editor.document.getText(sel)
            const trimmedText = rawText.trim()
            
            if (trimmedText.length === 0) {
                // Skip empty selections
                return
            }
            
            // Extract original text if it's already a banner
            const originalText = extractTextFromBanner(rawText)
            
            // Create new banner with original text
            const banner = buildBanner(originalText, lineWidth, paddingCharacter)
            editBuilder.replace(sel, banner)
        })
    }).then((success) => {
        if (!success) {
            vscode.window.showErrorMessage('Failed to create banner comment.')
        }
    })
}