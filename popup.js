// Popup controller
let debateState = {
  isActive: false,
  currentTurn: 0,
  maxTurns: 5,
  topic: '',
  delay: 3000,
  ai1: 'chatgpt',
  ai2: 'gemini',
  persona1: '',
  persona2: ''
};

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const activityLog = document.getElementById('activityLog');
const debateTopicInput = document.getElementById('debateTopic');
const turnLimitInput = document.getElementById('turnLimit');
const delaySecondsInput = document.getElementById('delaySeconds');
const ai1Select = document.getElementById('ai1Select');
const ai2Select = document.getElementById('ai2Select');
const persona1Input = document.getElementById('persona1Input');
const persona2Input = document.getElementById('persona2Input');

// Load saved settings
chrome.storage.local.get(['debateTopic', 'turnLimit', 'delaySeconds', 'ai1', 'ai2', 'persona1', 'persona2'], (result) => {
  if (result.debateTopic) debateTopicInput.value = result.debateTopic;
  if (result.turnLimit) turnLimitInput.value = result.turnLimit;
  if (result.delaySeconds) delaySecondsInput.value = result.delaySeconds;
  if (result.ai1) ai1Select.value = result.ai1;
  if (result.ai2) ai2Select.value = result.ai2;
  if (result.persona1) persona1Input.value = result.persona1;
  if (result.persona2) persona2Input.value = result.persona2;
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

ai1Select.addEventListener('change', () => {
  chrome.storage.local.set({ ai1: ai1Select.value });
});

ai2Select.addEventListener('change', () => {
  chrome.storage.local.set({ ai2: ai2Select.value });
});

persona1Input.addEventListener('change', () => {
  chrome.storage.local.set({ persona1: persona1Input.value });
});

persona2Input.addEventListener('change', () => {
  chrome.storage.local.set({ persona2: persona2Input.value });
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
  const ai1 = ai1Select.value;
  const ai2 = ai2Select.value;
  const persona1 = persona1Input.value.trim();
  const persona2 = persona2Input.value.trim();

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
    ai1: ai1,
    ai2: ai2,
    persona1: persona1,
    persona2: persona2
  };

  // Send message to background script
  chrome.runtime.sendMessage({
    action: 'startDebate',
    config: debateState
  });

  startBtn.disabled = true;
  stopBtn.disabled = false;
  updateStatus('active', 'ディベート中');
  const ai1Name = ai1 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
  const ai2Name = ai2 === 'chatgpt' ? 'ChatGPT' : 'Gemini';
  addLog(`🚀 ディベート開始: ${ai1Name} vs ${ai2Name}${topic ? ` - "${topic}"` : ''}`);
  
  if (persona1) {
    addLog(`👤 参加者1のペルソナ: ${persona1.substring(0, 50)}...`);
  }
  if (persona2) {
    addLog(`👤 参加者2のペルソナ: ${persona2.substring(0, 50)}...`);
  }
  
  if (!topic) {
    addLog('ℹ️ トピックが指定されていないため、手動で会話を開始してください');
  }
});

// Stop debate
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopDebate' });
  
  debateState.isActive = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  updateStatus('stopped', '停止');
  addLog('🛑 ユーザーによりディベート停止');
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'log') {
    addLog(message.message);
  } else if (message.type === 'debateEnded') {
    debateState.isActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('stopped', 'ディベート終了');
    addLog('✅ ディベート完了 (' + message.turns + ' ターン)');
  } else if (message.type === 'debateError') {
    debateState.isActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('stopped', 'エラー');
    addLog('❌ エラー: ' + message.error);
    if (message.details) {
      addLog(message.details);
    }
  }
});

// Check current debate status
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response && response.isActive) {
    debateState = response;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus('active', 'ディベート中');
  }
});
