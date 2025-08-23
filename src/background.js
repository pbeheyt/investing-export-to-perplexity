/**
 * This service worker listens for messages from the content script,
 * opens a new tab, and programmatically injects the necessary scripts
 * into the Perplexity page to perform the automation.
 */
const PERPLEXITY_URL = "https://www.perplexity.ai/spaces/systeme-de-recherche-qualitati-ZNn4sgLpQPi9PElesXnlcw";

// Create context menu items on extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "searchOnInvesting",
    title: "Search on Investing.com for '%s'",
    contexts: ["selection"]
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Perplexity Exporter] Background: Message received', message);
  if (message.action === 'exportToPerplexity') {
    const companyName = message.companyName;

    // This listener will handle the injection once the tab is ready.
    const tabUpdateListener = (tabId, changeInfo, tab) => {
      // Ensure we are acting on the correct tab and that it has finished loading.
      if (tab.url.startsWith("https://www.perplexity.ai") && changeInfo.status === 'complete') {
        console.log(`[Perplexity Exporter] Background: Tab ${tabId} is complete. Injecting scripts.`);
        
        // Inject scripts in the correct order. Dependencies must come first.
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [
            'src/platforms/platform-base.js',
            'src/platforms/implementations/perplexity-platform.js',
            'src/perplexity-content.js'
          ]
        }).then(() => {
          console.log("[Perplexity Exporter] Background: All scripts injected successfully.");
        }).catch(err => {
          console.error("[Perplexity Exporter] Background: Error injecting scripts:", err);
        });

        // IMPORTANT: Remove the listener to avoid it firing again for the same tab
        // or other tabs, which would cause errors and memory leaks.
        chrome.tabs.onUpdated.removeListener(tabUpdateListener);
      }
    };

    // Add the listener before creating the tab to catch the update event.
    chrome.tabs.onUpdated.addListener(tabUpdateListener);

    // Save the company name to local storage for the content script to pick up.
    chrome.storage.local.set({ companyToExport: companyName }, () => {
      console.log(`[Perplexity Exporter] Background: Saved "${companyName}" to storage.`);
      // Create a new tab with the Perplexity URL. The listener above will handle the rest.
      chrome.tabs.create({ url: PERPLEXITY_URL });
    });
    
    return true; // Required for async operations.
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "searchOnInvesting" && info.selectionText) {
    const query = encodeURIComponent(info.selectionText);
    const searchUrl = `https://www.investing.com/search/?q=${query}`;
    
    // Open the search result in a new tab
    chrome.tabs.create({ url: searchUrl });
  }
});
