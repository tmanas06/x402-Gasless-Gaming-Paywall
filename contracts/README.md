# Game Rewards Smart Contracts

Smart contracts for the Cronos Gaming DApp on Cronos Testnet.

## Prerequisites

1. Node.js and npm installed
2. Private key in `agent/.env` file (AGENT_PRIVATE_KEY)
3. Testnet CRO for gas fees

## Setup

```bash
cd contracts
npm install
```

## Configuration

The deployment script will automatically read from `../agent/.env`:
- `AGENT_PRIVATE_KEY` - Private key for deployment
- `CRONOS_RPC` - RPC URL (defaults to https://evm-t3.cronos.org)

Optional environment variables:
- `USDC_ADDRESS` - USDC token address on Cronos testnet (defaults to 0x0)
- `TREASURY_ADDRESS` - Treasury address for holding rewards (defaults to deployer)

## Deploy

```bash
npm run deploy
```

This will:
1. Compile the contracts
2. Deploy GameRewards contract to Cronos Testnet
3. Save deployment info to `deployments/cronos-testnet.json`

## After Deployment

1. Copy the contract address from the output
2. Update `CONTRACT_ADDRESS` in `lib/viem.ts`
3. Fund the treasury address with USDC tokens for rewards

## Contract Functions

- `claimReward()` - Claim reward once per address
- `setRewardAmount(uint256)` - Update reward amount (owner only)
- `setTreasury(address)` - Update treasury address (owner only)
- `setUSDC(address)` - Update USDC token address (owner only)
- `getContractInfo()` - Get contract information

## Network Info

- **Chain ID**: 338
- **Network**: Cronos Testnet
- **RPC**: https://evm-t3.cronos.org
- **Explorer**: https://testnet.cronoscan.com
