"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
/**
 * Builds a string of the form
 * # --------------- TITLE ---------------
 */
function buildBanner(text, width, fill) {
    const core = ` ${text.trim()} `; // Add spaces around the text
    // Note that the 'body' string itself should be 2 characters shorter than the total width because of '# '
    const targetBodyWidth = width - 2;
    const body = core
        .padStart(Math.floor((targetBodyWidth + core.length) / 2), fill)
        .padEnd(targetBodyWidth, fill);
    return `# ${body}`;
}
/**
 * Extension activation function. Called the first time a command from the extension is run.
 * @param context The extension context provided by VS Code.
 */
function activate(context) {
    // Message in the developer console (can be removed or kept for debugging)
    // console.log('Extension "banner-comment" is activated.');
    // Register the command bannerComment.make and bind it to the makeBanner function.
    // registerCommand returns a Disposable that must be added to the context's subscriptions
    // so that the command’s resources are freed when the extension is deactivated.
    const disposable = vscode.commands.registerCommand('bannerComment.make', makeBanner);
    context.subscriptions.push(disposable);
}
/**
 * Extension deactivation function. Called when VS Code is shut down
 * or the extension is uninstalled/disabled.
 * All resources registered in context.subscriptions are automatically released.
 * Additional cleanup is usually not required for simple extensions.
 */
function deactivate() { }
/**
 * Main command function.
 * Gets the selected text from the active editor and replaces it with a banner.
 */
function makeBanner() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active text editor.');
        return; // No active editor
    }
    const configuration = vscode.workspace.getConfiguration('bannerComment');
    const lineWidth = configuration.get('lineWidth', 80); // Default to 80 if not set
    const paddingCharacter = configuration.get('paddingCharacter', '-'); // Default to '-' if not set
    editor.edit((editBuilder) => {
        editor.selections.forEach((sel) => {
            const rawText = editor.document.getText(sel);
            if (!rawText.trim()) {
                // If the selection is empty or consists only of whitespace, do nothing
                return;
            }
            const banner = buildBanner(rawText, lineWidth, paddingCharacter); // Use the existing buildBanner function
            editBuilder.replace(sel, banner);
        });
    });
}
//# sourceMappingURL=extension.js.map