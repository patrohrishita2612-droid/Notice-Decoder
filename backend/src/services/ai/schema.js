/**
 * Standard Structured Notice Response Schema
 * Conforms to Member 1 requirements: 13 strict fields with consistent null/array defaults.
 */

const ALLOWED_URGENCY_VALUES = Object.freeze(['low', 'medium', 'high', 'unknown']);

const REQUIRED_SCHEMA_KEYS = Object.freeze([
  'title',
  'summary',
  'event_date',
  'start_time',
  'end_time',
  'venue',
  'deadline',
  'target_audience',
  'required_actions',
  'documents_required',
  'urgency',
  'missing_information',
  'evidence'
]);

/**
 * Creates a clean template for the structured response with exact null and empty array defaults.
 * @returns {Object}
 */
function createEmptyStructuredResponse() {
  return {
    title: null,
    summary: '',
    event_date: null,
    start_time: null,
    end_time: null,
    venue: null,
    deadline: null,
    target_audience: null,
    required_actions: [],
    documents_required: [],
    urgency: 'unknown',
    missing_information: [],
    evidence: []
  };
}

module.exports = {
  ALLOWED_URGENCY_VALUES,
  REQUIRED_SCHEMA_KEYS,
  createEmptyStructuredResponse
};
