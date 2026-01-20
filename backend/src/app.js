const express = require('express');
const cors = require('cors');
const analysisRoutes = require('./routes/analysis_routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - API information
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chess Analyzer API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      analyze: 'POST /api/analysis/analyze'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/analysis', analysisRoutes);

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;