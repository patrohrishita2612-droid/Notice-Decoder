const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  processNotice,
  resolveProvider,
  AIConfigError,
  AIResponseError,
  MockProvider
} = require('../src/services/ai.service');

const { env } = require('../src/config/env');

describe('Provider Errors & Configuration Tests', () => {
  it('should throw AIConfigError when no API keys are present in environment', () => {
    // Save original env values
    const origGemini = process.env.GEMINI_API_KEY;
    const origGrok = process.env.GROK_API_KEY;
    const origEnvGemini = env.GEMINI_API_KEY;
    const origEnvGrok = env.GROK_API_KEY;

    delete process.env.GEMINI_API_KEY;
    delete process.env.GROK_API_KEY;
    env.GEMINI_API_KEY = '';
    env.GROK_API_KEY = '';

    try {
      assert.throws(
        () => resolveProvider(),
        err => err instanceof AIConfigError && err.status === 503 && err.message.includes('No AI provider API key is configured')
      );
    } finally {
      // Restore
      if (origGemini !== undefined) process.env.GEMINI_API_KEY = origGemini;
      if (origGrok !== undefined) process.env.GROK_API_KEY = origGrok;
      env.GEMINI_API_KEY = origEnvGemini;
      env.GROK_API_KEY = origEnvGrok;
    }
  });

  it('should propagate provider network or rate-limit errors safely', async () => {
    const networkError = new Error('Connection timeout to AI gateway');
    networkError.status = 502;
    const mockProvider = new MockProvider({ error: networkError });

    await assert.rejects(
      async () => {
        await processNotice('College reopens on Monday after mid-term examinations.', {
          providerInstance: mockProvider
        });
      },
      err => err.message.includes('Connection timeout')
    );
  });

  it('should handle non-object / empty provider response safely', async () => {
    const mockProvider = new MockProvider({ response: '' });

    await assert.rejects(
      async () => {
        await processNotice('College reopens on Monday after mid-term examinations.', {
          providerInstance: mockProvider
        });
      },
      err => err instanceof AIResponseError
    );
  });
});
