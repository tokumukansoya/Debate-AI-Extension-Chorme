# 📖 Installation Guide

## Prerequisites

- Google Chrome browser (version 88 or higher recommended)
- Active accounts for:
  - ChatGPT ([chat.openai.com](https://chat.openai.com) or [chatgpt.com](https://chatgpt.com))
  - Google Gemini ([gemini.google.com](https://gemini.google.com))

## Step-by-Step Installation

### 1. Download the Extension

**Option A: Clone from GitHub**
```bash
git clone https://github.com/tokumukansoya/Debate-AI-Extension-Chorme.git
cd Debate-AI-Extension-Chorme
```

**Option B: Download ZIP**
1. Go to the GitHub repository
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to a location on your computer

### 2. Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in the address bar, or
   - Click the three-dot menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**
   - Look for the "Developer mode" toggle in the top-right corner
   - Turn it ON (it should turn blue)

3. **Load Unpacked Extension**
   - Click the "Load unpacked" button that appears
   - Navigate to the extension folder you downloaded/cloned
   - Select the folder and click "Select Folder" (or "Open")

4. **Verify Installation**
   - You should see "AI Debate Extension" appear in your extensions list
   - The extension should be enabled (toggle switch is blue)
   - Pin it to your toolbar by clicking the puzzle piece icon and pinning "AI Debate Extension"

### 3. Set Up Your Workspace

1. **Open ChatGPT**
   - Navigate to [chat.openai.com](https://chat.openai.com) or [chatgpt.com](https://chatgpt.com)
   - Sign in if you haven't already
   - Start a new chat if needed

2. **Open Gemini**
   - Navigate to [gemini.google.com](https://gemini.google.com)
   - Sign in with your Google account
   - Ensure you're on a new or appropriate chat

3. **Arrange Windows**
   - **Option A - Split Screen (Recommended):**
     - Windows: Drag a window to the left/right edge until you see a snap outline
     - Mac: Use a third-party tool like Rectangle, or manually resize
   
   - **Option B - Side by Side:**
     - Manually resize browser windows to view both simultaneously

## First-Time Setup

### 4. Test the Extension

1. **Click the extension icon** in your Chrome toolbar (the purple icon you pinned)

2. **Configure initial settings:**
   - **Topic**: Enter a simple test topic like "Hello, let's test this system"
   - **Turn Limit**: Set to 2 or 3 for initial testing
   - **Delay**: Keep at 3 seconds

3. **Click "Start Debate"**
   - Watch the Activity Log for updates
   - You should see "🤖 AI Debate Active" indicators on both AI pages
   - The topic will be sent to ChatGPT
   - After ChatGPT responds, it will be sent to Gemini
   - The process continues automatically

4. **Verify it works:**
   - Both AIs should respond in turn
   - Messages should appear automatically
   - Activity log should show progress
   - You can stop at any time with "Stop Debate"

## Troubleshooting Installation

### Extension won't load
- **Error: "Manifest file is missing or unreadable"**
  - Ensure you selected the correct folder containing `manifest.json`
  - The folder structure should have `manifest.json` at the root level

- **Error: "Manifest version 3 is not supported"**
  - Update Chrome to version 88 or higher
  - Check: Menu → Help → About Google Chrome

### Extension loads but doesn't work
1. **Refresh AI pages**
   - After installing, refresh both ChatGPT and Gemini pages
   - The content scripts need to be injected

2. **Check permissions**
   - Go to `chrome://extensions/`
   - Find "AI Debate Extension"
   - Click "Details"
   - Ensure site permissions are granted

3. **Check console for errors**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any red error messages
   - Report these in GitHub issues if needed

### Visual indicator doesn't appear
- The "🤖 AI Debate Active" indicator appears when a debate is running
- If not visible:
  - Check if debate actually started (check Activity Log)
  - Try refreshing the AI pages
  - Ensure z-index isn't being overridden by the site

## Updating the Extension

When a new version is released:

1. **Pull latest changes** (if using Git):
   ```bash
   cd Debate-AI-Extension-Chorme
   git pull origin main
   ```

2. **Or download new ZIP** and extract to replace old files

3. **Reload extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find "AI Debate Extension"
   - Click the refresh/reload icon (circular arrow)

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "AI Debate Extension"
3. Click "Remove"
4. Confirm removal
5. Optionally delete the extension folder from your computer

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting section in README.md](README.md#-troubleshooting)
2. Look through [GitHub Issues](https://github.com/tokumukansoya/Debate-AI-Extension-Chorme/issues)
3. Create a new issue with:
   - Chrome version
   - Operating system
   - Detailed description of the problem
   - Console error messages (if any)
   - Screenshots (if applicable)

## Next Steps

Once installed, check out:
- [Usage Guide](README.md#-usage) - How to run debates effectively
- [Tips for Recording](README.md#-tips-for-recording) - Making great videos
- [Technical Details](README.md#-technical-details) - How it works under the hood

---

**Happy debating! 🎭**
