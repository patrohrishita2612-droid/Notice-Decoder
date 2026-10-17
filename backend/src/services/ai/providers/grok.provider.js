/**
 * xAI Grok Provider Implementation
 * Uses native fetch (Node 18+) against xAI's OpenAI-compatible completions endpoint.
 */

const { SYSTEM_INSTRUCTION, buildNoticePrompt } = require('../prompt');

class GrokProvider {
  /**
   * @param {Object} config
   * @param {string} [config.apiKey]
   * @param {string} [config.modelName]
   * @param {string} [config.apiUrl]
   */
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.GROK_API_KEY || '';
    this.modelName = config.modelName || process.env.GROK_MODEL || 'grok-beta';
    this.apiUrl = config.apiUrl || 'https://api.x.ai/v1/chat/completions';

    if (!this.apiKey) {
      throw new Error(
        'GrokProvider requires a valid API key. Set GROK_API_KEY in backend/.env.'
      );
    }
  }

  /**
   * Call Grok to extract structured notice details
   * @param {string} cleanNoticeText
   * @param {Object} [options]
   * @returns {Promise<string>} Raw model response string
   */
  async processNoticeText(cleanNoticeText, options = {}) {
    const prompt = buildNoticePrompt(cleanNoticeText);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.modelName || this.modelName,
          temperature: 0.1,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 401) {
          const err = new Error('Grok API authentication failed: Invalid GROK_API_KEY.');
          err.status = 401;
          throw err;
        }
        if (response.status === 429) {
          const err = new Error('Grok API rate limit exceeded.');
          err.status = 429;
          throw err;
        }
        const err = new Error(`Grok API error HTTP ${response.status}: ${errText}`);
        err.status = 502;
        throw err;
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        const err = new Error('Grok returned an empty response body.');
        err.status = 502;
        throw err;
      }
      return content;
    } catch (error) {
      if (error.status) throw error;
      const err = new Error(`Grok network connection failed: ${error.message}`);
      err.status = 502;
      throw err;
    }
  }
}

module.exports = {
  GrokProvider
};
