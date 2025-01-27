// const vscode = require('vscode');
// async function setApiKey(secretStorage) {
//     const apiKey = await vscode.window.showInputBox({
//         prompt: 'Enter your OpenAI API key',
//         ignoreFocusOut: true,
//         password: true, // Mask the input
//     });
//     if (apiKey) {
//         await secretStorage.store('openaiApiKey', apiKey);
//         vscode.window.showInformationMessage('OpenAI API key saved successfully!');
//     } else {
//         vscode.window.showErrorMessage('No API key was entered.');
//     }
// }
// async function getApiKey(secretStorage) {
//     const apiKey = await secretStorage.get('openaiApiKey');
//     if (!apiKey) {
//         throw new Error('OpenAI API key not found. Please set the key using the "Alias AI: Set API Key" command.');
//     }
//     return apiKey;
// }
// module.exports = { setApiKey, getApiKey };
import * as vscode from 'vscode';
export async function setApiKey(secretStorage) {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your OpenAI API key',
        ignoreFocusOut: true,
        password: true, // Mask the input
    });
    if (apiKey) {
        await secretStorage.store('openaiApiKey', apiKey);
        vscode.window.showInformationMessage('OpenAI API key saved successfully!');
    }
    else {
        vscode.window.showErrorMessage('No API key was entered.');
    }
}
export async function getApiKey(secretStorage) {
    const apiKey = await secretStorage.get('openaiApiKey');
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set the key using the "Alias AI: Set API Key" command.');
    }
    return apiKey;
}
