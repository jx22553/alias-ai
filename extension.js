const vscode = require('vscode');
const { getVariableContexts } = require('./src/parser.js');
const { getAISuggestions } = require('./src/ai.js');
const { setApiKey, getApiKey } = require('./src/apiKeyManager.js');

function activate(context) {
    console.log('AliasBot extension activated');
    
    let aliasBotEditor;

    // Command to set the API key
    const setApiKeyCommand = vscode.commands.registerCommand('aliasai.setApiKey', async () => {
        await setApiKey(context.secrets);
    });
    context.subscriptions.push(setApiKeyCommand);

    const disposable = vscode.commands.registerCommand('aliasai.renameVariables', async () => {
        
        aliasBotEditor = vscode.window.activeTextEditor;
        if (!aliasBotEditor) {
            vscode.window.showErrorMessage('No active editor found. Please open a file.');
            return;
        }

        const languageId = aliasBotEditor.document.languageId;
        console.log('Active Language ID:', languageId);

        const supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'cpp'];
        if (!supportedLanguages.includes(languageId)) {
            vscode.window.showErrorMessage(`Alias AI does not support the "${languageId}" language.`);
            return;
        }


        const code = aliasBotEditor.document.getText();
        console.log('Code from active editor:', code);
        console.log(`Processing code for language: ${languageId}`);

        // const variables = getVariableContexts(code);
        const variables = getVariableContexts(code, languageId);
        console.log('Extracted variables:', variables);

        
        // Map variables with their assigned values for the AI prompt
        const variablesWithValues = variables.map(variable => ({
            name: variable.name,
            assignedValue: variable.assignedValue || 'No value assigned',
        }));

        // Debug log to verify variables and their values
        console.log('Variables with Values:', variablesWithValues);

        if (variables.length === 0) {
            vscode.window.showInformationMessage('No variables found in the code.');
            return;
        }

        const apiKey = await getApiKey(context.secrets);
        const suggestionsText = await getAISuggestions(variables, apiKey);
        console.log('AI Suggestions:', suggestionsText);

        const suggestions = {};
        const lines = suggestionsText.split('\n');

        const filteredSuggestions = lines.filter(line => line.includes('-'));

        // const extractedSuggestions = filteredSuggestions
        //     .map(line => line.match(/`(.+?)`/)?.[1])
        //     .filter(Boolean);

        // variables.forEach((variable) => {
        //     suggestions[variable.name] = extractedSuggestions;
        // });

        // Parse AI response to map suggestions to variables
        filteredSuggestions.forEach((line) => {
            console.log('Processing Line:', line);
        
            // Match lines with the format: - `variableName:suggestedName`
            const match = line.match(/- `(\w+):(.+?)`/);
            if (match) {
                console.log(`Match Found: Variable=${match[1]}, Suggestion=${match[2]}`);
                const variableName = match[1];
                const suggestedName = match[2];
                suggestions[variableName] = suggestions[variableName] || [];
                suggestions[variableName].push(suggestedName);
            } else {
                console.log('No Match Found for Line:', line);
            }
        });

        console.log('Filtered Suggestions:', filteredSuggestions);

        // Log parsed suggestions for debugging
        console.log('Parsed Suggestions:', suggestions);

        const panel = vscode.window.createWebviewPanel(
            'aliasaiSuggestions',
            'Alias AI Suggestions',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const tableRows = variables.map(variable => {
            const suggestionOptions = suggestions[variable.name]
                ? suggestions[variable.name].map(s => `<option value="${s}">${s}</option>`).join('')
                : '<option>No suggestions available</option>';

            return `
                <tr>
                    <td>
                        <span class="clickable" onclick="highlightVariable('${variable.name}')">${variable.name}</span>
                    </td>
                    <td>
                        <select>
                            ${suggestionOptions}
                        </select>
                    </td>
                    <td><input type="checkbox" id="${variable.name}" /></td>
                </tr>
            `;
        }).join('');

        panel.webview.html = `
        <html>
        <head>
            <style>
                .clickable {
                    color: blue;
                    text-decoration: underline;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h2>Alias AI Suggestions</h2>
            <table border="1">
                <tr>
                    <th>Current Name</th>
                    <th>Suggested Name</th>
                    <th>Approve</th>
                </tr>
                ${tableRows}
            </table>
            <button id="confirm">Confirm</button>
            <button id="cancel">Cancel</button>
            <script>
                const vscode = acquireVsCodeApi();

                function highlightVariable(variableName) {
                    vscode.postMessage({ action: 'highlight', variableName });
                }

                document.getElementById('confirm').addEventListener('click', () => {
                    const approvedChanges = {};
                    document.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
                        const row = input.parentElement.parentElement;
                        const currentName = row.children[0].textContent.trim();
                        const suggestedName = row.children[1].querySelector('select').value;
                        approvedChanges[currentName] = suggestedName;
                    });
                    vscode.postMessage({ action: 'confirm', approvedChanges });
                });

                document.getElementById('cancel').addEventListener('click', () => {
                    vscode.postMessage({ action: 'cancel' });
                });
            </script>
        </body>
        </html>
        `;

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.action === 'highlight') {
                const variableName = message.variableName.trim();
                console.log(`Highlighting variable: ${variableName}`);
        
                // Ensure the original editor is still valid
                if (!aliasBotEditor || aliasBotEditor.document.isClosed) {
                    vscode.window.showErrorMessage('The original editor is no longer available. Please reopen the file.');
                    return;
                }
        
                // Bring the editor into focus and reacquire the active editor
                console.log('Focusing on the editor...');
                await vscode.window.showTextDocument(aliasBotEditor.document);
                aliasBotEditor = vscode.window.activeTextEditor; // Reacquire the active editor
                console.log('Reacquired aliasBotEditor:', aliasBotEditor ? 'success' : 'failed');
                console.log('Is aliasBotEditor active:', vscode.window.activeTextEditor === aliasBotEditor);
        
                // Ensure the aliasBotEditor is now active
                if (!aliasBotEditor || vscode.window.activeTextEditor !== aliasBotEditor) {
                    vscode.window.showErrorMessage('Failed to activate the correct editor. Please try again.');
                    return;
                }
        
                // Locate the variable in the document
                const document = aliasBotEditor.document;
                const text = document.getText();
                console.log('Document Text Length:', text.length);
                console.log('Searching for variable with regex:', `\\b${variableName}\\b`);
        
                const regex = new RegExp(`\\b${variableName}\\b`, 'g');
                const matches = [...text.matchAll(regex)];
                console.log('Matches Found:', matches);
        
                if (matches.length > 0) {
                    const match = matches[0]; // Use the first match
                    const startOffset = match.index;
                    const endOffset = match.index + variableName.length;
        
                    console.log(`Match Start Offset: ${startOffset}, End Offset: ${endOffset}`);
        
                    const startPos = document.positionAt(startOffset);
                    const endPos = document.positionAt(endOffset);
        
                    console.log(`Highlighting range: Start(${startPos.line}, ${startPos.character}) -> End(${endPos.line}, ${endPos.character})`);
        
                    // Apply the selection and reveal the range
                    aliasBotEditor.selection = new vscode.Selection(startPos, endPos);
                    aliasBotEditor.revealRange(
                        new vscode.Range(startPos, endPos),
                        vscode.TextEditorRevealType.InCenterIfOutsideViewport
                    );
        
                    // Log the applied selection details
                    console.log('Selection Applied:', aliasBotEditor.selection);
                } else {
                    vscode.window.showErrorMessage(`Variable "${variableName}" not found in the document.`);
                    console.log(`Variable "${variableName}" not found in the document.`);
                }
            } else if (message.action === 'confirm') {
                const approvedChanges = message.approvedChanges;
                console.log('Approved changes:', approvedChanges);
        
                // Apply approved changes
                await applyApprovedChanges(aliasBotEditor, approvedChanges);
                panel.dispose();
            } else if (message.action === 'cancel') {
                vscode.window.showInformationMessage('No changes were applied.');
                panel.dispose();
            }
        });
        
        
        
    });

    context.subscriptions.push(disposable);
}

async function applyApprovedChanges(editor, approvedChanges) {
    console.log('Starting to apply approved changes:', approvedChanges);

    if (!editor) {
        vscode.window.showErrorMessage('AliasBot cannot find the original editor. Please rerun the command.');
        return;
    }

    const document = editor.document;

    if (vscode.window.activeTextEditor !== editor) {
        console.log('Editor is not active. Reopening the document...');
        await vscode.window.showTextDocument(document);
    }

    const success = await vscode.window.activeTextEditor.edit((editBuilder) => {
        for (const [originalName, newName] of Object.entries(approvedChanges)) {
            console.log(`Processing replacement: "${originalName}" -> "${newName}"`);

            const regex = new RegExp(`\\b${originalName.trim()}\\b`, 'g');
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const matchIndices = [...line.text.matchAll(regex)];

                if (matchIndices.length > 0) {
                    console.log(`Matches found for "${originalName}" on line ${i + 1}:`, matchIndices);

                    matchIndices.forEach((match) => {
                        const startPos = new vscode.Position(i, match.index);
                        const endPos = new vscode.Position(i, match.index + originalName.trim().length);

                        console.log(`Replacing range: (${startPos.line}, ${startPos.character}) -> (${endPos.line}, ${endPos.character})`);

                        editBuilder.replace(new vscode.Range(startPos, endPos), newName.trim());
                    });
                }
            }
        }
    });

    if (success) {
        vscode.window.showInformationMessage('Selected changes have been successfully applied.');
        console.log('Edit Operation Success:', success);
    } else {
        vscode.window.showErrorMessage('Failed to apply changes to the document.');
        console.error('Edit Operation Failed:', success);
    }
}

function deactivate() {}

module.exports = { activate, deactivate };


// import vscode from 'vscode';
// import { getVariableContexts } from './src/parser.js';
// import { getAISuggestions } from './src/ai.js';
// import { setApiKey, getApiKey } from './src/apiKeyManager.js';

// export function activate(context) {
//     console.log('Alias AI extension activated');
    
//     let aliasBotEditor;

//     // Command to set the API key
//     const setApiKeyCommand = vscode.commands.registerCommand('aliasai.setApiKey', async () => {
//         await setApiKey(context.secrets);
//     });
//     context.subscriptions.push(setApiKeyCommand);

//     const renameVariablesCommand = vscode.commands.registerCommand('aliasai.renameVariables', async () => {
//         aliasBotEditor = vscode.window.activeTextEditor;
//         if (!aliasBotEditor) {
//             vscode.window.showErrorMessage('No active editor found. Please open a file.');
//             return;
//         }

//         const languageId = aliasBotEditor.document.languageId;
//         console.log('Active Language ID:', languageId);

//         const supportedLanguages = ['javascript', 'typescript', 'python', 'java'];
//         if (!supportedLanguages.includes(languageId)) {
//             vscode.window.showErrorMessage(`Alias AI does not support the "${languageId}" language.`);
//             return;
//         }

//         const code = aliasBotEditor.document.getText();
//         console.log('Code from active editor:', code);
//         console.log(`Processing code for language: ${languageId}`);

//         const variables = getVariableContexts(code, languageId);
//         console.log('Extracted variables:', variables);

//         const variablesWithValues = variables.map(variable => ({
//             name: variable.name,
//             assignedValue: variable.assignedValue || 'No value assigned',
//         }));

//         console.log('Variables with Values:', variablesWithValues);

//         if (variables.length === 0) {
//             vscode.window.showInformationMessage('No variables found in the code.');
//             return;
//         }

//         const apiKey = await getApiKey(context.secrets);
//         const suggestionsText = await getAISuggestions(variables, apiKey, languageId);
//         console.log('AI Suggestions:', suggestionsText);

//         const suggestions = {};
//         const lines = suggestionsText.split('\n');
//         const filteredSuggestions = lines.filter(line => line.includes('-'));

//         filteredSuggestions.forEach((line) => {
//             const match = line.match(/- `(\w+):(.+?)`/);
//             if (match) {
//                 const variableName = match[1];
//                 const suggestedName = match[2];
//                 suggestions[variableName] = suggestions[variableName] || [];
//                 suggestions[variableName].push(suggestedName);
//             }
//         });

//         const panel = vscode.window.createWebviewPanel(
//             'aliasaiSuggestions',
//             'Alias AI Suggestions',
//             vscode.ViewColumn.One,
//             { enableScripts: true }
//         );

//         const tableRows = variables.map(variable => {
//             const suggestionOptions = suggestions[variable.name]
//                 ? suggestions[variable.name].map(s => `<option value="${s}">${s}</option>`).join('')
//                 : '<option>No suggestions available</option>';

//             return `
//                 <tr>
//                     <td>
//                         <span class="clickable" onclick="highlightVariable('${variable.name}')">${variable.name}</span>
//                     </td>
//                     <td>
//                         <select>
//                             ${suggestionOptions}
//                         </select>
//                     </td>
//                     <td><input type="checkbox" id="${variable.name}" /></td>
//                 </tr>
//             `;
//         }).join('');

//         panel.webview.html = `
//         <html>
//         <head>
//             <style>
//                 .clickable {
//                     color: blue;
//                     text-decoration: underline;
//                     cursor: pointer;
//                 }
//             </style>
//         </head>
//         <body>
//             <h2>Alias AI Suggestions</h2>
//             <table border="1">
//                 <tr>
//                     <th>Current Name</th>
//                     <th>Suggested Name</th>
//                     <th>Approve</th>
//                 </tr>
//                 ${tableRows}
//             </table>
//             <button id="confirm">Confirm</button>
//             <button id="cancel">Cancel</button>
//             <script>
//                 const vscode = acquireVsCodeApi();

//                 function highlightVariable(variableName) {
//                     vscode.postMessage({ action: 'highlight', variableName });
//                 }

//                 document.getElementById('confirm').addEventListener('click', () => {
//                     const approvedChanges = {};
//                     document.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
//                         const row = input.parentElement.parentElement;
//                         const currentName = row.children[0].textContent.trim();
//                         const suggestedName = row.children[1].querySelector('select').value;
//                         approvedChanges[currentName] = suggestedName;
//                     });
//                     vscode.postMessage({ action: 'confirm', approvedChanges });
//                 });

//                 document.getElementById('cancel').addEventListener('click', () => {
//                     vscode.postMessage({ action: 'cancel' });
//                 });
//             </script>
//         </body>
//         </html>
//         `;

//         panel.webview.onDidReceiveMessage(async (message) => {
//             if (message.action === 'highlight') {
//                 const variableName = message.variableName.trim();
//                 if (!aliasBotEditor || aliasBotEditor.document.isClosed) {
//                     vscode.window.showErrorMessage('The original editor is no longer available. Please reopen the file.');
//                     return;
//                 }
//                 await vscode.window.showTextDocument(aliasBotEditor.document);
//                 const document = aliasBotEditor.document;
//                 const text = document.getText();
//                 const regex = new RegExp(`\\b${variableName}\\b`, 'g');
//                 const matches = [...text.matchAll(regex)];
//                 if (matches.length > 0) {
//                     const match = matches[0];
//                     const startPos = document.positionAt(match.index);
//                     const endPos = document.positionAt(match.index + variableName.length);
//                     aliasBotEditor.selection = new vscode.Selection(startPos, endPos);
//                     aliasBotEditor.revealRange(
//                         new vscode.Range(startPos, endPos),
//                         vscode.TextEditorRevealType.InCenterIfOutsideViewport
//                     );
//                 } else {
//                     vscode.window.showErrorMessage(`Variable "${variableName}" not found in the document.`);
//                 }
//             } else if (message.action === 'confirm') {
//                 await applyApprovedChanges(aliasBotEditor, message.approvedChanges);
//                 panel.dispose();
//             } else if (message.action === 'cancel') {
//                 panel.dispose();
//             }
//         });
//     });

//     context.subscriptions.push(renameVariablesCommand);
// }

// async function applyApprovedChanges(editor, approvedChanges) {
//     if (!editor) {
//         vscode.window.showErrorMessage('Alias AI cannot find the original editor. Please rerun the command.');
//         return;
//     }

//     const document = editor.document;

//     await vscode.window.showTextDocument(document);
//     const success = await vscode.window.activeTextEditor.edit((editBuilder) => {
//         for (const [originalName, newName] of Object.entries(approvedChanges)) {
//             const regex = new RegExp(`\\b${originalName.trim()}\\b`, 'g');
//             for (let i = 0; i < document.lineCount; i++) {
//                 const line = document.lineAt(i);
//                 const matchIndices = [...line.text.matchAll(regex)];
//                 matchIndices.forEach((match) => {
//                     const startPos = new vscode.Position(i, match.index);
//                     const endPos = new vscode.Position(i, match.index + originalName.trim().length);
//                     editBuilder.replace(new vscode.Range(startPos, endPos), newName.trim());
//                 });
//             }
//         }
//     });

//     if (success) {
//         vscode.window.showInformationMessage('Selected changes have been successfully applied.');
//     } else {
//         vscode.window.showErrorMessage('Failed to apply changes to the document.');
//     }
// }

// export function deactivate() {}
