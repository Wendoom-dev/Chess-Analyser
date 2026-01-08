export default function App() {
  return (
    <div className="min-h-screen bg-[#1f1d1b] font-['Space_Grotesk'] text-[#e06c4e]">
      
      {/* Header */}
      <header className="w-full flex justify-center pt-10">
        <h1
          className="
            text-4xl font-semibold tracking-tight
            drop-shadow-[0_0_12px_rgba(224,108,78,0.25)]
          "
        >
          Game Analysis ♟️
        </h1>
      </header>

      {/* Main layout placeholder */}
      <main className="mt-16 grid grid-cols-[80px_1fr_420px] gap-6 px-10">
        
        {/* Evaluation bar (left) */}
        <div className="bg-[#2a2725] rounded-xl"></div>

        {/* Chessboard placeholder (center) */}
        <div className="aspect-square bg-[#2f2c29] rounded-2xl shadow-lg"></div>

        {/* Analysis panel (right) */}
        <div className="bg-[#2a2725] rounded-2xl p-6 text-[#e8d6cf]">
          <h2 className="text-lg font-medium mb-4 text-[#e06c4e]">
            Move Explanation
          </h2>
          <p className="text-sm leading-relaxed opacity-80">
            White gains a strong central advantage by controlling key squares.
            This move prepares long-term pressure and improves piece activity.
          </p>
        </div>

      </main>
    </div>
  )
}
