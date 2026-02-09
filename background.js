// Background service worker for coordinating the debate
const MIN_RESPONSE_LENGTH = 5;

let debateState = {
  isActive: false,
  isWaitingForFirstInput: false,
  isProcessingResponse: false,
  turnsP1: 0,
  turnsP2: 0,
  maxRounds: 5, // User setting (e.g. 5 rounds)
  topic: '',
  delay: 3000,
  ai1: 'chatgpt',
  ai2: 'gemini',
  currentSpeaker: 'ai1',
  lastSpeaker: null, // 'ai1' or 'ai2'
  participant1TabId: null,
  participant2TabId: null,
  lastResponse: ''
};

// Helper to get printable name
function getAIName(type) {
  switch (type) {
    case 'chatgpt': return 'ChatGPT';
    case 'gemini': return 'Gemini';
    case 'claude': return 'Claude';
    case 'grok': return 'Grok';
    default: return type;
  }
}

// Find AI tabs and auto-assign
async function findAITabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  let supportedTabs = [];

  for (const tab of tabs) {
    try {
      const url = new URL(tab.url);
      const host = url.hostname;
      let type = null;

      if (host.includes('chatgpt') || host === 'chat.openai.com') type = 'chatgpt';
      else if (host.includes('gemini.google')) type = 'gemini';
      else if (host.includes('claude.ai')) type = 'claude';
      else if (host === 'x.com' || host === 'twitter.com') type = 'grok';

      if (type) {
        supportedTabs.push({ tab, type });
      }
    } catch (e) { continue; }
  }

  // Sort by tab index (left to right)
  supportedTabs.sort((a, b) => a.tab.index - b.tab.index);

  let participant1 = null;
  let participant2 = null;

  if (supportedTabs.length >= 2) {
    participant1 = supportedTabs[0];
    participant2 = supportedTabs[1];
  }

  return { participant1, participant2, allTabs: supportedTabs };
}

function sendLog(message) {
  chrome.runtime.sendMessage({ type: 'log', message }).catch(() => { });
}

// Retry helper for sending messages to tabs (content scripts may not be ready)
async function sendMessageToTabWithRetry(tabId, message, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        sendLog(`⚠️ 送信リトライ中... (${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
}

async function startDebate(config) {
  // If topic is empty, we are entering "Monitoring Mode" waiting for manual input
  const isMonitoringMode = !config.topic;

  // config.maxTurns comes from popup "Turn Limit" which we now interpret as ROUNDS
  debateState = {
    ...config,
    maxRounds: config.maxTurns || 5, // Interpret as Rounds
    isActive: true,
    isWaitingForFirstInput: isMonitoringMode,
    isProcessingResponse: false,
    turnsP1: 0,
    turnsP2: 0,
    currentSpeaker: 'ai1',
    lastSpeaker: null,
    lastResponse: ''
  };

  const { participant1, participant2 } = await findAITabs();

  if (!participant1 || !participant2) {
    let errorMsg = `❌ AIタブが2つ以上見つかりません。`;
    let detailedError = `左から順に2つのAIタブが参加者として自動割り当てられます。`;
    sendLog(errorMsg);
    sendLog(detailedError);
    chrome.runtime.sendMessage({ type: 'debateError', error: errorMsg, details: detailedError }).catch(() => { });
    debateState.isActive = false;
    return;
  }

  debateState.participant1TabId = participant1.tab.id;
  debateState.participant2TabId = participant2.tab.id;
  debateState.ai1 = participant1.type;
  debateState.ai2 = participant2.type;

  // Send info to tabs
  // Initialize indicators (0/5)
  const sendInitObj = (pNum, type) => ({
    action: 'setParticipantInfo',
    participant: pNum,
    aiType: type,
    maxTurns: debateState.maxRounds
  });

  chrome.tabs.sendMessage(debateState.participant1TabId, sendInitObj(1, debateState.ai1)).catch(() => { });
  chrome.tabs.sendMessage(debateState.participant2TabId, sendInitObj(2, debateState.ai2)).catch(() => { });

  if (!isMonitoringMode) {
    // Standard start with topic
    sendLog(`🚀 ディベート開始: ${getAIName(debateState.ai1)} (P1) vs ${getAIName(debateState.ai2)} (P2)`);
    sendLog(`ℹ️ 設定: ${debateState.maxRounds}ラウンド (各${debateState.maxRounds}回)`);
    sendLog(`💬 トピックを${getAIName(debateState.ai1)}に送信中...`);
    try {
      await sendMessageToTabWithRetry(debateState.participant1TabId, { action: 'sendMessage', message: config.topic });
      debateState.currentSpeaker = 'ai2';
    } catch (error) {
      sendLog(`❌ 送信エラー: ${error.message}`);
      debateState.isActive = false;
    }
  } else {
    // Monitoring mode
    sendLog(`ℹ️ 設定: ${debateState.maxRounds}ラウンド (各${debateState.maxRounds}回)`);
    sendLog(`👀 待機中: 左側のタブ (${getAIName(debateState.ai1)}) にトピックを入力してください...`);
  }
}

function stopDebate() {
  debateState.isActive = false;
  debateState.isWaitingForFirstInput = false;
  debateState.isProcessingResponse = false;
  sendLog('Debate stopped');
}

async function continueDebate() {
  if (!debateState.participant1TabId || !debateState.participant2TabId) {
    sendLog('❌ 再開できません: タブ情報が失われました');
    return;
  }

  if (!debateState.lastResponse) {
    sendLog('❌ 再開できません: 前回の応答が見つかりません');
    return;
  }

  // Add 1 Round
  debateState.maxRounds += 1;
  debateState.isActive = true;

  sendLog(`🔄 ディベートを再開 (+1ラウンド / 合計${debateState.maxRounds}ラウンド)`);

  // Update indicators now with new max
  const updateMsgP1 = {
    action: 'updateTurn',
    currentTurn: debateState.turnsP1,
    maxTurns: debateState.maxRounds
  };
  const updateMsgP2 = {
    action: 'updateTurn',
    currentTurn: debateState.turnsP2,
    maxTurns: debateState.maxRounds
  };
  chrome.tabs.sendMessage(debateState.participant1TabId, updateMsgP1).catch(() => { });
  chrome.tabs.sendMessage(debateState.participant2TabId, updateMsgP2).catch(() => { });

  // Who spoke last?
  const lastSpeaker = debateState.lastSpeaker; // 'ai1' or 'ai2'

  // Send lastResponse to the OTHER person to trigger their turn
  const targetIsP1 = (lastSpeaker === 'ai2'); // If ai2 spoke last, send to ai1 (P1)

  const targetTabId = targetIsP1 ? debateState.participant1TabId : debateState.participant2TabId;
  const targetName = targetIsP1 ? getAIName(debateState.ai1) : getAIName(debateState.ai2);
  const targetPNum = targetIsP1 ? '1' : '2';

  sendLog(`➡️ ${targetName}（参加者${targetPNum}）に再送信中...`);

  try {
    await sendMessageToTabWithRetry(targetTabId, { action: 'sendMessage', message: debateState.lastResponse });
  } catch (e) {
    sendLog(`❌ 送信エラー (${targetName}): ${e.message}`);
    debateState.isActive = false;
  }
}

async function handleManualStart(senderTab, aiType) {
  // Only proceed if we are active AND waiting for first input
  if (!debateState.isActive || !debateState.isWaitingForFirstInput) {
    return;
  }

  if (senderTab.id !== debateState.participant1TabId) {
    return;
  }

  debateState.isWaitingForFirstInput = false;
  sendLog(`🚀 手動開始検知: ${getAIName(debateState.ai1)} が入力しました。`);
}

async function handleAIResponse(tabId, response) {
  if (!debateState.isActive) return;

  // Guard against duplicate/concurrent response processing
  if (debateState.isProcessingResponse) {
    sendLog('⚠️ 応答処理中に別の応答を受信 - スキップ');
    return;
  }

  if (debateState.isWaitingForFirstInput && tabId === debateState.participant1TabId) {
    debateState.isWaitingForFirstInput = false;
  }

  const isP1 = tabId === debateState.participant1TabId;
  const isP2 = tabId === debateState.participant2TabId;
  if (!isP1 && !isP2) return;

  // Validate response content
  if (!response || typeof response !== 'string' || response.trim().length < MIN_RESPONSE_LENGTH) {
    sendLog('⚠️ 空または無効な応答を受信 - スキップ');
    return;
  }
  response = response.trim();

  debateState.isProcessingResponse = true;

  const speakerName = isP1 ? getAIName(debateState.ai1) : getAIName(debateState.ai2);
  const pNum = isP1 ? '1' : '2';

  // Update last speaker
  debateState.lastSpeaker = isP1 ? 'ai1' : 'ai2';

  sendLog(`📝 ${speakerName} (参加者${pNum}) が回答しました`);

  debateState.lastResponse = response;

  // Independent Counter Update
  if (isP1) {
    debateState.turnsP1++;
    // Notify P1 with its new count
    chrome.tabs.sendMessage(debateState.participant1TabId, {
      action: 'updateTurn',
      currentTurn: debateState.turnsP1,
      maxTurns: debateState.maxRounds
    }).catch(() => { });
  } else {
    debateState.turnsP2++;
    // Notify P2 with its new count
    chrome.tabs.sendMessage(debateState.participant2TabId, {
      action: 'updateTurn',
      currentTurn: debateState.turnsP2,
      maxTurns: debateState.maxRounds
    }).catch(() => { });
  }

  // Check termination: BOTH must reach maxRounds
  if (debateState.turnsP1 >= debateState.maxRounds && debateState.turnsP2 >= debateState.maxRounds) {
    debateState.isActive = false;
    debateState.isProcessingResponse = false;
    sendLog('✅ Debate completed');
    chrome.runtime.sendMessage({ type: 'debateEnded', turns: debateState.maxRounds }).catch(() => { });
    return;
  }

  // Send to other AI
  setTimeout(async () => {
    if (!debateState.isActive) {
      debateState.isProcessingResponse = false;
      return;
    }

    const targetTabId = isP1 ? debateState.participant2TabId : debateState.participant1TabId;
    const targetName = isP1 ? getAIName(debateState.ai2) : getAIName(debateState.ai1);
    const targetPNum = isP1 ? '2' : '1';

    sendLog(`➡️ ${targetName}（参加者${targetPNum}）に送信中...`);

    try {
      await sendMessageToTabWithRetry(targetTabId, { action: 'sendMessage', message: response });
    } catch (e) {
      sendLog(`❌ 送信エラー (${targetName}): ${e.message}`);
      debateState.isActive = false;
    } finally {
      debateState.isProcessingResponse = false;
    }
  }, debateState.delay);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startDebate') {
    startDebate(message.config);
    sendResponse({ success: true });
  } else if (message.action === 'stopDebate') {
    stopDebate();
    sendResponse({ success: true });
  } else if (message.action === 'continueDebate') {
    continueDebate();
    sendResponse({ success: true });
  } else if (message.action === 'getStatus') {
    // Augment status with unified 'currentTurn' for popup if needed, or just send raw stuff
    // Popup uses currentTurn to decide if continue button shows? 
    // Popup check: response.currentTurn >= response.maxTurns.
    // Use max of p1/p2?
    const effectiveCurrent = Math.min(debateState.turnsP1, debateState.turnsP2);
    // Actually, completion is when BOTH >= max.
    // Let's modify popup logic or send a synthetic 'currentTurn' that looks like rounds.
    // Let's send effectiveCurrent = turnsP2 (usually the lagger).
    sendResponse({
      ...debateState,
      currentTurn: debateState.turnsP2,
      maxTurns: debateState.maxRounds
    });
  } else if (message.action === 'aiResponded') {
    handleAIResponse(sender.tab.id, message.response);
    sendResponse({ success: true });
  } else if (message.action === 'manualStart') {
    handleManualStart(sender.tab, message.aiType);
    sendResponse({ success: true });
  } else if (message.action === 'log') {
    sendLog(message.message);
    sendResponse({ success: true });
  }
  return true;
});
