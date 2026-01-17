import { CONTRACT_ADDRESS, CONTRACT_ABI, publicClient } from "./viem";

async function testContract() {
  try {
    // Call the rewardAmount function
    const rewardAmount = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'rewardAmount',
    });

    console.log('Reward Amount:', rewardAmount.toString());
    return rewardAmount;
  } catch (error) {
    console.error('Error testing contract:', error);
    throw error;
  }
}

// Run the test when this file is imported
export const testResult = testContract();
