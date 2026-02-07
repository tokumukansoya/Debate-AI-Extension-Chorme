// Content script for ChatGPT (chat.openai.com or chatgpt.com)
console.log('AI Debate Extension: ChatGPT content script loaded');

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
  // Find input box
  const inputBox = document.querySelector(SELECTORS.inputBox) || 
                   document.querySelector(SELECTORS.inputBoxAlt);
  
  if (!inputBox) {
    console.error('ChatGPT input box not found');
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
      console.log('Message sent to ChatGPT');
      
      // Wait for response
      waitForResponse();
    } else {
      console.error('ChatGPT send button not found or disabled');
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
        
        // Send to background script
        chrome.runtime.sendMessage({
          action: 'aiResponded',
          response: response
        });
        
        console.log('ChatGPT response captured and sent');
      }
    }

    if (checkCount >= maxChecks) {
      clearInterval(responseCheckInterval);
      console.log('Response timeout');
    }
  }, 1000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendMessage') {
    const success = sendMessage(message.message);
    sendResponse({ success });
  }
  return true;
});

// Add visual indicator that extension is active
function addIndicator() {
  if (document.getElementById('ai-debate-indicator')) return;
  
  const indicator = document.createElement('div');
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  indicator.textContent = '🤖 AIディベート実行中';
  document.body.appendChild(indicator);
}

addIndicator();
