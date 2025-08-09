console.log('[Perplexity Exporter] Content script loaded.');

/**
 * This script injects a button onto investing.com equity pages.
 * When clicked, it sends the company name to the background script.
 */
function addButton() {
  // Target the H1 element containing the company name.
  const header = document.querySelector('h1.text-xl.font-bold');
  console.log('[Perplexity Exporter] addButton: Searching for header. Found:', header);
  if (!header || document.getElementById('export-to-perplexity-btn')) {
    if (document.getElementById('export-to-perplexity-btn')) {
      console.log('[Perplexity Exporter] addButton: Button already exists. Exiting.');
    }
    return; // Exit if header not found or button already exists
  }

  // Create the button
  const button = document.createElement('button');
  button.id = 'export-to-perplexity-btn';
  button.textContent = 'Export to Perplexity';

  // Style the button to match the site's look and feel
  button.style.backgroundColor = '#0A69E5';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '8px 12px';
  button.style.marginLeft = '15px';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.style.fontSize = '14px';

  // Insert the button after the header
  header.parentNode.insertBefore(button, header.nextSibling);

  // Add click listener to send data to the background script
  button.addEventListener('click', () => {
    const companyName = header.textContent.trim();
    if (companyName) {
      chrome.runtime.sendMessage({
        action: 'exportToPerplexity',
        companyName: companyName
      });
    }
  });
}

// The page content can load dynamically. We use a MutationObserver
// to ensure our button is added as soon as the header element is available.
const observer = new MutationObserver((mutations, obs) => {
  console.log('[Perplexity Exporter] MutationObserver: DOM changed.');
  const header = document.querySelector('h1.text-xl.font-bold');
  if (header) {
    console.log('[Perplexity Exporter] MutationObserver: Header found. Adding button and disconnecting observer.');
    addButton();
    obs.disconnect(); // Stop observing once the button is added.
  } else {
    // This can be noisy, but useful for debugging dynamic pages.
    // console.log('[Perplexity Exporter] MutationObserver: Header not yet found.');
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
