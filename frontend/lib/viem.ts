// lib/viem.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadKey } from "./keyCache";

// Contract configuration
// TODO: Update this address after deploying the contract
// Run: cd contracts && npm run deploy
// Then copy the deployed address here
export const CONTRACT_ADDRESS = "0x33c070F5225E8d5715692968183031dF1B401d44" as const;
export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_usdc",
        type: "address"
      },
      {
        internalType: "address",
        name: "_treasury",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_rewardAmount",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "updater",
        type: "address"
      }
    ],
    name: "ConfigUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "RewardClaimed",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newAmount",
        type: "uint256"
      }
    ],
    name: "setRewardAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newTreasury",
        type: "address"
      }
    ],
    name: "setTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newUSDC",
        type: "address"
      }
    ],
    name: "setUSDC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "hasClaimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "rewardAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Cronos Testnet configuration
export const cronosTestnet = defineChain({
  id: 338, // Cronos Testnet chain ID
  name: "Cronos Testnet",
  nativeCurrency: { 
    name: "Cronos", 
    symbol: "tCRO", 
    decimals: 18 
  },
  rpcUrls: { 
    default: { 
      http: ["https://evm-t3.cronos.org"] 
    } 
  },
  blockExplorers: {
    default: {
      name: "Cronos Explorer",
      url: "https://testnet.cronoscan.com",
    },
  },
});

export const publicClient = createPublicClient({
  chain: cronosTestnet,
  transport: http(),
});

// Create contract instance
export const contract = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  publicClient,
} as const;

// Type definitions for contract functions
export type ContractFunction = {
  claimReward: () => Promise<void>;
  hasClaimed: (address: `0x${string}`) => Promise<boolean>;
  rewardAmount: () => Promise<bigint>;
  setRewardAmount: (amount: bigint) => Promise<void>;
  setTreasury: (address: `0x${string}`) => Promise<void>;
  setUSDC: (address: `0x${string}`) => Promise<void>;
  owner: () => Promise<`0x${string}`>;
  treasury: () => Promise<`0x${string}`>;
  usdc: () => Promise<`0x${string}`>;
};

export function getSigner() {
    const pk = loadKey();
    if (!pk) throw new Error("No cached private key");
    const account = privateKeyToAccount(pk as `0x${string}`);
    return createWalletClient({
      chain: cronosTestnet,
      account,
      transport: http(),
    });
  }