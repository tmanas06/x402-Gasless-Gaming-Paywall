interface UserStats {
  address: string;
  totalScore: number;
  bestScore: number;
  gamesPlayed: number;
  isPremium: boolean;
  lastPlayed: number;
}

interface GameData {
  gameId: string;
  levelDifficulty: number;
  rewards: string[];
  powerUps: string[];
}

export class GameService {
  private freePlayCounts: Map<string, number> = new Map();
  private userStats: Map<string, UserStats> = new Map();
  private scores: Array<{ address: string; score: number; isPremium: boolean; timestamp: number }> = [];

  initialize() {
    console.log("Game service initialized");
  }

  getFreePlayCount(address: string): number {
    return this.freePlayCounts.get(address.toLowerCase()) || 0;
  }

  incrementFreePlayCount(address: string): void {
    const current = this.getFreePlayCount(address);
    this.freePlayCounts.set(address.toLowerCase(), current + 1);
  }

  getGameData(address: string, isPremium: boolean): GameData {
    return {
      gameId: `game_${Date.now()}`,
      levelDifficulty: isPremium ? 2 : 1,
      rewards: isPremium ? ["xp", "coins", "gem"] : ["xp"],
      powerUps: isPremium
        ? ["shield", "timefreeze", "doubletap", "multiplier"]
        : ["shield"],
    };
  }

  async getUserStats(address: string): Promise<UserStats> {
    const addr = address.toLowerCase();

    if (!this.userStats.has(addr)) {
      this.userStats.set(addr, {
        address: addr,
        totalScore: 0,
        bestScore: 0,
        gamesPlayed: 0,
        isPremium: false,
        lastPlayed: 0,
      });
    }

    return this.userStats.get(addr)!;
  }

  async recordScore(
    address: string,
    score: number,
    isPremium: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      const addr = address.toLowerCase();
      const stats = await this.getUserStats(addr);

      // Update stats
      stats.totalScore += score;
      if (score > stats.bestScore) {
        stats.bestScore = score;
      }
      stats.gamesPlayed += 1;
      stats.isPremium = isPremium;
      stats.lastPlayed = Date.now();

      // Record score
      this.scores.push({
        address: addr,
        score,
        isPremium,
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: `Score recorded: ${score}`,
      };
    } catch (error) {
      console.error("Error recording score:", error);
      return {
        success: false,
        message: "Failed to record score",
      };
    }
  }

  getLeaderboard(limit: number = 10): UserStats[] {
    return Array.from(this.userStats.values())
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, limit);
  }
}
