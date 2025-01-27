# Alias AI

**Alias AI** is a Visual Studio Code extension powered by AI that helps you rename variables, functions, and classes to cleaner, more professional names. It analyzes your code, provides multiple context-aware suggestions, and ensures your code is easier to understand and maintain.

---

## Features

- 🧠 **AI-Powered Suggestions**: Get better, context-aware names for variables, functions, and classes.
- 📊 **Inline Suggestions**: View multiple naming suggestions for each entity in an intuitive dropdown.
- 🖱️ **Highlight and Navigate**: Click on variable names in the suggestions panel to locate and highlight them in your code.
- ✅ **Apply Changes Effortlessly**: Approve and apply the suggested names directly from the UI.
- 🔄 **Real-Time Feedback**: Automatically analyzes and updates suggestions as you work.
- 🔒 **Secure API Key Storage**: Use VS Code's secret storage to securely store your OpenAI API key.

---

## Prerequisites

To use Alias AI, you will need an **OpenAI API key**. The API key enables the extension to communicate with OpenAI's servers and provide AI-powered suggestions.

---

## How to Install

1. Open **Visual Studio Code**.
2. Go to the **Extensions View** by clicking the Extensions icon in the Activity Bar on the side of the window.
3. Search for **Alias AI** in the Extensions Marketplace.
4. Click **Install** to add the extension to your editor.
5. Reload VS Code if prompted.

---

## Setting Up Your OpenAI API Key

To use Alias AI, you'll need an OpenAI API key. Follow these steps to set it up:

1. Obtain your API key from the [OpenAI platform](https://platform.openai.com/).
2. In VS Code, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette.
3. Search for and select `Alias AI: Set API Key`.
4. Enter your OpenAI API key when prompted and press `Enter`.
5. You’ll see a confirmation message once the key is securely stored.

---

## How to Use

### 1. Open a Code File
- Open a JavaScript or TypeScript file in Visual Studio Code.

### 2. Trigger the Command
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette.
- Search for and select `Alias AI: Rename Variables`.

### 3. View AI Suggestions
- The extension analyzes your code and generates a **Suggestions Panel** listing all variables, functions, and classes with AI-suggested names.
- Each suggestion has a dropdown menu with multiple name options.

### 4. Highlight Variables in Your Code
- Click on a variable name in the panel to locate and highlight it in your code.

### 5. Approve Changes
- Select the desired name for each variable, function, or class from the dropdown.
- Check the box for the items you want to approve.
- Click the **Confirm** button to apply the changes directly to your code.

### 6. Cancel if Needed
- Click the **Cancel** button to discard changes and keep your code untouched.

---

## Example Usage

### Input Code:
```javascript
const x = 42;
function doStuff() {
    console.log(x);
}
const obj = { a: 1, b: 2 };
```

### Output Code (After Applying Suggestions):
```javascript
const count = 42;
function logCount() {
    console.log(count);
}
const data = { a: 1, b: 2 };
```

---

## Troubleshooting

- **No API Key Found**:  
  Ensure you have set your OpenAI API key using the `Alias AI: Set API Key` command. If you haven't, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS), search for `Alias AI: Set API Key`, and enter your API key.

- **Suggestions Not Appearing**:  
  Ensure your code is saved and contains variables, functions, or classes that Alias AI can analyze. If the problem persists, check the console logs in the **Output** panel for more details (select "Alias AI" in the dropdown).

- **Error During API Communication**:  
  Double-check your OpenAI API key and ensure you have an active internet connection. If your API key has expired or is invalid, update it using the `Alias AI: Set API Key` command.


## Feedback and Support

If you encounter any issues, have suggestions, or need help, feel free to:

1. Create an issue in the [GitHub repository](https://github.com/your-repository-link).
2. Reach out to us directly through the [Visual Studio Code Marketplace page](https://marketplace.visualstudio.com/).

We’re here to help and continuously improve Alias AI! 🎉
