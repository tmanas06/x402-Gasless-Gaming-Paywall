import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

interface RewardRecord {
  address: string;
  score: number;
  rewardAmount: string; // in tCRO (wei)
  txHash?: string;
  timestamp: number;
  gameMode: string;
}

export class RewardService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private rewards: Map<string, RewardRecord> = new Map();
  private readonly REWARD_RATE = 100; // 100 points = 1 tCRO

  constructor() {
    const rpcUrl = process.env.CRONOS_TESTNET_RPC || "https://evm-t3.cronos.org";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const privateKey = process.env.REWARD_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("REWARD_WALLET_PRIVATE_KEY is required in .env");
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    console.log(`Reward wallet initialized: ${this.wallet.address}`);
  }

  /**
   * Calculate reward amount in tCRO (wei)
   * 100 points = 1 tCRO = 1e18 wei
   */
  calculateReward(score: number): string {
    const tCROAmount = Math.floor(score / this.REWARD_RATE);
    // Convert tCRO to wei (1 tCRO = 1e18 wei)
    return ethers.parseEther(tCROAmount.toString()).toString();
  }

  /**
   * Send reward to player
   */
  async sendReward(
    playerAddress: string,
    score: number,
    gameMode: string
  ): Promise<{ success: boolean; txHash?: string; error?: string; rewardAmount: string }> {
    try {
      // Only reward for normal mode (3 lives)
      if (gameMode !== "classic" || score < this.REWARD_RATE) {
        return {
          success: false,
          error: "Rewards only available for normal mode with score >= 100",
          rewardAmount: "0",
        };
      }

      const rewardAmount = this.calculateReward(score);
      
      // Check if already rewarded for this game session
      const rewardKey = `${playerAddress.toLowerCase()}_${Date.now()}`;
      if (this.rewards.has(rewardKey)) {
        return {
          success: false,
          error: "Reward already claimed for this game",
          rewardAmount,
        };
      }

      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      const rewardAmountBigInt = BigInt(rewardAmount);
      
      if (balance < rewardAmountBigInt) {
        return {
          success: false,
          error: "Insufficient funds in reward wallet",
          rewardAmount,
        };
      }

      // Send tCRO reward
      const tx = await this.wallet.sendTransaction({
        to: playerAddress,
        value: rewardAmountBigInt,
      });

      console.log(`Reward sent: ${ethers.formatEther(rewardAmount)} tCRO to ${playerAddress}`);
      console.log(`Transaction hash: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Record reward
      const record: RewardRecord = {
        address: playerAddress.toLowerCase(),
        score,
        rewardAmount,
        txHash: receipt?.hash || tx.hash,
        timestamp: Date.now(),
        gameMode,
      };
      
      this.rewards.set(rewardKey, record);

      return {
        success: true,
        txHash: receipt?.hash || tx.hash,
        rewardAmount,
      };
    } catch (error) {
      console.error("Error sending reward:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        rewardAmount: this.calculateReward(score),
      };
    }
  }

  /**
   * Get reward history for an address
   */
  getRewardHistory(address: string): RewardRecord[] {
    const addressLower = address.toLowerCase();
    return Array.from(this.rewards.values()).filter(
      (r) => r.address === addressLower
    );
  }
}
