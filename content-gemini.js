// Content script for Gemini (gemini.google.com)
console.log('AI Debate Extension: Gemini content script loaded');

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
      console.log('Message sent to Gemini');
      
      // Wait for response
      waitForResponse();
    } else {
      console.error('Gemini send button not found or disabled');
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
        
        // Send to background script
        chrome.runtime.sendMessage({
          action: 'aiResponded',
          response: response
        });
        
        console.log('Gemini response captured and sent');
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
