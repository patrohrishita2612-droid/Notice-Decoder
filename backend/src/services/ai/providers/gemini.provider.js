/**
 * Google Gemini Provider Implementation
 * Uses the official @google/generative-ai SDK.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SYSTEM_INSTRUCTION, buildNoticePrompt } = require('../prompt');

class GeminiProvider {
  /**
   * @param {Object} config
   * @param {string} [config.apiKey]
   * @param {string} [config.modelName]
   */
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.modelName = config.modelName || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (!this.apiKey) {
      throw new Error(
        'GeminiProvider requires a valid API key. Set GEMINI_API_KEY in backend/.env.'
      );
    }

    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Call Gemini to extract structured notice details
   * @param {string} cleanNoticeText
   * @param {Object} [options]
   * @returns {Promise<string>} Raw model response string
   */
  async processNoticeText(cleanNoticeText, options = {}) {
    const model = this.client.getGenerativeModel({
      model: options.modelName || this.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.1, // low temperature for deterministic extraction
        responseMimeType: 'application/json'
      }
    });

    const prompt = buildNoticePrompt(cleanNoticeText);
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        const msg = error.message || String(error);

        if (msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('API key not valid')) {
          const err = new Error('Gemini API authentication failed: Invalid GEMINI_API_KEY.');
          err.status = 401;
          throw err;
        }

        // If transient 503 high demand or 429, retry with backoff
        if (
          (msg.includes('503') || msg.includes('high demand') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) &&
          attempt < maxAttempts
        ) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1500));
          continue;
        }

        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
          const err = new Error('Gemini API quota exceeded or rate limit reached. Please retry shortly.');
          err.status = 429;
          throw err;
        }

        const err = new Error(`Gemini AI service error: ${msg}`);
        err.status = 502;
        throw err;
      }
    }
  }
}

module.exports = {
  GeminiProvider
};
