/**
 * This script is programmatically injected into perplexity.ai. It checks for data
 * from the background script and uses the platform-specific classes (which were
 * injected before this script) to automate the form submission.
 */
function main() {
  console.log('[Perplexity Exporter] Injected content script running.');

  chrome.storage.local.get(['companyToExport'], (result) => {
    const companyInfo = result.companyToExport;

    if (companyInfo && companyInfo.name) {
      console.log(`[Perplexity Exporter] Found company info to export:`, companyInfo);
      
      // Clear the storage key immediately to prevent re-running on refresh.
      chrome.storage.local.remove(['companyToExport'], () => {
        console.log('[Perplexity Exporter] Cleared company info from storage.');
      });

      // Instantiate and run the automation. The PerplexityPlatform class
      // is available because its file was injected before this one.
      const platform = new PerplexityPlatform();
      platform.processAutomation(companyInfo);

    } else {
      console.log('[Perplexity Exporter] No company to export found in storage.');
    }
  });
}

main();
