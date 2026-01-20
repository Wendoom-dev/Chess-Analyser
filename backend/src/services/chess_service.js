const { parse } = require('pgn-parser');
const { Chess } = require('chess.js');

/**
 * Process a PGN string and extract moves, FEN positions, and metadata
 * @param {string} pgnString - The PGN string to process
 * @returns {Object} - Object containing moves, fenPositions, and metadata
 */
const processPGN = (pgnString) => {
  try {
    // Parse the PGN string
    const parsed = parse(pgnString, { startRule: 'game' });
    
    if (!parsed || parsed.length === 0) {
      throw new Error('Failed to parse PGN - no valid game found');
    }

    const game = parsed[0];

    // Extract moves in SAN (Standard Algebraic Notation)
    const sanMoves = game.moves.map(moveObj => moveObj.move);

    // Create a new chess instance
    const chess = new Chess();

    // Generate FEN positions
    const fenPositions = [chess.fen()]; // Start with initial position

    // Apply each move and record the FEN
    sanMoves.forEach((move, index) => {
      const result = chess.move(move);
      
      if (!result) {
        throw new Error(`Invalid move at position ${index + 1}: ${move}`);
      }
      
      fenPositions.push(chess.fen());
    });

    // Extract metadata from PGN headers
    const metadata = {
      event: game.headers?.Event || 'Unknown Event',
      site: game.headers?.Site || 'Unknown Site',
      date: game.headers?.Date || 'Unknown Date',
      round: game.headers?.Round || '-',
      white: game.headers?.White || 'Unknown',
      black: game.headers?.Black || 'Unknown',
      result: game.headers?.Result || '*',
      whiteElo: game.headers?.WhiteElo || null,
      blackElo: game.headers?.BlackElo || null,
      timeControl: game.headers?.TimeControl || null,
      termination: game.headers?.Termination || null
    };

    // Return structured data
    return {
      moves: sanMoves,
      fenPositions: fenPositions,
      metadata: metadata,
      totalMoves: sanMoves.length,
      totalPositions: fenPositions.length
    };

  } catch (error) {
    // Re-throw with more context
    if (error.message.includes('Invalid move')) {
      throw error; // Already has good context
    }
    throw new Error(`Invalid PGN format: ${error.message}`);
  }
};

module.exports = {
  processPGN
};