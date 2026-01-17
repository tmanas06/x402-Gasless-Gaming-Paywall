const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying MockUSDC contract to Cronos Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "CRO\n");

  // Deploy MockUSDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();

  await mockUSDC.waitForDeployment();
  const contractAddress = await mockUSDC.getAddress();

  console.log("✅ MockUSDC deployed to:", contractAddress);
  console.log("📝 Transaction hash:", mockUSDC.deploymentTransaction()?.hash);

  // Save deployment info
  const deploymentInfo = {
    network: "cronosTestnet",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    txHash: mockUSDC.deploymentTransaction()?.hash,
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", "mock-usdc.json");
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", deploymentPath);
  console.log("\n💡 Use this address as USDC_ADDRESS when deploying GameRewards contract");
  console.log("   Or set it in agent/.env as: USDC_ADDRESS=" + contractAddress);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
