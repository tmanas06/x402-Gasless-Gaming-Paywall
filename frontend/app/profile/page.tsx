'use client';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold mb-4">
              U
            </div>
            <h1 className="text-2xl font-bold">User Profile</h1>
            <p className="text-gray-400">@username</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-300 mb-2">Game Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Games Played</p>
                  <p className="text-xl font-bold">24</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">High Score</p>
                  <p className="text-xl font-bold">1,250</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Rank</p>
                  <p className="text-xl font-bold">#42</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Points</p>
                  <p className="text-xl font-bold">8,760</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-300 mb-3">Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Bubble Popper', 'Time Master', 'Survivor', 'Combo King'].map((achievement, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-gray-600/30 p-2 rounded">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 text-sm">🏆</span>
                    </div>
                    <span className="text-sm">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
