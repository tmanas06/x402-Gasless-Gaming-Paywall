"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, Zap, Play, Pause, RotateCcw } from "lucide-react"
import { getSigner, publicClient, CONTRACT_ADDRESS, CONTRACT_ABI, type ContractFunction } from "@/lib/viem"
import { Howl } from "howler"

// Sound effects interface
interface SoundEffect {
  play: () => void;
  stop: () => void;
}

// Sound effects disabled - using no-op functions
const createNoopSound = (): SoundEffect => ({
  play: () => {},
  stop: () => {}
});

const popSound = createNoopSound();
const bombSound = createNoopSound();
const bonusSound = createNoopSound();
const freezeSound = createNoopSound();

const BUBBLE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
const GAME_DURATION = 60; // seconds for time attack

interface Bubble {
  id: string
  x: number
  y: number
  size: number
  color: string
  speed: number
  type: "normal" | "bonus" | "bomb" | "powerup"
  powerUpType?: "freeze"
  points: number
}

interface GameState {
  bubbles: Bubble[]
  score: number
  lives: number
  timeLeft: number
  isPlaying: boolean
  isPaused: boolean
  gameMode: "classic" | "timeAttack" | "survival"
  level: number
  hasStarted?: boolean
  hasClaimedReward?: boolean
}

export default function MonadGamingDApp() {
  const [currentView, setCurrentView] = useState<"menu" | "game">("menu")
  const [gameState, setGameState] = useState<GameState>({
    bubbles: [],
    score: 0,
    lives: 3,
    timeLeft: GAME_DURATION,
    isPlaying: false,
    isPaused: false,
    gameMode: "classic",
    level: 1,
    hasClaimedReward: false
  })

  const [rewardAmount, setRewardAmount] = useState<number | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  // Check if player has claimed reward
  useEffect(() => {
    const checkClaimStatus = async () => {
      try {
        const signer = await getSigner()
        const hasClaimed = await signer.account.address
          ? await publicClient.simulateContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'hasClaimed',
              args: [signer.account.address]
            })
          : false
        setGameState(prev => ({ ...prev, hasClaimedReward: hasClaimed }))
      } catch (error) {
        console.error('Error checking claim status:', error)
      }
    }
    checkClaimStatus()
  }, [])

  // Calculate dynamic reward amount based on score
  const calculateRewardAmount = useCallback((score: number) => {
    // Base reward amount (0.001 USDT)
    const baseReward = 0.001;
    // Reward increment per 40 points
    const rewardPer40Points = 0.001;
    // Calculate how many 40-point intervals we've reached
    const scoreIntervals = Math.floor(score / 40);
    // Calculate total reward
    const totalReward = baseReward + (scoreIntervals * rewardPer40Points);
    return totalReward;
  }, []);

  // Update reward amount when score changes
  useEffect(() => {
    const rewardAmount = calculateRewardAmount(gameState.score);
    setRewardAmount(rewardAmount);
  }, [gameState.score, calculateRewardAmount])

  // Claim reward function
  const claimReward = async () => {
    try {
      setIsClaiming(true)
      const signer = await getSigner()
      const tx = await signer.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimReward'
      })
      await publicClient.waitForTransactionReceipt({ hash: tx })
      setGameState(prev => ({ ...prev, hasClaimedReward: true }))
      // Reset game state after claiming reward
      setGameState({
        bubbles: [],
        score: 0,
        lives: 3,
        timeLeft: GAME_DURATION,
        isPlaying: false,
        isPaused: false,
        gameMode: "classic",
        level: 1,
        hasStarted: false,
        hasClaimedReward: true
      })
    } catch (error) {
      console.error('Error claiming reward:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  // Refs with proper TypeScript types
  type IntervalHandle = ReturnType<typeof setInterval>
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<IntervalHandle | null>(null)
  const bubbleSpawnRef = useRef<IntervalHandle | null>(null)
  const gameIdRef = useRef<string>('')
  const startTimeRef = useRef<number | null>(null)
  const comboRef = useRef({ lastTap: 0, streak: 0 })

  // Initialize game ID on component mount
  useEffect(() => {
    gameIdRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now();
  }, []);

  const getBubbleSpeed = (score: number) => Math.min(2 + Math.floor(score / 100), 7)
  const getBubbleSpawnRate = (score: number) => Math.max(1000 - Math.floor(score / 50) * 70, 350)
  const getBombChance = (score: number) => Math.min(0.08 + score / 1000, 0.25)
  const getBubbleSize = (score: number) => Math.max(60 - Math.floor(score / 50) * 4, 18)

  const createBubble = useCallback((): Bubble => {
    const rect = gameAreaRef.current?.getBoundingClientRect()
    if (!rect) {
      // Return a default bubble if rect is not available
      return {
        id: Math.random().toString(36).substr(2, 9),
        x: 0,
        y: 0,
        size: 30,
        color: BUBBLE_COLORS[0],
        speed: 1,
        type: 'normal',
        points: 1
      };
    }

    const size = getBubbleSize(gameState.score) + Math.random() * 10 - 5
    const x = Math.random() * (rect.width - size)
    const y = rect.height
    let type: Bubble["type"] = "normal"
    let color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
    let points = 1

    const rand = Math.random()
    if (rand < getBombChance(gameState.score)) {
      type = "bomb"
      color = "#FF4444"
      points = -20
    } else if (rand < 0.15) {
      type = "bonus"
      color = "#FFD700"
      points = 50
    } else if (rand < 0.20) {
      type = "powerup"
      color = "#00FFFF"
      points = 0
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x, y, size, color, type, points,
      speed: getBubbleSpeed(gameState.score) + Math.random(),
      powerUpType: type === "powerup" ? "freeze" : undefined,
    }
  }, [gameState.score])

  const spawnBubble = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return
    setGameState(prev => ({
      ...prev,
      bubbles: [...prev.bubbles, createBubble()],
    }))
  }, [createBubble, gameState.isPaused, gameState.isPlaying])

  const updateBubbles = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying || prev.isPaused) return prev
      const moved = prev.bubbles.map(b => ({ ...b, y: b.y - b.speed }))
      const escaped = moved.filter(b => b.y + b.size < 0 && prev.gameMode === "survival" && b.type !== "bomb")
      const visible = moved.filter(b => b.y + b.size > 0)
      const newLives = Math.max(0, prev.lives - escaped.length)
      return { ...prev, bubbles: visible, lives: newLives }
    })
  }, [])

  const endGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }
    if (bubbleSpawnRef.current) {
      clearInterval(bubbleSpawnRef.current)
      bubbleSpawnRef.current = null
    }
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      hasStarted: false,
    }))
  }, [])

  const sendTapTx = async (bubble: Bubble, score: number) => {
    try {
      const signer = getSigner()
      const payload = {
        gid: gameIdRef.current ?? crypto.randomUUID(),
        score,
      }
      const data = ("0x" + Buffer.from(JSON.stringify(payload), "utf8").toString("hex")) as `0x${string}`
      const gas = await publicClient.estimateGas({
        account: signer.account.address,
        to: signer.account.address,
        value: BigInt(0),
        data,
      })
      await signer.sendTransaction({
        account: signer.account,
        to: signer.account.address,
        value: BigInt(0),
        data,
        gas,
      })
    } catch (err) {
      console.error("tap-tx error:", err)
    }
  }

  const popBubble = useCallback((bubbleId: string) => {
    setGameState(prev => {
      const bubble = prev.bubbles.find(b => b.id === bubbleId)
      if (!bubble) return prev

      const now = Date.now()
      const comboTime = 800
      comboRef.current.streak = now - comboRef.current.lastTap < comboTime ? comboRef.current.streak + 1 : 1
      comboRef.current.lastTap = now
      const multiplier = Math.min(1 + comboRef.current.streak * 0.1, 3)

      let points = bubble.points
      if (bubble.type === "normal") points = Math.floor((10 + (60 - bubble.size) * 0.8) * multiplier)

      let newScore = Math.max(0, prev.score + points)
      let newLives = prev.lives

      // 🎧 sound
      if (bubble.type === "bonus") bonusSound.play()
      else if (bubble.type === "bomb") {
        bombSound.play()
        newLives = Math.max(0, prev.lives - 1)
      } else if (bubble.type === "powerup" && bubble.powerUpType === "freeze") {
        freezeSound.play()
        if (bubbleSpawnRef.current) {
          clearInterval(bubbleSpawnRef.current)
          bubbleSpawnRef.current = null
        }
        setTimeout(() => {
          if (gameState.isPlaying && !gameState.isPaused) {
            bubbleSpawnRef.current = setInterval(spawnBubble, getBubbleSpawnRate(newScore)) as unknown as NodeJS.Timeout
          }
        }, 5000)
      } else popSound.play()

      sendTapTx(bubble, newScore)
      if (newLives <= 0) setTimeout(() => endGame(), 0)

      return {
        ...prev,
        bubbles: prev.bubbles.filter(b => b.id !== bubbleId),
        score: newScore,
        lives: newLives,
        hasStarted: true,
      }
    })
  }, [endGame])

  const cleanupIntervals = useCallback(() => {
    // Clear game loop interval if it exists
    if (gameLoopRef.current !== null) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }
    
    // Clear bubble spawn interval if it exists
    if (bubbleSpawnRef.current !== null) {
      clearInterval(bubbleSpawnRef.current)
      bubbleSpawnRef.current = null
    }
  }, [])

  const startGame = useCallback((mode: GameState["gameMode"]) => {
    // Clear any existing game loop
    cleanupIntervals()
    
    // Generate new game ID if needed
    if (!gameIdRef.current) {
      gameIdRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now()
    }
    
    // Reset game state
    setGameState({
      bubbles: [],
      score: 0,
      lives: mode === "survival" ? 3 : 999,
      timeLeft: mode === "timeAttack" ? GAME_DURATION : 999,
      isPlaying: true,
      isPaused: false,
      gameMode: mode,
      level: 1,
      hasStarted: false,
    })
    
    // Set initial view and start time
    setCurrentView("game")
    startTimeRef.current = Date.now()
  }, [])

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  const resetGame = useCallback(() => {
    cleanupIntervals()
    setGameState({
      bubbles: [],
      score: 0,
      lives: 3,
      timeLeft: GAME_DURATION,
      isPlaying: false,
      isPaused: false,
      gameMode: "classic",
      level: 1,
      hasStarted: false,
    })
    setCurrentView("menu")
  }, [cleanupIntervals])

  // Game loop effect
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      return
    }

    // Clear any existing intervals
    cleanupIntervals()
    
    // Set up new intervals
    const gameLoopId = setInterval(updateBubbles, 50) as unknown as NodeJS.Timeout
    const bubbleSpawnId = setInterval(() => {
      if (gameState.isPlaying && !gameState.isPaused) {
        spawnBubble()
      }
    }, getBubbleSpawnRate(gameState.score)) as unknown as NodeJS.Timeout
    
    gameLoopRef.current = gameLoopId
    bubbleSpawnRef.current = bubbleSpawnId

    // Time attack mode timer
    let timerInterval: NodeJS.Timeout | undefined
    if (gameState.gameMode === "timeAttack") {
      timerInterval = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            endGame()
            return prev
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
    }

    // Cleanup function
    return () => {
      cleanupIntervals()
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [gameState.isPlaying, gameState.isPaused, gameState.score, gameState.gameMode, updateBubbles, spawnBubble, endGame])

  useEffect(() => {
    if (gameState.isPlaying && gameState.lives <= 0) endGame()
  }, [gameState.isPlaying, gameState.lives, endGame])

  useEffect(() => {
    if (gameState.isPlaying && !gameState.hasStarted) {
      const timer = setTimeout(() => {
        setGameState(prev => (prev.hasStarted ? prev : { ...prev, hasStarted: true }))
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState.isPlaying, gameState.hasStarted])

  if (currentView === "menu") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="pt-20 pb-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6">
              Bubble Tap
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Pop bubbles, score points, and climb the leaderboard in this exciting arcade game!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all">
                <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Classic Mode</h3>
                <p className="text-gray-400 mb-4">Pop as many bubbles as you can before time runs out!</p>
                <Button 
                  onClick={() => startGame("classic")} 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
                >
                  Play Now
                </Button>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all">
                <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Time Attack</h3>
                <p className="text-gray-400 mb-4">Race against the clock to set a high score!</p>
                <Button 
                  onClick={() => startGame("timeAttack")} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 transition-opacity"
                >
                  Start Challenge
                </Button>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-pink-500 transition-all">
                <div className="bg-pink-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Survival</h3>
                <p className="text-gray-400 mb-4">How long can you last? Don't let the bombs get you!</p>
                <Button 
                  onClick={() => startGame("survival")} 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 transition-opacity"
                >
                  Survive Now
                </Button>
              </div>
            </div>
            
            <div className="mt-12 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
                  <p>Click or tap bubbles to pop them and earn points</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500/20 text-purple-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
                  <p>Avoid bombs - they'll end your game early!</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-pink-500/20 text-pink-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
                  <p>Collect power-ups for special abilities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="pt-20 pb-10 px-4 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="font-bold">Score: {gameState.score}</span>
                <span className="font-bold">Lives: {gameState.lives}</span>
                {gameState.gameMode === "timeAttack" && (
                  <span className="font-bold">Time: {gameState.timeLeft}s</span>
                )}
              </div>
              <Button 
                onClick={pauseGame} 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-gray-700"
              >
                {gameState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
            
            <div 
              ref={gameAreaRef} 
              className="relative w-full h-[500px] bg-gray-900 overflow-hidden"
            >
              {!gameState.hasStarted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white text-center p-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {gameState.gameMode === "classic" && "Classic Mode"}
                      {gameState.gameMode === "timeAttack" && `Time Attack: ${GAME_DURATION}s`}
                      {gameState.gameMode === "survival" && "Survival Mode"}
                    </h2>
                    <p className="mb-4">Click bubbles to pop them!</p>
                    <p className="text-sm text-gray-300">Watch out for bombs! 💣</p>
                  </div>
                </div>
              )}
              
              {gameState.bubbles.map(bubble => (
                <div
                  key={bubble.id}
                  onClick={() => popBubble(bubble.id)}
                  className="absolute rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  style={{
                    left: `${bubble.x}px`,
                    top: `${bubble.y}px`,
                    width: `${bubble.size}px`,
                    height: `${bubble.size}px`,
                    backgroundColor: bubble.color,
                    boxShadow: `0 0 10px ${bubble.color}80`,
                  }}
                >
                  {bubble.type === "bonus" && "✨"}
                  {bubble.type === "bomb" && "💣"}
                  {bubble.type === "powerup" && "❄️"}
                </div>
              ))}
            </div>
            
            {!gameState.isPlaying && gameState.hasStarted && (
              <div className="p-6 bg-gray-800 text-white text-center">
                <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                <p className="mb-4">Final Score: {gameState.score}</p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => startGame(gameState.gameMode)} 
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                  >
                    Play Again
                  </Button>
                  <Button 
                    onClick={resetGame} 
                    variant="outline"
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    Main Menu
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
