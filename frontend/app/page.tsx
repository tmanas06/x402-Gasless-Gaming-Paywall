"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gamepad2, Trophy, Zap, Star, Bot, Sparkles, Coins } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 via-purple-950 to-gray-950 text-white pt-20 pb-10 px-4 overflow-auto relative">
      {/* Animated background elements */}
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

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-7xl md:text-8xl font-black opacity-5 blur-sm select-none">
              GASLESS ARCADE
            </h1>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 relative bg-gradient-to-r from-purple-400 via-pink-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            🎮 Gasless Arcade 🎮
          </h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Play, Earn Rewards, Have Fun!
            </p>
            <Star className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the future of blockchain gaming with AI-powered tips, multiple game modes, and crypto rewards!
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link href="/game">
              <Button size="lg" className="px-10 py-7 text-xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-500 hover:via-blue-500 hover:to-purple-500 text-white shadow-2xl ring-4 ring-purple-400/50 transform hover:scale-105 transition-all">
                <Gamepad2 className="mr-3 h-6 w-6" />
                Play Now
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="outline" className="px-10 py-7 text-xl border-2 border-purple-500/50 hover:bg-purple-900/30 hover:border-purple-400 text-white backdrop-blur-sm transform hover:scale-105 transition-all">
                <Trophy className="mr-3 h-6 w-6" />
                Leaderboard
              </Button>
            </Link>
          </div>

          {/* AI Badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-semibold">Powered by AI Gaming Assistant</span>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            {
              title: "Multiple Modes",
              description: "Play Classic, Time Attack, or Survival modes with unique challenges. Earn rewards in classic mode!",
              icon: <Zap className="w-10 h-10 text-purple-400 mb-4 animate-pulse" />,
              gradient: "from-purple-600/20 to-blue-600/20",
              border: "border-purple-500/40"
            },
            {
              title: "AI-Powered Tips",
              description: "Get real-time AI assistance and strategies to improve your gameplay and maximize your scores!",
              icon: <Bot className="w-10 h-10 text-cyan-400 mb-4 animate-pulse" />,
              gradient: "from-cyan-600/20 to-purple-600/20",
              border: "border-cyan-500/40"
            },
            {
              title: "Crypto Rewards",
              description: "Earn tCRO tokens for your achievements! 100 points = 1 tCRO. Compete globally and climb rankings!",
              icon: <Coins className="w-10 h-10 text-yellow-400 mb-4 animate-pulse" />,
              gradient: "from-yellow-600/20 to-orange-600/20",
              border: "border-yellow-500/40"
            }
          ].map((feature, index) => (
            <div key={index} className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-md p-8 rounded-2xl border-2 ${feature.border} shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-pink-600/10 animate-pulse"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Games", value: "3+", icon: <Gamepad2 className="w-6 h-6 text-purple-400" /> },
            { label: "Modes", value: "5+", icon: <Sparkles className="w-6 h-6 text-cyan-400" /> },
            { label: "Rewards", value: "100%", icon: <Coins className="w-6 h-6 text-yellow-400" /> },
            { label: "AI Tips", value: "Live", icon: <Bot className="w-6 h-6 text-pink-400" /> }
          ].map((stat, index) => (
            <div key={index} className="bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-purple-500/30 text-center hover:border-purple-400/60 transition-all">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
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
