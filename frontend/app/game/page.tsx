"use client"

import { useState, useEffect } from "react";
import CronosGamingDApp from "@/components/game";
import SnakeGame from "@/components/SnakeGame";
import CryptoDodger from "@/components/CryptoDodger";
import { Gamepad2, MoveRight, Shield, Sparkles, Trophy, Zap, Star, Bot, X, ChevronRight } from "lucide-react";

type GameType = 'bubble' | 'snake' | 'crypto';

export default function GamePage() {
  const [activeGame, setActiveGame] = useState<GameType>('bubble');
  const [showAIMessage, setShowAIMessage] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  const [aiMessages, setAiMessages] = useState<string[]>([]);

  // AI-powered game tips based on selected game
  useEffect(() => {
    const tips = {
      bubble: "💡 AI Assistant: Pop bubbles rapidly to build combo multipliers! Quick taps = more points! Avoid red bombs - they're game enders!",
      snake: "🤖 AI Assistant: Strategic thinking wins! Trap food near walls for longer snake growth. Patience over speed - plan your route!",
      crypto: "⚡ AI Assistant: Coin collection is priority #1! Use freeze power-ups strategically when overwhelmed. Pattern recognition is key!"
    };

    setShowAIMessage(true);
    const newTip = tips[activeGame];
    setAiMessage(newTip);
    setAiMessages(prev => [...prev.filter(m => m !== newTip), newTip]);
    
    // Don't auto-hide - let user dismiss manually
  }, [activeGame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 via-purple-950 to-gray-950 text-white pt-20 pb-10 px-4 overflow-auto relative">
      {/* Enhanced animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto min-h-[calc(100vh-5rem)] relative z-10">
        {/* Enhanced Header with animated title */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-7xl md:text-8xl font-black opacity-5 blur-sm select-none">
              GASLESS ARCADE
            </h1>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 relative bg-gradient-to-r from-purple-400 via-pink-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            🎮 Gasless Arcade 🎮
          </h1>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Star className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Play, Earn Rewards, Have Fun!
            </p>
            <Star className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-300 font-semibold">AI-Powered Gaming Experience</span>
          </div>
        </div>

        {/* Prominent AI Assistant Panel */}
        {showAIMessage && (
          <div className="mb-6 mx-auto max-w-3xl animate-slideDown relative">
            <div className="bg-gradient-to-r from-cyan-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-5 border-2 border-cyan-400/50 shadow-2xl relative overflow-hidden">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
              
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg animate-pulse">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    <h3 className="text-lg font-bold text-white">AI Gaming Assistant</h3>
                    <span className="px-2 py-1 text-xs bg-cyan-500/30 rounded-full border border-cyan-400/50">LIVE</span>
                  </div>
                  <p className="text-white text-base md:text-lg font-medium leading-relaxed">{aiMessage}</p>
                </div>
                <button
                  onClick={() => setShowAIMessage(false)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show AI toggle button if hidden */}
        {!showAIMessage && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => setShowAIMessage(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 hover:from-cyan-500 hover:to-purple-500 rounded-xl border border-cyan-400/50 shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <Bot className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Show AI Assistant</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Enhanced Game Selector with neon effects */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-3xl bg-gray-900/60 backdrop-blur-md p-3 space-x-3 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden">
            {/* Glow effect behind buttons */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 blur-xl"></div>
            
            <button
              onClick={() => setActiveGame('bubble')}
              className={`relative flex items-center px-8 py-4 rounded-2xl transition-all duration-300 transform font-bold ${
                activeGame === 'bubble' 
                  ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white shadow-2xl scale-110 ring-4 ring-purple-400/50 shadow-purple-500/50' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60 hover:scale-105 border border-gray-700/50'
              }`}
            >
              {activeGame === 'bubble' && <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-50 blur-lg"></div>}
              <Gamepad2 className={`w-6 h-6 mr-3 relative z-10 ${activeGame === 'bubble' ? 'animate-bounce' : ''}`} />
              <span className="relative z-10 text-lg">Bubble Tap</span>
              {activeGame === 'bubble' && <Trophy className="w-5 h-5 ml-3 text-yellow-300 relative z-10 animate-pulse" />}
            </button>
            
            <button
              onClick={() => setActiveGame('snake')}
              className={`relative flex items-center px-8 py-4 rounded-2xl transition-all duration-300 transform font-bold ${
                activeGame === 'snake' 
                  ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white shadow-2xl scale-110 ring-4 ring-green-400/50 shadow-green-500/50' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60 hover:scale-105 border border-gray-700/50'
              }`}
            >
              {activeGame === 'snake' && <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-50 blur-lg"></div>}
              <MoveRight className={`w-6 h-6 mr-3 relative z-10 ${activeGame === 'snake' ? 'animate-pulse' : ''}`} />
              <span className="relative z-10 text-lg">Snake</span>
              {activeGame === 'snake' && <Trophy className="w-5 h-5 ml-3 text-yellow-300 relative z-10 animate-pulse" />}
            </button>
            
            <button
              onClick={() => setActiveGame('crypto')}
              className={`relative flex items-center px-8 py-4 rounded-2xl transition-all duration-300 transform font-bold ${
                activeGame === 'crypto'
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white shadow-2xl scale-110 ring-4 ring-amber-400/50 shadow-amber-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60 hover:scale-105 border border-gray-700/50'
              }`}
            >
              {activeGame === 'crypto' && <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-50 blur-lg"></div>}
              <Shield className={`w-6 h-6 mr-3 relative z-10 ${activeGame === 'crypto' ? 'animate-pulse' : ''}`} />
              <span className="relative z-10 text-lg">Crypto Dodger</span>
              {activeGame === 'crypto' && <Trophy className="w-5 h-5 ml-3 text-yellow-300 relative z-10 animate-pulse" />}
            </button>
          </div>
        </div>

        {/* Game Container with Enhanced Styling */}
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-500/30 relative">
          {/* Enhanced glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-blue-600/30 via-pink-600/30 to-purple-600/30 rounded-3xl blur-2xl opacity-60 -z-10 animate-pulse"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-3xl opacity-20 blur-xl -z-20"></div>
          
          {activeGame === 'bubble' && <CronosGamingDApp />}
          {activeGame === 'snake' && <SnakeGame />}
          {activeGame === 'crypto' && <CryptoDodger />}
        </div>

        {/* Enhanced Footer Info with AI badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-gray-900/80 via-purple-900/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div className="text-left">
                <p className="text-white font-bold text-base mb-1">
                  {activeGame === 'bubble' 
                    ? '🎯 Click bubbles to pop them and score points!'
                    : activeGame === 'snake'
                    ? '🐍 Use arrow keys or WASD to control the snake!'
                    : '🚀 Dodge bombs and collect coins to score!'}
                </p>
                <p className="text-gray-300 text-sm">
                  💰 <span className="font-semibold text-yellow-300">Earn tCRO rewards:</span> 100 points = 1 tCRO | All games support rewards!
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-purple-500/50 hidden sm:block"></div>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-600/30 rounded-lg border border-cyan-400/50">
              <Bot className="w-5 h-5 text-cyan-300 animate-pulse" />
              <span className="text-cyan-200 font-semibold text-sm">AI-Powered Tips</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
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
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
