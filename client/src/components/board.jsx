import { Chessboard } from "react-chessboard";

export default function Board({ moveIndex, fenPositions, onPrevious, onNext, onPlayPause, onReset, isPlaying }) {
  console.log("Board render - moveIndex:", moveIndex);
  console.log("Board render - Current FEN:", fenPositions[moveIndex]);

  // Get the current position
  const currentPosition = fenPositions[moveIndex];

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-1 items-center justify-center gap-4 p-4">
        {/* Vertical Eval Bar */}
        <div className="w-2 sm:w-3 h-full max-h-[760px] rounded-full bg-gradient-to-b from-white via-neutral-400 to-black" />

        {/* Chessboard - KEY FIX HERE */}
        <div className="flex-1 max-w-[760px]">
          {currentPosition ? (
            <Chessboard
              key={moveIndex} // CRITICAL: Force re-render on each move
              position={currentPosition}
              arePiecesDraggable={false}
              animationDuration={300}
              boardWidth={Math.min(760, window.innerWidth * 0.6)}
              customDarkSquareStyle={{ backgroundColor: '#b58863' }}
              customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[500px] text-gray-500">
              Loading game...
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 border-t border-[#3a342e] flex items-center justify-center gap-4 px-4">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-[#2a2622] hover:bg-[#3a342e] rounded transition-colors text-[#e6c07b]"
        >
          ⏮️ Reset
        </button>
        <button
          onClick={onPrevious}
          disabled={moveIndex === 0}
          className="px-4 py-2 bg-[#2a2622] hover:bg-[#3a342e] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#e6c07b]"
        >
          ◀️ Prev
        </button>
        <button
          onClick={onPlayPause}
          className="px-6 py-2 bg-[#e6c07b] text-[#1e1b18] hover:bg-[#d6bfa6] rounded font-semibold transition-colors"
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button
          onClick={onNext}
          disabled={moveIndex >= fenPositions.length - 1}
          className="px-4 py-2 bg-[#2a2622] hover:bg-[#3a342e] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#e6c07b]"
        >
          Next ▶️
        </button>
        
        {/* Move counter */}
        <div className="ml-4 text-sm text-[#a89984]">
          Move: {moveIndex} / {fenPositions.length - 1}
        </div>
      </div>
    </div>
  );
}