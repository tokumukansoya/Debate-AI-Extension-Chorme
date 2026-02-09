// Content script for Claude (claude.ai)
console.log('AI Debate Extension: Claude content script loaded');

// Participant info
let participantInfo = {
    participant: 0,
    aiType: 'claude',
    currentTurn: 0,
    maxTurns: 5
};

// Selectors for Claude interface (Best guess, needs verification)
const SELECTORS = {
    inputBox: 'div[contenteditable="true"].ProseMirror',
    sendButton: 'button[aria-label="Send Message"]',
    latestMessage: '.font-claude-message', // This is a guess, might need update
    messageContainer: '.flex-1.flex.flex-col.gap-3',
};

// Get the latest AI response
function getLatestResponse() {
    const messages = document.querySelectorAll(SELECTORS.latestMessage);
    if (messages.length > 0) {
        // Claude messages often alternate User/AI. We need the last AI one.
        // Assuming the structure differentiates via classes or position.
        // For now, grabbing the very last message container text.
        const lastMessage = messages[messages.length - 1];
        return lastMessage.innerText.trim();
    }
    return null;
}

// Send message to Claude
function sendMessage(message) {
    console.log('Claude: Attempting to send message');

    const inputBox = document.querySelector('div[contenteditable="true"]') ||
        document.querySelector(SELECTORS.inputBox);

    if (!inputBox) {
        console.error('Claude input box not found');
        chrome.runtime.sendMessage({
            action: 'log',
            message: '❌ Claudeの入力ボックスが見つかりません'
        }).catch(() => { });
        return false;
    }

    inputBox.focus();

    // Use execCommand 'insertText' for reliable React state update
    // First select all to clear if needed (though usually we want to just insert)
    // If it's a new turn, we assume it's empty or we want to overwrite? 
    // Let's just append/insert.
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, message);

    // Also dispatch input just in case
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));

    // Snapshot current response to avoid detecting stale responses
    lastResponseText = getLatestResponse() || '';

    // Wait and click send
    setTimeout(() => {
        const sendButton = document.querySelector('button[aria-label="Send Message"]') ||
            document.querySelector(SELECTORS.sendButton);

        if (sendButton && !sendButton.disabled) {
            sendButton.click();
            console.log('Message sent to Claude successfully');
            waitForResponse();
        } else {
            console.log('Send button disabled/missing, trying Enter...');
            const enterEvent = new KeyboardEvent('keydown', {
                bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
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

        // Crude check for "is generating" -> usually looking for a "Stop generating" button
        // or a blinking cursor/typing indicator.
        // For now, using stability check.

        if (response && response.length > 10) {
            if (response.length === previousLength) {
                stableCount++;
            } else {
                stableCount = 0;
                previousLength = response.length;
            }

            if (stableCount >= 5 && response !== lastResponseText) { // Slower generation, more stability checks
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
                message: '⚠️ Claudeの応答がタイムアウトしました'
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
        // Check if clicked element is a send button
        if (e.target.closest(SELECTORS.sendButton)) {
            notifyManualStart();
        }
    });

    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Check if focus is in input box
            if (e.target.closest(SELECTORS.inputBox)) {
                notifyManualStart();
            }
        }
    });
}

function notifyManualStart() {
    // Small delay to ensure message actually sends
    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: 'manualStart',
            aiType: 'claude'
        }).catch(() => { });
        waitForResponse(); // Start waiting for response immediately
    }, 500);
}

// UI Indicator
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
