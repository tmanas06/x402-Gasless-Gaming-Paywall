'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { getSigner, publicClient } from '@/lib/viem'
import { Button } from '@/components/ui/button'
import { v4 as uuidv4 } from 'uuid'
import { ArrowLeft, ArrowRight, RotateCcw, Play, Pause } from 'lucide-react'

type ObjectType = 'coin' | 'bomb' | 'freeze'

interface FallingObject {
  id: string
  x: number
  y: number
  speed: number
  type: ObjectType
}

interface GameState {
  score: number
  lives: number
  isPlaying: boolean
  isPaused: boolean
  hasStarted: boolean
  objects: FallingObject[]
  freezeActive: boolean
  gameOver: boolean
  gameWon: boolean
  level: number
}

const CryptoDodger = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    lives: 3,
    level: 1,
    objects: [],
    freezeActive: false,
    gameOver: false,
    gameWon: false,
    hasStarted: false
  })

  const [playerX, setPlayerX] = useState(150)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameIdRef = useRef<string>('')
  const playerSize = 40
  const [gameWidth, setGameWidth] = useState(300)
  const [gameHeight, setGameHeight] = useState(500)
  const moveStep = 20
  const playerSpeed = 8

  const animationRef = useRef<number>()
  const lastObjectTimeRef = useRef<number>(0)

  // Initialize game ID
  useEffect(() => {
    if (!gameIdRef.current) {
      gameIdRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
    }
    return () => {
      gameIdRef.current = ''
    }
  }, [])

  const spawnObject = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const type: ObjectType =
      Math.random() < 0.1 ? 'freeze' : Math.random() < 0.7 ? 'coin' : 'bomb'

    const obj: FallingObject = {
      id: uuidv4(),
      x: Math.random() * (gameWidth - 30),
      y: 0,
      speed: type === 'freeze' ? 2 : 3 + Math.random() * 2,
      type,
    }

    setGameState((prev) => ({
      ...prev,
      objects: [...prev.objects, obj],
    }))
  }, [gameState.isPlaying, gameState.isPaused, gameWidth])

  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const now = Date.now()
    const timeSinceLastObject = now - lastObjectTimeRef.current

    // Spawn new objects
    if (timeSinceLastObject > 1000) {
      spawnObject()
      lastObjectTimeRef.current = now
    }

    // Update object positions
    setGameState((prev) => {
      const newObjects = prev.objects
        .map((obj) => ({
          ...obj,
          y: obj.y + (prev.freezeActive ? obj.speed * 0.3 : obj.speed), // Slow down objects when freeze is active
        }))
        .filter((obj) => obj.y < gameHeight)

      // Check for collisions
      const playerRect = {
        x: playerX,
        y: gameHeight - playerSize,
        width: playerSize,
        height: playerSize,
      }

      let score = prev.score
      let lives = prev.lives
      let freezeActive = prev.freezeActive
      let objects = [...newObjects]

      // Check for collisions with player
      objects = objects.filter((obj) => {
        const objRect = {
          x: obj.x,
          y: obj.y,
          width: 30,
          height: 30,
        }

        if (isColliding(playerRect, objRect)) {
          if (obj.type === 'coin') {
            score += 10
            return false // Remove the coin
          } else if (obj.type === 'bomb') {
            lives--
            return false // Remove the bomb
          } else if (obj.type === 'freeze') {
            freezeActive = true
            setTimeout(() => {
              setGameState((prev) => ({ ...prev, freezeActive: false }))
            }, 5000)
            return false // Remove the freeze power-up
          }
        }
        return true // Keep objects that didn't collide
      })

      // Game over condition
      if (lives <= 0) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        return {
          ...prev,
          isPlaying: false,
          lives: 0,
          score,
          objects: [],
        }
      }

      return {
        ...prev,
        objects,
        score,
        lives,
        freezeActive,
      }
    })

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.isPlaying, gameState.isPaused, gameState.freezeActive, playerX, spawnObject, gameHeight])

  const togglePause = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }))
  }, [])

  // Collision detection helper
  const isColliding = (rect1: {x: number, y: number, width: number, height: number}, 
                      rect2: {x: number, y: number, width: number, height: number}) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }

  const startGame = useCallback(() => {
    setGameState({
      score: 0,
      lives: 3,
      isPlaying: true,
      isPaused: false,
      hasStarted: true,
      objects: [],
      freezeActive: false,
      gameOver: false,
      gameWon: false,
      level: 1
    })
    setPlayerX(gameWidth / 2 - playerSize / 2)
    lastObjectTimeRef.current = Date.now()
    gameLoop()
  }, [gameWidth, gameLoop])

  const resetGame = useCallback(() => {
    setGameState({
      score: 0,
      lives: 3,
      isPlaying: false,
      isPaused: false,
      hasStarted: false,
      objects: [],
      freezeActive: false,
      gameOver: false,
      gameWon: false,
      level: 1
    })
    setPlayerX(150) // Reset player position
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const sendTx = async (event: 'coin' | 'bonus', score: number) => {
    try {
      const signer = getSigner()
      const payload = {
        gid: gameIdRef.current ?? crypto.randomUUID(),
        score,
        event,
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
      console.error("tx error", err)
    }
  }

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isPlaying || gameState.isPaused) return

      switch (e.key) {
        case 'ArrowLeft':
          setPlayerX((prev) => Math.max(0, prev - moveStep))
          break
        case 'ArrowRight':
          setPlayerX((prev) => Math.min(gameWidth - playerSize, prev + moveStep))
          break
        case ' ':
        case 'Spacebar':
          togglePause()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState.isPlaying, gameState.isPaused, togglePause, moveStep, gameWidth, playerSize])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        if (rect) {
          setGameWidth(rect.width)
          setGameHeight(rect.height)
        }
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Start/stop game loop when playing/paused changes
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameLoop()
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.isPlaying, gameState.isPaused, gameLoop])

  // Game over overlay
  const gameOverOverlay = useMemo(() => {
    if (!gameState.hasStarted || gameState.isPlaying) return null

    return (
      <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
        <h2 className="text-3xl font-bold text-white mb-4">
          {gameState.lives <= 0 ? 'Game Over!' : 'Crypto Dodger'}
        </h2>
        <p className="text-xl text-white mb-6">Score: {gameState.score}</p>
        <Button
          onClick={gameState.lives <= 0 ? resetGame : startGame}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full"
        >
          {gameState.lives <= 0 ? 'Play Again' : 'Start Game'}
        </Button>
      </div>
    )
  }, [gameState.hasStarted, gameState.isPlaying, gameState.score, gameState.lives, resetGame, startGame])

  // Instructions
  const instructions = useMemo(() => (
    <div className="mt-4 text-center text-gray-300 text-sm">
      <p className="mb-2">
        <span className="text-yellow-400">🪙 Coins:</span> +10 points | 
        <span className="text-red-400"> 💣 Bombs:</span> -1 life | 
        <span className="text-blue-300"> ❄️ Freeze:</span> Slow down objects
      </p>
      <p>Use <span className="font-mono bg-gray-700 px-2 py-1 rounded">← →</span> to move | 
      <span className="font-mono bg-gray-700 px-2 py-1 rounded ml-2">Space</span> to pause</p>
    </div>
  ), [])

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2 text-white">Crypto Dodger 🚀</h1>
      
      <div className="relative">
        <div
          ref={gameAreaRef}
          className="relative bg-gray-800 border-2 border-gray-700 rounded-lg overflow-hidden"
          style={{ width: gameWidth, height: gameHeight }}
        >
          {/* Player */}
          <div
            className="absolute bg-gradient-to-r from-green-400 to-emerald-500 rounded-md shadow-lg"
            style={{
              width: playerSize,
              height: playerSize,
              bottom: 10,
              left: playerX,
              transition: 'left 0.1s ease-out',
              zIndex: 5,
            }}
          />

          {/* Falling objects */}
          {gameState.objects.map((obj) => (
            <div
              key={obj.id}
              className="absolute rounded-full shadow-md flex items-center justify-center"
              style={{
                width: 30,
                height: 30,
                left: obj.x,
                top: obj.y,
                backgroundColor:
                  obj.type === 'coin' 
                    ? 'rgba(255, 215, 0, 0.9)' 
                    : obj.type === 'bomb' 
                    ? 'rgba(255, 68, 68, 0.9)' 
                    : 'rgba(0, 255, 255, 0.9)',
                transition: 'transform 0.1s ease-out',
                transform: gameState.freezeActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {obj.type === 'coin' && '🪙'}
              {obj.type === 'bomb' && '💣'}
              {obj.type === 'freeze' && '❄️'}
            </div>
          ))}

          {gameOverOverlay}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden mt-4 flex justify-center gap-4">
          <button
            onClick={() => setPlayerX(prev => Math.max(0, prev - moveStep))}
            className="p-4 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            aria-label="Move left"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={gameState.isPlaying ? togglePause : startGame}
            className="p-4 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
            aria-label={gameState.isPlaying ? 'Pause' : 'Start'}
          >
            {gameState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button
            onClick={() => setPlayerX(prev => Math.min(gameWidth - playerSize, prev + moveStep))}
            className="p-4 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            aria-label="Move right"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="mt-4 text-white flex flex-col items-center">
        <div className="flex gap-8 mb-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{gameState.score}</div>
            <div className="text-sm text-gray-400">Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{gameState.lives} ❤️</div>
            <div className="text-sm text-gray-400">Lives</div>
          </div>
        </div>
        
        {gameState.freezeActive && (
          <div className="text-blue-300 font-medium flex items-center gap-2 mb-2">
            <span className="text-xl">❄️</span> Freeze Active!
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {!gameState.isPlaying ? (
          <Button 
            onClick={startGame} 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            size="lg"
          >
            {gameState.hasStarted ? 'Play Again' : 'Start Game'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={togglePause} 
              variant="outline" 
              className="gap-2"
              size="sm"
            >
              {gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {gameState.isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              onClick={resetGame} 
              variant="outline" 
              className="gap-2"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        )}
      </div>

      {instructions}
    </div>
  )
}

export default CryptoDodger
