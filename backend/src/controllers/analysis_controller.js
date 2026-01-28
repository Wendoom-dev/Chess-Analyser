const chessService = require('../services/chess_service');
const engineService = require('../services/engine_service');
const fetch = require('node-fetch');

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

/**
 * Analyze a chess game with Stockfish engine and AI commentary
 * @route POST /api/analysis/analyze-with-engine
 * @param {Object} req.body.pgn - The PGN string to analyze
 * @param {Number} req.body.depth - Engine analysis depth (optional, default: 15)
 */
const analyzeGameWithEngine = async (req, res) => {
  try {
    const { pgn, depth = 15 } = req.body;

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

    // First, process the PGN to get moves and FEN positions
    const gameData = await chessService.processPGN(pgn);

    console.log(`\n📊 Analyzing ${gameData.totalPositions} positions with Stockfish at depth ${depth}...`);

    // Analyze each position with Stockfish
    const positionAnalyses = [];
    
    for (let i = 0; i < gameData.fenPositions.length; i++) {
      const fen = gameData.fenPositions[i];
      const moveNumber = Math.floor(i / 2) + 1;
      const isWhiteMove = i % 2 === 0;
      
      console.log(`  Analyzing position ${i + 1}/${gameData.fenPositions.length}...`);
      
      try {
        const analysis = await engineService.analyzePosition(fen, depth);
        
        positionAnalyses.push({
          moveNumber,
          plyNumber: i,
          isWhiteMove,
          fen,
          playedMove: i > 0 ? gameData.moves[i - 1] : null,
          engineBestMove: analysis.bestMove,
          evaluation: analysis.evaluation,
          evaluationText: formatEvaluation(analysis.evaluation)
        });
      } catch (error) {
        console.error(`  ✗ Error analyzing position ${i}:`, error);
        positionAnalyses.push({
          moveNumber,
          plyNumber: i,
          isWhiteMove,
          fen,
          playedMove: i > 0 ? gameData.moves[i - 1] : null,
          error: 'Analysis failed'
        });
      }
    }

    console.log(`✅ Stockfish analysis complete!\n`);

    // Calculate accuracy and blunders
    const stats = calculateGameStats(positionAnalyses);

    // Generate AI commentary
    console.log('🤖 Generating AI commentary...');
    let commentaries = [];
    let commentaryError = null;
    
    try {
      const commentaryResponse = await fetch('http://localhost:5001/generate-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: positionAnalyses }),
        timeout: 120000 // 2 minute timeout
      });

      if (commentaryResponse.ok) {
        const commentaryData = await commentaryResponse.json();
        commentaries = commentaryData.commentaries || [];
        console.log(`✅ Generated ${commentaries.length} commentaries\n`);
      } else {
        const errorText = await commentaryResponse.text();
        console.warn(`⚠️  Commentary API returned error: ${commentaryResponse.status}`);
        commentaryError = `Commentary service error: ${commentaryResponse.status}`;
      }
    } catch (error) {
      console.warn(`⚠️  Could not connect to commentary service: ${error.message}`);
      console.warn('   Continuing without AI commentary...\n');
      commentaryError = `Commentary service unavailable: ${error.message}`;
    }

    // Send complete analysis
    return res.status(200).json({
      success: true,
      data: {
        metadata: gameData.metadata,
        moves: gameData.moves,
        totalMoves: gameData.totalMoves,
        analysis: positionAnalyses,
        commentaries: commentaries,
        statistics: stats,
        commentaryStatus: commentaryError ? 'failed' : 'success',
        commentaryError: commentaryError
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing game with engine:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze game with engine',
      message: 'An error occurred while processing the game with Stockfish'
    });
  }
};

/**
 * Format evaluation score as human-readable text
 */
function formatEvaluation(evaluation) {
  if (evaluation === null || evaluation === undefined) return 'Unknown';
  
  if (Math.abs(evaluation) >= 100) {
    const mateIn = evaluation > 0 ? 'White mates' : 'Black mates';
    return mateIn;
  }
  
  if (evaluation > 0) {
    return `+${evaluation.toFixed(2)} (White advantage)`;
  } else if (evaluation < 0) {
    return `${evaluation.toFixed(2)} (Black advantage)`;
  } else {
    return '0.00 (Equal)';
  }
}

/**
 * Calculate game statistics from position analyses
 */
function calculateGameStats(analyses) {
  let whiteBlunders = 0;
  let blackBlunders = 0;
  let whiteMistakes = 0;
  let blackMistakes = 0;
  
  for (let i = 1; i < analyses.length - 1; i++) {
    const current = analyses[i];
    const next = analyses[i + 1];
    
    if (!current.evaluation || !next.evaluation) continue;
    
    // Calculate evaluation drop
    const evalDrop = current.isWhiteMove 
      ? current.evaluation - next.evaluation
      : next.evaluation - current.evaluation;
    
    // Classify moves
    if (evalDrop > 3) {
      if (current.isWhiteMove) whiteBlunders++;
      else blackBlunders++;
    } else if (evalDrop > 1.5) {
      if (current.isWhiteMove) whiteMistakes++;
      else blackMistakes++;
    }
  }
  
  return {
    white: {
      blunders: whiteBlunders,
      mistakes: whiteMistakes
    },
    black: {
      blunders: blackBlunders,
      mistakes: blackMistakes
    }
  };
}

module.exports = {
  analyzeGame,
  analyzeGameWithEngine
};