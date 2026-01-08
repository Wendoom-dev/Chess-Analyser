export default function MoveAnalysisBar() {
  return (
    <div className="w-[420px] border-l border-[#3a342e] p-6 flex flex-col gap-6">
      
      {/* Move Analysis Dialogue */}
      <div className="flex-1">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Move Analysis
        </h2>
        <div className="text-sm leading-relaxed text-[#d6bfa6] border rounded-lg p-4 h-[400px] overflow-y-auto">
          Select a move to see explanation.<br />
          Blunders, mistakes, inaccuracies, and brilliant ideas will appear here.
        </div>
      </div>

    </div>
  );
}
