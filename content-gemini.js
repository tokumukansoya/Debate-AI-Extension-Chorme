// Content script for Gemini
(function() {
  'use strict';

  console.log('AI Debate Extension: Gemini content script loaded');

  // Register this tab with the background script
  chrome.runtime.sendMessage({ type: 'registerTab', platform: 'gemini' });

  // Create visual indicator
  createDebateIndicator();

  let isListening = false;
  let observer = null;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendMessage') {
      sendMessageToGemini(message.message);
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
        background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
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
        <span>Gemini Debating...</span>
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

  async function sendMessageToGemini(message) {
    showIndicator();
    
    // Find the input area - Gemini uses a rich text editor
    const editor = document.querySelector('rich-textarea .ql-editor, [contenteditable="true"]');
    
    if (!editor) {
      console.error('Could not find Gemini input editor');
      hideIndicator();
      return;
    }

    // Set the message
    editor.textContent = message;
    editor.innerHTML = message;
    
    // Trigger input events
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait a bit for the UI to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find and click the send button
    const sendButton = document.querySelector('button[aria-label*="Send"], button.send-button, button[mattooltip*="Send"]');

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
    // Look for the latest model response
    const checkForResponse = () => {
      // Gemini's response container
      const messageContainers = document.querySelectorAll('.model-response-text, .response-container .markdown, message-content model-response');
      
      if (messageContainers.length > 0) {
        const lastMessage = messageContainers[messageContainers.length - 1];
        
        // Check if still generating (look for stop button or loading indicator)
        const isGenerating = document.querySelector('button[aria-label*="Stop"]') !== null;
        
        if (!isGenerating) {
          const messageText = lastMessage.textContent || lastMessage.innerText;
          
          if (messageText && messageText.trim().length > 0) {
            console.log('Gemini response captured:', messageText.substring(0, 100));
            
            // Send the message to background script
            chrome.runtime.sendMessage({
              type: 'messageGenerated',
              platform: 'gemini',
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
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    hideIndicator();
  }
})();
