require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

// Pad key to 64 hex chars if wallet stripped leading zeros
function normalizeKey(raw) {
  if (!raw) return undefined;
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  return "0x" + hex.padStart(64, "0");
}

const DEPLOYER_KEY = normalizeKey(process.env.PRIVATE_KEY);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
      chainId: 44787,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
      chainId: 42220,
    },
  },
  etherscan: {
    apiKey: process.env.CELOSCAN_API_KEY ?? "",
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },
};
