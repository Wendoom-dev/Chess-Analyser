import { Chessboard } from "react-chessboard";

export default function Board({ moveIndex }) {

  console.log('Board moveIndex:', moveIndex);

  return (
    <div className="flex flex-1 items-center justify-center gap-4 p-4">
      
      {/* Vertical Eval Bar */}
      <div className="w-2 sm:w-3 h-full max-h-[760px] rounded-full bg-gradient-to-b from-white via-neutral-400 to-black" />

      {/* Chessboard */}
      <div className="flex-1 max-w-[760px]">
        <Chessboard
          boardWidth={Math.min(760, window.innerWidth * 0.6)}
          arePiecesDraggable={false}
        />
      </div>

    </div>
  );
}
