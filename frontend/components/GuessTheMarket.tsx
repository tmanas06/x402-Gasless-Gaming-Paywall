'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowUp, ArrowDown, Loader2, RotateCcw, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSigner } from '@/lib/viem'
import { loadKey } from '@/lib/keyCache'

interface CryptoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap_change_percentage_24h: number
}

interface GuessResult {
  isCorrect: boolean
  startPrice: number
  endPrice: number
  userGuess: string
  actualDirection: string
  pointsEarned: number
}

export default function GuessTheMarket() {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([])
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoPrice | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [userGuess, setUserGuess] = useState<'up' | 'down' | null>(null)
  const [isGuessing, setIsGuessing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [result, setResult] = useState<GuessResult | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guessHistory, setGuessHistory] = useState<GuessResult[]>([])
  
  // In development, always use localhost:5000 for backend
  // In production, use NEXT_PUBLIC_BACKEND_URL or fallback to same origin + /api
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
    (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000'
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'))
  const countdownInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize user and fetch cryptos
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Get user address
        const cachedKey = loadKey()
        if (cachedKey) {
          const signer = getSigner()
          if (signer?.account?.address) {
            setUserAddress(signer.account.address)
          }
        }

        // Fetch available cryptos
        const response = await fetch(`${API_URL}/api/market/cryptos`)
        const data = await response.json()

        if (data.success && data.cryptos) {
          setCryptos(data.cryptos)
          if (data.cryptos.length > 0) {
            setSelectedCrypto(data.cryptos[0])
            setCurrentPrice(data.cryptos[0].current_price)
          }
        }
      } catch (err) {
        setError('Failed to load game data')
        console.error('Initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeGame()
  }, [])

  // Handle crypto selection
  const handleSelectCrypto = async (crypto: CryptoPrice) => {
    setSelectedCrypto(crypto)
    setCurrentPrice(crypto.current_price)
    setUserGuess(null)
    setResult(null)

    // Fetch latest price
    try {
      const response = await fetch(`${API_URL}/api/market/price/${crypto.id}`)
      const data = await response.json()
      if (data.success) {
        setCurrentPrice(data.current_price)
        setSelectedCrypto({
          ...crypto,
          current_price: data.current_price,
        })
      }
    } catch (err) {
      console.error('Error fetching price:', err)
    }
  }

  // Submit guess
  const handleSubmitGuess = async (guess: 'up' | 'down') => {
    if (!selectedCrypto || !currentPrice || !userAddress) {
      setError('Missing required data')
      return
    }

    try {
      setIsGuessing(true)
      setUserGuess(guess)
      setCountdown(10)
      setError(null)

      // Start countdown
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownInterval.current) clearInterval(countdownInterval.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Submit guess to backend
      const response = await fetch(`${API_URL}/api/market/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          crypto: selectedCrypto.id,
          startPrice: currentPrice,
          guess: guess,
          duration: 10,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit guess')
      }

      // Wait 10 seconds for result (simulated)
      // In production, use WebSocket or SSE
      setTimeout(async () => {
        // Fetch the updated price
        try {
          const priceResponse = await fetch(`${API_URL}/api/market/price/${selectedCrypto.id}`)
          const priceData = await priceResponse.json()

          if (priceData.success) {
            const endPrice = priceData.current_price
            const actualDirection = endPrice > currentPrice ? 'up' : endPrice < currentPrice ? 'down' : 'same'
            const isCorrect = (guess === 'up' && actualDirection === 'up') || (guess === 'down' && actualDirection === 'down')
            const pointsEarned = isCorrect ? 10 : -10

            const guessResult: GuessResult = {
              isCorrect,
              startPrice: currentPrice,
              endPrice,
              userGuess: guess,
              actualDirection,
              pointsEarned,
            }

            setResult(guessResult)
            setTotalPoints((prev) => prev + pointsEarned)
            setGuessHistory((prev) => [guessResult, ...prev])

            if (countdownInterval.current) clearInterval(countdownInterval.current)
            setCountdown(0)
          }
        } catch (err) {
          console.error('Error getting result:', err)
          setError('Failed to get result')
        } finally {
          setIsGuessing(false)
        }
      }, 10000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit guess')
      setIsGuessing(false)
      if (countdownInterval.current) clearInterval(countdownInterval.current)
    }
  }

  const handlePlayAgain = () => {
    setUserGuess(null)
    setResult(null)
    setCountdown(0)
    setIsGuessing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 via-purple-950 to-gray-950 text-white p-4 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Guess the Market
            </h1>
            <TrendingDown className="w-8 h-8 text-pink-400" />
          </div>
          <p className="text-lg text-gray-300 mb-2">Predict crypto price movements and earn points!</p>
          <Badge className="bg-cyan-500/30 border-cyan-400/50 text-cyan-300">
            💰 {totalPoints > 0 ? '+' : ''}{totalPoints} Points
          </Badge>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/50 flex items-center gap-2 text-red-300">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Crypto Selection */}
          <div className="md:col-span-1">
            <Card className="bg-gray-900/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-300">Available Cryptos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {cryptos.map((crypto) => (
                  <button
                    key={crypto.id}
                    onClick={() => handleSelectCrypto(crypto)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedCrypto?.id === crypto.id
                        ? 'bg-cyan-600/30 border-cyan-400 shadow-lg shadow-cyan-500/50'
                        : 'bg-gray-800/40 border-gray-700/50 hover:border-cyan-400/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{crypto.name}</div>
                        <div className="text-sm text-gray-400">${crypto.current_price.toFixed(2)}</div>
                      </div>
                      <div className={`text-sm font-bold ${crypto.market_cap_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.market_cap_change_percentage_24h >= 0 ? '+' : ''}{crypto.market_cap_change_percentage_24h.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center: Game Area */}
          <div className="md:col-span-2">
            {!isGuessing && !result && (
              <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-2 border-purple-500/50">
                <CardHeader>
                  <CardTitle className="text-center text-white">
                    {selectedCrypto?.name} Price Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Price */}
                  <div className="text-center">
                    <div className="text-5xl font-bold text-cyan-400 mb-2">
                      ${currentPrice?.toFixed(2)}
                    </div>
                    <p className="text-gray-400">Current Price</p>
                  </div>

                  {/* Prediction Question */}
                  <div className="bg-gray-800/60 p-6 rounded-xl border border-purple-500/30 text-center">
                    <p className="text-lg font-semibold text-purple-300 mb-4">
                      Will {selectedCrypto?.name} go UP or DOWN in the next 10 seconds?
                    </p>
                    <p className="text-sm text-gray-400">
                      Correct prediction: +10 points | Wrong prediction: -10 points
                    </p>
                  </div>

                  {/* Guess Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSubmitGuess('up')}
                      className="p-6 rounded-xl bg-gradient-to-br from-green-600/30 to-emerald-600/30 border-2 border-green-500/50 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105"
                    >
                      <ArrowUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <div className="font-bold text-green-300">Predict UP</div>
                    </button>
                    <button
                      onClick={() => handleSubmitGuess('down')}
                      className="p-6 rounded-xl bg-gradient-to-br from-red-600/30 to-pink-600/30 border-2 border-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105"
                    >
                      <ArrowDown className="w-8 h-8 mx-auto mb-2 text-red-400" />
                      <div className="font-bold text-red-300">Predict DOWN</div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isGuessing && !result && (
              <Card className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border-2 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-center text-white">Evaluating Your Guess...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-cyan-300 mb-4">{countdown} seconds</div>
                    <p className="text-gray-300">
                      Your prediction: <span className="font-bold text-cyan-400">{userGuess?.toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Live price updates */}
                  <div className="bg-gray-800/60 p-4 rounded-xl border border-cyan-500/30 text-center">
                    <p className="text-sm text-gray-400 mb-2">Current Price</p>
                    <p className="text-2xl font-bold text-cyan-400">${currentPrice?.toFixed(2)}</p>
                  </div>

                  <p className="text-center text-sm text-gray-400">
                    Waiting for price confirmation... Please don't leave this page.
                  </p>
                </CardContent>
              </Card>
            )}

            {result && (
              <Card className={`bg-gradient-to-br border-2 ${
                result.isCorrect
                  ? 'from-green-900/50 to-emerald-900/50 border-green-500/50'
                  : 'from-red-900/50 to-pink-900/50 border-red-500/50'
              }`}>
                <CardHeader>
                  <CardTitle className="text-center text-white">
                    {result.isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Result Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/60 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-400 mb-2">Start Price</p>
                      <p className="text-2xl font-bold text-blue-400">${result.startPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-800/60 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-400 mb-2">End Price</p>
                      <p className="text-2xl font-bold text-blue-400">${result.endPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Price Change */}
                  <div className="bg-gray-800/60 p-4 rounded-lg text-center border border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-2">Price Direction</p>
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">You Predicted</p>
                        <div className={`flex items-center gap-1 ${result.userGuess === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {result.userGuess === 'up' ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                          <span className="font-bold text-lg">{result.userGuess.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="text-gray-500">vs</div>
                      <div>
                        <p className="text-xs text-gray-500">Actual Direction</p>
                        <div className={`flex items-center gap-1 ${result.actualDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {result.actualDirection === 'up' ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                          <span className="font-bold text-lg">{result.actualDirection.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className={`p-4 rounded-lg text-center border-2 ${
                    result.pointsEarned > 0
                      ? 'bg-green-900/30 border-green-500/50'
                      : 'bg-red-900/30 border-red-500/50'
                  }`}>
                    <p className="text-sm text-gray-400 mb-2">Points</p>
                    <div className={`text-4xl font-bold ${result.pointsEarned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.pointsEarned > 0 ? '+' : ''}{result.pointsEarned}
                    </div>
                  </div>

                  {/* Play Again Button */}
                  <Button
                    onClick={handlePlayAgain}
                    className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Play Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* History */}
        {guessHistory.length > 0 && (
          <div className="mt-8">
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-purple-300">Recent Guesses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {guessHistory.slice(0, 10).map((guess, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-3">
                        {guess.isCorrect ? (
                          <div className="text-green-400">✓</div>
                        ) : (
                          <div className="text-red-400">✗</div>
                        )}
                        <div>
                          <p className="text-sm font-semibold">
                            Predicted {guess.userGuess.toUpperCase()}: {guess.startPrice.toFixed(2)} → {guess.endPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {guess.actualDirection === 'up' ? '📈' : '📉'} Went {guess.actualDirection.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${guess.pointsEarned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {guess.pointsEarned > 0 ? '+' : ''}{guess.pointsEarned}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
