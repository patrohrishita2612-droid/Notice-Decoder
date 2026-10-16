const { createClient } = require('@supabase/supabase-js');
const { env, isSupabaseConfigured } = require('./env');

// Initialize the Supabase client if credentials are provided in .env
let supabase = null;

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
    console.log('✅ Supabase client initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
  }
} else {
  console.warn(
    '⚠️ Supabase credentials are not yet configured in .env. Add SUPABASE_URL and SUPABASE_KEY to enable database operations.'
  );
}

/**
 * Returns the active Supabase client or throws a clear error if not yet configured.
 */
function getSupabaseClient() {
  if (!supabase) {
    // If user filled in .env while server was already running, try re-initializing
    if (env.SUPABASE_URL && env.SUPABASE_KEY) {
      supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
      return supabase;
    }
    throw new Error(
      'Database configuration missing. Please add SUPABASE_URL and SUPABASE_KEY to your backend .env file.'
    );
  }
  return supabase;
}

module.exports = {
  supabase,
  getSupabaseClient
};
