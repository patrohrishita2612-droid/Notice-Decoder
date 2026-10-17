/**
 * AI Provider Factory & Manager
 * Discovers and instantiates the configured AI provider (Gemini by default, or Grok).
 * Enforces that missing credentials return a descriptive configuration error
 * rather than fabricating artificial AI output.
 */

const { env } = require('../../../config/env');
const { GeminiProvider } = require('./gemini.provider');
const { GrokProvider } = require('./grok.provider');
const { MockProvider } = require('./mock.provider');

class AIConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIConfigError';
    this.status = 503; // Service Unavailable
  }
}

/**
 * Creates and returns the active AI provider based on environment configuration or options.
 *
 * @param {Object} [options]
 * @param {Object} [options.providerInstance] - Explicit provider instance (used in tests)
 * @param {string} [options.providerName] - 'gemini' | 'grok' | 'mock'
 * @returns {GeminiProvider|GrokProvider|MockProvider}
 */
function resolveProvider(options = {}) {
  // If an explicit provider instance is passed in (e.g. for testing), return it
  if (options.providerInstance) {
    return options.providerInstance;
  }

  const requestedName = (options.providerName || '').toLowerCase();

  // 1. Check Gemini
  const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (requestedName === 'gemini' || (!requestedName && geminiKey)) {
    if (!geminiKey) {
      throw new AIConfigError(
        'Google Gemini API key is missing. Please set GEMINI_API_KEY in your backend/.env file.'
      );
    }
    return new GeminiProvider({ apiKey: geminiKey });
  }

  // 2. Check Grok
  const grokKey = process.env.GROK_API_KEY || env.GROK_API_KEY;
  if (requestedName === 'grok' || (!requestedName && grokKey)) {
    if (!grokKey) {
      throw new AIConfigError(
        'Grok API key is missing. Please set GROK_API_KEY in your backend/.env file.'
      );
    }
    return new GrokProvider({ apiKey: grokKey });
  }

  // 3. Neither key is configured
  throw new AIConfigError(
    'No AI provider API key is configured. Please configure GEMINI_API_KEY (recommended) or GROK_API_KEY in backend/.env to enable live AI notice processing.'
  );
}

module.exports = {
  AIConfigError,
  resolveProvider,
  GeminiProvider,
  GrokProvider,
  MockProvider
};
