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
   * Inserts text into a contenteditable div, mimicking user input.
   * @param {HTMLElement} editorElement - The contenteditable editor.
   * @param {string} text - The text to insert.
   */
  async _insertTextIntoContentEditable(editorElement, text) {
    editorElement.focus();
    // Clear existing content if any
    editorElement.innerHTML = ''; 

    // Using execCommand is often more reliable for triggering the app's internal state updates.
    document.execCommand('insertText', false, text);

    // Dispatching events ensures frameworks like React detect the change.
    this._dispatchEvents(editorElement, ['input', 'change', 'blur', 'focus']);
    console.log(`[${this.platformId}] Text inserted and events dispatched.`);
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

    // 3. Find and click the submit button
    const submitButton = await this._waitForElementState(this._getSubmitButtonSelectors(), this._isButtonReady, 5000);
    if (!submitButton) {
      console.error(`[${this.platformId}] Could not find an enabled submit button. Aborting.`);
      return;
    }
    console.log(`[${this.platformId}] Submit button found and is ready.`);

    await this._clickSubmitButton(submitButton);
    console.log(`[${this.platformId}] Automation process complete.`);
  }
}
