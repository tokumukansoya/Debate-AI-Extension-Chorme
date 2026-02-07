# Quick Start Guide

## What is AI Debate Extension?

This Chrome extension allows ChatGPT and Google Gemini to automatically debate each other. You set up both AI platforms in separate tabs, start the debate, and watch as they exchange messages back and forth!

## Installation (5 minutes)

1. **Download the Extension**
   - If you cloned the repository, you already have it!
   - Location: `/Debate-AI-Extension-Chorme/`

2. **Load into Chrome**
   - Open Chrome
   - Go to: `chrome://extensions/`
   - Toggle ON "Developer mode" (top-right corner)
   - Click "Load unpacked"
   - Select the extension folder
   - ✅ Extension icon appears in toolbar!

## First Debate (3 minutes)

### Step 1: Open Both AI Platforms
- **Tab 1**: Go to https://chatgpt.com (log in if needed)
- **Tab 2**: Go to https://gemini.google.com (log in if needed)

💡 **Tip**: Arrange tabs side-by-side for the best experience!

### Step 2: Configure the Extension
1. Click the extension icon in your toolbar
2. You'll see the control panel popup
3. Settings (optional to change):
   - **Max Exchanges**: 10 (good starting point)
   - **Delay**: 5 seconds (time between messages)

### Step 3: Start the Debate!
1. Click the **"▶️ Start Debate"** button
2. Watch as:
   - ChatGPT receives an initial debate prompt
   - ChatGPT responds
   - Response is sent to Gemini
   - Gemini responds
   - Response goes back to ChatGPT
   - Process repeats!

### Step 4: Monitor Progress
- Visual indicators appear on each AI tab showing which is active
- Exchange counter shows how many messages have been exchanged
- Status shows "Debating..." while active

### Step 5: Stop When Desired
- Click **"⏸️ Stop Debate"** anytime
- Or wait for it to complete automatically after max exchanges

## What You'll See

### On ChatGPT Tab:
- Purple indicator: "ChatGPT Debating..."
- Messages appear and are sent automatically
- Responses are captured and forwarded

### On Gemini Tab:
- Blue/green indicator: "Gemini Debating..."
- Receives messages from ChatGPT
- Responses are captured and sent back

### In the Popup:
- Real-time exchange counter
- Active/idle status
- Start/stop controls

## Tips for Best Results

### For Great Debates:
- **Use interesting topics**: The initial prompt is about AI's importance, but you can modify the code to use different topics
- **Adjust delay**: If responses are cut off, increase the delay to 8-10 seconds
- **Perfect for recording**: The clean UI is designed for screen captures

### For Split Screen View:
1. Open both tabs
2. Right-click on one tab → "Move tab to new window"
3. Arrange windows side-by-side
4. Both AI conversations visible at once!

### Settings Guide:
- **Max Exchanges: 5** = Quick test (2-3 minutes)
- **Max Exchanges: 10** = Standard debate (5-7 minutes)
- **Max Exchanges: 20** = Long discussion (10-15 minutes)

- **Delay: 3 seconds** = Fast-paced (may cut off long responses)
- **Delay: 5 seconds** = Balanced (recommended)
- **Delay: 10 seconds** = Slower but ensures complete responses

## Troubleshooting

### "Failed to start debate"
**Problem**: Extension can't find both AI tabs
**Solution**: 
- Make sure both ChatGPT AND Gemini tabs are open
- Refresh both tabs
- Make sure you're logged into both platforms

### Messages not sending
**Problem**: Input field not detected
**Solution**:
- Refresh the AI tab
- Make sure the input field is visible on screen
- Try increasing the delay setting

### Responses cut off
**Problem**: Message sent before AI finishes responding
**Solution**:
- Increase delay to 8-10 seconds
- Some responses are very long and need more time

### Extension icon not showing
**Problem**: Extension not loaded properly
**Solution**:
- Go to `chrome://extensions/`
- Find "AI Debate Extension"
- Click the refresh icon
- Make sure it's enabled

## Example Use Cases

### 1. Educational Content
Record debates on topics like:
- "Benefits vs risks of AI"
- "Should AI be regulated?"
- "Future of AI in education"

### 2. Entertainment
- Watch AIs debate philosophical questions
- See how different models approach problems
- Compare reasoning styles

### 3. Research
- Test how AIs handle debates
- Study conversation patterns
- Analyze argumentation strategies

## Advanced Tips

### Modify the Initial Prompt
Edit `background.js` line 55 to change the starting topic:
```javascript
debateState.lastMessage = 'Your custom debate topic here';
```

### Adjust Response Detection
If the extension misses responses:
- Check browser console (F12) for debug messages
- Content scripts log when they capture responses
- You may need to adjust DOM selectors if AI platforms update their UI

### Debug Mode
To see what's happening:
1. Open DevTools (F12) on both AI tabs
2. Check Console for extension messages
3. Go to `chrome://extensions/`
4. Click "Inspect views: service worker" to see background script logs

## Safety & Privacy

✅ **Safe to Use**:
- Only runs on ChatGPT and Gemini domains
- No data sent to external servers
- All processing happens in your browser
- Open source code you can inspect

✅ **Privacy**:
- Extension only sees the AI conversations
- No data collection
- No tracking
- Messages only go between the two AI platforms

## Need Help?

- Check `README.md` for detailed documentation
- Check `INSTALLATION.md` for troubleshooting guide
- Open an issue on GitHub
- Console logs (F12) show debug information

## Have Fun!

Enjoy watching AI models debate each other! It's fascinating to see how they interact, build on each other's points, and sometimes even disagree.

Perfect for:
- 🎥 Recording videos
- 📚 Educational demonstrations  
- 🔬 Research projects
- 🎭 Entertainment

**Happy Debating!** 🤖💬🤖
