# AI Debate Extension for Chrome

A Chrome extension that enables AI models (ChatGPT and Google Gemini) to debate each other automatically. Watch as AI debates unfold in real-time with a clean, simple interface perfect for recording.

## Features

- 🤖 **Automated AI Debates**: ChatGPT and Gemini exchange messages automatically
- 🎨 **Clean UI**: Simple, elegant design perfect for screen recording
- ⚙️ **Customizable Settings**: Configure max exchanges and delay between messages
- 📊 **Real-time Status**: Visual indicators show which AI is currently responding
- 🖥️ **Split-View Ready**: Works seamlessly when both AI tabs are side-by-side
- 🎯 **Easy Controls**: Start and stop debates with one click

## Installation

### For Development

1. Clone this repository:
   ```bash
   git clone https://github.com/tokumukansoya/Debate-AI-Extension-Chorme.git
   cd Debate-AI-Extension-Chorme
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked" and select the extension directory

5. The AI Debate Extension icon should appear in your browser toolbar

### For Users

*(Once published to Chrome Web Store)*
- Visit the Chrome Web Store
- Search for "AI Debate Extension"
- Click "Add to Chrome"

## Usage

1. **Open Both AI Platforms**:
   - Open ChatGPT in one tab: `https://chatgpt.com`
   - Open Google Gemini in another tab: `https://gemini.google.com`
   - Arrange tabs side-by-side (split screen view recommended)

2. **Start a Debate**:
   - Click the extension icon in the toolbar
   - Configure settings (optional):
     - **Max Exchanges**: Number of back-and-forth exchanges (default: 10)
     - **Delay**: Seconds to wait between messages (default: 5)
   - Click "Start Debate"

3. **Watch the Debate**:
   - The extension will automatically:
     - Send an initial prompt to ChatGPT
     - Wait for ChatGPT's response
     - Send that response to Gemini
     - Wait for Gemini's response
     - Send that back to ChatGPT
     - Continue until max exchanges reached
   - Visual indicators appear on each page showing which AI is active
   - Exchange counter shows progress in the popup

4. **Stop the Debate**:
   - Click "Stop Debate" in the popup at any time
   - Or wait for the debate to complete automatically

## How It Works

The extension consists of:

- **Popup UI** (`popup.html`, `popup.js`, `popup.css`): Control panel for starting/stopping debates
- **Background Service Worker** (`background.js`): Coordinates message flow between tabs
- **Content Scripts**: 
  - `content-chatgpt.js`: Interacts with ChatGPT interface
  - `content-gemini.js`: Interacts with Gemini interface

### Message Flow

1. User clicks "Start Debate"
2. Background script sends initial prompt to ChatGPT
3. ChatGPT content script:
   - Inserts message into input field
   - Clicks send button
   - Monitors for response completion
   - Extracts response text
   - Sends to background script
4. Background script forwards to Gemini
5. Gemini content script repeats the process
6. Cycle continues until max exchanges or manual stop

## Screenshots

### Extension Popup
The clean control panel with start/stop buttons and settings.

### Split View Debate
Watch both AIs debate side-by-side with visual indicators.

## Settings

- **Max Exchanges** (1-100): Maximum number of message exchanges
- **Delay** (1-30 seconds): Wait time between sending messages

## Tips for Best Results

- Use Chrome's split-screen feature to view both AIs side-by-side
- Start with a clear, interesting debate topic
- Adjust delay if responses are being cut off too early
- Keep window in focus for best performance
- Use incognito mode if you want to test multiple debate sessions

## Troubleshooting

**Debate won't start**:
- Ensure both ChatGPT and Gemini tabs are open
- Make sure you're logged into both platforms
- Check that no other extensions are interfering

**Messages not sending**:
- Try increasing the delay setting
- Refresh both AI tabs and restart the debate
- Check browser console for errors (F12)

**Responses cut off**:
- Increase the delay between messages
- Some responses take longer to generate

## Development

### Structure
```
Debate-AI-Extension-Chorme/
├── manifest.json           # Extension configuration
├── popup.html             # Popup UI structure
├── popup.css              # Popup styling
├── popup.js               # Popup logic
├── background.js          # Background service worker
├── content-chatgpt.js     # ChatGPT content script
├── content-gemini.js      # Gemini content script
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Testing

1. Load the unpacked extension in Chrome
2. Open browser console (F12) on AI tabs to see debug logs
3. Check the service worker console in `chrome://extensions/`
4. Test with different settings and scenarios

## Privacy & Security

- This extension only runs on ChatGPT and Gemini domains
- No data is collected or sent to external servers
- All communication happens locally in your browser
- Messages are only exchanged between the two AI platforms

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built for enabling AI-to-AI interactions
- Designed with screen recording in mind
- Inspired by the curiosity of what happens when AIs debate

## Future Enhancements

- Support for more AI platforms
- Debate topic templates
- Export debate transcripts
- Custom system prompts
- Pause/resume functionality
- Multiple debate threads

---

**Note**: This extension requires active accounts on both ChatGPT and Google Gemini. Response quality and speed depend on the AI platforms themselves.