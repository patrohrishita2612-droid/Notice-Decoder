/**
 * Input & Output Validators for AI Notice Processing
 * Ensures strict conformity to the 13-field structured notice schema,
 * enforces non-hallucination verification on evidence quotes, and handles errors safely.
 */

const {
  ALLOWED_URGENCY_VALUES,
  REQUIRED_SCHEMA_KEYS,
  createEmptyStructuredResponse
} = require('./schema');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

class AIResponseError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AIResponseError';
    this.status = 502;
    this.details = details;
  }
}

/**
 * Validates input text from pasted content, PDFs, or image OCR.
 * Rejects empty, non-string, or meaningless inputs.
 *
 * @param {*} input - The input notice text
 * @returns {string} Clean, trimmed text
 * @throws {ValidationError} If input is invalid
 */
function validateNoticeInput(input) {
  if (input === null || input === undefined) {
    throw new ValidationError('Notice text is required.');
  }

  if (typeof input !== 'string') {
    throw new ValidationError('Notice text must be a string.');
  }

  const cleanText = input.trim();

  if (cleanText.length === 0) {
    throw new ValidationError('Notice text cannot be empty.');
  }

  // Meaningless, gibberish, or insufficient input check (e.g. "hiiii", single repeated words, < 3 words)
  const words = cleanText.split(/\s+/).filter(Boolean);
  const isRepetitiveGibberish = /^(.)\1+$/i.test(cleanText) || /^([a-z])\1{2,}$/i.test(cleanText) || /^(hi+|hello+|hey+|test+|asdf+|qwerty+)$/i.test(cleanText);

  if (cleanText.length < 15 || words.length < 3 || isRepetitiveGibberish) {
    throw new ValidationError('Not enough information to extract a notice. Please upload a valid notice or enter more details. Notice text is too short to be processed.');
  }

  return cleanText;
}

/**
 * Safely extracts a JSON object from an LLM response string.
 * Handles markdown code fences (```json ... ```) or conversational wrappers.
 *
 * @param {string|Object} rawResponse - Model raw output
 * @returns {Object} Parsed JSON object
 * @throws {AIResponseError} If JSON parsing fails
 */
function extractJsonFromResponse(rawResponse) {
  if (rawResponse && typeof rawResponse === 'object') {
    return rawResponse;
  }

  if (typeof rawResponse !== 'string') {
    throw new AIResponseError('AI provider returned an empty or invalid non-text response.');
  }

  let text = rawResponse.trim();

  if (text.length === 0) {
    throw new AIResponseError('AI provider returned an empty response.');
  }

  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  } else {
    // If enclosed inside markdown anywhere, find outermost JSON object
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1).trim();
    }
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    throw new AIResponseError(`Failed to parse AI response as valid JSON: ${parseError.message}`, {
      rawSnippet: text.slice(0, 300)
    });
  }
}

/**
 * Normalizes text to assist in fuzzy quotation matching (collapses whitespace, lowercases).
 * @param {string} str
 * @returns {string}
 */
function normalizeForComparison(str) {
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D"']/g, '') // strip smart & regular quotes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates and sanitizes scalar values (null if empty, "N/A", "none", or undefined).
 * @param {*} value
 * @returns {string|null}
 */
function sanitizeScalar(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    return String(value).trim() || null;
  }
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (
    trimmed === '' ||
    lower === 'null' ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'tbd' ||
    lower === 'tba' ||
    lower === 'to be announced' ||
    lower === 'unknown' ||
    lower === 'undefined'
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Normalizes array fields. Ensures return value is an array of non-empty strings.
 * @param {*} val
 * @returns {string[]}
 */
function sanitizeArray(val) {
  if (!val) {
    return [];
  }
  if (Array.isArray(val)) {
    return val
      .map(item => (item !== null && item !== undefined ? String(item).trim() : ''))
      .filter(item => item.length > 0);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return [];
}

/**
 * Validates and normalizes parsed AI response to ensure 100% schema conformity.
 * Also verifies evidence quotations against original notice text.
 *
 * @param {Object} rawData - Parsed JSON object from AI
 * @param {string} originalNoticeText - The source notice text
 * @returns {Object} Strictly conformant structured response
 */
function validateAndNormalizeAIResponse(rawData, originalNoticeText = '', options = {}) {
  if (!rawData || typeof rawData !== 'object') {
    throw new AIResponseError('Extracted AI data must be a JSON object.');
  }

  const result = createEmptyStructuredResponse();
  const normalizedOriginal = normalizeForComparison(originalNoticeText);

  // 1. Title
  result.title = sanitizeScalar(rawData.title);

  // If title was not provided by AI, infer from notice text if a clear event and subject are stated
  if (!result.title && originalNoticeText) {
    const eventMatch = originalNoticeText.match(
      /\b(?:attend|conduct(?:ing)?|organiz(?:ing|e)|announces?|schedule(?:d)?\s+for)\s+(?:a|an|the)\s+([A-Za-z0-9\s-]{0,40}?\b(?:workshop|seminar|conference|webinar|symposium|hackathon|examination|exam|test|lecture|drive|session))\b/i
    );
    if (eventMatch && eventMatch[1]) {
      const cleanEvent = eventMatch[1].trim();
      const capitalized = cleanEvent
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      if (result.target_audience && /(?:AI|Data Science|Computer Science|IT|Mechanical|Electrical|Civil)/i.test(result.target_audience)) {
        const deptMatch = result.target_audience.match(/(?:AI and Data Science|Computer Science|IT|Mechanical|Electrical|Civil)/i);
        result.title = deptMatch ? `${deptMatch[0]} ${capitalized}` : capitalized;
      } else {
        result.title = capitalized;
      }
    }
  }

  // 2. Summary (must be string, default empty)
  if (typeof rawData.summary === 'string') {
    result.summary = rawData.summary.trim();
  } else if (rawData.summary) {
    result.summary = String(rawData.summary).trim();
  } else {
    result.summary = '';
  }

  // 3. Dates and Times
  result.event_date = sanitizeScalar(rawData.event_date || rawData.date);
  result.start_time = sanitizeScalar(rawData.start_time || rawData.time);
  result.end_time = sanitizeScalar(rawData.end_time);

  // 4. Venue & Deadline
  result.venue = sanitizeScalar(rawData.venue);
  result.deadline = sanitizeScalar(rawData.deadline);

  // 5. Target Audience
  result.target_audience = sanitizeScalar(rawData.target_audience || rawData.audience);

  // 6. Arrays: required_actions, documents_required, missing_information
  result.required_actions = sanitizeArray(rawData.required_actions || rawData.required_action);
  result.documents_required = sanitizeArray(rawData.documents_required || rawData.documents);
  result.missing_information = sanitizeArray(rawData.missing_information);

  // 7. Urgency (strictly 'low' | 'medium' | 'high' | 'unknown')
  let rawUrgency = (rawData.urgency || '').toString().toLowerCase().trim();
  if (!ALLOWED_URGENCY_VALUES.includes(rawUrgency)) {
    rawUrgency = 'unknown';
  }

  // If urgency is 'unknown', evaluate whether sufficient information exists to determine urgency
  if (rawUrgency === 'unknown' && originalNoticeText) {
    const hasDeadline = Boolean(result.deadline);
    const hasEventDate = Boolean(result.event_date);
    const hasMandatoryLanguage = /(?:must\s+attend|mandatory|compulsory|strictly\s+required|strict\s+action|disciplinary)/i.test(
      originalNoticeText
    );
    const hasUrgentAction = result.required_actions.some(action =>
      /(?:must|mandatory|compulsory|deadline|urgent|immediately)/i.test(action)
    );

    if (hasMandatoryLanguage || (hasDeadline && hasUrgentAction)) {
      rawUrgency = 'high';
    } else if (hasDeadline || (hasEventDate && result.required_actions.length > 0)) {
      rawUrgency = 'medium';
    }
  }

  result.urgency = rawUrgency;

  // 8. Evidence Quotation Verification
  const candidateEvidence = sanitizeArray(rawData.evidence);
  const verifiedEvidence = [];
  const unverifiedQuotes = [];

  if (options.isDocument || !originalNoticeText) {
    result.evidence = candidateEvidence;
  } else {
    for (const quote of candidateEvidence) {
      const normalizedQuote = normalizeForComparison(quote);
      if (normalizedQuote.length === 0) continue;

      // Verify whether the quotation exists in the original notice text
      if (normalizedOriginal.includes(normalizedQuote)) {
        verifiedEvidence.push(quote);
      } else {
        unverifiedQuotes.push(quote);
      }
    }

    result.evidence = verifiedEvidence;

    // If evidence quotations failed verification against the text, track in missing_information
    if (unverifiedQuotes.length > 0) {
      result.missing_information.push(
        `Notice verification note: ${unverifiedQuotes.length} candidate quote(s) could not be verified in original text.`
      );
    }
  }

  // 9. Backwards compatibility for Member 2's Supabase schema
  // (maps to notices table columns: summary, date, time, venue, target_audience, required_action)
  result.date = result.event_date || null;
  result.time = result.start_time
    ? (result.end_time ? `${result.start_time} - ${result.end_time}` : result.start_time)
    : null;
  result.required_action = result.required_actions.length > 0
    ? result.required_actions.join('; ')
    : null;

  return result;
}

module.exports = {
  ValidationError,
  AIResponseError,
  validateNoticeInput,
  extractJsonFromResponse,
  validateAndNormalizeAIResponse
};
