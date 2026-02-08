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

  return { participant1Tab, participant2Tab, chatgptTabs, geminiTabs };
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

  const { participant1Tab, participant2Tab, chatgptTabs, geminiTabs } = await findAITabs(config.ai1, config.ai2);

  const ai1Name = config.ai1 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
  const ai2Name = config.ai2 === 'chatgpt' ? 'ChatGPT' : 'Gemini';

  if (!participant1Tab || !participant2Tab) {
    let errorMsg = '';
    let detailedError = '';
    
    if (config.ai1 === config.ai2) {
      // Same AI type - need two tabs
      const aiName = ai1Name;
      const availableCount = config.ai1 === 'chatgpt' ? chatgptTabs.length : geminiTabs.length;
      
      if (availableCount === 0) {
        errorMsg = `❌ ${aiName}のタブが見つかりません`;
        detailedError = `必要な条件:\n• ${aiName}のタブを2つ開いてください\n• 各タブでログインしていることを確認してください\n• タブを開いた後、拡張機能アイコンをクリックしてください`;
      } else if (availableCount === 1) {
        errorMsg = `❌ ${aiName}のタブが1つしか開かれていません`;
        detailedError = `必要な条件:\n• ${aiName}のタブをもう1つ開いてください（合計2つ必要）\n• 両方のタブでログインしていることを確認してください`;
      }
    } else {
      // Different AI types
      const missingAIs = [];
      if (!participant1Tab) missingAIs.push(ai1Name);
      if (!participant2Tab) missingAIs.push(ai2Name);
      
      errorMsg = `❌ 必要なAIタブが開かれていません: ${missingAIs.join(', ')}`;
      detailedError = `必要な条件:\n`;
      if (chatgptTabs.length === 0 && (config.ai1 === 'chatgpt' || config.ai2 === 'chatgpt')) {
        detailedError += `• ChatGPTのタブを開いてください (chat.openai.com または chatgpt.com)\n`;
      }
      if (geminiTabs.length === 0 && (config.ai1 === 'gemini' || config.ai2 === 'gemini')) {
        detailedError += `• Geminiのタブを開いてください (gemini.google.com)\n`;
      }
      detailedError += `• 各タブでログインしていることを確認してください\n• タブを開いた後、拡張機能アイコンをクリックしてください`;
    }
    
    sendLog(errorMsg);
    sendLog(detailedError);
    chrome.runtime.sendMessage({ 
      type: 'debateError', 
      error: errorMsg,
      details: detailedError
    }).catch(() => {});
    debateState.isActive = false;
    return;
  }

  debateState.participant1TabId = participant1Tab.id;
  debateState.participant2TabId = participant2Tab.id;

  // Send participant info to tabs for better identification
  chrome.tabs.sendMessage(participant1Tab.id, {
    action: 'setParticipantInfo',
    participant: 1,
    aiType: debateState.ai1
  }).catch(() => {});
  
  chrome.tabs.sendMessage(participant2Tab.id, {
    action: 'setParticipantInfo',
    participant: 2,
    aiType: debateState.ai2
  }).catch(() => {});

  // Start with AI 1 if there's a topic
  if (config.topic) {
    sendLog(`💬 トピックを${ai1Name}（参加者1）に送信中...`);
    try {
      const response = await chrome.tabs.sendMessage(participant1Tab.id, {
        action: 'sendMessage',
        message: config.topic
      });
      
      if (!response || !response.success) {
        throw new Error('メッセージの送信に失敗しました');
      }
      debateState.currentSpeaker = 'ai2'; // Next will be AI 2
    } catch (error) {
      sendLog(`❌ メッセージ送信エラー: ${error.message}`);
      sendLog(`必要な条件:\n• ${ai1Name}ページが完全に読み込まれていることを確認してください\n• ${ai1Name}にログインしていることを確認してください\n• ページを更新してから再試行してください`);
      chrome.runtime.sendMessage({ 
        type: 'debateError', 
        error: 'メッセージの送信に失敗しました',
        details: `• ${ai1Name}ページが完全に読み込まれていることを確認してください\n• ${ai1Name}にログインしていることを確認してください\n• ページを更新してから再試行してください`
      }).catch(() => {});
      debateState.isActive = false;
      return;
    }
  } else {
    sendLog('⚠️ トピックが指定されていません。手動で会話を開始してください。');
  }
}

// Stop the debate
function stopDebate() {
  debateState.isActive = false;
  sendLog('Debate stopped');
}

// Handle response from AI
async function handleAIResponse(tabId, response) {
  if (!debateState.isActive) {
    console.log('Debate not active, ignoring response from tab', tabId);
    return;
  }

  const isFromParticipant1 = tabId === debateState.participant1TabId;
  const isFromParticipant2 = tabId === debateState.participant2TabId;

  if (!isFromParticipant1 && !isFromParticipant2) {
    console.log('Response from unknown tab', tabId);
    return;
  }

  // Determine AI names for logging
  const speakerType = isFromParticipant1 ? debateState.ai1 : debateState.ai2;
  const participantNum = isFromParticipant1 ? '1' : '2';
  const speaker = speakerType === 'chatgpt' ? 'ChatGPT' : 'Gemini';
  
  // Log the response
  sendLog(`📝 ${speaker} (参加者${participantNum}) が回答しました`);
  console.log(`Response from Participant ${participantNum} (${speaker}):`, response.substring(0, 100) + '...');

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
    if (!debateState.isActive) {
      console.log('Debate ended before sending response');
      return;
    }

    try {
      if (isFromParticipant1) {
        // Send to Participant 2
        const ai2Name = debateState.ai2 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
        sendLog(`➡️ ${ai2Name}（参加者2）に送信中...`);
        console.log(`Sending from Participant 1 to Participant 2 (tab ${debateState.participant2TabId})`);
        
        const sendResult = await chrome.tabs.sendMessage(debateState.participant2TabId, {
          action: 'sendMessage',
          message: response
        });
        
        if (!sendResult || !sendResult.success) {
          throw new Error('メッセージの送信に失敗しました');
        }
        console.log('Successfully sent to Participant 2');
        debateState.currentSpeaker = 'ai2';
      } else {
        // Send to Participant 1
        const ai1Name = debateState.ai1 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
        sendLog(`➡️ ${ai1Name}（参加者1）に送信中...`);
        console.log(`Sending from Participant 2 to Participant 1 (tab ${debateState.participant1TabId})`);
        
        const sendResult = await chrome.tabs.sendMessage(debateState.participant1TabId, {
          action: 'sendMessage',
          message: response
        });
        
        if (!sendResult || !sendResult.success) {
          throw new Error('メッセージの送信に失敗しました');
        }
        console.log('Successfully sent to Participant 1');
        debateState.currentSpeaker = 'ai1';
      }
    } catch (error) {
      const targetAI = isFromParticipant1 ? 
        (debateState.ai2 === 'chatgpt' ? 'ChatGPT' : 'Gemini') :
        (debateState.ai1 === 'chatgpt' ? 'ChatGPT' : 'Gemini');
      
      console.error(`Error sending to ${targetAI}:`, error);
      sendLog(`❌ ${targetAI}へのメッセージ送信エラー: ${error.message}`);
      sendLog(`必要な条件:\n• ${targetAI}ページが開いていることを確認してください\n• ${targetAI}にログインしていることを確認してください\n• ページを更新してから再試行してください`);
      
      debateState.isActive = false;
      chrome.runtime.sendMessage({ 
        type: 'debateError', 
        error: `${targetAI}へのメッセージ送信に失敗しました`,
        details: `• ${targetAI}ページが開いていることを確認してください\n• ${targetAI}にログインしていることを確認してください\n• ページを更新してから再試行してください`
      }).catch(() => {});
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
  } else if (message.action === 'log') {
    // Forward log messages from content scripts to popup
    sendLog(message.message);
    sendResponse({ success: true });
  }
  return true;
});
