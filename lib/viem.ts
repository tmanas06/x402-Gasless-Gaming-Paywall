// lib/viem.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadKey } from "./keyCache";

// Contract configuration
export const CONTRACT_ADDRESS = "0x3Bc9FA89c0fA5E8a2fA586029F91CC51E28E4C44" as const;
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

export const monadTestnet = defineChain({
  id: 10143,                         // official test-net ID :contentReference[oaicite:6]{index=6}
  name: "Monad Testnet",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 6 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

export const publicClient = createPublicClient({
  chain: monadTestnet,
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
    const pk = loadKey();                         // <─ from utils/keyCache
    if (!pk) throw new Error("No cached private key");
    const account = privateKeyToAccount(pk as `0x${string}`);            // viem helper :contentReference[oaicite:2]{index=2}
    return createWalletClient({
      chain: monadTestnet,
      account,
      transport: http(),
    });
  }