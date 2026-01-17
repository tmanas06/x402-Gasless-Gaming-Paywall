"use client"

import { useState, useEffect } from "react";
import MonadGamingDApp from "@/components/game";
import SnakeGame from "@/components/SnakeGame";
import CryptoDodger from "@/components/CryptoDodger";
import { Gamepad2, MoveRight, Shield } from "lucide-react";

type GameType = 'bubble' | 'snake' | 'crypto';

export default function GamePage() {
  const [activeGame, setActiveGame] = useState<GameType>('bubble');

  // Removed scroll prevention to allow page scrolling

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 pb-10 px-4 overflow-auto">
      <div className="max-w-4xl mx-auto min-h-[calc(100vh-5rem)]">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-800 p-1 space-x-1">
            <button
              onClick={() => setActiveGame('bubble')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeGame === 'bubble' 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              Bubble Tap
            </button>
            <button
              onClick={() => setActiveGame('snake')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeGame === 'snake' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MoveRight className="w-5 h-5 mr-2" />
              Snake
            </button>
            <button
              onClick={() => setActiveGame('crypto')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeGame === 'crypto'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-5 h-5 mr-2" />
              Crypto Dodger
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
          {activeGame === 'bubble' && <MonadGamingDApp />}
          {activeGame === 'snake' && <SnakeGame />}
          {activeGame === 'crypto' && <CryptoDodger />}
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Use the buttons above to switch between games</p>
          <p className="mt-1">
            {activeGame === 'bubble' 
              ? 'Click the bubbles to pop them and score points!'
              : activeGame === 'snake'
              ? 'Use arrow keys to control the snake and eat the red food!'
              : 'Dodge the bombs and collect coins to score points!'}
          </p>
        </div>
      </div>
    </div>
  );
}
