// Content script for ChatGPT (chat.openai.com or chatgpt.com)
console.log('AI Debate Extension: ChatGPT content script loaded');

// Participant info
let participantInfo = {
  participant: 0,
  aiType: 'chatgpt',
  currentTurn: 0,
  maxTurns: 5
};

// Selectors for ChatGPT interface
const SELECTORS = {
  inputBox: 'textarea[data-id^="root"]',
  inputBoxAlt: '#prompt-textarea',
  sendButton: 'button[data-testid="send-button"]',
  sendButtonAlt: 'button[aria-label="Send prompt"]',
  messageContainer: '[data-testid^="conversation-turn-"]',
  latestMessage: '[data-message-author-role="assistant"]'
};

// Get the latest AI response
function getLatestResponse() {
  // Try multiple selectors for different ChatGPT versions
  const assistantMessages = document.querySelectorAll(SELECTORS.latestMessage);
  if (assistantMessages.length > 0) {
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    return lastMessage.textContent.trim();
  }
  return null;
}

// Send message to ChatGPT
function sendMessage(message) {
  console.log('ChatGPT: Attempting to send message:', message.substring(0, 50) + '...');

  // Try multiple selector strategies
  const inputBox = document.querySelector(SELECTORS.inputBox) ||
    document.querySelector(SELECTORS.inputBoxAlt) ||
    document.querySelector('#prompt-textarea');

  if (!inputBox) {
    console.error('ChatGPT input box not found');
    chrome.runtime.sendMessage({
      action: 'log',
      message: '❌ ChatGPTの入力ボックスが見つかりません'
    }).catch(() => { });
    return false;
  }

  // Set the message - handle textarea vs contenteditable separately
  inputBox.focus();

  if (inputBox.tagName === 'TEXTAREA') {
    // For native textarea elements
    inputBox.value = message;
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
    inputBox.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // For contenteditable div (ProseMirror in newer ChatGPT)
    // Use execCommand for reliable React/ProseMirror state update
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, message);
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Wait a bit for UI to update state
  setTimeout(() => {
    // Snapshot current response to avoid detecting stale responses
    lastResponseText = getLatestResponse() || '';

    const clickSend = () => {
      let sendButton = document.querySelector(SELECTORS.sendButton) ||
        document.querySelector(SELECTORS.sendButtonAlt) ||
        document.querySelector('button[data-testid="send-button"]');

      if (sendButton && !sendButton.disabled) {
        sendButton.click();
        console.log('Message sent to ChatGPT successfully');
        waitForResponse();
      } else {
        // Fallback: Try Enter key
        console.log('Send button not ready, trying Enter key...');
        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
        });
        inputBox.dispatchEvent(enterEvent);

        // Re-check after a brief delay if we need to retry or if it worked
        setTimeout(() => {
          waitForResponse();
        }, 1000);
      }
    };

    clickSend();
  }, 1000);

  return true;
}

// Wait for AI response and notify background script
let lastResponseText = '';
let responseCheckInterval = null;

function waitForResponse() {
  // Clear any existing interval
  if (responseCheckInterval) {
    clearInterval(responseCheckInterval);
  }

  let checkCount = 0;
  const maxChecks = 120; // 2 minutes max

  responseCheckInterval = setInterval(() => {
    checkCount++;

    // Check for loading/generating indicator
    const isGenerating = document.querySelector('[data-testid="stop-button"]') !== null;

    if (!isGenerating && checkCount > 3) {
      // Response complete, get the text
      const response = getLatestResponse();

      if (response && response !== lastResponseText && response.length > 10) {
        lastResponseText = response;
        clearInterval(responseCheckInterval);

        console.log('ChatGPT response captured, length:', response.length);

        // Send to background script
        chrome.runtime.sendMessage({
          action: 'aiResponded',
          response: response
        });

        console.log('ChatGPT response sent to background script');
      }
    }

    if (checkCount >= maxChecks) {
      clearInterval(responseCheckInterval);
      console.log('Response timeout');
      chrome.runtime.sendMessage({
        action: 'log',
        message: '⚠️ ChatGPTの応答がタイムアウトしました\n考えられる原因:\n• 応答が非常に長い可能性があります\n• ChatGPTがエラーを返した可能性があります\n• ネットワークの問題がある可能性があります\n対処方法:\n• 遅延設定を増やしてください\n• ページを更新してから再試行してください'
      }).catch(() => { });
    }
  }, 1000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('ChatGPT: Received message:', message.action);

  if (message.action === 'sendMessage') {
    const success = sendMessage(message.message);
    sendResponse({ success });
  } else if (message.action === 'setParticipantInfo') {
    participantInfo = {
      participant: message.participant,
      aiType: message.aiType,
      currentTurn: 0,
      maxTurns: message.maxTurns || 5
    };
    updateIndicator();
    sendResponse({ success: true });
  } else if (message.action === 'updateTurn') {
    participantInfo.currentTurn = message.currentTurn;
    participantInfo.maxTurns = message.maxTurns;
    updateIndicator();
    sendResponse({ success: true });
  }
  return true;
});

// Add visual indicator that extension is active
function addIndicator() {
  updateIndicator();
}

function updateIndicator() {
  let indicator = document.getElementById('ai-debate-indicator');

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'ai-debate-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 999999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      gap: 2px;
    `;

    document.body.appendChild(indicator);
  }

  let participantText = '待機中...';
  if (participantInfo.participant > 0) {
    participantText = `参加者${participantInfo.participant} (${participantInfo.currentTurn}/${participantInfo.maxTurns})`;
  }

  indicator.innerHTML = `
    <div>${participantText}</div>
  `;
}

addIndicator();
// Manual Start Detection
function attachManualStartListener() {
  document.body.addEventListener('click', (e) => {
    const sendBtn = document.querySelector(SELECTORS.sendButton) || document.querySelector(SELECTORS.sendButtonAlt);
    if (sendBtn && (e.target === sendBtn || sendBtn.contains(e.target))) {
      notifyManualStart();
    }
  });

  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const inputBox = document.querySelector(SELECTORS.inputBox) || document.querySelector(SELECTORS.inputBoxAlt);
      if (inputBox && (e.target === inputBox || inputBox.contains(e.target))) {
        notifyManualStart();
      }
    }
  });
}

function notifyManualStart() {
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'manualStart',
      aiType: 'chatgpt'
    }).catch(() => { });
    waitForResponse();
  }, 500);
}

attachManualStartListener();
