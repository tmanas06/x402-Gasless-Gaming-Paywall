'use client';

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RotateCcw, Smartphone, Wallet, Coins, Loader2 } from 'lucide-react';
import { loadKey } from '@/lib/keyCache';
import { getSigner } from '@/lib/viem';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const GAME_SPEED = 100;
const MIN_CELL_SIZE = 15; // Minimum cell size for mobile
const MAX_GAME_SIZE = 400; // Maximum game area size

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [cellSize, setCellSize] = useState(20);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  const snakeRef = useRef<Position[]>([]);
  const foodRef = useRef<Position>({ x: 0, y: 0 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number>();

  // Generate food at random position
  const generateFood = useCallback(() => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    
    // Make sure food doesn't spawn on snake
    const isOnSnake = snakeRef.current.some(segment => segment.x === x && segment.y === y);
    if (isOnSnake) {
      generateFood();
      return;
    }
    
    foodRef.current = { x, y };
  }, []);

  // Draw the game state
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, GRID_SIZE * cellSize);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(GRID_SIZE * cellSize, i * cellSize);
      ctx.stroke();
    }

    // Draw snake
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#4F46E5' : '#6366F1';
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });

    // Draw food as a circle
    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    const centerX = foodRef.current.x * cellSize + cellSize / 2;
    const centerY = foodRef.current.y * cellSize + cellSize / 2;
    const radius = cellSize / 2 - 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }, [cellSize]);

  // Initialize game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = GRID_SIZE * cellSize;
    canvas.height = GRID_SIZE * cellSize;

    // Reset snake to starting position
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    snakeRef.current = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];

    // Initial food position
    generateFood();
    
    // Reset direction
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    
    // Reset score
    setScore(0);
    setGameOver(false);
    
    // Draw initial state
    drawGame();
  }, [cellSize, drawGame, generateFood]);

  // Game loop effect
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameStep = () => {
      // Update direction
      directionRef.current = nextDirectionRef.current;

      // Move snake
      const head = { ...snakeRef.current[0] };
      
      switch (directionRef.current) {
        case 'UP': head.y--; break;
        case 'DOWN': head.y++; break;
        case 'LEFT': head.x--; break;
        case 'RIGHT': head.x++; break;
      }

      // Check collision with walls
      if (
        head.x < 0 || 
        head.x >= GRID_SIZE || 
        head.y < 0 || 
        head.y >= GRID_SIZE ||
        // Check collision with self
        snakeRef.current.some((segment, index) => 
          index > 0 && segment.x === head.x && segment.y === head.y
        )
      ) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      // Add new head
      const newSnake = [head, ...snakeRef.current];

      // Check if food is eaten
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(prev => prev + 10);
        generateFood();
      } else {
        // Remove tail if no food is eaten
        newSnake.pop();
      }

      snakeRef.current = newSnake;

      // Draw everything
      drawGame();
    };

    const interval = setInterval(gameStep, GAME_SPEED);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, generateFood, drawGame]);

  // Handle responsive canvas sizing
  useLayoutEffect(() => {
    const updateCanvasSize = () => {
      if (!gameAreaRef.current || !canvasRef.current) return;
      
      const containerWidth = Math.min(
        gameAreaRef.current.clientWidth - 32, // Account for padding
        MAX_GAME_SIZE
      );
      
      const calculatedCellSize = Math.max(
        MIN_CELL_SIZE,
        Math.floor(containerWidth / GRID_SIZE)
      );
      
      const gameSize = calculatedCellSize * GRID_SIZE;
      
      canvasRef.current.width = gameSize;
      canvasRef.current.height = gameSize;
      setCellSize(calculatedCellSize);
      
      // Check if mobile device
      setShowMobileControls(window.innerWidth <= 768);
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Initialize game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Update high score when game over
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  // Check wallet connection and calculate reward
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const cachedKey = loadKey();
        if (cachedKey) {
          const signer = getSigner();
          if (signer?.account?.address) {
            setUserAddress(signer.account.address);
          }
        }
      } catch (error) {
        // User not connected
      }
    };
    initializeUser();
  }, []);

  // Calculate reward amount: 100 points = 1 tCRO
  useEffect(() => {
    const tCROAmount = Math.floor(score / 100);
    setRewardAmount(tCROAmount);
  }, [score]);

  // Handle touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !isPlaying) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    
    const diffX = touchStart.x - endX;
    const diffY = touchStart.y - endY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    
    // Determine if the swipe was horizontal or vertical
    if (Math.max(absDiffX, absDiffY) > 10) { // 10px threshold for swipe
      if (absDiffX > absDiffY) {
        // Horizontal swipe
        if (diffX > 0 && directionRef.current !== 'RIGHT') {
          nextDirectionRef.current = 'LEFT';
        } else if (diffX < 0 && directionRef.current !== 'LEFT') {
          nextDirectionRef.current = 'RIGHT';
        }
      } else {
        // Vertical swipe
        if (diffY > 0 && directionRef.current !== 'DOWN') {
          nextDirectionRef.current = 'UP';
        } else if (diffY < 0 && directionRef.current !== 'UP') {
          nextDirectionRef.current = 'DOWN';
        }
      }
    }
    
    setTouchStart(null);
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for arrow keys to stop page scrolling
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (arrowKeys.includes(e.key)) {
        e.preventDefault();
      }

      if (!isPlaying && (e.key === ' ' || e.key === 'Enter')) {
        startGame();
        return;
      }
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);
  
  // Handle direction button clicks
  const handleDirectionClick = (direction: Direction) => {
    if (!isPlaying) return;
    
    // Prevent 180-degree turns
    if (
      (direction === 'UP' && directionRef.current !== 'DOWN') ||
      (direction === 'DOWN' && directionRef.current !== 'UP') ||
      (direction === 'LEFT' && directionRef.current !== 'RIGHT') ||
      (direction === 'RIGHT' && directionRef.current !== 'LEFT')
    ) {
      nextDirectionRef.current = direction;
    }
  };

  const startGame = () => {
    initGame();
    setIsPlaying(true);
    setGameOver(false);
    setHasClaimedReward(false);
    setRewardError(null);
  };

  // Claim reward from backend
  const claimReward = async () => {
    try {
      setIsClaiming(true);
      setRewardError(null);

      if (!userAddress) {
        throw new Error('Please connect your wallet first');
      }

      if (score < 100) {
        throw new Error('Minimum score of 100 required for rewards');
      }

      // Submit score to backend first
      await fetch(`${API_URL}/api/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          score: score,
          isPremium: false,
          gameMode: 'snake'
        })
      });

      // Claim reward from backend
      const response = await fetch(`${API_URL}/api/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          score: score,
          gameMode: 'snake'
        })
      });

      const result = await response.json();

      if (result.success) {
        setRewardError(null);
        setHasClaimedReward(true);
        alert(`🎉 Reward claimed! ${result.rewardAmountFormatted} tCRO sent to your wallet.\nTransaction: ${result.txHash}\nView on explorer: https://testnet.cronoscan.com/tx/${result.txHash}`);
      } else {
        throw new Error(result.error || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setRewardError(error instanceof Error ? error.message : 'Failed to claim reward');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-2xl mx-auto">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <div className="text-xl font-bold text-white">
          Score: <span className="text-yellow-400">{score}</span>
        </div>
        <div className="text-lg text-gray-300">
          High Score: <span className="text-green-400">{highScore}</span>
        </div>
      </div>
      
      <div 
        ref={gameAreaRef}
        className="relative bg-gray-900 rounded-lg overflow-hidden shadow-xl w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas 
          ref={canvasRef}
          className="bg-gray-800 touch-none"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            touchAction: 'none',
          }}
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/95 via-black/90 to-black/95 backdrop-blur-sm p-4 overflow-y-auto">
            {gameOver ? (
              <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                {/* Game Over Header */}
                <div className="text-center mb-6">
                  <div className="inline-block mb-3 p-3 bg-gradient-to-br from-red-600/20 to-red-700/10 rounded-full border border-red-500/30">
                    <span className="text-3xl">☠️</span>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-red-600 to-orange-500 bg-clip-text text-transparent mb-2">
                    Game Over!
                  </h2>
                  <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
                </div>

                {/* Score Display */}
                <div className="mb-6 p-5 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl border border-blue-500/20 shadow-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest">Final Score</p>
                    <p className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {score}
                    </p>
                  </div>
                </div>
                
                {/* Reward Section */}
                {score >= 100 && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-amber-900/40 via-yellow-900/30 to-orange-900/40 rounded-xl border border-yellow-500/30 shadow-lg">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Coins className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Reward Earned</p>
                        <p className="text-2xl font-bold text-yellow-300">
                          {rewardAmount ? `${rewardAmount} tCRO` : 'Calculating...'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 text-center">(100 points = 1 tCRO)</p>
                    
                    {rewardAmount && rewardAmount > 0 && !hasClaimedReward && (
                      <Button
                        onClick={claimReward}
                        disabled={isClaiming || !userAddress || score < 100}
                        className="w-full mt-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600 hover:from-yellow-600 hover:via-amber-600 hover:to-orange-700 text-black font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Claim {rewardAmount} tCRO
                          </>
                        )}
                      </Button>
                    )}
                    
                    {hasClaimedReward && (
                      <div className="w-full mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-center gap-2">
                        <span className="text-2xl">✓</span>
                        <span className="font-semibold text-green-300">Reward Claimed!</span>
                      </div>
                    )}
                    
                    {rewardError && (
                      <div className="w-full mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-xs text-red-300 text-center">{rewardError}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {score < 100 && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-xl border border-cyan-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xl">🎯</span>
                      <p className="text-sm font-semibold text-cyan-300">
                        Score 100+ to earn rewards!
                      </p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min((score / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      {100 - score} more points needed
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <h2 className="text-4xl font-bold text-white mb-2 text-center">Snake Game</h2>
            )}
            
            <p className="text-gray-300 text-center mb-8 max-w-md text-sm">
              {showMobileControls 
                ? 'Swipe or use the on-screen controls to move the snake.'
                : 'Use arrow keys or WASD to move the snake.'
              }
            </p>
            
            <Button 
              onClick={startGame}
              className="px-8 py-4 text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 hover:from-green-500 hover:via-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              {gameOver ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {gameOver ? 'Play Again' : 'Start Game'}
            </Button>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      {showMobileControls && isPlaying && (
        <div className="mt-6 w-full max-w-md">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-start-2">
              <button
                onClick={() => handleDirectionClick('UP')}
                className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center"
                aria-label="Move Up"
              >
                <ArrowUp className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDirectionClick('LEFT')}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center"
              aria-label="Move Left"
            >
              <ArrowLeft className="w-8 h-8 text-white" />
            </button>
            <div className="p-4 bg-gray-900 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-gray-500" />
            </div>
            <button
              onClick={() => handleDirectionClick('RIGHT')}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center"
              aria-label="Move Right"
            >
              <ArrowRight className="w-8 h-8 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="col-start-2">
              <button
                onClick={() => handleDirectionClick('DOWN')}
                className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center"
                aria-label="Move Down"
              >
                <ArrowDown className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-gray-400">
            Swipe or tap buttons to control
          </p>
        </div>
      )}
      
      {/* Desktop Instructions */}
      {!showMobileControls && (
        <div className="mt-6 text-center text-gray-400">
          <p className="mb-3">Use arrow keys or WASD to control the snake</p>
          <div className="flex justify-center gap-2">
            <div className="p-2 bg-gray-800 rounded">
              <ArrowUp className="w-5 h-5" />
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="ml-2 p-2 bg-gray-800 rounded">
              <span className="text-sm">WASD</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Swipe or use the on-screen controls on mobile devices</p>
      </div>
    </div>
  );
}
