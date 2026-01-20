const chessService = require('../services/chess_service');

/**
 * Analyze a chess game from PGN
 * @route POST /api/analysis/analyze
 * @param {Object} req.body.pgn - The PGN string to analyze
 */

const analyzeGame = async (req, res) => {
  try {
    // Extract PGN from request body
    const { pgn } = req.body;

    // Validate that PGN exists
    if (!pgn) {
      return res.status(400).json({
        success: false,
        error: 'PGN is required',
        message: 'Please provide a PGN string in the request body'
      });
    }

    // Validate that PGN is a string
    if (typeof pgn !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid PGN format',
        message: 'PGN must be a string'
      });
    }

    // Call the chess service to process the PGN
    const result = await chessService.processPGN(pgn);

    // Send success response
    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error analyzing game:', error);

    // Send error response
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze game',
      message: 'An error occurred while processing the PGN'
    });
  }
};

module.exports = {
  analyzeGame
};