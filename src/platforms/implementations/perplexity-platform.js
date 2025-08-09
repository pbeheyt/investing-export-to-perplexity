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
}
