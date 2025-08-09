/**
 * This script injects a button onto investing.com equity pages.
 * When clicked, it sends the company name to the background script.
 */
console.log('[Perplexity Exporter] Content script loaded.');

function addButton() {
  // Use the container for the "Add to Portfolio" / "Create Alert" buttons as a stable anchor
  const buttonContainer = document.querySelector('.instrument-add-alert_no-select__7sTq_');
  
  // Find the main h1 tag for the company name, which is more reliable than class-based selectors.
  const header = document.querySelector('h1');

  console.log('[Perplexity Exporter] addButton: Searching for button container. Found:', buttonContainer);
  console.log('[Perplexity Exporter] addButton: Searching for header. Found:', header);

  // Exit if elements aren't found or if our button already exists
  if (!buttonContainer || !header || document.getElementById('export-to-perplexity-btn')) {
    if (document.getElementById('export-to-perplexity-btn')) {
      console.log('[Perplexity Exporter] addButton: Button already exists. Exiting.');
    }
    return;
  }

  // Create the button
  const button = document.createElement('button');
  button.id = 'export-to-perplexity-btn';
  button.textContent = 'Export to Perplexity';

  // Style the button to match the existing buttons in the container
  button.style.backgroundColor = '#E6E9EB'; // A neutral gray matching other secondary buttons
  button.style.color = '#232526';
  button.style.border = 'none';
  button.style.padding = '0.625rem 1rem'; // Matches `py-2.5 px-4`
  button.style.borderRadius = '0.25rem'; // Matches `rounded`
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.style.fontSize = '14px';
  button.style.lineHeight = '1.25rem'; // Matches `leading-5`
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.height = '100%'; // Ensure consistent height with siblings

  // Add click listener to send data to the background script
  button.addEventListener('click', () => {
    // Get the company name, removing the ticker symbol in parentheses if it exists
    const companyName = header.textContent.split('(')[0].trim();
    if (companyName) {
      console.log(`[Perplexity Exporter] Exporting company: ${companyName}`);
      chrome.runtime.sendMessage({
        action: 'exportToPerplexity',
        companyName: companyName
      });
    }
  });

  // Insert our button at the beginning of the container
  buttonContainer.prepend(button);
  console.log('[Perplexity Exporter] addButton: Button successfully added.');
}

// The page content can load dynamically. We use a MutationObserver
// to ensure our button is added as soon as the target container is available.
const observer = new MutationObserver((mutations, obs) => {
  const buttonContainer = document.querySelector('.instrument-add-alert_no-select__7sTq_');
  if (buttonContainer) {
    console.log('[Perplexity Exporter] MutationObserver: Button container found. Adding button and disconnecting observer.');
    addButton();
    obs.disconnect(); // Stop observing once the button is added.
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
