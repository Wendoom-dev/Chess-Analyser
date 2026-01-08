import { Chessboard } from "react-chessboard";

export default function Board() {
  return (
    <div className="flex flex-1 items-center justify-center gap-4 p-6">
      
      {/* Vertical Eval Bar */}
      <div className="w-3 h-[760px] rounded-full bg-gradient-to-b from-white via-neutral-400 to-black" />

      {/* Chessboard */}
      <div className="w-[760px]">
        <Chessboard
          boardWidth={760} // ensures the chessboard fits the container
          arePiecesDraggable={false} // view-only for now
        />
      </div>

    </div>
  );
}
