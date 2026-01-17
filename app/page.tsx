"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gamepad2, Trophy, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Monad Gaming DApp
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Experience the future of blockchain gaming with fast, fun, and interactive games on Monad!
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link href="/game">
              <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <Gamepad2 className="mr-2 h-5 w-5" />
                Play Now
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                <Trophy className="mr-2 h-5 w-5" />
                View Leaderboard
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              {
                title: "Multiple Modes",
                description: "Play Classic, Time Attack, or Survival modes with unique challenges.",
                icon: <Zap className="w-8 h-8 text-purple-400 mb-4" />
              },
              {
                title: "Power-ups & Bonuses",
                description: "Collect special bubbles for extra points and power-ups.",
                icon: <Zap className="w-8 h-8 text-blue-400 mb-4" />
              },
              {
                title: "Compete Globally",
                description: "Climb the leaderboards and compete with players worldwide.",
                icon: <Trophy className="w-8 h-8 text-yellow-400 mb-4" />
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm border border-gray-700/50">
                <div className="flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
