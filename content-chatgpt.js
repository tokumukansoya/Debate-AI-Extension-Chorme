// Content script for ChatGPT (chat.openai.com or chatgpt.com)
console.log('AI Debate Extension: ChatGPT content script loaded');

// Participant info
let participantInfo = {
  participant: 0,
  aiType: 'chatgpt',
  persona: ''
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
  
  // Find input box
  const inputBox = document.querySelector(SELECTORS.inputBox) || 
                   document.querySelector(SELECTORS.inputBoxAlt);
  
  if (!inputBox) {
    console.error('ChatGPT input box not found');
    chrome.runtime.sendMessage({
      action: 'log',
      message: '❌ ChatGPTの入力ボックスが見つかりません\n必要な条件:\n• ChatGPTにログインしていることを確認してください\n• 新しい会話を開始していることを確認してください\n• ページを更新してから再試行してください'
    }).catch(() => {});
    return false;
  }

  // Set the message
  inputBox.value = message;
  inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Focus the input
  inputBox.focus();

  // Wait a bit for UI to update
  setTimeout(() => {
    // Find and click send button
    const sendButton = document.querySelector(SELECTORS.sendButton) || 
                       document.querySelector(SELECTORS.sendButtonAlt);
    
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
      console.log('Message sent to ChatGPT successfully');
      
      // Wait for response
      waitForResponse();
    } else {
      console.error('ChatGPT send button not found or disabled');
      chrome.runtime.sendMessage({
        action: 'log',
        message: '❌ ChatGPTの送信ボタンが見つからないか、無効になっています\n必要な条件:\n• メッセージが入力されていることを確認してください\n• ChatGPTが応答中でないことを確認してください\n• ページを更新してから再試行してください'
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
      }).catch(() => {});
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
