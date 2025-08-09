/**
 * Perplexity AI platform-specific implementation.
 * This script relies on BasePlatform being injected first.
 */
class PerplexityPlatform extends BasePlatform {
  constructor() {
    super('Perplexity');
  }

  /**
   * Provides CSS selectors for finding Perplexity's editor element.
   * @returns {string[]}
   */
  _getEditorSelectors() {
    return [
      '#ask-input', // The primary ID for the contenteditable div
      'textarea[placeholder*="Ask anything"]', // Fallback for a textarea
    ];
  }

  /**
   * Provides CSS selectors for finding Perplexity's submit button.
   * @returns {string[]}
   */
  _getSubmitButtonSelectors() {
    return [
      'button[data-testid="submit-button"]', // The primary selector
      'button[aria-label="Submit"]', // Fallback aria-label
    ];
  }

  /**
   * Inserts text into Perplexity's editor.
   * Since Perplexity uses a contenteditable div, we use the specific helper for that.
   * @param {HTMLElement} editorElement - The editor element.
   * @param {string} text - The text to insert.
   * @protected
   */
  async _insertTextIntoEditor(editorElement, text) {
    // Perplexity uses a contenteditable div, so we use the robust helper method from the base class.
    return super._insertTextIntoContentEditable(editorElement, text);
  }

  /**
   * Checks if the Perplexity editor is empty.
   * @param {HTMLElement} editorElement - The editor element to check.
   * @returns {boolean}
   * @protected
   */
  _isEditorEmpty(editorElement) {
    // Perplexity's editor is empty if its text content is empty and it might
    // contain a placeholder structure.
    const text = (editorElement.textContent || '').trim();
    if (text === '') {
      // Check if the editor only contains a placeholder paragraph
      const placeholder = editorElement.querySelector('p[class*="placeholder"]');
      if (placeholder && editorElement.children.length === 1) {
        return true;
      }
      // Or if its inner HTML is just a paragraph with a break
      if (editorElement.innerHTML.trim().toLowerCase() === '<p><br></p>') {
        return true;
      }
      return true; // If textContent is empty, consider it empty.
    }
    return false;
  }

  /**
   * Provides CSS selectors for finding the "Research" mode button.
   * @returns {string[]}
   */
  _getResearchModeButtonSelector() {
    return ['button[value="research"]'];
  }

  /**
   * Overridden automation process to include selecting "Research" mode.
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

    // 3. Find and select the "Research" mode button
    const researchButtonResult = await this._waitForElementState(this._getResearchModeButtonSelector(), (el) => this._isVisibleElement(el), 5000);
    if (researchButtonResult.status === 'found') {
      const researchButton = researchButtonResult.element;
      if (researchButton.getAttribute('data-state') === 'unchecked' || researchButton.getAttribute('aria-checked') === 'false') {
        console.log(`[${this.platformId}] "Research" mode is not active. Clicking to enable.`);
        await this._simulateRealClick(researchButton);
        // Wait a brief moment for the UI to potentially update after the click
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log(`[${this.platformId}] "Research" mode is already active.`);
      }
    } else {
      console.warn(`[${this.platformId}] Could not find the "Research" mode button. Continuing without it.`);
    }

    // 4. Find and wait for the submit button to become ready
    const buttonResult = await this._waitForElementState(this._getSubmitButtonSelectors(), (el) => this._isButtonEnabled(el) && this._isVisibleElement(el), 5000);
    if (buttonResult.status !== 'found') {
      console.error(`[${this.platformId}] Submit button did not become enabled. Aborting.`);
      return;
    }
    const submitButton = buttonResult.element;
    console.log(`[${this.platformId}] Submit button is ready.`);

    // 5. Click the button
    await this._clickSubmitButton(submitButton);

    // 6. Verify submission
    await this._verifySubmission();
    
    console.log(`[${this.platformId}] Automation process complete.`);
  }
}
