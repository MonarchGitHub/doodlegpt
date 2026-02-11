// popup.js — safer sendMessage with pre-check & injection fallback
const toggleBtn = document.getElementById('toggle');
const attachBtn = document.getElementById('attachBtn');

function setUI(enabled){
  toggleBtn.textContent = enabled ? 'On' : 'Off';
  toggleBtn.className = enabled ? 'on' : 'off';
}

// Helper: get active tab (promise wrapper)
function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0]));
  });
}

// Helper: sendMessage wrapper that surfaces chrome.runtime.lastError as rejection
function sendMessageToTab(tabId, msg) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, msg, (resp) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(err);
      resolve(resp);
    });
  });
}

// Check whether the content script marker exists in the page
async function isContentScriptPresent(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          return !!(window.__CGPT_DOODLE && window.__CGPT_DOODLE.loaded);
        } catch { return false; }
      }
    });
    // results is an array of InjectionResult objects; use first
    return !!(results && results[0] && results[0].result);
  } catch (e) {
    console.warn('Check presence failed', e);
    return false;
  }
}

// Try to inject the content script file into the tab
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content_script.js']
    });
    // after injection, do a small re-check
    return await isContentScriptPresent(tabId);
  } catch (e) {
    console.error('Injection failed', e);
    return false;
  }
}

// Main: safely send message to active tab with fall injection fallback 
async function sendToActiveTab(msg) {
  const tab = await getActiveTab();
  if (!tab) {
    console.warn('No active tab found.');
    return { ok: false, error: 'no-active-tab' };
  }

  // Only operate on http(s) pages; ignore chrome://, extensions pages, etc.
  if (!tab.url || !/^https?:\/\//.test(tab.url)) {
    console.warn('Active tab is not an http(s) page:', tab.url);
    return { ok: false, error: 'invalid-url' };
  }

  const tabId = tab.id;

  // 1) Check if content script is already present
  let present = await isContentScriptPresent(tabId);
  if (!present) {
    console.info('Content script not detected, trying to inject content_script.js...');
    // 2) Try to inject content_script.js programmatically
    const injected = await injectContentScript(tabId);
    if (!injected) {
      console.error('Content script not present and injection failed. Ask user to reload the page or grant host permissions.');
      return { ok: false, error: 'injection_failed' };
    }
  }

  // 3) Send message
  try {
    const resp = await sendMessageToTab(tabId, msg);
    return { ok: true, resp };
  } catch (err) {
    console.warn('Send message failed:', err);
    return { ok: false, error: String(err) };
  }
}

// initialize UI from storage
chrome.storage.local.get(['doodleEnabled'], (res) => {
  const enabled = !!res.doodleEnabled;
  setUI(enabled);
});

// Toggle button
toggleBtn.addEventListener('click', async () => {
  const res = await chrome.storage.local.get(['doodleEnabled']);
  const enabled = !res.doodleEnabled;
  await chrome.storage.local.set({ doodleEnabled: enabled });
  setUI(enabled);

  const result = await sendToActiveTab({ type: 'SET_ENABLED', enabled });
  if (!result.ok) {
    console.warn('Toggle message failed:', result.error);
    // Optional: show user-friendly message in popup
    // alert('Could not talk to content script. Try reloading the page.');
  }
});

// Force attach inside chat (tries to inject if needed)
attachBtn.addEventListener('click', async () => {
  const result = await sendToActiveTab({ type: 'ATTACH_INSIDE_CHAT' });
  if (!result.ok) {
    console.warn('Attach message failed:', result.error);
    // Optional feedback for user
    // alert('Failed to attach. Make sure you are on a supported chat page and the extension has host permissions.');
  }
});
