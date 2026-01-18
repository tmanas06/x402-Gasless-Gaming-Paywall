'use client';

import { Trophy, Star, Target, TrendingUp, Award, Crown, Medal } from 'lucide-react';
import { Coins } from 'lucide-react';

export default function ProfilePage() {
  const stats = [
    { label: "Games Played", value: "24", icon: <Target className="w-5 h-5 text-purple-400" /> },
    { label: "High Score", value: "1,250", icon: <TrendingUp className="w-5 h-5 text-blue-400" /> },
    { label: "Current Rank", value: "#42", icon: <Trophy className="w-5 h-5 text-yellow-400" /> },
    { label: "Total Points", value: "8,760", icon: <Star className="w-5 h-5 text-pink-400" /> }
  ];

  const achievements = [
    { name: "Bubble Popper", icon: "🎯", unlocked: true, description: "Pop 100 bubbles" },
    { name: "Time Master", icon: "⏱️", unlocked: true, description: "Complete time attack mode" },
    { name: "Survivor", icon: "🛡️", unlocked: true, description: "Survive 5 minutes" },
    { name: "Combo King", icon: "🔥", unlocked: false, description: "Get 10x combo" },
    { name: "Crypto Collector", icon: "💰", unlocked: false, description: "Earn 10 tCRO" },
    { name: "Legendary", icon: "👑", unlocked: false, description: "Reach top 10" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 via-purple-950 to-gray-950 text-white pt-20 pb-10 px-4 overflow-auto relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-500/30 relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30 rounded-3xl blur-2xl opacity-60 -z-10 animate-pulse"></div>
          
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-5xl font-bold mb-4 shadow-2xl ring-4 ring-purple-400/50 relative">
                  <span className="relative z-10">U</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50"></div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-gray-900"></div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  User Profile
                </h1>
                <p className="text-xl text-gray-300 mb-4">@username</p>
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-400">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span>Total Rewards Earned: <span className="text-yellow-400 font-bold">2.5 tCRO</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md p-6 rounded-2xl border-2 border-purple-500/30 shadow-xl hover:border-purple-400/60 transition-all text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 animate-pulse"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/30 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-yellow-600/30 rounded-3xl blur-2xl opacity-60 -z-10 animate-pulse"></div>
          
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-8 h-8 text-yellow-400 animate-pulse" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Achievements
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl border-2 transition-all ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50 hover:border-yellow-400/80' 
                      : 'bg-gray-800/30 border-gray-700/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' 
                        : 'bg-gray-800/50 grayscale'
                    }`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${
                          achievement.unlocked ? 'text-white' : 'text-gray-500'
                        }`}>
                          {achievement.name}
                        </h3>
                        {achievement.unlocked && <Crown className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
      `}</style>
    </div>
  );
}
