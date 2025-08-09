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
}
