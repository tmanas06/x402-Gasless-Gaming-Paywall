'use client';

import { Trophy, Crown, Medal, Award, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/src/config';

interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  correctGuesses: number;
  totalGuesses: number;
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LEADERBOARD, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || 
            `Failed to fetch leaderboard: ${response.status} ${response.statusText}`
          );
        }
        
        const data = await response.json();
        if (data.success) {
          setRankings(data.leaderboard || []);
        } else {
          throw new Error(data.error || 'Failed to load leaderboard data');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Set up polling to refresh leaderboard every 30 seconds
    const intervalId = setInterval(fetchLeaderboard, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTrophy = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 1: return <Trophy className="w-5 h-5 text-gray-300" />;
      case 2: return <Medal className="w-5 h-5 text-orange-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 via-purple-950 to-gray-950 text-white pt-20 pb-10 px-4 overflow-auto relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-7xl md:text-8xl font-black opacity-5 blur-sm select-none">
              LEADERBOARD
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Leaderboard
            </h1>
            <Trophy className="w-10 h-10 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-gray-300">Top players competing for glory and rewards!</p>
        </div>

        {/* Leaderboard Container */}
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/30 relative">
          {/* Glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-yellow-600/30 rounded-3xl blur-2xl opacity-60 -z-10 animate-pulse"></div>
          
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-4 font-bold text-gray-300 mb-4 p-6 border-b-2 border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-orange-900/20">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Rank
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Player
            </div>
            <div className="text-right flex items-center justify-end gap-2">
              <span>Score</span>
            </div>
          </div>

          {/* Rankings */}
          <div className="divide-y divide-yellow-500/20">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
                <span className="ml-2">Loading leaderboard...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">
                <p>Error loading leaderboard: {error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No leaderboard data available yet. Be the first to make a guess!
              </div>
            ) : (
              rankings.map((entry, index) => (
                <div 
                  key={entry.address}
                  className={`grid grid-cols-3 gap-4 items-center py-4 px-6 transition-all hover:bg-gradient-to-r ${
                    index <= 2 
                      ? `hover:from-yellow-900/40 hover:to-orange-900/40 ${index === 0 ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30' : index === 1 ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50' : 'bg-gradient-to-r from-orange-900/20 to-yellow-900/20'}`
                      : 'hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {index <= 2 && getTrophy(index)}
                    <span className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg ring-2 ring-yellow-400/50' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-900 shadow-md ring-2 ring-gray-400/50' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md ring-2 ring-orange-400/50' :
                      'bg-gray-800 border border-gray-700 text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="font-semibold text-lg">
                    {formatAddress(entry.address)}
                    <div className="text-xs text-gray-400">
                      {entry.correctGuesses}/{entry.totalGuesses} correct
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                      {entry.totalPoints.toLocaleString()} pts
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round((entry.correctGuesses / (entry.totalGuesses || 1)) * 100)}% accuracy
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-t-2 border-purple-500/30 text-center">
            <p className="text-sm text-gray-400">
              💰 Earn tCRO rewards for your scores! Top players receive special bonuses.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
