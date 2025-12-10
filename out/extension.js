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
 * Returns the comment prefix for the given language ID
 * @param languageId The VS Code language identifier
 * @returns The comment prefix (e.g., "//", "#", "--")
 */
function getCommentPrefix(languageId) {
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
            return '//';
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
            return '#';
        case 'sql':
        case 'lua':
        case 'haskell':
        case 'ada':
            return '--';
        case 'clojure':
        case 'lisp':
        case 'scheme':
            return ';;';
        case 'tex':
        case 'latex':
        case 'matlab':
            return '%';
        case 'bat':
            return 'REM';
        default:
            return '#';
    }
}
/**
 * Extracts the original text from a banner comment
 * @param text The text that might be a banner
 * @param prefix The comment prefix to check for
 * @returns The original text without banner formatting
 */
function extractTextFromBanner(text, prefix) {
    const trimmed = text.trim();
    // Check if it starts with the prefix
    if (!trimmed.startsWith(prefix)) {
        return trimmed;
    }
    // Remove the prefix and any whitespace
    const withoutPrefix = trimmed.substring(prefix.length).trim();
    // If it's empty after removing prefix, return empty
    if (withoutPrefix.length === 0) {
        return '';
    }
    // Check if it's a banner pattern: starts and ends with the same non-alphanumeric character
    // and has text in the middle surrounded by spaces
    if (withoutPrefix.length >= 2) {
        const firstChar = withoutPrefix.charAt(0);
        const lastChar = withoutPrefix.charAt(withoutPrefix.length - 1);
        // If first and last characters are the same and are padding characters
        if (firstChar === lastChar && /[^a-zA-Z0-9А-Яа-я\s]/.test(firstChar)) {
            // Try to find the pattern: padding + space + text + space + padding
            let start = 0;
            let end = withoutPrefix.length - 1;
            // Find where the padding ends on the left
            while (start < withoutPrefix.length && withoutPrefix.charAt(start) === firstChar) {
                start++;
            }
            // Find where the padding starts on the right  
            while (end >= 0 && withoutPrefix.charAt(end) === lastChar) {
                end--;
            }
            // Extract the middle part
            if (start <= end) {
                const middlePart = withoutPrefix.substring(start, end + 1).trim();
                if (middlePart.length > 0) {
                    return middlePart;
                }
            }
        }
    }
    // If not a banner pattern, return the text without prefix
    return withoutPrefix;
}
/**
 * Validates and normalizes configuration values
 * @param lineWidth The configured line width
 * @param paddingCharacter The configured padding character
 * @returns Normalized configuration object
 */
function validateConfiguration(lineWidth, paddingCharacter) {
    // Validate line width
    let normalizedWidth = lineWidth;
    if (!Number.isInteger(normalizedWidth) || normalizedWidth < 10) {
        normalizedWidth = 80;
        vscode.window.showWarningMessage(`Invalid line width: ${lineWidth}. Using default value: 80`);
    }
    if (normalizedWidth > 200) {
        normalizedWidth = 200;
        vscode.window.showWarningMessage(`Line width too large: ${lineWidth}. Using maximum value: 200`);
    }
    // Validate padding character
    let normalizedPadding = paddingCharacter;
    if (!normalizedPadding || normalizedPadding.length === 0) {
        normalizedPadding = '-';
        vscode.window.showWarningMessage('Empty padding character. Using default: "-"');
    }
    if (normalizedPadding.length > 1) {
        normalizedPadding = normalizedPadding.charAt(0);
        vscode.window.showWarningMessage(`Padding character too long: "${paddingCharacter}". Using first character: "${normalizedPadding}"`);
    }
    return {
        lineWidth: normalizedWidth,
        paddingCharacter: normalizedPadding
    };
}
/**
 * Builds a string of the form
 * <PREFIX> --------------- TITLE ---------------
 * @param text The text to put in the banner
 * @param width The total width of the banner line
 * @param fill The character to use for padding
 * @param prefix The comment prefix to use
 * @returns The formatted banner string
 */
function buildBanner(text, width, fill, prefix) {
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    // Handle empty text - create a simple line
    if (cleanText.length === 0) {
        const prefixStr = `${prefix} `;
        const bodyWidth = width - prefixStr.length;
        const body = fill.repeat(Math.max(0, bodyWidth));
        return `${prefixStr}${body}`;
    }
    const core = ` ${cleanText} `; // Add spaces around the text
    const prefixStr = `${prefix} `;
    const targetBodyWidth = width - prefixStr.length;
    // Check if text is too long for the specified width
    if (core.length >= targetBodyWidth) {
        // If text is too long, truncate it properly
        const availableSpace = Math.max(1, targetBodyWidth);
        const truncatedCore = core.substring(0, availableSpace);
        return `${prefixStr}${truncatedCore}`;
    }
    // Calculate padding for perfect centering
    const totalPadding = targetBodyWidth - core.length;
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    const body = fill.repeat(leftPadding) + core + fill.repeat(rightPadding);
    return `${prefixStr}${body}`;
}
/**
 * Extension activation function. Called the first time a command from the extension is run.
 * @param context The extension context provided by VS Code.
 */
function activate(context) {
    // Register the command bannerComment.make and bind it to the makeBanner function.
    const disposable = vscode.commands.registerCommand('bannerComment.make', makeBanner);
    context.subscriptions.push(disposable);
}
/**
 * Extension deactivation function. Called when VS Code is shut down
 * or the extension is uninstalled/disabled.
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
        return;
    }
    // Check if there are any valid selections
    const hasValidSelection = editor.selections.some(sel => {
        const text = editor.document.getText(sel);
        return text.trim().length > 0;
    });
    if (!hasValidSelection) {
        vscode.window.showWarningMessage('Please select some text to create a banner.');
        return;
    }
    const configuration = vscode.workspace.getConfiguration('bannerComment');
    const rawLineWidth = configuration.get('lineWidth', 80);
    const rawPaddingCharacter = configuration.get('paddingCharacter', '-');
    // Validate and normalize configuration
    const { lineWidth, paddingCharacter } = validateConfiguration(rawLineWidth, rawPaddingCharacter);
    // Determine comment prefix based on language
    const languageId = editor.document.languageId;
    const commentPrefix = getCommentPrefix(languageId);
    // Process all selections in a single edit operation for better undo support
    editor.edit((editBuilder) => {
        editor.selections.forEach((sel) => {
            const rawText = editor.document.getText(sel);
            // Normalize text: replace newlines with spaces to ensure single-line banner
            const normalizedText = rawText.replace(/[\r\n]+/g, ' ');
            const trimmedText = normalizedText.trim();
            if (trimmedText.length === 0) {
                // Skip empty selections
                return;
            }
            // Extract original text if it's already a banner
            const originalText = extractTextFromBanner(normalizedText, commentPrefix);
            // Create new banner with original text
            const banner = buildBanner(originalText, lineWidth, paddingCharacter, commentPrefix);
            editBuilder.replace(sel, banner);
        });
    }).then((success) => {
        if (!success) {
            vscode.window.showErrorMessage('Failed to create banner comment.');
        }
    });
}
//# sourceMappingURL=extension.js.map