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
const CLIPBOARD_SVG_ICON = `<svg style="margin:auto; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="8" width="13" height="13" rx="4" stroke="${IDLE_COLOR}" stroke-width="2"></rect><path fill-rule="evenodd" clip-rule="evenodd" d="M13 2.00004L12.8842 2.00002C12.0666 1.99982 11.5094 1.99968 11.0246 2.09611C9.92585 2.31466 8.95982 2.88816 8.25008 3.69274C7.90896 4.07944 7.62676 4.51983 7.41722 5.00004H9.76392C10.189 4.52493 10.7628 4.18736 11.4147 4.05768C11.6802 4.00488 12.0228 4.00004 13 4.00004H14.6C15.7366 4.00004 16.5289 4.00081 17.1458 4.05121C17.7509 4.10066 18.0986 4.19283 18.362 4.32702C18.9265 4.61464 19.3854 5.07358 19.673 5.63807C19.8072 5.90142 19.8994 6.24911 19.9488 6.85428C19.9992 7.47112 20 8.26343 20 9.40004V11C20 11.9773 19.9952 12.3199 19.9424 12.5853C19.8127 13.2373 19.4748 13.8114 19 14.2361V16.5829C20.4795 15.9374 21.5804 14.602 21.9039 12.9755C22.0004 12.4907 22.0002 11.9334 22 11.1158L22 11V9.40004V9.35725C22 8.27346 22 7.3993 21.9422 6.69141C21.8826 5.96256 21.7568 5.32238 21.455 4.73008C20.9757 3.78927 20.2108 3.02437 19.27 2.545C18.6777 2.24322 18.0375 2.1174 17.3086 2.05785C16.6007 2.00002 15.7266 2.00003 14.6428 2.00004L14.6 2.00004H13Z" fill="${IDLE_COLOR}"></path></svg>`;
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

  // Extract company info from the header, same as the export button.
  const header = document.querySelector('h1');
  if (!header) {
    console.error('[Perplexity Exporter] Could not find company header element.');
    return;
  }
  const headerText = header.textContent.trim();
  const match = headerText.match(/^(.*?)\s+\(([^)]+)\)$/);
  const companyInfo = (match && match[1] && match[2])
    ? { name: match[1].trim(), ticker: match[2].trim() }
    : { name: headerText.split('(')[0].trim(), ticker: 'N/A' };

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
    const contentHeader = `[Investing.com Metrics]\n${companyInfo.name} (${companyInfo.ticker})`;
    const formattedStats = stats.join('\n');
    const contentToCopy = `${contentHeader}\n\n${formattedStats}`;

    try {
      await navigator.clipboard.writeText(contentToCopy);
      console.log(`[Perplexity Exporter] Copied header and ${stats.length} key stats to clipboard.`);

      // Provide visual feedback
      const originalTitle = button.title;
      button.dataset.isCopied = 'true';
      button.innerHTML = CHECK_SVG_ICON;
      button.title = 'Copied!';
      
      setTimeout(() => {
        button.innerHTML = CLIPBOARD_SVG_ICON;
        button.title = originalTitle;
        button.querySelectorAll('[stroke]').forEach(el => el.setAttribute('stroke', IDLE_COLOR));
        button.querySelectorAll('[fill]').forEach(el => el.setAttribute('fill', IDLE_COLOR));
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
    if (!copyStatsButton.dataset.isCopied) {
      copyStatsButton.querySelectorAll('[stroke]').forEach(el => el.setAttribute('stroke', HOVER_COLOR));
      copyStatsButton.querySelectorAll('[fill]').forEach(el => el.setAttribute('fill', HOVER_COLOR));
    }
  });
  copyStatsButton.addEventListener('mouseout', () => {
    if (!copyStatsButton.dataset.isCopied) {
      copyStatsButton.querySelectorAll('[stroke]').forEach(el => el.setAttribute('stroke', IDLE_COLOR));
      copyStatsButton.querySelectorAll('[fill]').forEach(el => el.setAttribute('fill', IDLE_COLOR));
    }
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
