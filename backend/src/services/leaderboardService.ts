import axios from 'axios';

interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  lastRewardTime: number;
  totalRewards: number;
}

export class LeaderboardService {
  private readonly CRO_FAUCET_ADDRESS = '0xB4cd671bd612C996A21F48170e30382449FFD864';
  private readonly CROSCAN_API_KEY = process.env.CROSCAN_API_KEY || 'YourApiKeyToken';
  // Updated to use testnet API endpoint
  private readonly CROSCAN_API_URL = 'https://cronos.org/explorer/testnet3/api';
  // tCRO token address on testnet
  private readonly T_CRO_TOKEN = '0x2D03b6C79A5Bc289dD8523a4D55B529962a82eA6';
  private readonly REWARD_AMOUNT = 1; // 1 tCRO per reward

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      console.log('Fetching leaderboard data...');
      console.log('Using API URL:', this.CROSCAN_API_URL);
      console.log('Token address:', this.T_CRO_TOKEN);
      console.log('Faucet address:', this.CRO_FAUCET_ADDRESS);
      
      // Get all token transfers from the faucet address
      const response = await axios.get(`${this.CROSCAN_API_URL}`, {
        params: {
          module: 'account',
          action: 'tokentx',
          contractaddress: this.T_CRO_TOKEN,
          address: this.CRO_FAUCET_ADDRESS,
          startblock: 0,
          endblock: 99999999,
          sort: 'desc',
          apikey: this.CROSCAN_API_KEY
        },
        // Add timeout and better error handling
        timeout: 10000,
        validateStatus: () => true // Always resolve the promise
      });

      console.log('Cronos API response status:', response.status);
      console.log('Response data:', {
        status: response.data.status,
        message: response.data.message,
        resultCount: Array.isArray(response.data.result) ? response.data.result.length : 'not an array',
        resultType: typeof response.data.result
      });

      // Handle non-200 status codes
      if (response.status !== 200) {
        console.error('Cronos API returned non-200 status:', response.status);
        return [];
      }

      // Handle empty or invalid responses
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response format from Cronos API');
        return [];
      }

      // Handle API error status
      if (response.data.status !== '1') {
        console.warn('Cronos API returned non-success status:', response.data);
        // Check for rate limiting or API key issues
        if (response.data.message?.includes('rate limit') || 
            response.data.message?.includes('API key') ||
            response.data.result === 'Max rate limit reached') {
          console.error('API rate limit reached or invalid API key');
        }
        return [];
      }

      // Ensure result is an array
      if (!Array.isArray(response.data.result)) {
        console.error('Expected result to be an array, got:', typeof response.data.result);
        return [];
      }

      // Process transactions to create leaderboard
      const leaderboardMap = new Map<string, LeaderboardEntry>();
      
      if (!response.data.result || !Array.isArray(response.data.result)) {
        console.warn('No valid transaction data in response');
        return [];
      }
      
      response.data.result.forEach((tx: any) => {
        // Only process inbound transfers to the faucet
        if (tx.to && tx.to.toLowerCase() === this.CRO_FAUCET_ADDRESS.toLowerCase()) {
          const amount = parseFloat(tx.value) / 1e18; // Convert from wei to tCRO
          
          // Only count full tCRO rewards (1 tCRO = 1 reward)
          if (amount === this.REWARD_AMOUNT) {
            const address = tx.from.toLowerCase();
            const entry = leaderboardMap.get(address) || {
              address,
              totalPoints: 0,
              lastRewardTime: 0,
              totalRewards: 0
            };
            
            const timestamp = parseInt(tx.timeStamp) * 1000; // Convert to milliseconds
            
            entry.totalPoints += amount * 100; // Each tCRO represents 100 points
            entry.totalRewards += 1;
            entry.lastRewardTime = Math.max(entry.lastRewardTime, timestamp);
            
            leaderboardMap.set(address, entry);
          }
        }
      });

      // Convert map to array and sort by total points (descending)
      return Array.from(leaderboardMap.values())
        .sort((a, b) => b.totalPoints - a.totalPoints || b.lastRewardTime - a.lastRewardTime)
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error('Failed to fetch leaderboard data');
    }
  }
}

// Singleton instance
export const leaderboardService = new LeaderboardService();
