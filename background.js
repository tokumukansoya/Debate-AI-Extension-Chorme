// Background service worker for coordinating the debate
let debateState = {
  isActive: false,
  currentTurn: 0,
  maxTurns: 5,
  topic: '',
  delay: 3000,
  ai1: 'chatgpt', // Type of first AI: 'chatgpt' or 'gemini'
  ai2: 'gemini', // Type of second AI: 'chatgpt' or 'gemini'
  currentSpeaker: 'ai1', // 'ai1' or 'ai2'
  participant1TabId: null,
  participant2TabId: null,
  lastResponse: ''
};

// Find AI tabs
async function findAITabs(ai1Type, ai2Type) {
  const tabs = await chrome.tabs.query({});
  let chatgptTabs = [];
  let geminiTabs = [];

  for (const tab of tabs) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      if (hostname === 'chat.openai.com' || hostname === 'chatgpt.com' || hostname === 'www.chatgpt.com') {
        chatgptTabs.push(tab);
      } else if (hostname === 'gemini.google.com' || hostname === 'www.gemini.google.com') {
        geminiTabs.push(tab);
      }
    } catch (e) {
      // Invalid URL, skip
      continue;
    }
  }

  let participant1Tab = null;
  let participant2Tab = null;

  // If both are the same AI type, we need two tabs of that type
  if (ai1Type === ai2Type) {
    const tabs = ai1Type === 'chatgpt' ? chatgptTabs : geminiTabs;
    if (tabs.length >= 2) {
      participant1Tab = tabs[0];
      participant2Tab = tabs[1];
    }
  } else {
    // Different AI types - assign from their respective arrays
    participant1Tab = ai1Type === 'chatgpt' ? chatgptTabs[0] : geminiTabs[0];
    participant2Tab = ai2Type === 'chatgpt' ? chatgptTabs[0] : geminiTabs[0];
  }

  return { participant1Tab, participant2Tab };
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
    currentSpeaker: 'ai1',
    lastResponse: ''
  };

  const { participant1Tab, participant2Tab } = await findAITabs(config.ai1, config.ai2);

  const ai1Name = config.ai1 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
  const ai2Name = config.ai2 === 'chatgpt' ? 'ChatGPT' : 'Gemini';

  if (!participant1Tab || !participant2Tab) {
    let errorMsg = '❌ Please open required AI tabs: ';
    if (config.ai1 === config.ai2) {
      errorMsg += `two ${ai1Name} tabs`;
    } else {
      errorMsg += `${ai1Name} and ${ai2Name} tabs`;
    }
    sendLog(errorMsg);
    chrome.runtime.sendMessage({ 
      type: 'debateError', 
      error: 'Missing required AI tabs' 
    }).catch(() => {});
    debateState.isActive = false;
    return;
  }

  debateState.participant1TabId = participant1Tab.id;
  debateState.participant2TabId = participant2Tab.id;

  // Start with AI 1 if there's a topic
  if (config.topic) {
    sendLog(`💬 Sending topic to ${ai1Name} (Participant 1)...`);
    await chrome.tabs.sendMessage(participant1Tab.id, {
      action: 'sendMessage',
      message: config.topic
    });
    debateState.currentSpeaker = 'ai2'; // Next will be AI 2
  } else {
    sendLog('⚠️ No topic provided. Please start the conversation manually.');
  }
}

// Stop the debate
function stopDebate() {
  debateState.isActive = false;
  sendLog('Debate stopped');
}

// Handle response from AI
async function handleAIResponse(tabId, response) {
  if (!debateState.isActive) return;

  const isFromParticipant1 = tabId === debateState.participant1TabId;
  const isFromParticipant2 = tabId === debateState.participant2TabId;

  if (!isFromParticipant1 && !isFromParticipant2) return;

  // Determine AI names for logging
  const speakerType = isFromParticipant1 ? debateState.ai1 : debateState.ai2;
  const participantNum = isFromParticipant1 ? '1' : '2';
  const speaker = speakerType === 'chatgpt' ? 'ChatGPT' : 'Gemini';
  
  // Log the response
  sendLog(`📝 ${speaker} (Participant ${participantNum}) responded`);

  debateState.lastResponse = response;
  debateState.currentTurn++;

  // Check if debate should end
  if (debateState.currentTurn >= debateState.maxTurns) {
    debateState.isActive = false;
    sendLog('✅ Debate completed');
    chrome.runtime.sendMessage({ 
      type: 'debateEnded', 
      turns: debateState.currentTurn 
    }).catch(() => {});
    return;
  }

  // Wait before sending to the other AI
  setTimeout(async () => {
    if (!debateState.isActive) return;

    if (isFromParticipant1) {
      // Send to Participant 2
      const ai2Name = debateState.ai2 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
      sendLog(`➡️ Sending to ${ai2Name} (Participant 2)...`);
      await chrome.tabs.sendMessage(debateState.participant2TabId, {
        action: 'sendMessage',
        message: response
      });
      debateState.currentSpeaker = 'ai1';
    } else {
      // Send to Participant 1
      const ai1Name = debateState.ai1 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
      sendLog(`➡️ Sending to ${ai1Name} (Participant 1)...`);
      await chrome.tabs.sendMessage(debateState.participant1TabId, {
        action: 'sendMessage',
        message: response
      });
      debateState.currentSpeaker = 'ai2';
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
