// Background service worker for coordinating the debate
let debateState = {
  isDebating: false,
  exchangeCount: 0,
  maxExchanges: 10,
  delaySeconds: 5,
  currentTurn: 'chatgpt', // Start with ChatGPT
  lastMessage: ''
};

// Keep track of connected tabs
let chatgptTabId = null;
let geminiTabId = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'startDebate') {
    handleStartDebate(message, sendResponse);
    return true; // Async response
  } else if (message.type === 'stopDebate') {
    handleStopDebate(sendResponse);
    return true;
  } else if (message.type === 'registerTab') {
    handleRegisterTab(message, sender, sendResponse);
    return true;
  } else if (message.type === 'messageGenerated') {
    handleMessageGenerated(message, sender, sendResponse);
    return true;
  } else if (message.type === 'messageSent') {
    handleMessageSent(message, sender, sendResponse);
    return true;
  }
});

async function handleStartDebate(message, sendResponse) {
  // Find ChatGPT and Gemini tabs
  const tabs = await chrome.tabs.query({});
  chatgptTabId = tabs.find(tab => 
    tab.url?.includes('chatgpt.com') || tab.url?.includes('chat.openai.com')
  )?.id;
  geminiTabId = tabs.find(tab => 
    tab.url?.includes('gemini.google.com')
  )?.id;

  if (!chatgptTabId || !geminiTabId) {
    sendResponse({ 
      success: false, 
      error: 'Please open both ChatGPT and Gemini in separate tabs.' 
    });
    return;
  }

  debateState.isDebating = true;
  debateState.exchangeCount = 0;
  debateState.maxExchanges = message.maxExchanges;
  debateState.delaySeconds = message.delaySeconds;
  debateState.currentTurn = 'chatgpt';
  debateState.lastMessage = 'Please introduce yourself and state your position on the importance of artificial intelligence in modern society.';

  await chrome.storage.local.set(debateState);
  
  sendResponse({ success: true });

  // Start the debate by sending initial message to ChatGPT
  setTimeout(() => {
    chrome.tabs.sendMessage(chatgptTabId, {
      type: 'sendMessage',
      message: debateState.lastMessage
    });
  }, 1000);
}

function handleStopDebate(sendResponse) {
  debateState.isDebating = false;
  chrome.storage.local.set(debateState);
  
  // Notify all tabs
  if (chatgptTabId) {
    chrome.tabs.sendMessage(chatgptTabId, { type: 'stopDebate' }).catch(() => {});
  }
  if (geminiTabId) {
    chrome.tabs.sendMessage(geminiTabId, { type: 'stopDebate' }).catch(() => {});
  }
  
  sendResponse({ success: true });
}

function handleRegisterTab(message, sender, sendResponse) {
  if (message.platform === 'chatgpt') {
    chatgptTabId = sender.tab.id;
  } else if (message.platform === 'gemini') {
    geminiTabId = sender.tab.id;
  }
  sendResponse({ success: true });
}

async function handleMessageGenerated(message, sender, sendResponse) {
  if (!debateState.isDebating) {
    sendResponse({ success: false });
    return;
  }

  debateState.lastMessage = message.message;
  debateState.exchangeCount++;
  
  await chrome.storage.local.set(debateState);
  
  // Notify popup of progress
  chrome.runtime.sendMessage({
    type: 'debateStatus',
    isDebating: debateState.isDebating,
    exchangeCount: debateState.exchangeCount
  }).catch((err) => console.log('Popup not open:', err.message));

  // Check if we've reached max exchanges
  if (debateState.exchangeCount >= debateState.maxExchanges) {
    handleStopDebate(() => {});
    sendResponse({ success: true, shouldStop: true });
    return;
  }

  // Switch turns and send message to the other AI
  const targetTabId = message.platform === 'chatgpt' ? geminiTabId : chatgptTabId;
  
  if (targetTabId) {
    setTimeout(() => {
      chrome.tabs.sendMessage(targetTabId, {
        type: 'sendMessage',
        message: debateState.lastMessage
      }).catch(() => {});
    }, debateState.delaySeconds * 1000);
  }

  sendResponse({ success: true });
}

function handleMessageSent(message, sender, sendResponse) {
  sendResponse({ success: true });
}

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Debate Extension installed');
});
