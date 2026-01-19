import { useEffect, useState } from "react";
import Navbar from "./components/navBar.jsx";
import MoveAnalysisBar from "./components/moveAnalysisBar.jsx";
import Board from "./components/board.jsx";
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

import { parse } from "pgn-parser";         
import { Chess } from "chess.js";

const PGN = `
[Event "Live Chess"]
[Site "Chess.com"]
[Date "2025.12.08"]
[Round "-"]
[White "vuk128"]
[Black "wendoom"]
[Result "0-1"]
[WhiteElo "493"]
[BlackElo "530"]
[TimeControl "60"]
[EndTime "16:33:30 GMT+0000"]
[Termination "wendoom won on time"]

1. e4 e5 2. Nf3 Bc5 3. Nc3 Nf6 4. d4 exd4 5. Nxd4 Bb6 6. Nf5 O-O 7. Qg4 g6 8. Nd5 Nxd5
9. Qg5 Qxg5 10. Bxg5 d6 11. exd5 Bxf5 12. Bf6 Na6 13. Rd1 Nc5 14. Rd4 Bxc2 15. Rh4 h5
16. Bc4 Rae8+ 17. Kd2 Bf5 18. Re1 Rxe1 19. Kxe1 Nd3+ 20. Kd2 Nxb2 21. Kc3 Nxc4
22. Kxc4 c5 23. Kb5 Bd8 0-1
`;

export default function App() {
  const [fenPositions, setFenPositions] = useState([]);
  const [moves, setMoves] = useState([]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);


  useEffect(() => {
    try {
      const [parsed] = parse(PGN, { startRule: "game" });
      const sanMoves = parsed.moves.map((m) => m.move);
      setMoves(sanMoves);

      const temp = new Chess();
      const fens = [temp.fen()];
      sanMoves.forEach((san) => {
        temp.move(san);
        fens.push(temp.fen());
      });
      setFenPositions(fens);
      
      console.log("Parsed moves:", sanMoves);
      console.log("Generated FENs:", fens);
    } catch (err) {
      console.error("Failed to parse PGN:", err);
    }
  }, []);


  useEffect(() => {
    if (!isPlaying || fenPositions.length === 0) return;

    const interval = setInterval(() => {
      setMoveIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex < fenPositions.length) {
          console.log("Auto-advancing to move", nextIndex);
          return nextIndex;
        }
        setIsPlaying(false);
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, fenPositions.length]);

  const handlePrevious = () => {
    setMoveIndex(prev => {
      const newIndex = Math.max(0, prev - 1);
      console.log("Previous clicked, new index:", newIndex);
      return newIndex;
    });
  };

  const handleNext = () => {
    setMoveIndex(prev => {
      const newIndex = Math.min(fenPositions.length - 1, prev + 1);
      console.log("Next clicked, new index:", newIndex);
      return newIndex;
    });
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
    console.log("Play/Pause toggled");
  };

  const handleReset = () => {
    setMoveIndex(0);
    setIsPlaying(false);
    console.log("Reset to starting position");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1b18] text-[#e6c07b] font-['Space_Grotesk'] flex flex-col">
      <Navbar />

      <div className="flex flex-1 h-[calc(100vh-6rem)] overflow-hidden">
        <Board 
          moveIndex={moveIndex} 
          fenPositions={fenPositions}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          isPlaying={isPlaying}
        />
        <div className="flex-shrink-0 w-[350px] sm:w-[400px]">
          <MoveAnalysisBar moveIndex={moveIndex} moves={moves} />
        </div>
      </div>
    </div>
  );
}