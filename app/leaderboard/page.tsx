'use client';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Leaderboard</h1>
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-4 font-medium text-gray-400 mb-4 pb-2 border-b border-gray-700">
            <div>Rank</div>
            <div>Player</div>
            <div className="text-right">Score</div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((rank) => (
              <div key={rank} className="grid grid-cols-3 gap-4 items-center py-2 hover:bg-gray-700/50 rounded-lg px-2">
                <div className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded-full text-sm">
                    {rank}
                  </span>
                </div>
                <div>Player {rank}</div>
                <div className="text-right font-mono">{1000 - (rank * 100)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
