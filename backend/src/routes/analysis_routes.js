const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis_controller');

// POST /api/analysis/analyze - Analyze a chess game from PGN (fast, no engine)
router.post('/analyze', analysisController.analyzeGame);

// POST /api/analysis/analyze-with-engine - Analyze with Stockfish engine (slower, detailed)
router.post('/analyze-with-engine', analysisController.analyzeGameWithEngine);

module.exports = router;