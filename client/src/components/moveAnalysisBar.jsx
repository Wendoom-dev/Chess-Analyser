export default function MoveAnalysisBar({ moveIndex, moves, analysis, commentaries, analysisLoading, analysisError }) {
  console.log("Bar moveIndex:", moveIndex);
  
  const currentMove = moves[moveIndex - 1];
  const moveNumber = Math.floor((moveIndex - 1) / 2) + 1;
  const isWhite = (moveIndex - 1) % 2 === 0;
  
  // Get the analysis for the current position
  const currentAnalysis = analysis[moveIndex];
  
  // Get the commentary for the current position
  const currentCommentary = commentaries?.find(c => c.plyNumber === moveIndex);

  return (
    <div className="h-full border-l border-[#3a342e] p-4 flex flex-col gap-6">
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4 text-center">Move Analysis</h2>
        
        <div className="text-sm leading-relaxed text-[#d6bfa6] border rounded-lg p-4 flex-1 overflow-y-auto bg-[#2a2622]">
          {moveIndex === 0 ? (
            <>
              <p className="mb-3">Starting position of the game.</p>
              <p className="text-xs text-[#a89984]">Press Play or Next to begin.</p>
              
              {analysisLoading && (
                <div className="mt-4 p-3 bg-[#1e1b18] rounded border border-[#3a342e]">
                  <p className="text-xs text-[#a89984] mb-2">🔄 Analyzing with Stockfish...</p>
                  <p className="text-xs">This may take 30-60 seconds.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 pb-3 border-b border-[#3a342e]">
                <p className="text-xs text-[#a89984] mb-1">Current Move</p>
                <p className="text-lg font-semibold text-[#e6c07b]">
                  {moveNumber}. {isWhite ? currentMove : `... ${currentMove}`}
                </p>
              </div>
              
              <div className="space-y-4">
                <p><strong>Move {moveIndex}</strong> of {moves.length}</p>
                
                {/* AI COMMENTARY SECTION - NEW! */}
                {currentCommentary && !currentCommentary.error && (
                  <div className="p-3 bg-[#1e1b18] rounded border border-[#e6c07b]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-[#e6c07b] font-semibold">🤖 AI Commentary</p>
                      {currentCommentary.provider && (
                        <span className="text-[10px] text-[#a89984] bg-[#2a2622] px-2 py-0.5 rounded">
                          {currentCommentary.provider}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#d6bfa6] leading-relaxed italic">
                      {currentCommentary.commentary.replace(/^["']|["']$/g, '')}
                    </p>
                  </div>
                )}
                
                {currentCommentary?.error && (
                  <div className="p-3 bg-[#1e1b18] rounded border border-red-400/30">
                    <p className="text-xs text-red-400 mb-1">⚠️ Commentary unavailable</p>
                    <p className="text-xs text-[#a89984]">Rate limit reached</p>
                  </div>
                )}
                
                {/* ENGINE ANALYSIS SECTION */}
                <div className="p-3 bg-[#1e1b18] rounded border border-[#3a342e]">
                  <p className="text-xs text-[#a89984] mb-2">Engine Analysis</p>
                  
                  {analysisLoading ? (
                    <div className="space-y-2">
                      <p className="text-sm">🔄 Analyzing with Stockfish...</p>
                      <p className="text-xs text-[#a89984]">This may take 30-60 seconds.</p>
                    </div>
                  ) : analysisError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-red-400">❌ Analysis failed</p>
                      <p className="text-xs text-[#a89984]">{analysisError}</p>
                    </div>
                  ) : currentAnalysis ? (
                    <div className="space-y-3">
                      {/* Evaluation */}
                      <div>
                        <p className="text-xs text-[#a89984] mb-1">Evaluation</p>
                        <p className="text-lg font-semibold text-[#e6c07b]">
                          {currentAnalysis.evaluationText}
                        </p>
                      </div>

                      {/* Played Move */}
                      {currentAnalysis.playedMove && (
                        <div>
                          <p className="text-xs text-[#a89984] mb-1">Played Move</p>
                          <p className="text-sm font-mono">{currentAnalysis.playedMove}</p>
                        </div>
                      )}

                      {/* Best Move */}
                      <div>
                        <p className="text-xs text-[#a89984] mb-1">Engine Best Move</p>
                        <p className="text-sm font-mono text-green-400">
                          {currentAnalysis.engineBestMove}
                        </p>
                      </div>

                      {/* Position Info */}
                      <div className="pt-2 border-t border-[#3a342e] text-xs text-[#a89984]">
                        <p>Position: {currentAnalysis.plyNumber + 1}</p>
                        <p>Turn: {currentAnalysis.isWhiteMove ? "White" : "Black"}</p>
                      </div>

                      {/* Raw Data (for debugging - can remove later) */}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-[#a89984] hover:text-[#e6c07b]">
                          View raw data
                        </summary>
                        <pre className="mt-2 p-2 bg-[#1e1b18] rounded overflow-x-auto text-[10px]">
                          {JSON.stringify(currentAnalysis, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-sm text-[#a89984]">
                      No analysis available for this position.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}