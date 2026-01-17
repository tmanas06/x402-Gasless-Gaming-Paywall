require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../agent/.env" });

/** @type import('hardhat/config').HardhatConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    cronosTestnet: {
      url: process.env.CRONOS_RPC || "https://evm-t3.cronos.org",
      chainId: 338,
      accounts: process.env.AGENT_PRIVATE_KEY ? [process.env.AGENT_PRIVATE_KEY] : [],
      gasPrice: 500000000000, // 500 gwei
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
