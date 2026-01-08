import Navbar from './components/navBar.jsx';
import MoveAnalysisBar from './components/moveAnalysisBar.jsx';
import Board from './components/board.jsx'; // use default export, keep file lowercase

export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1b18] text-[#e6c07b] font-['Space_Grotesk']">
      
      {/* Navbar at the top */}
      <Navbar />

      {/* Main content: Chessboard + Move Analysis */}
      <div className="flex h-[calc(100vh-6rem)]">
        
        {/* Chessboard + Eval Bar Section */}
        <Board />

        {/* Right-hand Move Analysis Panel */}
        <MoveAnalysisBar />

      </div>
    </div>
  );
}
