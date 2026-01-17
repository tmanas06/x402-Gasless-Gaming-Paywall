const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💰 Funding treasury with MockUSDC...\n");

  // Read deployment info
  const mockUSDCPath = path.join(__dirname, "..", "deployments", "mock-usdc.json");
  const gameRewardsPath = path.join(__dirname, "..", "deployments", "cronos-testnet.json");

  if (!fs.existsSync(mockUSDCPath) || !fs.existsSync(gameRewardsPath)) {
    console.error("❌ Deployment files not found. Please deploy contracts first.");
    process.exit(1);
  }

  const mockUSDC = JSON.parse(fs.readFileSync(mockUSDCPath, "utf8"));
  const gameRewards = JSON.parse(fs.readFileSync(gameRewardsPath, "utf8"));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "CRO\n");

  // Get MockUSDC contract
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = MockUSDC.attach(mockUSDC.contractAddress);

  // Get treasury address (deployer address)
  const treasury = gameRewards.treasury || deployer.address;
  console.log("Treasury address:", treasury);

  // Check current balance
  const currentBalance = await usdc.balanceOf(treasury);
  console.log("Current treasury balance:", hre.ethers.formatUnits(currentBalance, 6), "USDC\n");

  // Transfer 1000 USDC to treasury (enough for many rewards)
  const amount = hre.ethers.parseUnits("1000", 6);
  console.log("Transferring", hre.ethers.formatUnits(amount, 6), "USDC to treasury...");

  const tx = await usdc.transfer(treasury, amount);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  const newBalance = await usdc.balanceOf(treasury);
  console.log("\n✅ Treasury funded!");
  console.log("New treasury balance:", hre.ethers.formatUnits(newBalance, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
