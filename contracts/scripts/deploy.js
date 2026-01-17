const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying GameRewards contract to Cronos Testnet...\n");

  // Cronos testnet USDC address
  // If USDC_ADDRESS is not set, try to read from mock-usdc deployment
  let USDC_ADDRESS = process.env.USDC_ADDRESS;
  
  if (!USDC_ADDRESS || USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
    const mockUSDCPath = path.join(__dirname, "..", "deployments", "mock-usdc.json");
    if (fs.existsSync(mockUSDCPath)) {
      const mockUSDC = JSON.parse(fs.readFileSync(mockUSDCPath, "utf8"));
      USDC_ADDRESS = mockUSDC.contractAddress;
      console.log("📋 Using MockUSDC from previous deployment:", USDC_ADDRESS);
    } else {
      console.warn("⚠️  USDC_ADDRESS not set and no MockUSDC deployment found.");
      console.warn("   Deploy MockUSDC first: npm run deploy:mock-usdc");
      console.warn("   Or set USDC_ADDRESS in agent/.env");
      process.exit(1);
    }
  }
  
  // Treasury address (can be the deployer address or a separate treasury)
  const [deployer] = await hre.ethers.getSigners();
  const TREASURY = process.env.TREASURY_ADDRESS || deployer.address;
  
  // Base reward amount: 0.001 USDC (6 decimals = 1000)
  const REWARD_AMOUNT = hre.ethers.parseUnits("0.001", 6);

  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "CRO");
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("Treasury Address:", TREASURY);
  console.log("Reward Amount:", hre.ethers.formatUnits(REWARD_AMOUNT, 6), "USDC\n");

  // Deploy GameRewards contract
  const GameRewards = await hre.ethers.getContractFactory("GameRewards");
  const gameRewards = await GameRewards.deploy(
    USDC_ADDRESS,
    TREASURY,
    REWARD_AMOUNT
  );

  await gameRewards.waitForDeployment();
  const contractAddress = await gameRewards.getAddress();

  console.log("✅ GameRewards deployed to:", contractAddress);
  console.log("📝 Transaction hash:", gameRewards.deploymentTransaction()?.hash);

  // Save deployment info
  const deploymentInfo = {
    network: "cronosTestnet",
    contractAddress: contractAddress,
    deployer: deployer.address,
    treasury: TREASURY,
    usdcAddress: USDC_ADDRESS,
    rewardAmount: REWARD_AMOUNT.toString(),
    deployedAt: new Date().toISOString(),
    txHash: gameRewards.deploymentTransaction()?.hash,
  };

  // Write to file
  const deploymentPath = path.join(__dirname, "..", "deployments", "cronos-testnet.json");
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", deploymentPath);
  console.log("\n🎮 Contract is ready to use!");
  console.log("   Update CONTRACT_ADDRESS in lib/viem.ts with:", contractAddress);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
