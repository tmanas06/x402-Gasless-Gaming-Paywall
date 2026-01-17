# Deployment Guide - Cronos Testnet

## Prerequisites

1. **Private Key**: Your wallet private key should be in `agent/.env` as `AGENT_PRIVATE_KEY`
2. **Testnet CRO**: Get testnet CRO from [Cronos Faucet](https://cronos.org/faucet)
3. **Node.js**: Version 18+ installed

## Step 1: Install Contract Dependencies

```bash
cd contracts
npm install
```

## Step 2: Deploy Contracts

### Option A: Deploy Everything (Recommended)

```bash
npm run deploy:all
```

This will:
1. Deploy MockUSDC token
2. Deploy GameRewards contract
3. Automatically update `lib/viem.ts` with the contract address

### Option B: Deploy Individually

```bash
# Deploy MockUSDC first
npm run deploy:mock-usdc

# Then deploy GameRewards (it will auto-detect MockUSDC)
npm run deploy
```

## Step 3: Fund the Treasury

After deployment, you need to fund the treasury address with USDC:

1. Get the treasury address from the deployment output
2. Transfer MockUSDC tokens to the treasury address
3. The treasury needs enough USDC for rewards

Example (using Hardhat console):
```bash
npx hardhat console --network cronosTestnet
> const MockUSDC = await ethers.getContractFactory("MockUSDC")
> const usdc = MockUSDC.attach("MOCK_USDC_ADDRESS")
> await usdc.transfer("TREASURY_ADDRESS", ethers.parseUnits("1000", 6))
```

## Step 4: Verify Deployment

Check `contracts/deployments/cronos-testnet.json` for deployment details.

## Network Configuration

- **Chain ID**: 338
- **RPC URL**: https://evm-t3.cronos.org
- **Explorer**: https://testnet.cronoscan.com
- **Native Token**: CRO (18 decimals)

## Troubleshooting

### "Insufficient funds"
- Get testnet CRO from the faucet
- Make sure your private key has enough CRO for gas

### "Contract address is 0x0"
- Run `npm run update-address` to update the address manually
- Or check `contracts/deployments/cronos-testnet.json`

### "USDC_ADDRESS not found"
- Deploy MockUSDC first: `npm run deploy:mock-usdc`
- Or set `USDC_ADDRESS` in `agent/.env`
