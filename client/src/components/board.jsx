import { useEffect, useRef } from "react";
import { Chessground } from "chessground";

export default function Board({ moveIndex, fenPositions, onPrevious, onNext, onPlayPause, onReset, isPlaying }) {
  const boardRef = useRef(null);
  const chessgroundRef = useRef(null);

  // Initialize Chessground once on mount
  useEffect(() => {
    if (!boardRef.current) return;

    const config = {
      fen: fenPositions[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      viewOnly: true, // Pieces can't be dragged
      animation: {
        enabled: true,
        duration: 300
      },
      highlight: {
        lastMove: true,
        check: true
      },
      coordinates: true
    };

    chessgroundRef.current = Chessground(boardRef.current, config);

    console.log("Chessground initialized");

    // Cleanup on unmount
    return () => {
      if (chessgroundRef.current) {
        chessgroundRef.current.destroy();
      }
    };
  }, [fenPositions]);

  // Update position when moveIndex changes
  useEffect(() => {
    if (!chessgroundRef.current || !fenPositions[moveIndex]) return;

    console.log("Updating board to moveIndex:", moveIndex);
    console.log("New FEN:", fenPositions[moveIndex]);

    chessgroundRef.current.set({
      fen: fenPositions[moveIndex],
      lastMove: null // You can add last move highlighting later
    });
  }, [moveIndex, fenPositions]);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-1 items-center justify-center gap-4 p-4">
        {/* Vertical Eval Bar */}
        <div className="w-2 sm:w-3 h-full max-h-[760px] rounded-full bg-gradient-to-b from-white via-neutral-400 to-black" />

        {/* Chessground Container */}
        <div className="flex-1 max-w-[760px] flex items-center justify-center">
          <div 
            ref={boardRef}
            style={{
              width: '600px',
              height: '600px'
            }}
            className="cg-wrap"
          />
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