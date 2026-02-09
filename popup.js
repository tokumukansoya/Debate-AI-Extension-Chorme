// Popup controller
let debateState = {
  isActive: false,
  currentTurn: 0,
  maxTurns: 5,
  topic: '',
  delay: 3000
};

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const continueBtn = document.getElementById('continueBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const activityLog = document.getElementById('activityLog');
const debateTopicInput = document.getElementById('debateTopic');
const turnLimitInput = document.getElementById('turnLimit');
const delaySecondsInput = document.getElementById('delaySeconds');
// Selectors removed from DOM, references removed

// Load saved settings
chrome.storage.local.get(['debateTopic', 'turnLimit', 'delaySeconds'], (result) => {
  if (result.debateTopic) debateTopicInput.value = result.debateTopic;
  if (result.turnLimit) turnLimitInput.value = result.turnLimit;
  if (result.delaySeconds) delaySecondsInput.value = result.delaySeconds;
});

// Save settings on change
debateTopicInput.addEventListener('change', () => {
  chrome.storage.local.set({ debateTopic: debateTopicInput.value });
});

turnLimitInput.addEventListener('change', () => {
  chrome.storage.local.set({ turnLimit: turnLimitInput.value });
});

delaySecondsInput.addEventListener('change', () => {
  chrome.storage.local.set({ delaySeconds: delaySecondsInput.value });
});

// Add log entry
function addLog(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="log-time">${time}</span>${message}`;
  activityLog.insertBefore(entry, activityLog.firstChild);

  // Keep only last 20 entries
  while (activityLog.children.length > 20) {
    activityLog.removeChild(activityLog.lastChild);
  }
}

// Update status
function updateStatus(status, text) {
  const dot = statusIndicator.querySelector('.status-dot');
  dot.className = 'status-dot ' + status;
  statusText.textContent = text;
}

// Start debate
startBtn.addEventListener('click', async () => {
  const topic = debateTopicInput.value.trim();
  const turnLimit = parseInt(turnLimitInput.value) || 5;
  const delaySeconds = parseInt(delaySecondsInput.value) || 3;

  // Validation
  if (turnLimit < 1 || turnLimit > 20) {
    addLog('⚠️ ターン制限は1から20の間で設定してください');
    return;
  }

  if (delaySeconds < 1 || delaySeconds > 30) {
    addLog('⚠️ 遅延は1から30秒の間で設定してください');
    return;
  }

  debateState = {
    isActive: true,
    currentTurn: 0,
    maxTurns: turnLimit,
    topic: topic,
    delay: delaySeconds * 1000,
    ai1: null,
    ai2: null
  };

  // Send message to background script
  chrome.runtime.sendMessage({
    action: 'startDebate',
    config: debateState
  });

  startBtn.disabled = true;
  stopBtn.disabled = false;
  continueBtn.style.display = 'none';

  const getAIName = (type) => {
    switch (type) {
      case 'chatgpt': return 'ChatGPT';
      case 'gemini': return 'Gemini';
      case 'claude': return 'Claude';
      case 'grok': return 'Grok';
      default: return type;
    }
  };

  if (topic) {
    updateStatus('active', 'ディベート中');
    addLog(`🚀 ディベート開始をリクエスト: トピック "${topic}"`);
  } else {
    updateStatus('active', '手動入力待機中');
    addLog(`👀 待機モード開始: 左側のAIタブでトピックを入力してください`);
  }
});

// Stop debate
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopDebate' });

  debateState.isActive = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  continueBtn.style.display = 'none';
  updateStatus('stopped', '停止');
  addLog('🛑 ユーザーによりディベート停止');
});

// Continue debate
continueBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'continueDebate' });

  debateState.isActive = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  continueBtn.style.display = 'none';

  updateStatus('active', 'ディベート再開中');
  addLog('🔄 ディベートを再開します');
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'log') {
    addLog(message.message);
  } else if (message.type === 'debateEnded') {
    debateState.isActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    continueBtn.style.display = 'inline-block';
    updateStatus('stopped', 'ディベート終了');
    addLog('✅ ディベート完了 (' + message.turns + ' ターン)');
  } else if (message.type === 'debateError') {
    debateState.isActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    continueBtn.style.display = 'none';
    updateStatus('stopped', 'エラー');
    addLog('❌ エラー: ' + message.error);
    if (message.details) {
      addLog(message.details);
    }
  }
});

// Check current debate status
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response) {
    debateState = response;
    if (response.isActive) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      continueBtn.style.display = 'none';
      if (response.isWaitingForFirstInput) {
        updateStatus('active', '手動入力待機中');
      } else {
        updateStatus('active', 'ディベート中');
      }
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      if (response.currentTurn > 0 && response.currentTurn >= response.maxTurns) {
        continueBtn.style.display = 'inline-block';
      } else {
        continueBtn.style.display = 'none';
      }
    }
  }
});
