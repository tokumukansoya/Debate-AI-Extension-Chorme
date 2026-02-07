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
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const activityLog = document.getElementById('activityLog');
const debateTopicInput = document.getElementById('debateTopic');
const turnLimitInput = document.getElementById('turnLimit');
const delaySecondsInput = document.getElementById('delaySeconds');

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

  debateState = {
    isActive: true,
    currentTurn: 0,
    maxTurns: turnLimit,
    topic: topic,
    delay: delaySeconds * 1000
  };

  // Send message to background script
  chrome.runtime.sendMessage({
    action: 'startDebate',
    config: debateState
  });

  startBtn.disabled = true;
  stopBtn.disabled = false;
  updateStatus('active', 'Debate Active');
  addLog('🚀 Debate started' + (topic ? `: "${topic}"` : ''));
});

// Stop debate
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopDebate' });
  
  debateState.isActive = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  updateStatus('stopped', 'Stopped');
  addLog('🛑 Debate stopped by user');
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'log') {
    addLog(message.message);
  } else if (message.type === 'debateEnded') {
    debateState.isActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('stopped', 'Debate Ended');
    addLog('✅ Debate completed (' + message.turns + ' turns)');
  } else if (message.type === 'debateError') {
    debateState.isActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('stopped', 'Error');
    addLog('❌ Error: ' + message.error);
  }
});

// Check current debate status
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response && response.isActive) {
    debateState = response;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus('active', 'Debate Active');
  }
});
