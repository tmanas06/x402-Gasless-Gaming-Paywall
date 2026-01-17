const fs = require("fs");
const path = require("path");

// Read deployment info
const deploymentPath = path.join(__dirname, "..", "deployments", "cronos-testnet.json");
const viemPath = path.join(__dirname, "..", "..", "lib", "viem.ts");

if (!fs.existsSync(deploymentPath)) {
  console.error("❌ Deployment file not found. Please deploy the contract first.");
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const contractAddress = deployment.contractAddress;

if (!contractAddress) {
  console.error("❌ Contract address not found in deployment file.");
  process.exit(1);
}

// Read viem.ts
let viemContent = fs.readFileSync(viemPath, "utf8");

// Update contract address
const addressRegex = /export const CONTRACT_ADDRESS = "0x[a-fA-F0-9]+" as const;/;
const newAddressLine = `export const CONTRACT_ADDRESS = "${contractAddress}" as const;`;

if (addressRegex.test(viemContent)) {
  viemContent = viemContent.replace(addressRegex, newAddressLine);
  fs.writeFileSync(viemPath, viemContent);
  console.log("✅ Updated CONTRACT_ADDRESS in lib/viem.ts");
  console.log(`   New address: ${contractAddress}`);
} else {
  console.error("❌ Could not find CONTRACT_ADDRESS in lib/viem.ts");
  process.exit(1);
}
