const { spawn } = require('child_process');
const path = require('path');

/**
 * Analyze a chess position using Stockfish.
 * @param {string} fen - FEN string of the position.
 * @param {number} depth - Search depth.
 * @returns {Promise<{bestMove: string, evaluation: number}>}
 */
function analyzePosition(fen, depth = 15) {
  return new Promise((resolve, reject) => {
    const enginePath = getEnginePath();
    const engine = spawn(enginePath);

    let bestMove = null;
    let evaluation = 0;

    const timeout = setTimeout(() => {
      engine.kill();
      reject(new Error("Engine analysis timed out."));
    }, 30000);

    engine.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");

      for (const line of lines) {
        // Centipawn evaluation
        if (line.includes("score cp")) {
          const match = line.match(/score cp (-?\d+)/);
          if (match) {
            evaluation = parseInt(match[1], 10) / 100;
          }
        }

        // Mate evaluation
        if (line.includes("score mate")) {
          const match = line.match(/score mate (-?\d+)/);
          if (match) {
            const mate = parseInt(match[1], 10);
            evaluation = mate > 0 ? 100 : -100;
          }
        }

        // Best move received
        if (line.startsWith("bestmove")) {
          clearTimeout(timeout);

          bestMove = line.split(" ")[1];

          engine.stdin.write("quit\n");

          resolve({
            bestMove,
            evaluation,
          });
        }
      }
    });

    engine.stderr.on("data", (data) => {
      console.error("Stockfish:", data.toString());
    });

    engine.on("error", (err) => {
      clearTimeout(timeout);

      if (err.code === "ENOENT") {
        reject(
          new Error(
            `Stockfish executable not found.\nExpected: ${enginePath}\nMake sure Stockfish is installed and available.`
          )
        );
      } else {
        reject(err);
      }
    });

    engine.on("close", (code) => {
      if (code !== 0 && bestMove === null) {
        clearTimeout(timeout);
        reject(new Error(`Stockfish exited with code ${code}`));
      }
    });

    try {
      engine.stdin.write("uci\n");
      engine.stdin.write("isready\n");
      engine.stdin.write(`position fen ${fen}\n`);
      engine.stdin.write(`go depth ${depth}\n`);
    } catch (err) {
      clearTimeout(timeout);
      engine.kill();
      reject(err);
    }
  });
}

/**
 * Returns the Stockfish executable path for the current platform.
 */
function getEnginePath() {
  switch (process.platform) {
    case "win32":
      // Bundled Windows executable
      return path.join(
        __dirname,
        "stockfish-windows-x86-64-avx2.exe"
      );

    case "darwin":
      // Homebrew installation (Apple Silicon & Intel)
      return "stockfish";

    case "linux":
      // System installation
      return "stockfish";

    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

module.exports = {
  analyzePosition,
};