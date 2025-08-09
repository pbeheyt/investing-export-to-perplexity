/**
 * Base class providing robust, reusable logic for interacting with web pages.
 * This version incorporates more advanced and reliable automation patterns.
 */
class BasePlatform {
  constructor(platformId) {
    this.platformId = platformId;
  }

  /**
   * Waits for an element to be found and meet a specific condition.
   * @param {string[]} selectors - Array of CSS selectors to try.
   * @param {function} conditionFn - An async or sync function that returns true if the element is in the desired state.
   * @param {number} [timeoutMs=5000] - Max time to wait.
   * @returns {Promise<{status: 'found'|'timeout', element: HTMLElement|null}>} An object with the status and the found element.
   * @protected
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
            resolve({ status: 'found', element });
            return;
          }
        }

        if (Date.now() - startTime > timeoutMs) {
          console.error(`[${this.platformId}] Timeout waiting for element with selectors: ${selectors.join(', ')}`);
          resolve({ status: 'timeout', element: null });
        } else {
          setTimeout(check, pollIntervalMs);
        }
      };
      check();
    });
  }

  /**
   * Checks if an element is visible.
   * @param {HTMLElement} element - The element to check.
   * @returns {boolean}
   * @protected
   */
  _isVisibleElement(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
  }

  /**
   * Checks if a button is enabled.
   * @param {HTMLElement} element - The element to check.
   * @returns {boolean}
   * @protected
   */
  _isButtonEnabled(element) {
    if (!element) return false;
    const isDisabled = element.disabled || element.getAttribute('aria-disabled') === 'true';
    return !isDisabled;
  }

  /**
   * Dispatches synthetic events to notify the web app of changes.
   * @param {HTMLElement} element - The target element.
   * @param {string[]} eventTypes - Array of event names to dispatch.
   * @protected
   */
  _dispatchEvents(element, eventTypes) {
    eventTypes.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
    });
  }

  /**
   * Inserts text into a contenteditable div using a more robust method that better simulates user input.
   * @param {HTMLElement} editorElement - The contenteditable editor.
   * @param {string} text - The text to insert.
   * @protected
   */
  async _insertTextIntoContentEditable(editorElement, text) {
    console.log(`[${this.platformId}] Starting robust text insertion for: "${text}"`);
    
    // 1. Focus the element. This is critical.
    editorElement.focus();
    
    // 2. Select all existing content in the editor to ensure it's replaced.
    const range = document.createRange();
    range.selectNodeContents(editorElement);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // 3. Use `document.execCommand` to insert text. This is much more reliable
    // for triggering the website's framework (e.g., React) to update its state.
    console.log(`[${this.platformId}] Using execCommand to insert text.`);
    document.execCommand('insertText', false, text);

    // 4. Dispatch events just in case. Sometimes frameworks need an extra push.
    this._dispatchEvents(editorElement, ['input', 'change', 'keyup']);

    console.log(`[${this.platformId}] Text insertion process complete.`);
  }

  /**
   * Inserts text into a standard textarea.
   * @param {HTMLElement} editorElement - The textarea element.
   * @param {string} text - The text to insert.
   * @protected
   */
  async _insertTextIntoTextarea(editorElement, text) {
    console.log(`[${this.platformId}] Inserting text into standard textarea.`);
    editorElement.focus();
    editorElement.value = text;
    this._dispatchEvents(editorElement, ['input', 'change']);
    console.log(`[${this.platformId}] Text insertion into textarea complete.`);
  }

  /**
   * Abstract method for subclasses to implement text insertion.
   * @param {HTMLElement} editorElement - The editor element.
   * @param {string} text - The text to insert.
   * @protected
   * @abstract
   */
  async _insertTextIntoEditor(editorElement, text) {
    throw new Error('_insertTextIntoEditor must be implemented by subclasses');
  }

  /**
   * Simulates a realistic click sequence.
   * @param {HTMLElement} buttonElement - The button to click.
   * @protected
   */
  async _simulateRealClick(buttonElement) {
    console.log(`[${this.platformId}] Simulating real click on button.`);
    buttonElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    buttonElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    buttonElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  /**
   * Clicks a submit button.
   * @param {HTMLElement} buttonElement - The button to click.
   * @protected
   */
  async _clickSubmitButton(buttonElement) {
    await this._simulateRealClick(buttonElement);
  }

  /**
   * Checks if the editor is empty. Must be implemented by subclasses.
   * @param {HTMLElement} editorElement - The editor element to check.
   * @returns {boolean}
   * @protected
   * @abstract
   */
  _isEditorEmpty(editorElement) {
    throw new Error('_isEditorEmpty must be implemented by subclasses');
  }

  /**
   * Verifies submission by polling to see if the editor becomes empty.
   * @returns {Promise<boolean>} True if verification passes.
   * @protected
   */
  async _verifySubmission() {
    console.log(`[${this.platformId}] Verifying submission by checking for empty editor.`);
    const pollInterval = 200;
    const maxWaitTime = 5000;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = async () => {
        const editorSelectors = this._getEditorSelectors();
        let editorElement = null;
        for (const selector of editorSelectors) {
          editorElement = document.querySelector(selector);
          if (editorElement) break;
        }

        if (!editorElement || this._isEditorEmpty(editorElement)) {
          console.log(`[${this.platformId}] Submission verification PASSED: Editor is empty or gone.`);
          resolve(true);
          return;
        }

        if (Date.now() - startTime > maxWaitTime) {
          console.error(`[${this.platformId}] Submission verification FAILED: Editor did not empty within timeout.`);
          resolve(false);
        } else {
          setTimeout(check, pollInterval);
        }
      };
      check();
    });
  }

  /**
   * The main automation process.
   * @param {string} companyName - The data to be entered.
   */
  async processAutomation(companyName) {
    console.log(`[${this.platformId}] Starting automation for: ${companyName}`);

    // 1. Find the editor
    const editorResult = await this._waitForElementState(this._getEditorSelectors(), (el) => this._isVisibleElement(el), 10000);
    if (editorResult.status !== 'found') {
      console.error(`[${this.platformId}] Could not find the editor element. Aborting.`);
      return;
    }
    const editor = editorResult.element;
    console.log(`[${this.platformId}] Editor found.`);

    // 2. Insert the text
    await this._insertTextIntoEditor(editor, companyName);

    // 3. Find and wait for the submit button to become ready
    const buttonResult = await this._waitForElementState(this._getSubmitButtonSelectors(), (el) => this._isButtonEnabled(el) && this._isVisibleElement(el), 5000);
    if (buttonResult.status !== 'found') {
      console.error(`[${this.platformId}] Submit button did not become enabled. Aborting.`);
      return;
    }
    const submitButton = buttonResult.element;
    console.log(`[${this.platformId}] Submit button is ready.`);

    // 4. Click the button
    await this._clickSubmitButton(submitButton);

    // 5. Verify submission
    await this._verifySubmission();
    
    console.log(`[${this.platformId}] Automation process complete.`);
  }
}
