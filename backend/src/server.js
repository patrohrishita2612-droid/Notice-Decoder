const express = require('express');
const cors = require('cors');
const { env, isSupabaseConfigured } = require('./config/env');

// Import routes
const noticeRoutes = require('./routes/notice.routes');
const eventRoutes = require('./routes/event.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================

// Enable CORS for local frontend development
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ==========================================
// Base Health Check Route
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Notice Decoder Backend is running!'
  });
});

// ==========================================
// API Routes
// ==========================================
app.use('/api/notices', noticeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);

// ==========================================
// 404 Route Not Found Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found.'
  });
});

// ==========================================
// Global Error Handler Middleware
// ==========================================
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error.'
  });
});

// ==========================================
// Start Server
// ==========================================
const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Notice Decoder Backend listening on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/`);
  console.log(`📡 Notice API:   http://localhost:${PORT}/api/notices`);
  console.log(`📅 Event API:    http://localhost:${PORT}/api/events`);
  console.log(`🔐 Auth API:     http://localhost:${PORT}/api/auth`);
  if (!isSupabaseConfigured()) {
    console.log(`⚠️  SUPABASE NOTICE: Configure SUPABASE_URL and SUPABASE_KEY in .env for live DB`);
  } else {
    console.log(`✅ Supabase configuration detected`);
  }
  console.log(`===============================================`);
});

module.exports = app;
