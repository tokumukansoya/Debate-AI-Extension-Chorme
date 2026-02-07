// Background service worker for coordinating the debate
let debateState = {
  isActive: false,
  currentTurn: 0,
  maxTurns: 5,
  topic: '',
  delay: 3000,
  currentSpeaker: 'chatgpt', // 'chatgpt' or 'gemini'
  chatgptTabId: null,
  geminiTabId: null,
  lastResponse: ''
};

// Find AI tabs
async function findAITabs() {
  const tabs = await chrome.tabs.query({});
  let chatgptTab = null;
  let geminiTab = null;

  for (const tab of tabs) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      if (hostname === 'chat.openai.com' || hostname === 'chatgpt.com' || hostname === 'www.chatgpt.com') {
        chatgptTab = tab;
      } else if (hostname === 'gemini.google.com' || hostname === 'www.gemini.google.com') {
        geminiTab = tab;
      }
    } catch (e) {
      // Invalid URL, skip
      continue;
    }
  }

  return { chatgptTab, geminiTab };
}

// Send log to popup
function sendLog(message) {
  chrome.runtime.sendMessage({ type: 'log', message }).catch(() => {});
}

// Start the debate
async function startDebate(config) {
  debateState = {
    ...config,
    isActive: true,
    currentTurn: 0,
    currentSpeaker: 'chatgpt',
    lastResponse: ''
  };

  const { chatgptTab, geminiTab } = await findAITabs();

  if (!chatgptTab || !geminiTab) {
    sendLog('❌ ChatGPTとGeminiの両方を別々のタブで開いてください');
    chrome.runtime.sendMessage({ 
      type: 'debateError', 
      error: 'ChatGPTまたはGeminiのタブがありません' 
    }).catch(() => {});
    debateState.isActive = false;
    return;
  }

  debateState.chatgptTabId = chatgptTab.id;
  debateState.geminiTabId = geminiTab.id;

  // Start with ChatGPT if there's a topic
  if (config.topic) {
    sendLog('💬 ChatGPTにトピックを送信中...');
    await chrome.tabs.sendMessage(chatgptTab.id, {
      action: 'sendMessage',
      message: config.topic
    });
    debateState.currentSpeaker = 'gemini'; // Next will be Gemini
  } else {
    sendLog('⚠️ トピックが指定されていません。手動で会話を開始してください。');
  }
}

// Stop the debate
function stopDebate() {
  debateState.isActive = false;
  sendLog('討論を停止しました');
}

// Handle response from AI
async function handleAIResponse(tabId, response) {
  if (!debateState.isActive) return;

  const isFromChatGPT = tabId === debateState.chatgptTabId;
  const isFromGemini = tabId === debateState.geminiTabId;

  if (!isFromChatGPT && !isFromGemini) return;

  // Log the response
  const speaker = isFromChatGPT ? 'ChatGPT' : 'Gemini';
  sendLog(`📝 ${speaker} responded`);

  debateState.lastResponse = response;
  debateState.currentTurn++;

  // Check if debate should end
  if (debateState.currentTurn >= debateState.maxTurns) {
    debateState.isActive = false;
    sendLog('✅ 討論が完了しました');
    chrome.runtime.sendMessage({ 
      type: 'debateEnded', 
      turns: debateState.currentTurn 
    }).catch(() => {});
    return;
  }

  // Wait before sending to the other AI
  setTimeout(async () => {
    if (!debateState.isActive) return;

    if (isFromChatGPT) {
      // Send to Gemini
      sendLog('➡️ Geminiに送信中...');
      await chrome.tabs.sendMessage(debateState.geminiTabId, {
        action: 'sendMessage',
        message: response
      });
      debateState.currentSpeaker = 'chatgpt';
    } else {
      // Send to ChatGPT
      sendLog('➡️ ChatGPTに送信中...');
      await chrome.tabs.sendMessage(debateState.chatgptTabId, {
        action: 'sendMessage',
        message: response
      });
      debateState.currentSpeaker = 'gemini';
    }
  }, debateState.delay);
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startDebate') {
    startDebate(message.config);
    sendResponse({ success: true });
  } else if (message.action === 'stopDebate') {
    stopDebate();
    sendResponse({ success: true });
  } else if (message.action === 'getStatus') {
    sendResponse(debateState);
  } else if (message.action === 'aiResponded') {
    handleAIResponse(sender.tab.id, message.response);
    sendResponse({ success: true });
  }
  return true;
});
