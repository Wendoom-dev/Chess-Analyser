import { useEffect, useState } from "react";
import Navbar from "./components/navBar.jsx";
import MoveAnalysisBar from "./components/moveAnalysisBar.jsx";
import Board from "./components/board.jsx";

import { parse } from "pgn-parser";         // ✔ proper parser
import { Chess } from "chess.js";

// Your original PGN string
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

  useEffect(() => {
    try {
      // 1️⃣ Parse PGN into JSON structure
      const [parsed] = parse(PGN, { startRule: "game" });
      console.log("Parsed PGN object:", parsed);

      // 2️⃣ Extract only SAN move strings
      // `parsed.moves` contains objects with .move property
      const sanMoves = parsed.moves.map((m) => m.move);
      console.log("SAN moves:", sanMoves);

      setMoves(sanMoves);

      // 3️⃣ Feed into chess.js to generate FENs
      const chess = new Chess();
      const temp = new Chess();
      const fens = [temp.fen()];

      sanMoves.forEach((san) => {
        temp.move(san);
        fens.push(temp.fen());
      });

      setFenPositions(fens);

      console.log("FEN positions:", fens);
    } catch (err) {
      console.error("Failed to parse PGN with pgn-parser:", err);
    }
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1b18] text-[#e6c07b] font-['Space_Grotesk'] flex flex-col">
      <Navbar />

      <div className="flex flex-1 h-[calc(100vh-6rem)] overflow-hidden">
        {/* Just show starting position for now */}
        <Board moveIndex={0} fenPositions={fenPositions} />

        <div className="flex-shrink-0 w-[350px] sm:w-[400px]">
          <MoveAnalysisBar moveIndex={0} moves={moves} />
        </div>
      </div>
    </div>
  );
}
