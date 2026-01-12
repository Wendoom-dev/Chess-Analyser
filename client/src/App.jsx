import { useEffect, useState } from 'react';
import Navbar from './components/navBar.jsx';
import MoveAnalysisBar from './components/moveAnalysisBar.jsx';
import Board from './components/board.jsx';

export default function App() {
  // 🔑 single source of truth
  const [moveIndex, setMoveIndex] = useState(0);

  // ⌨️ arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setMoveIndex((prev) => prev + 1);
      }
      if (e.key === 'ArrowLeft') {
        setMoveIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1b18] text-[#e6c07b] font-['Space_Grotesk'] flex flex-col">
      
      <Navbar />

      <div className="flex flex-1 h-[calc(100vh-6rem)] overflow-hidden">
        
        {/* Board only renders based on moveIndex */}
        <Board moveIndex={moveIndex} />

        <div className="flex-shrink-0 w-[350px] sm:w-[400px]">
          <MoveAnalysisBar moveIndex={moveIndex} />
        </div>

      </div>
    </div>
  );
}
