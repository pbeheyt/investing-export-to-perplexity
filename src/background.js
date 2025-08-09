/**
 * This service worker listens for messages from the content script,
 * opens a new tab, and injects a script to interact with the Perplexity page.
 */
const PERPLEXITY_URL = "https://www.perplexity.ai/spaces/company-qualitative-analysis-cJBemcwJS.Cd4qWmXz6lCQ";

// This function is injected into the Perplexity page.
function fillAndSubmitForm(companyName) {
  const promptTextarea = document.getElementById('ask-input');
  const submitButton = document.querySelector('button[data-testid="submit-button"]');

  if (promptTextarea && submitButton) {
    // Focus and insert text into the contenteditable div
    promptTextarea.focus();
    document.execCommand('insertText', false, companyName);

    // A short delay helps ensure the page's UI state updates before we click
    setTimeout(() => {
      submitButton.disabled = false; // Ensure button is enabled
      submitButton.click();
    }, 250);
  } else {
    console.error("Perplexity AI page elements (textarea or submit button) not found.");
  }
}

// Main listener for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Perplexity Exporter] Background: Message received', message);
  if (message.action === 'exportToPerplexity') {
    const companyName = message.companyName;

    // 1. Create a new tab with the Perplexity URL
    chrome.tabs.create({ url: PERPLEXITY_URL }, (tab) => {
      // 2. Listen for the tab to finish loading completely
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          // 3. Once loaded, inject the script to fill and submit the form
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: fillAndSubmitForm,
            args: [companyName],
          });
          // 4. Clean up the listener to prevent it from running again
          chrome.tabs.onUpdated.removeListener(listener);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
    return true; // Required for async sendResponse.
  }
});
