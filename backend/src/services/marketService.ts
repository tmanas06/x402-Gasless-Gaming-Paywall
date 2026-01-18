import axios from "axios";

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap_change_percentage_24h: number;
  timestamp: number;
  image?: string;
}

interface PriceSnapshot {
  crypto: string;
  price: number;
  timestamp: number;
}

interface GuessRecord {
  id: string;
  address: string;
  crypto: string;
  startPrice: number;
  endPrice: number;
  userGuess: "up" | "down";
  isCorrect: boolean;
  pointsEarned: number;
  timestamp: number;
  duration: number; // seconds
}

export class MarketService {
  private guessRecords: Map<string, GuessRecord> = new Map();
  private priceSnapshots: Map<string, PriceSnapshot[]> = new Map();
  private userGuesses: Map<string, GuessRecord[]> = new Map();
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";
  private readonly CORRECT_POINTS = 10;
  private readonly WRONG_POINTS = -10;

  // Supported cryptos with CoinGecko IDs
  private supportedCryptos: { [key: string]: { id: string; name: string } } = {
    bitcoin: { id: "bitcoin", name: "Bitcoin" },
    ethereum: { id: "ethereum", name: "Ethereum" },
    cardano: { id: "cardano", name: "Cardano" },
    solana: { id: "solana", name: "Solana" },
    ripple: { id: "ripple", name: "XRP" },
    polkadot: { id: "polkadot", name: "Polkadot" },
    dogecoin: { id: "dogecoin", name: "Dogecoin" },
    litecoin: { id: "litecoin", name: "Litecoin" },
    chainlink: { id: "chainlink", name: "Chainlink" },
    uniswap: { id: "uniswap", name: "Uniswap" },
  };

  constructor() {
    console.log("✓ Market Service initialized with CoinGecko API");
  }

  /**
   * Get list of available cryptos
   */
  async getAvailableCryptos(): Promise<CryptoPrice[]> {
    try {
      const ids = Object.values(this.supportedCryptos)
        .map((c) => c.id)
        .join(",");

      const response = await axios.get(`${this.COINGECKO_API}/simple/price`, {
        params: {
          ids: ids,
          vs_currencies: "usd",
          include_market_cap_change_percentage: "24h",
          include_last_updated_at: "true",
          order: "market_cap_desc",
        },
      });

      const cryptos: CryptoPrice[] = [];

      for (const [cryptoId, data] of Object.entries(response.data) as any[]) {
        const cryptoInfo = Object.values(this.supportedCryptos).find(
          (c) => c.id === cryptoId
        );
        if (cryptoInfo) {
          cryptos.push({
            id: cryptoId,
            symbol: cryptoId.toUpperCase().slice(0, 3),
            name: cryptoInfo.name,
            current_price: data.usd,
            market_cap_change_percentage_24h:
              data.usd_market_cap_change_percentage_24h || 0,
            timestamp: Date.now(),
            image: `https://assets.coingecko.com/coins/images/${this.getCoinImageId(
              cryptoId
            )}/large/`,
          });
        }
      }

      return cryptos.sort(
        (a, b) => b.current_price * 1000 - a.current_price * 1000
      );
    } catch (error) {
      console.error("Error fetching cryptos:", error);
      throw new Error("Failed to fetch cryptocurrency prices");
    }
  }

  /**
   * Get current price of specific crypto
   */
  async getCurrentPrice(cryptoId: string): Promise<CryptoPrice> {
    try {
      const cryptoInfo = this.supportedCryptos[cryptoId.toLowerCase()];
      if (!cryptoInfo) {
        throw new Error(`Unsupported cryptocurrency: ${cryptoId}`);
      }

      const response = await axios.get(`${this.COINGECKO_API}/simple/price`, {
        params: {
          ids: cryptoInfo.id,
          vs_currencies: "usd",
          include_market_cap_change_percentage: "24h",
        },
      });

      const data = response.data[cryptoInfo.id];
      if (!data) {
        throw new Error(`No price data for ${cryptoId}`);
      }

      return {
        id: cryptoInfo.id,
        symbol: cryptoId.toUpperCase().slice(0, 3),
        name: cryptoInfo.name,
        current_price: data.usd,
        market_cap_change_percentage_24h:
          data.usd_market_cap_change_percentage_24h || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error fetching price for", cryptoId, error);
      throw error;
    }
  }

  /**
   * Record a price snapshot for later verification
   */
  recordPriceSnapshot(cryptoId: string, price: number): void {
    const key = cryptoId.toLowerCase();
    if (!this.priceSnapshots.has(key)) {
      this.priceSnapshots.set(key, []);
    }

    const snapshots = this.priceSnapshots.get(key)!;
    snapshots.push({
      crypto: key,
      price: price,
      timestamp: Date.now(),
    });

    // Keep only last 100 snapshots per crypto
    if (snapshots.length > 100) {
      snapshots.shift();
    }
  }

  /**
   * Submit a guess and evaluate it after waiting
   */
  async submitGuess(
    guessId: string,
    address: string,
    cryptoId: string,
    startPrice: number,
    userGuess: "up" | "down",
    duration: number = 10
  ): Promise<{
    id: string;
    isCorrect: boolean;
    startPrice: number;
    endPrice: number;
    userGuess: string;
    actualDirection: string;
    pointsEarned: number;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        // Record initial price
        this.recordPriceSnapshot(cryptoId, startPrice);

        // Wait for specified duration
        setTimeout(async () => {
          try {
            // Get price after duration
            const endPriceData = await this.getCurrentPrice(cryptoId);
            const endPrice = endPriceData.current_price;

            // Record end price
            this.recordPriceSnapshot(cryptoId, endPrice);

            // Determine if price went up or down
            const actualDirection =
              endPrice > startPrice ? "up" : endPrice < startPrice ? "down" : "same";

            // Check if user was correct
            const isCorrect =
              (userGuess === "up" && actualDirection === "up") ||
              (userGuess === "down" && actualDirection === "down");

            const pointsEarned = isCorrect ? this.CORRECT_POINTS : this.WRONG_POINTS;

            // Record guess
            const record: GuessRecord = {
              id: guessId,
              address: address.toLowerCase(),
              crypto: cryptoId.toLowerCase(),
              startPrice,
              endPrice,
              userGuess,
              isCorrect,
              pointsEarned,
              timestamp: Date.now(),
              duration,
            };

            this.guessRecords.set(guessId, record);

            // Track user guesses
            const userKey = address.toLowerCase();
            if (!this.userGuesses.has(userKey)) {
              this.userGuesses.set(userKey, []);
            }
            this.userGuesses.get(userKey)!.push(record);

            console.log(
              `[Market Guess] ${cryptoId}: ${startPrice} → ${endPrice} (${actualDirection})`
            );
            console.log(
              `[Market Guess] User guessed: ${userGuess}, Correct: ${isCorrect}, Points: ${pointsEarned}`
            );

            resolve({
              id: guessId,
              isCorrect,
              startPrice,
              endPrice,
              userGuess,
              actualDirection,
              pointsEarned,
            });
          } catch (error) {
            console.error("Error evaluating guess:", error);
            reject(error);
          }
        }, duration * 1000);
      } catch (error) {
        console.error("Error submitting guess:", error);
        reject(error);
      }
    });
  }

  /**
   * Get guess history for user
   */
  getUserGuesses(address: string): GuessRecord[] {
    return this.userGuesses.get(address.toLowerCase()) || [];
  }

  /**
   * Get user statistics
   */
  getUserStats(address: string): {
    totalGuesses: number;
    correctGuesses: number;
    wrongGuesses: number;
    totalPoints: number;
    winRate: number;
  } {
    const guesses = this.getUserGuesses(address);

    const correct = guesses.filter((g) => g.isCorrect).length;
    const wrong = guesses.length - correct;
    const totalPoints = guesses.reduce((sum, g) => sum + g.pointsEarned, 0);

    return {
      totalGuesses: guesses.length,
      correctGuesses: correct,
      wrongGuesses: wrong,
      totalPoints,
      winRate: guesses.length > 0 ? (correct / guesses.length) * 100 : 0,
    };
  }

  /**
   * Get global leaderboard
   */
  getLeaderboard(limit: number = 10): Array<{
    address: string;
    totalPoints: number;
    correctGuesses: number;
    totalGuesses: number;
  }> {
    const leaderboard = new Map<
      string,
      {
        totalPoints: number;
        correctGuesses: number;
        totalGuesses: number;
      }
    >();

    for (const [address, guesses] of this.userGuesses.entries()) {
      const correct = guesses.filter((g) => g.isCorrect).length;
      const totalPoints = guesses.reduce((sum, g) => sum + g.pointsEarned, 0);

      leaderboard.set(address, {
        totalPoints,
        correctGuesses: correct,
        totalGuesses: guesses.length,
      });
    }

    return Array.from(leaderboard.entries())
      .map(([address, stats]) => ({
        address,
        ...stats,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }

  /**
   * Helper: Get CoinGecko coin image ID
   */
  private getCoinImageId(cryptoId: string): string {
    const imageIds: { [key: string]: string } = {
      bitcoin: "1",
      ethereum: "279",
      cardano: "975",
      solana: "11014",
      ripple: "24",
      polkadot: "12171",
      dogecoin: "5",
      litecoin: "2",
      chainlink: "1975",
      uniswap: "12191",
    };
    return imageIds[cryptoId] || "1";
  }
}
