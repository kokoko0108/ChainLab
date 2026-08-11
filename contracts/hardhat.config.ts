import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Read secrets from .env (never commit this file). Fallbacks keep `compile`
// and local `test` working even when no network keys are configured.
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      // The optimizer reduces deployment gas; 200 runs is a common default.
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Sepolia testnet — safe, free deployment target.
    sepolia: {
      url: SEPOLIA_RPC_URL,
      // Only include the account if a key is present, so commands that don't
      // need signing (compile/test) work without a key configured.
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  // Used by `hardhat verify` to publish source on Etherscan.
  etherscan: {
    apiKey: { sepolia: ETHERSCAN_API_KEY },
  },
};

export default config;
