// Content script for Grok (x.com)
console.log('AI Debate Extension: Grok content script loaded');

// Participant info
let participantInfo = {
    participant: 0,
    aiType: 'grok',
    currentTurn: 0,
    maxTurns: 5
};

// Selectors for Grok interface (x.com/grok)
const SELECTORS = {
    inputBox: 'div[data-testid="tweetTextarea_0"]', // Standard X compose box, might differ for Grok
    sendButton: 'button[data-testid="tweetButtonInline"]', // Standard X send
    latestMessage: 'div[data-testid="tweetText"]', // Very generic, needs refinement for Grok specific responses
    grokContainer: 'div[aria-label="Grok"]' // Look for Grok specific container
};

// Get the latest AI response
function getLatestResponse() {
    // Grok messages are likely mixed in a timeline or chat view.
    // We'll look for the last message that is NOT from the user.
    // This is tricky on X.com without specific Grok selectors.
    // Assuming a standard chat flow for now.
    const messages = document.querySelectorAll(SELECTORS.latestMessage);
    if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        return lastMessage.innerText.trim();
    }
    return null;
}

// Send message to Grok
// Send message to Grok
function sendMessage(message) {
    console.log('Grok: Attempting to send message');

    // Grok input usually looks like the standard tweet composer but might be in a specific container
    // Best effort selector
    const inputBox = document.querySelector(SELECTORS.inputBox) ||
        document.querySelector('div[contenteditable="true"]');

    if (!inputBox) {
        console.error('Grok input box not found');
        chrome.runtime.sendMessage({
            action: 'log',
            message: '❌ Grokの入力ボックスが見つかりません'
        }).catch(() => { });
        return false;
    }

    // Set message using execCommand (most reliable for X/Twitter React inputs)
    inputBox.focus();

    // Clear first if needed? Usually we append or it's empty.
    // Select all and replace to be safe
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, message);

    // Dispatch input event just in case
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));

    // Snapshot current response to avoid detecting stale responses
    lastResponseText = getLatestResponse() || '';

    // Wait a bit and click send
    setTimeout(() => {
        const sendButton = document.querySelector(SELECTORS.sendButton) ||
            document.querySelector('button[aria-label="Post"]'); // Fallback

        if (sendButton && !sendButton.disabled) {
            sendButton.click();
            console.log('Message sent to Grok successfully');
            waitForResponse();
        } else {
            // Try Enter key (Ctrl+Enter often sends on X)
            console.log('Send button missing/disabled, trying Ctrl+Enter...');
            const enterEvent = new KeyboardEvent('keydown', {
                bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', ctrlKey: true
            });
            inputBox.dispatchEvent(enterEvent);
            waitForResponse();
        }
    }, 800);

    return true;
}

// Wait for AI response
let lastResponseText = '';
let responseCheckInterval = null;

function waitForResponse() {
    if (responseCheckInterval) clearInterval(responseCheckInterval);

    let checkCount = 0;
    const maxChecks = 120; // 2 minutes
    let stableCount = 0;
    let previousLength = 0;

    responseCheckInterval = setInterval(() => {
        checkCount++;
        const response = getLatestResponse();

        if (response && response.length > 10) {
            if (response.length === previousLength) {
                stableCount++;
            } else {
                stableCount = 0;
                previousLength = response.length;
            }

            if (stableCount >= 5 && response !== lastResponseText) {
                lastResponseText = response;
                clearInterval(responseCheckInterval);

                chrome.runtime.sendMessage({
                    action: 'aiResponded',
                    response: response
                });
            }
        }

        if (checkCount >= maxChecks) {
            clearInterval(responseCheckInterval);
            chrome.runtime.sendMessage({
                action: 'log',
                message: '⚠️ Grokの応答がタイムアウトしました'
            }).catch(() => { });
        }
    }, 1000);
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sendMessage') {
        sendMessage(message.message);
        sendResponse({ success: true });
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

// Manual Start Detection
function attachManualStartListener() {
    document.body.addEventListener('click', (e) => {
        if (e.target.closest(SELECTORS.sendButton)) {
            notifyManualStart();
        }
    });

    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (e.target.closest(SELECTORS.inputBox)) {
                notifyManualStart();
            }
        }
    });
}

function notifyManualStart() {
    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: 'manualStart',
            aiType: 'grok'
        }).catch(() => { });
        waitForResponse();
    }, 500);
}

// UI Indicator Same as others
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

    indicator.innerHTML = `<div>${participantText}</div>`;
}

addIndicator();
attachManualStartListener();

function addIndicator() {
    updateIndicator();
}
