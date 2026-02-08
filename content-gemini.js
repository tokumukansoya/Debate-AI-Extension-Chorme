// Content script for Gemini (gemini.google.com)
console.log('AI Debate Extension: Gemini content script loaded');

// Participant info
let participantInfo = {
  participant: 0,
  aiType: 'gemini',
  persona: ''
};

// Selectors for Gemini interface
const SELECTORS = {
  inputBox: 'rich-textarea[aria-label*="prompt"]',
  inputBoxAlt: '.ql-editor[contenteditable="true"]',
  inputBoxAlt2: 'div[contenteditable="true"][aria-label]',
  sendButton: 'button[aria-label*="Send"]',
  sendButtonAlt: 'button.send-button',
  latestMessage: '.model-response-text',
  latestMessageAlt: '.response-container-content'
};

// Get the latest AI response
function getLatestResponse() {
  // Try multiple selectors for Gemini responses
  let responses = document.querySelectorAll(SELECTORS.latestMessage);
  if (responses.length === 0) {
    responses = document.querySelectorAll(SELECTORS.latestMessageAlt);
  }
  
  if (responses.length > 0) {
    const lastResponse = responses[responses.length - 1];
    return lastResponse.textContent.trim();
  }
  return null;
}

// Send message to Gemini
function sendMessage(message) {
  console.log('Gemini: Attempting to send message:', message.substring(0, 50) + '...');
  
  // Find input box - try multiple selectors
  let inputBox = document.querySelector(SELECTORS.inputBox);
  if (!inputBox) {
    inputBox = document.querySelector(SELECTORS.inputBoxAlt);
  }
  if (!inputBox) {
    inputBox = document.querySelector(SELECTORS.inputBoxAlt2);
  }
  
  if (!inputBox) {
    console.error('Gemini input box not found');
    chrome.runtime.sendMessage({
      action: 'log',
      message: '❌ Geminiの入力ボックスが見つかりません\n必要な条件:\n• Geminiにログインしていることを確認してください\n• 新しい会話を開始していることを確認してください\n• ページを更新してから再試行してください'
    }).catch(() => {});
    return false;
  }

  // Set the message
  if (inputBox.tagName === 'RICH-TEXTAREA') {
    // For rich-textarea elements
    const textarea = inputBox.querySelector('textarea') || inputBox;
    textarea.value = message;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // For contenteditable divs
    inputBox.textContent = message;
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Focus the input
  inputBox.focus();

  // Wait a bit for UI to update
  setTimeout(() => {
    // Find and click send button
    const sendButtons = document.querySelectorAll(SELECTORS.sendButton);
    let sendButton = null;
    
    // Find the enabled send button
    for (const btn of sendButtons) {
      if (!btn.disabled && btn.offsetParent !== null) {
        sendButton = btn;
        break;
      }
    }
    
    if (!sendButton) {
      sendButton = document.querySelector(SELECTORS.sendButtonAlt);
    }
    
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
      console.log('Message sent to Gemini successfully');
      
      // Wait for response
      waitForResponse();
    } else {
      console.error('Gemini send button not found or disabled');
      chrome.runtime.sendMessage({
        action: 'log',
        message: '❌ Geminiの送信ボタンが見つからないか、無効になっています\n必要な条件:\n• メッセージが入力されていることを確認してください\n• Geminiが応答中でないことを確認してください\n• ページを更新してから再試行してください'
      }).catch(() => {});
      return false;
    }
  }, 500);

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
  let stableCount = 0;
  let previousLength = 0;

  responseCheckInterval = setInterval(() => {
    checkCount++;

    // Get current response
    const response = getLatestResponse();
    
    if (response && response.length > 10) {
      // Check if response length is stable (not growing)
      if (response.length === previousLength) {
        stableCount++;
      } else {
        stableCount = 0;
        previousLength = response.length;
      }

      // If stable for 3 checks and different from last, consider it complete
      if (stableCount >= 3 && response !== lastResponseText) {
        lastResponseText = response;
        clearInterval(responseCheckInterval);
        
        console.log('Gemini response captured, length:', response.length);
        
        // Send to background script
        chrome.runtime.sendMessage({
          action: 'aiResponded',
          response: response
        });
        
        console.log('Gemini response sent to background script');
      }
    }

    if (checkCount >= maxChecks) {
      clearInterval(responseCheckInterval);
      console.log('Response timeout');
      chrome.runtime.sendMessage({
        action: 'log',
        message: '⚠️ Geminiの応答がタイムアウトしました\n考えられる原因:\n• 応答が非常に長い可能性があります\n• Geminiがエラーを返した可能性があります\n• ネットワークの問題がある可能性があります\n対処方法:\n• 遅延設定を増やしてください\n• ページを更新してから再試行してください'
      }).catch(() => {});
    }
  }, 1000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Gemini: Received message:', message.action);
  
  if (message.action === 'sendMessage') {
    const success = sendMessage(message.message);
    sendResponse({ success });
  } else if (message.action === 'setParticipantInfo') {
    participantInfo = {
      participant: message.participant,
      aiType: message.aiType,
      persona: message.persona
    };
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    document.body.appendChild(indicator);
  }
  
  let participantText = '';
  if (participantInfo.participant > 0) {
    participantText = `<div style="font-size: 11px; opacity: 0.9;">参加者${participantInfo.participant} (${participantInfo.aiType === 'chatgpt' ? 'ChatGPT' : 'Gemini'})</div>`;
  }
  
  indicator.innerHTML = `
    <div>🤖 AIディベート実行中</div>
    ${participantText}
  `;
}

// Add settings button
function addSettingsButton() {
  if (document.getElementById('ai-debate-settings-btn')) return;
  
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'ai-debate-settings-btn';
  settingsBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    z-index: 999998;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  settingsBtn.innerHTML = '⚙️';
  settingsBtn.title = 'AIディベート設定';
  
  settingsBtn.addEventListener('mouseenter', () => {
    settingsBtn.style.transform = 'scale(1.1)';
    settingsBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
  });
  
  settingsBtn.addEventListener('mouseleave', () => {
    settingsBtn.style.transform = 'scale(1)';
    settingsBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  });
  
  settingsBtn.addEventListener('click', () => {
    // Open the extension popup by sending a message to background
    chrome.runtime.sendMessage({ action: 'openPopup' }).catch(() => {
      // Fallback: show a modal with instructions
      showSettingsModal();
    });
  });
  
  document.body.appendChild(settingsBtn);
}

function showSettingsModal() {
  if (document.getElementById('ai-debate-settings-modal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'ai-debate-settings-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    color: black;
    padding: 24px;
    border-radius: 12px;
    z-index: 9999999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
  `;
  
  modal.innerHTML = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px;">AIディベート設定</h2>
    <p style="margin: 0 0 16px 0; line-height: 1.6;">
      設定にアクセスするには、ブラウザのツールバーにある拡張機能アイコン（🤖）をクリックしてください。
    </p>
    <button id="close-settings-modal" style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    ">閉じる</button>
  `;
  
  const overlay = document.createElement('div');
  overlay.id = 'ai-debate-settings-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999998;
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  const closeModal = () => {
    modal.remove();
    overlay.remove();
  };
  
  document.getElementById('close-settings-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
}

addIndicator();
addSettingsButton();
