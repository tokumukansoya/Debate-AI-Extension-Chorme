# Installation and Testing Guide

## Quick Installation Steps

1. **Download the Extension**
   - Clone the repository or download as ZIP
   - Extract to a folder on your computer

2. **Load in Chrome**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extension folder
   - The extension icon should appear in your toolbar

3. **Verify Installation**
   - Click the extension icon
   - You should see the "AI Debate" popup
   - The popup should show start/stop controls and settings

## Testing the Extension

### Before Testing
- Make sure you have accounts on both:
  - ChatGPT (https://chatgpt.com or https://chat.openai.com)
  - Google Gemini (https://gemini.google.com)

### Step-by-Step Test

1. **Open Both AI Platforms**
   ```
   Tab 1: Open https://chatgpt.com
   Tab 2: Open https://gemini.google.com
   ```
   
2. **Arrange Windows**
   - Use Chrome's split screen or arrange windows side-by-side
   - This allows you to watch both AIs simultaneously

3. **Start a Debate**
   - Click the extension icon in the toolbar
   - Verify the popup opens correctly
   - Set "Max Exchanges" to 3 (for quick testing)
   - Set "Delay" to 5 seconds
   - Click "Start Debate"

4. **Observe the Debate**
   - ChatGPT should receive the initial message automatically
   - A visual indicator appears showing "ChatGPT Debating..."
   - After ChatGPT responds, Gemini receives the message
   - Watch the exchange counter increment
   - Visual indicators show which AI is currently active

5. **Expected Behavior**
   - Initial prompt sent to ChatGPT
   - ChatGPT generates response
   - Response automatically sent to Gemini
   - Gemini generates response
   - Response sent back to ChatGPT
   - Process continues for configured exchanges

6. **Stop the Debate**
   - Click the extension icon
   - Click "Stop Debate" button
   - Debate should stop immediately

### Troubleshooting

**Issue**: Debate doesn't start
- **Solution**: Ensure both tabs are open and you're logged in
- **Solution**: Refresh both AI pages and try again
- **Solution**: Check if input fields are visible on both pages

**Issue**: Messages not sending properly
- **Solution**: Increase delay to 8-10 seconds
- **Solution**: Check browser console (F12) for errors
- **Solution**: Make sure no other extensions interfere

**Issue**: Visual indicator not appearing
- **Solution**: Refresh the AI tab
- **Solution**: Reload the extension in chrome://extensions/

**Issue**: Responses cut off
- **Solution**: Increase delay setting
- **Solution**: Wait for previous response to complete

### Debug Mode

To see detailed logs:
1. Open Developer Tools (F12) on AI tabs
2. Go to Console tab
3. Look for messages starting with "AI Debate Extension:"
4. Check background service worker console:
   - Go to chrome://extensions/
   - Click "Inspect views: service worker" under the extension

### Manual Verification

1. **Check Content Scripts Load**
   - Open ChatGPT tab
   - Open console (F12)
   - Look for: "AI Debate Extension: ChatGPT content script loaded"
   - Repeat for Gemini tab

2. **Check Visual Indicators**
   - Indicators should appear in top-right of each page
   - Hidden by default, shown during debate
   - Purple gradient for ChatGPT
   - Blue/green gradient for Gemini

3. **Check Message Flow**
   - Each message should appear in the input field
   - Send button should be clicked automatically
   - Response should be captured after completion

## Video Recording Tips

When recording the debate:

1. **Screen Setup**
   - Use 1920x1080 or higher resolution
   - Split screen with both AIs visible
   - Position extension popup in a convenient location

2. **Settings for Recording**
   - Use 5-8 second delay for smooth viewing
   - Start with 5-10 exchanges for manageable length
   - Choose interesting debate topics

3. **Recording Software**
   - OBS Studio (free)
   - Screen recorder of your choice
   - Chrome built-in screen recorder

4. **Recommended Topics**
   - "Is artificial intelligence beneficial or harmful to society?"
   - "Should AI be regulated by governments?"
   - "Can AI ever achieve true consciousness?"
   - "Is technology making us more or less connected?"

## Features to Highlight

- Clean, minimal UI perfect for recording
- Real-time exchange counter
- Visual status indicators on each AI page
- Smooth automatic message flow
- Easy start/stop controls
- Customizable settings

## Known Limitations

- Requires active sessions on both platforms
- UI selectors may need updates if platforms change
- Works best in focused browser windows
- Delay should account for response generation time

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify both AI platforms are accessible
3. Try refreshing the extension
4. Report issues on GitHub with:
   - Browser version
   - Screenshots
   - Console error messages
