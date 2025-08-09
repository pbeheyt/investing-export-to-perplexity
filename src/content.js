/**
 * This script injects a button onto investing.com equity pages.
 * When clicked, it sends the company name to the background script.
 */
console.log('[Perplexity Exporter] Content script loaded.');

// --- Configuration for the SVG Button ---
const SVG_ICON = `<svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: auto;">
    <path xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" d="M101.008 42L190.99 124.905L190.99 124.886L190.99 42.1913H208.506L208.506 125.276L298.891 42V136.524L336 136.524V272.866H299.005V357.035L208.506 277.525L208.506 357.948H190.99L190.99 278.836L101.11 358V272.866H64V136.524H101.008V42ZM177.785 153.826H81.5159V255.564H101.088V223.472L177.785 153.826ZM118.625 231.149V319.392L190.99 255.655L190.99 165.421L118.625 231.149ZM209.01 254.812V165.336L281.396 231.068V272.866H281.489V318.491L209.01 254.812ZM299.005 255.564H318.484V153.826L222.932 153.826L299.005 222.751V255.564ZM281.375 136.524V81.7983L221.977 136.524L281.375 136.524ZM177.921 136.524H118.524V81.7983L177.921 136.524Z" fill="black"/>
</svg>`;
const IDLE_COLOR = '#5e666e';
const HOVER_COLOR = '#2f579d';
const BG_COLOR = '#f8f4f0';

function addButton() {
  const buttonContainer = document.querySelector('.instrument-add-alert_no-select__7sTq_');
  const header = document.querySelector('h1');

  console.log('[Perplexity Exporter] addButton: Searching for button container. Found:', buttonContainer);
  console.log('[Perplexity Exporter] addButton: Searching for header. Found:', header);

  if (!buttonContainer || !header || document.getElementById('export-to-perplexity-btn')) {
    if (document.getElementById('export-to-perplexity-btn')) {
      console.log('[Perplexity Exporter] addButton: Button already exists. Exiting.');
    }
    return;
  }

  const button = document.createElement('button');
  button.id = 'export-to-perplexity-btn';
  button.innerHTML = SVG_ICON;

  // Style the button
  button.style.boxSizing = 'border-box'; // Ensures padding is included in the total width/height
  button.style.backgroundColor = BG_COLOR;
  button.style.border = 'none';
  button.style.padding = '8px'; // Add padding to make the inner SVG smaller
  button.style.borderRadius = '0.25rem';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.height = '40px'; // Match sibling button height
  button.style.width = '40px'; // Ensure it's a square
  button.title = 'Export to Perplexity'; // Tooltip for accessibility

  // Set initial color of SVG paths
  const svgPaths = button.querySelectorAll('path');
  svgPaths.forEach(path => path.setAttribute('fill', IDLE_COLOR));

  // Add hover effects
  button.addEventListener('mouseover', () => {
    svgPaths.forEach(path => path.setAttribute('fill', HOVER_COLOR));
  });
  button.addEventListener('mouseout', () => {
    svgPaths.forEach(path => path.setAttribute('fill', IDLE_COLOR));
  });
  
  // Add click listener to send data
  button.addEventListener('click', () => {
    const companyName = header.textContent.split('(')[0].trim();
    if (companyName) {
      console.log(`[Perplexity Exporter] Exporting company: ${companyName}`);
      chrome.runtime.sendMessage({
        action: 'exportToPerplexity',
        companyName: companyName
      });
    }
  });

  buttonContainer.prepend(button);
  console.log('[Perplexity Exporter] addButton: SVG Button successfully added.');
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
