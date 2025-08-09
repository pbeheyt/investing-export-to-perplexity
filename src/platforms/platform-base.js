/**
 * Base class providing robust, reusable logic for interacting with web pages,
 * inspired by the user's provided architectural example.
 */
class BasePlatform {
  constructor(platformId) {
    this.platformId = platformId;
  }

  /**
   * Waits for an element to exist and meet a specific condition.
   * @param {string[]} selectors - Array of CSS selectors to try.
   * @param {function} conditionFn - Function that returns true if the element is in the desired state.
   * @param {number} timeoutMs - Max time to wait.
   * @returns {Promise<HTMLElement|null>} The found element or null.
   */
  async _waitForElementState(selectors, conditionFn, timeoutMs = 5000) {
    const pollIntervalMs = 200;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = async () => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && (await conditionFn(element))) {
            console.log(`[${this.platformId}] Element found and condition met for selector: ${selector}`);
            resolve(element);
            return;
          }
        }

        if (Date.now() - startTime > timeoutMs) {
          console.error(`[${this.platformId}] Timeout waiting for element with selectors: ${selectors.join(', ')}`);
          resolve(null);
        } else {
          setTimeout(check, pollIntervalMs);
        }
      };
      check();
    });
  }

  /**
   * Checks if a button is visible and enabled.
   * @param {HTMLElement} element - The element to check.
   * @returns {boolean}
   */
  _isButtonReady(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    const isDisabled = element.disabled || element.getAttribute('aria-disabled') === 'true';
    return isVisible && !isDisabled;
  }
  
  /**
   * Dispatches synthetic events to notify the web app of changes.
   * @param {HTMLElement} element - The target element.
   * @param {string[]} eventTypes - Array of event names to dispatch.
   */
  _dispatchEvents(element, eventTypes) {
    eventTypes.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
    });
  }

  /**
   * Inserts text into a contenteditable div, mimicking user input reliably for modern frameworks.
   * @param {HTMLElement} editorElement - The contenteditable editor.
   * @param {string} text - The text to insert.
   */
  async _insertTextIntoContentEditable(editorElement, text) {
    console.log(`[${this.platformId}] Starting robust text insertion for: "${text}"`);
    editorElement.focus();

    // Clear existing content
    editorElement.innerHTML = '';

    // Insert text line by line, creating <p> tags, which is common for these editors.
    // This mimics how the site's own framework builds the content.
    const lines = text.split('\n');
    lines.forEach((line) => {
      const p = document.createElement('p');
      if (line === '') {
        // For empty lines, editors often use <br> inside the paragraph
        p.appendChild(document.createElement('br'));
      } else {
        p.textContent = line;
      }
      editorElement.appendChild(p);
    });

    // Move the user's selection/cursor to the end of the newly inserted content.
    // This is a crucial step for the framework to recognize the new state.
    const range = document.createRange();
    const sel = window.getSelection();
    if (editorElement.lastChild) {
      range.setStartAfter(editorElement.lastChild);
    } else {
      range.setStart(editorElement, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // Dispatch the 'input' and 'change' events. The site's framework (React)
    // listens for these to update its internal state, which prevents it from
    // overwriting our changes.
    this._dispatchEvents(editorElement, ['input', 'change']);
    console.log(`[${this.platformId}] Text insertion process complete.`);
  }

  /**
   * Clicks a button.
   * @param {HTMLElement} buttonElement - The button to click.
   */
  async _clickSubmitButton(buttonElement) {
    console.log(`[${this.platformId}] Clicking submit button.`);
    buttonElement.click();
  }

  /**
   * The main automation process.
   * @param {string} companyName - The data to be entered.
   */
  async processAutomation(companyName) {
    console.log(`[${this.platformId}] Starting automation for: ${companyName}`);

    // 1. Find the editor
    const editor = await this._waitForElementState(this._getEditorSelectors(), (el) => !!el, 10000);
    if (!editor) {
      console.error(`[${this.platformId}] Could not find the editor element. Aborting.`);
      return;
    }
    console.log(`[${this.platformId}] Editor found.`);

    // 2. Insert the text
    await this._insertTextIntoContentEditable(editor, companyName);

    // 3. Find the submit button, even if it's initially disabled
    const submitButton = await this._waitForElementState(this._getSubmitButtonSelectors(), (el) => !!el, 5000);
    if (!submitButton) {
      console.error(`[${this.platformId}] Could not find the submit button element. Aborting.`);
      return;
    }
    console.log(`[${this.platformId}] Submit button found. Waiting for it to become enabled.`);

    // 4. Wait for the button to be enabled using a MutationObserver
    const enabledButton = await new Promise((resolve) => {
      // If button is already ready, resolve immediately.
      if (this._isButtonReady(submitButton)) {
        console.log(`[${this.platformId}] Submit button was already enabled.`);
        resolve(submitButton);
        return;
      }

      const observer = new MutationObserver((mutationsList, obs) => {
        if (this._isButtonReady(submitButton)) {
          console.log(`[${this.platformId}] Submit button is now enabled via MutationObserver.`);
          obs.disconnect();
          resolve(submitButton);
        }
      });

      observer.observe(submitButton, { attributes: true, attributeFilter: ['disabled', 'class', 'aria-disabled'] });

      // Failsafe timeout
      const waitTimeout = setTimeout(() => {
        observer.disconnect();
        // Final check before giving up
        if (this._isButtonReady(submitButton)) {
          resolve(submitButton);
        } else {
          resolve(null);
        }
      }, 5000);
    });

    if (!enabledButton) {
      console.error(`[${this.platformId}] Timeout: Submit button did not become enabled. Aborting.`);
      return;
    }

    await this._clickSubmitButton(enabledButton);
    console.log(`[${this.platformId}] Automation process complete.`);
  }
}
