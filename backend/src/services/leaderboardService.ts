import axios from 'axios';
import { ethers } from 'ethers';
import { RewardService } from './rewardService';

interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  lastRewardTime: number;
  totalRewards: number;
}

export class LeaderboardService {
  private provider: ethers.Provider;
  private rewardService: RewardService;
  private readonly REWARD_RATE = 100; // 100 points = 1 tCRO
  
  // BlockScout API endpoints (try multiple)
  private readonly BLOCKSCOUT_APIS = [
    'https://testnet.cronoscan.com/api',
    'https://cronos.org/explorer/testnet3/api',
  ];
  private readonly CROSCAN_API_KEY = process.env.CROSCAN_API_KEY || '';

  constructor(rewardService: RewardService) {
    const rpcUrl = process.env.CRONOS_TESTNET_RPC || "https://evm-t3.cronos.org";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.rewardService = rewardService;
  }

  /**
   * Method 1: Get leaderboard from in-memory rewards (fastest, most reliable)
   */
  private getLeaderboardFromMemory(limit: number): LeaderboardEntry[] {
    try {
      const rewards = this.rewardService.getLeaderboardFromMemory(limit);
      return rewards.map(entry => ({
        address: entry.address,
        totalPoints: entry.totalPoints,
        lastRewardTime: entry.lastRewardTime,
        totalRewards: entry.totalRewards,
      }));
    } catch (error) {
      console.error('Error getting leaderboard from memory:', error);
      return [];
    }
  }

  /**
   * Method 2: Query BlockScout API for native CRO transfers
   */
  private async getLeaderboardFromBlockScout(limit: number): Promise<LeaderboardEntry[]> {
    const rewardWalletAddress = this.rewardService.getRewardWalletAddress();
    
    for (const apiUrl of this.BLOCKSCOUT_APIS) {
      try {
        console.log(`Trying BlockScout API: ${apiUrl}`);
        console.log(`Querying transactions FROM: ${rewardWalletAddress}`);

        // Use 'txlist' for native CRO transfers (not 'tokentx')
        const response = await axios.get(apiUrl, {
          params: {
            module: 'account',
            action: 'txlist', // Changed from 'tokentx' to 'txlist' for native transfers
            address: rewardWalletAddress, // Query FROM the reward wallet
            startblock: 0,
            endblock: 99999999,
            sort: 'desc',
            apikey: this.CROSCAN_API_KEY || undefined
          },
          timeout: 30000,
          validateStatus: () => true
        });

        console.log(`BlockScout API response status: ${response.status}`);
        
        if (response.status !== 200) {
          console.warn(`API returned status ${response.status}, trying next endpoint...`);
          continue;
        }

        if (!response.data || typeof response.data !== 'object') {
          console.warn('Invalid response format, trying next endpoint...');
          continue;
        }

        // Handle API error status
        if (response.data.status !== '1') {
          console.warn(`API returned status '${response.data.status}': ${response.data.message}`);
          if (response.data.message?.includes('No transactions found')) {
            // This is okay - just means no transactions yet
            return [];
          }
          continue; // Try next API endpoint
        }

        // Ensure result is an array
        if (!Array.isArray(response.data.result)) {
          console.warn('Expected result to be an array, got:', typeof response.data.result);
          continue;
        }

        console.log(`Found ${response.data.result.length} transactions`);

        // Process transactions to create leaderboard
        const leaderboardMap = new Map<string, LeaderboardEntry>();

        response.data.result.forEach((tx: any) => {
          // Only process outbound transfers FROM the reward wallet TO players
          if (tx.from && 
              tx.from.toLowerCase() === rewardWalletAddress.toLowerCase() && 
              tx.to && 
              tx.value && 
              tx.value !== '0') {
            
            const amount = parseFloat(tx.value) / 1e18; // Convert from wei to tCRO
            
            // Only count transactions that look like rewards (positive amounts)
            if (amount > 0) {
              const recipientAddress = tx.to.toLowerCase();
              const entry = leaderboardMap.get(recipientAddress) || {
                address: recipientAddress,
                totalPoints: 0,
                lastRewardTime: 0,
                totalRewards: 0
              };
              
              const timestamp = parseInt(tx.timeStamp) * 1000; // Convert to milliseconds
              
              // Convert tCRO to points (1 tCRO = 100 points)
              entry.totalPoints += amount * this.REWARD_RATE;
              entry.totalRewards += 1;
              entry.lastRewardTime = Math.max(entry.lastRewardTime, timestamp);
              
              leaderboardMap.set(recipientAddress, entry);
            }
          }
        });

        // Convert map to array and sort by total points (descending)
        const leaderboard = Array.from(leaderboardMap.values())
          .sort((a, b) => b.totalPoints - a.totalPoints || b.lastRewardTime - a.lastRewardTime)
          .slice(0, limit);

        console.log(`Successfully fetched ${leaderboard.length} leaderboard entries from BlockScout`);
        return leaderboard;

      } catch (error: any) {
        console.error(`Error querying BlockScout API (${apiUrl}):`, error.message);
        // Continue to next API endpoint
        continue;
      }
    }

    return [];
  }

  /**
   * Main method: Combines all methods with fallback strategy
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      // Method 1: Start with in-memory data (fastest, most reliable)
      const memoryLeaderboard = this.getLeaderboardFromMemory(limit);
      
      if (memoryLeaderboard.length > 0) {
        console.log(`Using in-memory leaderboard: ${memoryLeaderboard.length} entries`);
        return memoryLeaderboard;
      }

      // Method 2: Fallback to BlockScout API to get historical data
      console.log('In-memory leaderboard empty, querying BlockScout API...');
      const blockScoutLeaderboard = await this.getLeaderboardFromBlockScout(limit);
      
      if (blockScoutLeaderboard.length > 0) {
        console.log(`Using BlockScout leaderboard: ${blockScoutLeaderboard.length} entries`);
        return blockScoutLeaderboard;
      }

      // If both methods return empty, return empty array
      console.log('No leaderboard data found from any source');
      return [];

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  }
}

// Factory function to create leaderboard service
export const createLeaderboardService = (rewardService: RewardService) => {
  return new LeaderboardService(rewardService);
};
