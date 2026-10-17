/**
 * AI Processing Service (Member 1 - Notice Processing & Intelligence)
 *
 * Connects official AI providers (Google Gemini default / xAI Grok fallback)
 * to process unstructured academic notices from pasted text, PDFs, or images.
 * Enforces strict grounding, student-friendly summarization, and exact schema validation.
 */

const {
  validateNoticeInput,
  extractJsonFromResponse,
  validateAndNormalizeAIResponse,
  ValidationError,
  AIResponseError
} = require('./ai/validator');

const {
  createEmptyStructuredResponse,
  ALLOWED_URGENCY_VALUES,
  REQUIRED_SCHEMA_KEYS
} = require('./ai/schema');

const {
  SYSTEM_INSTRUCTION,
  buildNoticePrompt
} = require('./ai/prompt');

const {
  resolveProvider,
  AIConfigError,
  GeminiProvider,
  GrokProvider,
  MockProvider
} = require('./ai/providers');

/**
 * Main AI Notice Processor
 * Accepts raw notice text, validates input, queries configured AI model,
 * parses and normalizes the response, and verifies evidence quotations.
 *
 * @param {string} rawText - Raw notice text
 * @param {Object} [options] - Optional configurations (e.g. { providerInstance, modelName })
 * @returns {Promise<Object>} Strictly validated 13-field structured notice object
 */
async function processNotice(rawText, options = {}) {
  // 1. Validate notice input text
  const cleanText = validateNoticeInput(rawText);

  // 2. Discover and resolve active AI provider (throws AIConfigError if no key configured)
  const provider = resolveProvider(options);

  // 3. Request LLM completion
  const rawModelResponse = await provider.processNoticeText(cleanText, options);

  // 4. Extract and parse JSON
  const parsedData = extractJsonFromResponse(rawModelResponse);

  // 5. Enforce 13-field schema, normalize nulls/arrays, and verify evidence quotations
  const validatedNotice = validateAndNormalizeAIResponse(parsedData, cleanText);

  return validatedNotice;
}

/**
 * Main AI Notice File Processor (PDF, JPG, PNG)
 * Accepts a file buffer, mimeType, and optional user notes.
 * Sends multimodal payload to GeminiProvider (or MockProvider for tests).
 *
 * @param {Buffer} fileBuffer - Raw buffer of uploaded document or image
 * @param {string} mimeType - 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/jpg'
 * @param {string} [extraText] - Optional typed notice text or commentary
 * @param {Object} [options] - Optional configurations (e.g. { providerInstance, modelName })
 * @returns {Promise<Object>} Strictly validated 13-field structured notice object
 */
async function processNoticeFile(fileBuffer, mimeType, extraText = '', options = {}) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    const error = new Error('Invalid or empty file buffer provided.');
    error.status = 400;
    throw error;
  }

  const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validMimes.includes(mimeType)) {
    const error = new Error(`Unsupported file type '${mimeType}'. Only PDF (.pdf) and images (.jpg, .jpeg, .png) are permitted.`);
    error.status = 400;
    throw error;
  }

  const provider = resolveProvider(options);

  let rawModelResponse;
  if (typeof provider.processNoticeDocument === 'function') {
    rawModelResponse = await provider.processNoticeDocument(fileBuffer, mimeType, extraText, options);
  } else if (extraText && typeof provider.processNoticeText === 'function') {
    rawModelResponse = await provider.processNoticeText(extraText, options);
  } else {
    const error = new Error('Active AI provider does not support multimodal document decoding.');
    error.status = 501;
    throw error;
  }

  const parsedData = extractJsonFromResponse(rawModelResponse);
  const validatedNotice = validateAndNormalizeAIResponse(parsedData, extraText, { isDocument: true });

  return validatedNotice;
}

module.exports = {
  processNotice,
  processNoticeFile,
  validateNoticeInput,
  extractJsonFromResponse,
  validateAndNormalizeAIResponse,
  createEmptyStructuredResponse,
  buildNoticePrompt,
  SYSTEM_INSTRUCTION,
  resolveProvider,
  ALLOWED_URGENCY_VALUES,
  REQUIRED_SCHEMA_KEYS,
  ValidationError,
  AIResponseError,
  AIConfigError,
  GeminiProvider,
  GrokProvider,
  MockProvider
};
