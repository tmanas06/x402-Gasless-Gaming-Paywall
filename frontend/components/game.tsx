"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, Zap, Play, Pause, RotateCcw, Coins, Wallet, Loader2 } from "lucide-react"
import { getSigner, publicClient, CONTRACT_ADDRESS, CONTRACT_ABI, type ContractFunction } from "@/lib/viem"
import { loadKey } from "@/lib/keyCache"
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

export default function CronosGamingDApp() {
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
  const [freePlaysRemaining, setFreePlaysRemaining] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null)
  const [initialGameMode, setInitialGameMode] = useState<GameState["gameMode"] | null>(null)
  const [initialLives, setInitialLives] = useState<number>(3)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)
  const [pendingGameMode, setPendingGameMode] = useState<GameState["gameMode"] | null>(null)
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  // Get user address and check claim status
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const cachedKey = loadKey();
        if (!cachedKey) {
          return;
        }
        
        const signer = getSigner();
        if (signer?.account?.address) {
          setUserAddress(signer.account.address);
          
          // Check if user has claimed reward from smart contract
          try {
            const hasClaimed = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'hasClaimed',
              args: [signer.account.address]
            });
            setGameState(prev => ({ ...prev, hasClaimedReward: hasClaimed as boolean }))
          } catch (error) {
            console.error('Error checking claim status:', error)
          }
        }
      } catch (error) {
        if (error instanceof Error && !error.message.includes('No cached private key')) {
          console.error('Error initializing user:', error)
        }
      }
    }
    initializeUser()
  }, [])

  // Calculate reward amount: 100 points = 1 tCRO
  const calculateRewardAmount = useCallback((score: number) => {
    // 100 points = 1 tCRO
    const tCROAmount = Math.floor(score / 100);
    return tCROAmount;
  }, []);

  // Update reward amount when score changes
  useEffect(() => {
    const rewardAmount = calculateRewardAmount(gameState.score);
    setRewardAmount(rewardAmount);
  }, [gameState.score, calculateRewardAmount])

  // Check payment status with backend
  const checkPaymentStatus = useCallback(async (address: string): Promise<{ allowed: boolean; isPremium: boolean; freePlayRemaining?: number; requiresPayment?: boolean; invoice?: any }> => {
    try {
      setPaymentError(null)
      
      console.log(`[Payment Check] Checking payment for address: ${address}`)
      console.log(`[Payment Check] API URL: ${API_URL}`)
      
      const response = await fetch(`${API_URL}/api/play?address=${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`[Payment Check] Response status: ${response.status}`)
      
      if (response.status === 402) {
        // Payment required
        const data = await response.json()
        console.log('[Payment Check] Payment required:', data)
        return {
          allowed: false,
          isPremium: false,
          requiresPayment: true,
          invoice: data.invoice
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Payment Check] Server error: ${response.status} - ${errorText}`)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[Payment Check] Payment status:', data)
      return {
        allowed: data.allowed,
        isPremium: data.isPremium,
        freePlayRemaining: data.freePlayRemaining
      }
    } catch (error) {
      console.error('[Payment Check] Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to check payment status'
      setPaymentError(errorMessage)
      // If backend is not available, allow free play for now
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        console.warn('[Payment Check] Backend not available, allowing free play')
        return {
          allowed: true,
          isPremium: false,
          freePlayRemaining: 3
        }
      }
      throw error
    }
  }, [API_URL])

  // cleanupIntervals - defined early so it can be used by other functions
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
    
    // Clear payment poll interval if it exists
    if (paymentPollRef.current !== null) {
      clearInterval(paymentPollRef.current)
      paymentPollRef.current = null
    }
  }, [])

  // Internal game start (after payment check) - defined before handlePayment to avoid circular dependency
  const startGameInternal = useCallback((mode: GameState["gameMode"]) => {
    // Clear any existing game loop
    cleanupIntervals()
    
    // Generate new game ID if needed
    if (!gameIdRef.current) {
      gameIdRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now()
    }
    
    // Reset game state
    // Classic mode = 3 lives (normal mode with rewards)
    // Survival = 3 lives (free mode)
    // Time Attack = unlimited lives (free mode)
    const initialLivesCount = mode === "classic" ? 3 : mode === "survival" ? 3 : 999
    setInitialGameMode(mode)
    setInitialLives(initialLivesCount)
    
    setGameState({
      bubbles: [],
      score: 0,
      lives: initialLivesCount,
      timeLeft: mode === "timeAttack" ? GAME_DURATION : 999,
      isPlaying: true,
      isPaused: false,
      gameMode: mode,
      level: 1,
      hasStarted: false,
      hasClaimedReward: false
    })
    
    // Set initial view and start time
    setCurrentView("game")
    startTimeRef.current = Date.now()
    setPaymentError(null)
  }, [cleanupIntervals])

  // Handle x402 payment flow
  const handlePayment = useCallback(async (invoice: any, mode: GameState["gameMode"]) => {
    try {
      // Clear any existing payment poll
      if (paymentPollRef.current) {
        clearInterval(paymentPollRef.current)
        paymentPollRef.current = null
      }
      
      console.log('[Payment] Showing payment modal with invoice:', invoice)
      // Show payment modal
      setPaymentInvoice(invoice)
      setPendingGameMode(mode)
      setShowPaymentModal(true)
      setPaymentError(null)
      
      // Start polling for payment verification in the background
      let attempts = 0
      const maxAttempts = 60 // 2 minutes (60 * 2 seconds)
      const pollInterval = 2000 // 2 seconds
      
      paymentPollRef.current = setInterval(async () => {
        attempts++
        try {
          const status = await checkPaymentStatus(userAddress!)
          if (status.allowed && status.isPremium) {
            if (paymentPollRef.current) {
              clearInterval(paymentPollRef.current)
              paymentPollRef.current = null
            }
            setPaymentError(null)
            setIsPremium(true)
            setFreePlaysRemaining(null)
            setShowPaymentModal(false)
            setPaymentInvoice(null)
            setPendingGameMode(null)
            // Start the game after payment is verified
            startGameInternal(mode)
          } else if (attempts >= maxAttempts) {
            if (paymentPollRef.current) {
              clearInterval(paymentPollRef.current)
              paymentPollRef.current = null
            }
            setPaymentError('Payment timeout. Please try again.')
            setShowPaymentModal(false)
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            if (paymentPollRef.current) {
              clearInterval(paymentPollRef.current)
              paymentPollRef.current = null
            }
            setPaymentError('Payment verification failed. Please try again.')
            setShowPaymentModal(false)
          }
        }
      }, pollInterval)
      
    } catch (error) {
      console.error('Error handling payment:', error)
      setPaymentError(error instanceof Error ? error.message : 'Payment failed')
      setShowPaymentModal(false)
    }
  }, [userAddress, checkPaymentStatus, startGameInternal])

  // Claim reward from backend (sends tCRO directly)
  const claimReward = async () => {
    try {
      setIsClaiming(true)
      setPaymentError(null)
      
      if (!userAddress) {
        throw new Error('Please connect your wallet first');
      }

      // Only allow rewards for normal mode (classic with 3 lives)
      if (gameState.gameMode !== "classic" || gameState.lives !== 3) {
        throw new Error('Rewards only available for normal mode (3 lives)');
      }

      // Check minimum score (100 points = 1 tCRO)
      if (gameState.score < 100) {
        throw new Error('Minimum score of 100 required for rewards');
      }

      // Submit score to backend first
      await fetch(`${API_URL}/api/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          score: gameState.score,
          isPremium: isPremium,
          gameMode: gameState.gameMode
        })
      })

      // Claim reward from backend
      const response = await fetch(`${API_URL}/api/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          score: gameState.score,
          gameMode: gameState.gameMode
        })
      })

      const result = await response.json()

      if (result.success) {
        // Show success notification
        setPaymentError(null)
        setGameState(prev => ({ ...prev, hasClaimedReward: true }))
        
        // Show transaction notification
        alert(`🎉 Reward claimed! ${result.rewardAmountFormatted} tCRO sent to your wallet.\nTransaction: ${result.txHash}\nView on explorer: https://testnet.cronoscan.com/tx/${result.txHash}`)
      } else {
        throw new Error(result.error || 'Failed to claim reward')
      }
      
    } catch (error) {
      console.error('Error claiming reward:', error)
      setPaymentError(error instanceof Error ? error.message : 'Failed to claim reward')
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
  const paymentPollRef = useRef<IntervalHandle | null>(null)

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
      // Keep hasStarted true so game over screen shows
      hasStarted: true,
    }))
  }, [])

  const sendTapTx = async (bubble: Bubble, score: number) => {
    try {
      // Check if user is authenticated before sending transaction
      const { loadKey } = await import('@/lib/keyCache');
      const cachedKey = loadKey();
      
      if (!cachedKey) {
        // User not authenticated, skip transaction
        return;
      }
      
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
      // Silently fail if user is not authenticated
      if (err instanceof Error && !err.message.includes('No cached private key')) {
        console.error("tap-tx error:", err)
      }
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
          setGameState((currentState) => {
            if (currentState.isPlaying && !currentState.isPaused) {
              bubbleSpawnRef.current = setInterval(spawnBubble, getBubbleSpawnRate(currentState.score)) as unknown as NodeJS.Timeout
            }
            return currentState;
          });
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

  // Start game with payment check
  const startGame = useCallback(async (mode: GameState["gameMode"]) => {
    setPaymentError(null)
    
    // Unlimited mode (survival/timeAttack) is free - no payment check needed
    if (mode === "survival" || mode === "timeAttack") {
      setIsPremium(false)
      setFreePlaysRemaining(null)
      startGameInternal(mode)
      return
    }

    // Normal mode (classic with 3 lives) requires wallet and payment check
    if (mode === "classic") {
      if (!userAddress) {
        setPaymentError('Please connect your wallet first to play normal mode')
        return
      }
      
      try {
        setIsCheckingPayment(true)
        const paymentStatus = await checkPaymentStatus(userAddress)
        
        if (!paymentStatus.allowed) {
          if (paymentStatus.requiresPayment && paymentStatus.invoice) {
            // Show payment UI and wait for payment
            setIsCheckingPayment(false)
            await handlePayment(paymentStatus.invoice, mode)
            return
          } else {
            setPaymentError('Unable to start game. Please try again.')
            setIsCheckingPayment(false)
            return
          }
        }
        
        // Update free plays and premium status
        setIsPremium(paymentStatus.isPremium)
        setFreePlaysRemaining(paymentStatus.freePlayRemaining ?? null)
        setIsCheckingPayment(false)
        
        // Start the game after payment is verified
        startGameInternal(mode)
      } catch (error) {
        console.error('Error starting game:', error)
        setPaymentError(error instanceof Error ? error.message : 'Failed to start game')
        setIsCheckingPayment(false)
      }
    } else {
      // For other modes, start directly
      startGameInternal(mode)
    }
  }, [userAddress, checkPaymentStatus, handlePayment, startGameInternal])

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
                <h3 className="text-xl font-bold text-white mb-2">Normal Mode</h3>
                <p className="text-gray-400 mb-2">3 lives - Earn rewards! (100 points = 1 tCRO)</p>
                <p className="text-xs text-yellow-400 mb-4">💰 Play fee required after free plays</p>
                <Button 
                  onClick={() => startGame("classic")} 
                  disabled={isCheckingPayment}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking Payment...
                    </>
                  ) : (
                    'Play Now'
                  )}
                </Button>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all">
                <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Time Attack</h3>
                <p className="text-gray-400 mb-2">Race against the clock to set a high score!</p>
                <p className="text-xs text-green-400 mb-4">🆓 Free to play - No rewards</p>
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
                <p className="text-gray-400 mb-2">How long can you last? Don't let the bombs get you!</p>
                <p className="text-xs text-green-400 mb-4">🆓 Free to play - No rewards</p>
                <Button 
                  onClick={() => startGame("survival")} 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 transition-opacity"
                >
                  Survive Now
                </Button>
              </div>
            </div>
            
            {/* Payment Status Display */}
            {userAddress && (
              <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Payment Status
                </h2>
                <div className="space-y-2">
                  {isPremium ? (
                    <Badge className="bg-green-600 text-white">Premium Player</Badge>
                  ) : freePlaysRemaining !== null ? (
                    <p className="text-gray-300">
                      Free plays remaining: <span className="font-bold text-blue-400">{freePlaysRemaining}</span>
                    </p>
                  ) : (
                    <p className="text-gray-300">Connect wallet to see payment status</p>
                  )}
                  {paymentError && (
                    <p className="text-red-400 text-sm">{paymentError}</p>
                  )}
                </div>
              </div>
            )}
            
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
              <div className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                <p className="text-sm text-yellow-200">
                  <strong>💰 Rewards:</strong> In Normal Mode (3 lives), earn tCRO rewards! 
                  <br />100 points = 1 tCRO. Rewards are sent directly to your wallet after claiming.
                  <br />Free modes (Time Attack & Survival) don't have rewards.
                </p>
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
                
                {/* Reward Information - Only for normal mode (classic with 3 initial lives) */}
                {/* Debug: initialGameMode={initialGameMode}, initialLives={initialLives}, gameMode={gameState.gameMode} */}
                {initialGameMode === "classic" && (
                  <div className="mb-4 p-4 bg-purple-900/30 rounded-lg border border-purple-500/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Coins className="h-5 w-5 text-yellow-400" />
                      <p className="font-semibold">
                        {rewardAmount && rewardAmount > 0 
                          ? `Reward Available: ${rewardAmount} tCRO`
                          : 'No reward yet'}
                      </p>
                      <p className="text-xs text-gray-400">(100 points = 1 tCRO)</p>
                    </div>
                    {rewardAmount && rewardAmount > 0 && !gameState.hasClaimedReward && (
                      <Button
                        onClick={claimReward}
                        disabled={isClaiming || !userAddress || gameState.score < 100}
                        className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:opacity-90"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Claim {rewardAmount} tCRO
                          </>
                        )}
                      </Button>
                    )}
                    {gameState.hasClaimedReward && (
                      <Badge className="mt-2 bg-green-600">Reward Claimed ✓</Badge>
                    )}
                    {gameState.score < 100 && !gameState.hasClaimedReward && (
                      <p className="text-xs text-yellow-400 mt-2">
                        Score at least 100 points to earn rewards (Current: {gameState.score} points)
                      </p>
                    )}
                  </div>
                )}
                
                {/* Info for other modes - only show if NOT classic with 3 lives */}
                {initialGameMode && initialGameMode !== "classic" && (
                  <div className="mb-4 p-4 bg-blue-900/30 rounded-lg border border-blue-500/50">
                    <p className="text-sm text-blue-300">
                      {initialGameMode === "survival" || initialGameMode === "timeAttack" 
                        ? "🎮 Free play mode - No rewards available"
                        : "No rewards available"}
                    </p>
                  </div>
                )}
                
                {/* Show message if classic mode but not 3 lives (shouldn't happen, but just in case) */}
                {initialGameMode === "classic" && initialLives !== 3 && (
                  <div className="mb-4 p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
                    <p className="text-sm text-yellow-300">
                      ⚠️ Rewards only available in normal mode (3 lives). Current mode has {initialLives} lives.
                    </p>
                  </div>
                )}
                
                {/* Payment Status */}
                {paymentError && (
                  <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/50 text-sm">
                    {paymentError}
                  </div>
                )}
                
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => startGame(gameState.gameMode)} 
                    variant="secondary"
                    disabled={isCheckingPayment}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                  >
                    {isCheckingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Play Again'
                    )}
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
        
        {/* Payment Modal */}
        {showPaymentModal && paymentInvoice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Payment Required</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (paymentPollRef.current) {
                        clearInterval(paymentPollRef.current)
                        paymentPollRef.current = null
                      }
                      setShowPaymentModal(false)
                      setPaymentInvoice(null)
                      setPendingGameMode(null)
                      setPaymentError(null)
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-300 mb-2">Pay 0.01 USDC to continue playing</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Invoice ID: {paymentInvoice.id || 'N/A'}
                  </p>
                  
                  {paymentError && (
                    <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/50 text-sm text-red-300">
                      {paymentError}
                    </div>
                  )}
                  
                  <div className="mb-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-blue-300 mb-2">
                      💡 The payment will be processed automatically by the x402 agent.
                    </p>
                    <p className="text-xs text-gray-400">
                      Waiting for payment verification...
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking payment status...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
