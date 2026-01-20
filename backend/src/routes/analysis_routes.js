const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis_controller');

// POST /api/analysis/analyze - Analyze a chess game from PGN
router.post('/analyze', analysisController.analyzeGame);

module.exports = router;