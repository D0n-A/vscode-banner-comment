import * as vscode from 'vscode'

/**
 * Builds a string of the form
 * # --------------- TITLE ---------------
 */
function buildBanner(text: string, width: number, fill: string): string {
    const core = ` ${text.trim()} ` // Add spaces around the text
    // Note that the 'body' string itself should be 2 characters shorter than the total width because of '# '
    const targetBodyWidth = width - 2
    const body = core
        .padStart(Math.floor((targetBodyWidth + core.length) / 2), fill)
        .padEnd(targetBodyWidth, fill)
    return `# ${body}`
}

/**
 * Extension activation function. Called the first time a command from the extension is run.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    // Message in the developer console (can be removed or kept for debugging)
    // console.log('Extension "banner-comment" is activated.');

    // Register the command bannerComment.make and bind it to the makeBanner function.
    // registerCommand returns a Disposable that must be added to the context's subscriptions
    // so that the command’s resources are freed when the extension is deactivated.
    const disposable = vscode.commands.registerCommand(
        'bannerComment.make',
        makeBanner
    )

    context.subscriptions.push(disposable)
}

/**
 * Extension deactivation function. Called when VS Code is shut down
 * or the extension is uninstalled/disabled.
 * All resources registered in context.subscriptions are automatically released.
 * Additional cleanup is usually not required for simple extensions.
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
        return // No active editor
    }

    const configuration = vscode.workspace.getConfiguration('bannerComment')
    const lineWidth = configuration.get<number>('lineWidth', 80) // Default to 80 if not set
    const paddingCharacter = configuration.get<string>('paddingCharacter', '-') // Default to '-' if not set

    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        editor.selections.forEach((sel: vscode.Selection) => {
            const rawText = editor.document.getText(sel)
            if (!rawText.trim()) {
                // If the selection is empty or consists only of whitespace, do nothing
                return
            }
            const banner = buildBanner(rawText, lineWidth, paddingCharacter) // Use the existing buildBanner function
            editBuilder.replace(sel, banner)
        })
    })
}
