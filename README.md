# 🤖 AI Debate Extension for Chrome

A Chrome extension that enables automated debates between ChatGPT and Google Gemini. Watch two AI systems discuss topics back and forth, perfect for exploring different perspectives, testing AI reasoning, or simply entertainment.

## ✨ Features

- **Automated Debate Flow**: Messages are automatically copied from one AI to the other
- **Split View Support**: Works seamlessly with Chrome's split-view window management
- **Customizable Settings**:
  - Set debate topics
  - Configure turn limits (1-20 exchanges)
  - Adjust delay between responses (1-30 seconds)
- **Clean, Simple UI**: Minimal design perfect for screen recording
- **Real-time Activity Log**: Track the debate progress with timestamped events
- **Visual Indicators**: See when the extension is active on each AI page

## 📦 Installation

### Option 1: Load Unpacked Extension (Development)

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/tokumukansoya/Debate-AI-Extension-Chorme.git
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the extension directory

5. **Verify installation**
   - You should see "AI Debate Extension" in your extensions list
   - Pin it to the toolbar for easy access

## 🚀 Usage

### Setup

1. **Open ChatGPT**
   - Go to [chat.openai.com](https://chat.openai.com) or [chatgpt.com](https://chatgpt.com)
   - Sign in if needed

2. **Open Gemini**
   - Go to [gemini.google.com](https://gemini.google.com)
   - Sign in if needed

3. **Arrange Windows**
   - Use Chrome's split-view or arrange windows side by side
   - This allows you to watch both AIs simultaneously

### Starting a Debate

1. **Click the extension icon** in your toolbar

2. **Configure settings** (optional):
   - **Topic**: Enter a debate topic or question (e.g., "What is the meaning of life?")
   - **Turn Limit**: Set how many exchanges you want (default: 5)
   - **Delay**: Set seconds between responses (default: 3)

3. **Click "Start Debate"**
   - If you provided a topic, it will be sent to ChatGPT first
   - If no topic, manually start the conversation in either AI
   - The extension will then automatically exchange responses

4. **Watch the debate unfold**
   - Monitor the activity log for progress
   - Both AI pages will show a "🤖 AI Debate Active" indicator

5. **Stop anytime**
   - Click "Stop Debate" to end early
   - Or wait for the turn limit to be reached

## 🎥 Tips for Recording

- Use a clean browser profile without other extensions for minimal UI
- The extension has a simple, unobtrusive design
- Activity log helps you track what's happening off-screen
- Consider using split-screen recording software to capture both AIs

## 🔧 Technical Details

### Extension Structure

```
Debate-AI-Extension-Chorme/
├── manifest.json           # Extension configuration
├── popup.html             # Control panel UI
├── popup.css              # Styling
├── popup.js               # Control panel logic
├── background.js          # Service worker for coordination
├── content-chatgpt.js     # ChatGPT page interaction
├── content-gemini.js      # Gemini page interaction
└── icons/                 # Extension icons
```

### How It Works

1. **Content Scripts** inject into ChatGPT and Gemini pages
2. **Background Service Worker** coordinates the debate flow
3. **Popup UI** provides user control and status updates
4. Content scripts:
   - Extract AI responses from the page
   - Inject messages into input fields
   - Click send buttons programmatically
   - Wait for response completion before continuing

### Permissions

- `activeTab`: To interact with the current tab
- `storage`: To save user preferences
- `scripting`: To inject content scripts
- Host permissions for `chat.openai.com`, `chatgpt.com`, and `gemini.google.com`

## ⚠️ Limitations

- Requires active sessions in both ChatGPT and Gemini
- May need adjustment if OpenAI or Google change their UI
- Response detection uses heuristics and may occasionally miss responses
- Rate limits from AI providers still apply
- Does not bypass any API limits or terms of service

## 🐛 Troubleshooting

**Extension not working?**
- Ensure you're signed into both ChatGPT and Gemini
- Refresh the AI pages after installing the extension
- Check the browser console for error messages
- Verify the extension has necessary permissions

**Messages not sending?**
- Try increasing the delay setting
- Check if the AI pages are fully loaded
- Refresh the pages and try again

**Responses not detected?**
- The extension waits for responses to stabilize
- Very long responses may take time to complete
- Check the activity log for status updates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the MIT License.

## ⚖️ Disclaimer

This extension is for educational and entertainment purposes. It automates interaction with web interfaces of ChatGPT and Gemini. Users should:
- Respect the terms of service of both platforms
- Not use this for any malicious purposes
- Be aware of rate limits and usage policies
- Understand that AI responses may be unpredictable

---

**Enjoy watching AI debates! 🎭**