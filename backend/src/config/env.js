const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  SUPABASE_URL: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '',
  SUPABASE_KEY: process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.trim() : '',
  GROK_API_KEY: process.env.GROK_API_KEY ? process.env.GROK_API_KEY.trim() : ''
};

/**
 * Check whether required Supabase credentials are present
 */
function isSupabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_KEY);
}

/**
 * Validate that required Supabase configuration is present.
 * Throws a descriptive error if missing so routes can return an appropriate message.
 */
function validateSupabaseConfig() {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error(
      'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY in your backend .env file.'
    );
  }
}

module.exports = {
  env,
  isSupabaseConfigured,
  validateSupabaseConfig
};
