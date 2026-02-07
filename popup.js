// Popup UI controller
let isDebating = false;
let exchangeCount = 0;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const exchangeCountEl = document.getElementById('exchangeCount');
const maxExchangesInput = document.getElementById('maxExchanges');
const delaySecondsInput = document.getElementById('delaySeconds');

// Load saved state
chrome.storage.local.get(['isDebating', 'exchangeCount'], (result) => {
  isDebating = result.isDebating || false;
  exchangeCount = result.exchangeCount || 0;
  updateUI();
});

// Listen for updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'debateStatus') {
    isDebating = message.isDebating;
    exchangeCount = message.exchangeCount;
    updateUI();
  }
});

// Start debate button
startBtn.addEventListener('click', async () => {
  const maxExchanges = parseInt(maxExchangesInput.value);
  const delaySeconds = parseInt(delaySecondsInput.value);
  
  if (maxExchanges < 1 || delaySeconds < 1) {
    alert('Please enter valid values for max exchanges and delay.');
    return;
  }

  // Send message to background script to start debate
  chrome.runtime.sendMessage({
    type: 'startDebate',
    maxExchanges: maxExchanges,
    delaySeconds: delaySeconds
  }, (response) => {
    if (response && response.success) {
      isDebating = true;
      exchangeCount = 0;
      updateUI();
    } else {
      alert(response?.error || 'Failed to start debate. Make sure both ChatGPT and Gemini tabs are open.');
    }
  });
});

// Stop debate button
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'stopDebate' }, (response) => {
    if (response && response.success) {
      isDebating = false;
      updateUI();
    }
  });
});

// Update UI based on current state
function updateUI() {
  exchangeCountEl.textContent = exchangeCount;
  
  if (isDebating) {
    statusIndicator.classList.add('active');
    statusText.textContent = 'Debating...';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusIndicator.classList.remove('active');
    statusText.textContent = 'Idle';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}
