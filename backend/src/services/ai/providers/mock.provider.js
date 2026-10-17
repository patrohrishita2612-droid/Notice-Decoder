/**
 * Mock AI Provider for deterministic unit & integration tests
 */

class MockProvider {
  /**
   * @param {Object} options
   * @param {string|Object|Function} [options.response]
   * @param {Error} [options.error]
   */
  constructor(options = {}) {
    this.response = options.response;
    this.error = options.error;
    this.callCount = 0;
    this.lastInput = null;
  }

  setResponse(response) {
    this.response = response;
    this.error = null;
  }

  setError(error) {
    this.error = error;
    this.response = null;
  }

  async processNoticeText(cleanNoticeText) {
    this.callCount++;
    this.lastInput = cleanNoticeText;

    if (this.error) {
      throw this.error;
    }

    if (typeof this.response === 'function') {
      return this.response(cleanNoticeText);
    }

    if (this.response !== undefined && this.response !== null) {
      if (typeof this.response === 'object') {
        return JSON.stringify(this.response);
      }
      return this.response;
    }

    return '{}';
  }

  async processNoticeDocument(fileBuffer, mimeType, extraText = '') {
    this.callCount++;
    this.lastInput = { fileBuffer, mimeType, extraText };

    if (this.error) {
      throw this.error;
    }

    if (typeof this.response === 'function') {
      return this.response(fileBuffer, mimeType, extraText);
    }

    if (this.response !== undefined && this.response !== null) {
      if (typeof this.response === 'object') {
        return JSON.stringify(this.response);
      }
      return this.response;
    }

    return '{}';
  }
}

module.exports = {
  MockProvider
};
