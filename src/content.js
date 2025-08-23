/**
 * This script injects buttons onto investing.com equity pages.
 * - "Export to Perplexity" sends company info to the background script.
 * - "Copy Key Stats" scrapes financial data and copies it to the clipboard.
*/
console.log('[Perplexity Exporter] Content script loaded.');

// --- Configuration for SVG Buttons ---
const IDLE_COLOR = '#5e666e';
const HOVER_COLOR = '#2f579d';
const BG_COLOR = '#f8f4f0';

const PERPLEXITY_SVG_ICON = `<svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: auto;">
    <path xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" d="M101.008 42L190.99 124.905L190.99 124.886L190.99 42.1913H208.506L208.506 125.276L298.891 42V136.524L336 136.524V272.866H299.005V357.035L208.506 277.525L208.506 357.948H190.99L190.99 278.836L101.11 358V272.866H64V136.524H101.008V42ZM177.785 153.826H81.5159V255.564H101.088V223.472L177.785 153.826ZM118.625 231.149V319.392L190.99 255.655L190.99 165.421L118.625 231.149ZM209.01 254.812V165.336L281.396 231.068V272.866H281.489V318.491L209.01 254.812ZM299.005 255.564H318.484V153.826L222.932 153.826L299.005 222.751V255.564ZM281.375 136.524V81.7983L221.977 136.524L281.375 136.524ZM177.921 136.524H118.524V81.7983L177.921 136.524Z" fill="black"/>
</svg>`;
const CLIPBOARD_SVG_ICON = `<svg style="margin:auto; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3H8C5.23858 3 3 5.23858 3 8V16C3 18.7614 5.23858 21 8 21H16C18.7614 21 21 18.7614 21 16V8C21 5.23858 18.7614 3 16 3Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="${IDLE_COLOR}"/><path d="M16 8H13C12.448 8 12 7.55228 12 7V4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="${IDLE_COLOR}"/></svg>`;
const CHECK_SVG_ICON = `<svg style="margin:auto; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="green"/></svg>`;


/**
 * Creates a styled button element.
 * @param {string} id - The ID for the button.
 * @param {string} title - The tooltip text.
 * @param {string} svgIcon - The SVG content for the button.
 * @returns {HTMLButtonElement}
 */
function createStyledButton(id, title, svgIcon) {
  const button = document.createElement('button');
  button.id = id;
  button.innerHTML = svgIcon;
  button.title = title;

  // Style the button
  button.style.boxSizing = 'border-box';
  button.style.backgroundColor = BG_COLOR;
  button.style.border = 'none';
  button.style.padding = '8px';
  button.style.borderRadius = '0.25rem';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.height = '40px';
  button.style.width = '40px';
  button.style.marginLeft = '8px';

  return button;
}

/**
 * Handles the logic for scraping and copying key stats.
 * @param {Event} event - The click event.
 */
async function handleCopyStatsClick(event) {
  const button = event.currentTarget;
  console.log('[Perplexity Exporter] Copy Key Stats button clicked.');

  // Find the grid of stats by looking for a known data-test attribute and finding its parent grid.
  const firstStatElement = document.querySelector('dd[data-test]');
  if (!firstStatElement) {
    console.error('[Perplexity Exporter] Could not find any key stat elements.');
    return;
  }
  
  const grid = firstStatElement.closest('div[class*="grid"]');
  if (!grid) {
    console.error('[Perplexity Exporter] Key stats grid container not found.');
    return;
  }

  const statRows = grid.querySelectorAll(':scope > div');
  const stats = [];

  statRows.forEach(row => {
    const keyEl = row.querySelector('dt');
    const valueEl = row.querySelector('dd');
    if (keyEl && valueEl) {
      const keyText = keyEl.textContent.trim().replace(/\s+/g, ' ');
      const valueText = valueEl.textContent.trim();
      if(keyText && valueText) {
        stats.push(`${keyText}: ${valueText}`);
      }
    }
  });

  if (stats.length > 0) {
    const formattedStats = stats.join('\n');
    try {
      await navigator.clipboard.writeText(formattedStats);
      console.log(`[Perplexity Exporter] Copied ${stats.length} key stats to clipboard.`);

      // Provide visual feedback
      const originalTitle = button.title;
      button.dataset.isCopied = 'true';
      button.innerHTML = CHECK_SVG_ICON;
      button.title = 'Copied!';
      
      setTimeout(() => {
        button.innerHTML = CLIPBOARD_SVG_ICON;
        button.title = originalTitle;
        const svgElements = button.querySelectorAll('path, rect');
        svgElements.forEach(el => el.setAttribute('stroke', IDLE_COLOR));
        delete button.dataset.isCopied;
      }, 2000);

    } catch (err) {
      console.error('[Perplexity Exporter] Failed to copy stats to clipboard:', err);
    }
  } else {
    console.warn('[Perplexity Exporter] No key stats found to copy.');
  }
}

function addButtons() {
  const buttonContainer = document.querySelector('.instrument-add-alert_no-select__7sTq_');
  const header = document.querySelector('h1');

  console.log('[Perplexity Exporter] addButtons: Searching for button container. Found:', buttonContainer);
  console.log('[Perplexity Exporter] addButtons: Searching for header. Found:', header);

  if (!buttonContainer || !header || document.getElementById('export-to-perplexity-btn')) {
    if (document.getElementById('export-to-perplexity-btn')) {
      console.log('[Perplexity Exporter] addButtons: Buttons already exist. Exiting.');
    }
    return;
  }

  // --- Create "Export to Perplexity" button ---
  const perplexityButton = createStyledButton('export-to-perplexity-btn', 'Export to Perplexity', PERPLEXITY_SVG_ICON);
  perplexityButton.querySelectorAll('path').forEach(path => path.setAttribute('fill', IDLE_COLOR));
  perplexityButton.addEventListener('mouseover', () => perplexityButton.querySelectorAll('path').forEach(path => path.setAttribute('fill', HOVER_COLOR)));
  perplexityButton.addEventListener('mouseout', () => perplexityButton.querySelectorAll('path').forEach(path => path.setAttribute('fill', IDLE_COLOR)));
  perplexityButton.addEventListener('click', () => {
    const headerText = header.textContent.trim();
    const match = headerText.match(/^(.*?)\s+\(([^)]+)\)$/);
    const companyInfo = (match && match[1] && match[2])
      ? { name: match[1].trim(), ticker: match[2].trim() }
      : { name: headerText.split('(')[0].trim(), ticker: '' };
    console.log(`[Perplexity Exporter] Exporting company info:`, companyInfo);
    chrome.runtime.sendMessage({ action: 'exportToPerplexity', companyInfo });
  });

  // --- Create "Copy Key Stats" button ---
  const copyStatsButton = createStyledButton('copy-key-stats-btn', 'Copy Key Stats', CLIPBOARD_SVG_ICON);
  copyStatsButton.addEventListener('mouseover', () => {
    if (!copyStatsButton.dataset.isCopied) copyStatsButton.querySelectorAll('path, rect').forEach(el => el.setAttribute('stroke', HOVER_COLOR));
  });
  copyStatsButton.addEventListener('mouseout', () => {
    if (!copyStatsButton.dataset.isCopied) copyStatsButton.querySelectorAll('path, rect').forEach(el => el.setAttribute('stroke', IDLE_COLOR));
  });
  copyStatsButton.addEventListener('click', handleCopyStatsClick);
  
  // Add buttons to the page (in reverse order because we use prepend)
  buttonContainer.prepend(copyStatsButton);
  buttonContainer.prepend(perplexityButton);
  console.log('[Perplexity Exporter] addButtons: All buttons successfully added.');
}

// The page content can load dynamically. We use a MutationObserver
// to ensure our buttons are added as soon as the target container is available.
const observer = new MutationObserver((mutations, obs) => {
  const buttonContainer = document.querySelector('.instrument-add-alert_no-select__7sTq_');
  if (buttonContainer) {
    console.log('[Perplexity Exporter] MutationObserver: Button container found. Adding buttons and disconnecting observer.');
    addButtons();
    obs.disconnect(); // Stop observing once the buttons are added.
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
