/**
 * AI Processing Service (Placeholder Interface for Member 1)
 *
 * NOTE FOR MEMBER 1:
 * This service receives unstructured notice text and extracts key details.
 * You can integrate your Grok API or other LLM here using the GROK_API_KEY from .env.
 * The output object fields directly map to the 'notices' table in Supabase.
 */

const { env } = require('../config/env');

/**
 * Basic heuristic / regex extractor to provide sensible default values
 * until Member 1 connects the real Grok AI model.
 *
 * @param {string} rawText - The unformatted notice text.
 * @returns {Promise<Object>} Extracted notice metadata.
 */
async function processNotice(rawText) {
  // If Member 1 configures Grok API, call it here.
  // For now, we use a simple rule-based fallback so Postman testing works immediately.

  // 1. Extract Date (e.g., "25 October 2026", "13 Nov 2026", "2026-10-25")
  const dateMatch = rawText.match(
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{4}-\d{2}-\d{2})\b/i
  );
  const date = dateMatch ? dateMatch[0] : 'To be announced';

  // 2. Extract Time (e.g., "10 AM", "10:00 AM", "11:30 AM to 1:00 PM")
  const timeMatch = rawText.match(
    /\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM)(?:\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM))?)\b/i
  );
  const time = timeMatch ? timeMatch[0] : 'Time not specified';

  // 3. Extract Venue (e.g., "Seminar Hall", "Room 204", "Auditorium")
  const venueMatch = rawText.match(
    /(?:in|at|venue:?)\s+([A-Za-z0-9\s—–-]+(?:Hall|Room|Auditorium|Lab|Block|Center|Campus)[A-Za-z0-9\s]*)/i
  );
  const venue = venueMatch ? venueMatch[1].trim() : 'Campus / TBA';

  // 4. Extract Target Audience (e.g., "second year students", "third-year students")
  const audienceMatch = rawText.match(
    /(?:for|all)\s+([A-Za-z0-9\s-]+\b(?:students|batch|faculty|year)\b[A-Za-z0-9\s-]*)/i
  );
  const target_audience = audienceMatch ? audienceMatch[1].trim() : 'All Students';

  // 5. Extract Required Action (e.g., "must attend", "submit practical records")
  const actionMatch = rawText.match(
    /(?:must|should|required to|kindly)\s+([^\.\n]+)/i
  );
  const required_action = actionMatch
    ? actionMatch[0].trim()
    : 'Review notice details and mark your calendar';

  // 6. Summary: first 150 chars or first sentence
  const firstSentence = rawText.split(/[\.\n]/)[0].trim();
  const summary = firstSentence.length > 20
    ? firstSentence
    : rawText.slice(0, 160).trim();

  return {
    summary: summary || 'Notice details extracted.',
    date,
    time,
    venue,
    target_audience,
    required_action
  };
}

module.exports = {
  processNotice
};
