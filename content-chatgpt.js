// Content script for ChatGPT
(function() {
  'use strict';

  console.log('AI Debate Extension: ChatGPT content script loaded');

  // Register this tab with the background script
  chrome.runtime.sendMessage({ type: 'registerTab', platform: 'chatgpt' });

  // Create visual indicator
  createDebateIndicator();

  let isListening = false;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendMessage') {
      sendMessageToChatGPT(message.message);
      sendResponse({ success: true });
    } else if (message.type === 'stopDebate') {
      stopListening();
      sendResponse({ success: true });
    }
  });

  function createDebateIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'ai-debate-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: none;
        align-items: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <span style="
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        "></span>
        <span>ChatGPT Debating...</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;
    document.body.appendChild(indicator);
  }

  function showIndicator() {
    const indicator = document.querySelector('#ai-debate-indicator > div');
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }

  function hideIndicator() {
    const indicator = document.querySelector('#ai-debate-indicator > div');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  async function sendMessageToChatGPT(message) {
    showIndicator();
    
    // Find the input textarea
    const textarea = document.querySelector('textarea[placeholder*="Message"], textarea#prompt-textarea, textarea[data-id="root"]');
    
    if (!textarea) {
      console.error('Could not find ChatGPT input textarea');
      hideIndicator();
      return;
    }

    // Set the message
    textarea.value = message;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Wait a bit for the UI to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find and click the send button
    const sendButton = Array.from(document.querySelectorAll('button')).find(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      return ariaLabel && ariaLabel.toLowerCase().includes('send');
    }) || document.querySelector('button[data-testid="send-button"]');

    if (sendButton && !sendButton.disabled) {
      sendButton.click();
      startListening();
    } else {
      console.error('Could not find or click send button');
      hideIndicator();
    }
  }

  function startListening() {
    if (isListening) return;
    
    isListening = true;

    // Wait for the response to be generated
    setTimeout(() => {
      observeForResponse();
    }, 2000);
  }

  function observeForResponse() {
    // Look for the latest assistant message
    const checkForResponse = () => {
      const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
      
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        
        // Check if the message is complete (no streaming indicator)
        const isComplete = !document.querySelector('[data-testid="stop-button"]');
        
        if (isComplete) {
          const messageText = lastMessage.textContent || lastMessage.innerText;
          
          if (messageText && messageText.trim().length > 0) {
            console.log('ChatGPT response captured:', messageText.substring(0, 100));
            
            // Send the message to background script
            chrome.runtime.sendMessage({
              type: 'messageGenerated',
              platform: 'chatgpt',
              message: messageText.trim()
            });
            
            stopListening();
            hideIndicator();
            return;
          }
        }
      }
      
      // Keep checking
      if (isListening) {
        setTimeout(checkForResponse, 1000);
      }
    };

    checkForResponse();
  }

  function stopListening() {
    isListening = false;
    hideIndicator();
  }
})();
