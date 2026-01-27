const { spawn } = require('child_process');
const path = require('path');

/**
 * Analyze a chess position using Stockfish engine
 * @param {string} fen - The FEN position to analyze
 * @param {number} depth - Analysis depth (default: 15)
 * @returns {Promise<Object>} - Object containing bestMove and evaluation
 */
function analyzePosition(fen, depth = 15) {
  return new Promise((resolve, reject) => {
    // Determine the correct engine path based on OS
    const enginePath = getEnginePath();

    const engine = spawn(enginePath);

    let bestMove = null;
    let evaluation = null;
    let isReady = false;
    let timeout;

    // Set a timeout to prevent hanging
    timeout = setTimeout(() => {
      engine.kill();
      reject(new Error('Engine analysis timeout'));
    }, 30000); // 30 second timeout

    engine.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');

      for (const line of lines) {
        // Check if engine is ready
        if (line.includes('uciok')) {
          isReady = true;
        }

        // Extract centipawn evaluation
        if (line.includes('score cp')) {
          const match = line.match(/score cp (-?\d+)/);
          if (match) {
            evaluation = parseInt(match[1], 10) / 100;
          }
        }

        // Extract mate score
        if (line.includes('score mate')) {
          const mateMatch = line.match(/score mate (-?\d+)/);
          if (mateMatch) {
            const mateIn = parseInt(mateMatch[1], 10);
            // Represent mate as very high/low score
            evaluation = mateIn > 0 ? 100 : -100;
          }
        }

        // Get best move and finish
        if (line.startsWith('bestmove')) {
          clearTimeout(timeout);
          bestMove = line.split(' ')[1];
          
          engine.stdin.write('quit\n');
          
          // Give engine a moment to quit gracefully
          setTimeout(() => {
            if (!engine.killed) {
              engine.kill();
            }
          }, 100);
          
          resolve({ 
            bestMove, 
            evaluation: evaluation !== null ? evaluation : 0 
          });
        }
      }
    });

    engine.stderr.on('data', (err) => {
      console.error('Engine stderr:', err.toString());
    });

    engine.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start engine: ${error.message}`));
    });

    engine.on('close', (code) => {
      if (code !== 0 && code !== null && bestMove === null) {
        clearTimeout(timeout);
        reject(new Error(`Engine process exited with code ${code}`));
      }
    });

    // Send UCI commands
    try {
      engine.stdin.write('uci\n');
      engine.stdin.write('isready\n');
      engine.stdin.write(`position fen ${fen}\n`);
      engine.stdin.write(`go depth ${depth}\n`);
    } catch (error) {
      clearTimeout(timeout);
      engine.kill();
      reject(new Error(`Failed to communicate with engine: ${error.message}`));
    }
  });
}

/**
 * Get the correct Stockfish engine path based on the operating system
 * @returns {string} - Path to the Stockfish executable
 */
function getEnginePath() {
  const platform = process.platform;
  
  if (platform === 'win32') {
    // Windows - assumes extracted .exe file in same directory as engine_service.js
    return path.join(
      __dirname,
      'stockfish-windows-x86-64-avx2.exe'
    );
  } else if (platform === 'darwin') {
    // macOS
    return path.join(
      __dirname,
      'stockfish-mac'
    );
  } else {
    // Linux
    return path.join(
      __dirname,
      'stockfish-linux'
    );
  }
}

module.exports = { analyzePosition };