"use client"

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 Hey there! I'm your AI Gaming Assistant! I can help you with:\n\n🎮 Game strategies and tips\n💰 Understanding rewards and payouts\n🏆 Achievement guidance\n⚡ Performance optimization\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call backend AI chat API
      const response = await fetch(`${API_URL}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: conversationHistory
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      // Fallback to static response on error
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(currentInput),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes("strategy") || lowerInput.includes("tip") || lowerInput.includes("help")) {
      return "🎯 **Strategy Tips:**\n\n• Focus on building combos - rapid taps = more points!\n• In Snake: Plan your route to trap food near walls\n• In Crypto Dodger: Prioritize coins, use freeze strategically\n• Watch for power-ups - they're game changers!\n\nWhich game would you like more specific tips for?";
    }
    
    if (lowerInput.includes("reward") || lowerInput.includes("tcro") || lowerInput.includes("earn")) {
      return "💰 **Rewards System:**\n\n• Score 100+ points in any game to earn rewards\n• 100 points = 1 tCRO\n• Rewards are sent directly to your wallet\n• Only classic/normal modes offer rewards\n• Maximum reward per game: Based on your score!\n\nKeep playing and building your score! 🚀";
    }
    
    if (lowerInput.includes("achievement") || lowerInput.includes("unlock")) {
      return "🏆 **Achievements Guide:**\n\nAvailable achievements:\n• 🎯 Bubble Popper - Pop 100 bubbles\n• ⏱️ Time Master - Complete time attack\n• 🛡️ Survivor - Survive 5 minutes\n• 🔥 Combo King - Get 10x combo\n• 💰 Crypto Collector - Earn 10 tCRO\n• 👑 Legendary - Reach top 10\n\nKeep playing to unlock them all!";
    }
    
    if (lowerInput.includes("score") || lowerInput.includes("points") || lowerInput.includes("high")) {
      return "⭐ **Scoring Tips:**\n\n• Smaller bubbles = more points\n• Build combos by tapping rapidly\n• Collect bonus items for extra points\n• Avoid bombs - they cost you lives/points\n• Power-ups can multiply your score!\n\nTry different game modes to find your best strategy!";
    }
    
    if (lowerInput.includes("game") || lowerInput.includes("play") || lowerInput.includes("mode")) {
      return "🎮 **Game Modes:**\n\n**Bubble Tap:**\n• Classic: 3 lives with rewards\n• Time Attack: Race against the clock\n• Survival: Unlimited lives\n\n**Snake:** Traditional snake with modern twist\n**Crypto Dodger:** Dodge bombs, collect coins!\n\nWhich game would you like to try? Head to the Play page! 🚀";
    }
    
    return "🤖 Thanks for your question! I'm constantly learning about gaming strategies. Here are some things I can help with:\n\n• Game strategies and tips\n• Understanding rewards\n• Achievement progress\n• Performance tips\n\nFeel free to ask me anything about the games! 💡";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 via-purple-950 to-gray-950 text-white pt-20 pb-10 px-4 overflow-auto relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
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
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-7xl md:text-8xl font-black opacity-5 blur-sm select-none">
              AI CHAT
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-10 h-10 text-cyan-400 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              AI Gaming Assistant
            </h1>
            <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-gray-300">Ask me anything about games, strategies, rewards, and more!</p>
        </div>

        {/* Chat Container */}
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-2 border-cyan-500/30 relative h-[600px] flex flex-col">
          {/* Glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/30 via-purple-600/30 to-pink-600/30 rounded-3xl blur-2xl opacity-60 -z-10 animate-pulse"></div>
          
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-cyan-600/30 via-purple-600/30 to-pink-600/30 p-4 border-b-2 border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">AI Gaming Assistant</h3>
                <p className="text-xs text-cyan-200 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online & Ready to Help
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-gradient-to-r from-gray-800 to-gray-900 border border-cyan-500/30 text-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">U</span>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-cyan-500/30 rounded-2xl p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t-2 border-cyan-500/30 bg-gradient-to-r from-gray-900/50 to-black/50">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about strategies, rewards, achievements..."
                className="flex-1 bg-gray-800/60 border-2 border-cyan-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              💡 Try: "How do I earn rewards?", "Give me game tips", "What achievements are available?"
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

