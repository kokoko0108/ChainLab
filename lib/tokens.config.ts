import type { Address } from "viem";

/**
 * Token list + ERC-20 ABI for the Token Balance Checker.
 *
 * Web3 concepts for beginners:
 * - An "ERC-20 token" (USDC, LINK, …) is a smart contract that keeps a ledger
 *   of balances. Unlike native ETH, a token balance lives INSIDE its contract,
 *   so to read it we call a function ON that contract.
 * - An "ABI" (Application Binary Interface) describes a contract's functions so
 *   our code knows how to encode the call and decode the result. We only need
 *   the two read-only functions used here: `balanceOf` and `decimals`.
 * - "decimals" tells us how to interpret the raw integer balance. A raw balance
 *   of 1_000_000 with 6 decimals means 1.0 token. USDC uses 6, WBTC uses 8,
 *   most others use 18 — which is exactly why we read it on-chain rather than
 *   guessing.
 */

// Minimal ERC-20 ABI: just the read functions we need. `as const` lets viem
// infer precise TypeScript return types (bigint for balanceOf, number for
// decimals) from the ABI itself.
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  // ---- Write functions (used by the "Write to Smart Contract" page) ----
  // `allowance(owner, spender)` is read-only: how much `spender` may move on
  // behalf of `owner`. Required before/after approving.
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // `approve(spender, amount)` authorizes `spender` to transfer up to `amount`
  // of YOUR tokens. Returns true on success. This is a state-changing call, so
  // it costs gas and needs a wallet signature.
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // `transfer(to, amount)` moves `amount` of your tokens to `to`. State-
  // changing, so it requires a signature and gas.
  {
    constant: false,
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export interface TokenConfig {
  /** Token contract address (ERC-20 on Ethereum, BEP-20 on BNB Chain). */
  address: Address;
  symbol: string;
  name: string;
  /** Expected decimals — used as a fallback if the on-chain read fails. */
  decimals: number;
  /** Logo URL from the TrustWallet assets repo (keyed by checksummed address). */
  logo: string;
}

/**
 * A network the checker can read tokens from. BEP-20 is the SAME standard as
 * ERC-20 (identical balanceOf/decimals), so the only per-chain differences are
 * the chainId, the token contract addresses, and the logo asset path.
 */
export interface TokenChainConfig {
  chainId: number;
  /** Display label for the toggle. */
  label: string;
  /** What the tokens are called on this chain (for copy). */
  standard: "ERC-20" | "BEP-20";
  /** Accent color used to tint the active toggle. */
  color: string;
  tokens: TokenConfig[];
}

// TrustWallet stores assets per blockchain folder. Ethereum tokens live under
// `ethereum`, BNB Chain (BSC) tokens under `smartchain`. The address must be
// checksummed (mixed-case) for the path to resolve.
function trustWalletLogo(
  blockchain: "ethereum" | "smartchain",
  address: string,
): string {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${blockchain}/assets/${address}/logo.png`;
}

// ---- Ethereum mainnet (ERC-20) ----
const ETHEREUM_TOKENS: TokenConfig[] = [
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: trustWalletLogo("ethereum", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logo: trustWalletLogo("ethereum", "0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  },
  {
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
    logo: trustWalletLogo("ethereum", "0x514910771AF9Ca656af840dff83E8264EcF986CA"),
  },
  {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    symbol: "UNI",
    name: "Uniswap",
    decimals: 18,
    logo: trustWalletLogo("ethereum", "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"),
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    logo: trustWalletLogo("ethereum", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
  },
];

// ---- BNB Chain / BSC (BEP-20) ----
// NOTE: the same token has a DIFFERENT address on BNB Chain than on Ethereum.
// On BSC most stablecoins use 18 decimals (unlike Ethereum's 6) — another
// reason we read decimals() on-chain rather than assuming.
const BNB_TOKENS: TokenConfig[] = [
  {
    address: "0x55d398326f99059fF775485246999027B3197955",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    logo: trustWalletLogo("smartchain", "0x55d398326f99059fF775485246999027B3197955"),
  },
  {
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    logo: trustWalletLogo("smartchain", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"),
  },
  {
    address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    symbol: "CAKE",
    name: "PancakeSwap",
    decimals: 18,
    logo: trustWalletLogo("smartchain", "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"),
  },
  {
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    symbol: "ETH",
    name: "Ethereum Token",
    decimals: 18,
    logo: trustWalletLogo("smartchain", "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"),
  },
  {
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    symbol: "WBNB",
    name: "Wrapped BNB",
    decimals: 18,
    logo: trustWalletLogo("smartchain", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"),
  },
];

/** The networks the checker supports. The first entry is the default. */
export const TOKEN_CHAINS: TokenChainConfig[] = [
  {
    chainId: 1,
    label: "Ethereum",
    standard: "ERC-20",
    color: "#627eea",
    tokens: ETHEREUM_TOKENS,
  },
  {
    chainId: 56,
    label: "BNB Chain",
    standard: "BEP-20",
    color: "#f0b90b",
    tokens: BNB_TOKENS,
  },
];

/** Look up a token-chain config by chainId, with a safe default. */
export function getTokenChain(chainId: number): TokenChainConfig {
  return TOKEN_CHAINS.find((c) => c.chainId === chainId) ?? TOKEN_CHAINS[0];
}

/**
 * ---- Sepolia testnet tokens for the "Write to Smart Contract" page ----
 *
 * Writes (approve/transfer) are done on SEPOLIA so testing is free and safe.
 * Mainnet token addresses would NOT work here — each network has its own
 * contracts — so these are real, verified Sepolia faucet test tokens:
 *   - USDC / USDT: Aave faucet tokens (mintable from the Aave testnet faucet)
 *   - LINK: Chainlink's official Sepolia LINK
 *   - DAI: Aave faucet DAI (used in place of UNI, which has no canonical
 *          Sepolia test token; DAI is widely faucetable)
 * All verified on-chain (symbol/decimals) before inclusion.
 */
export interface WriteTokenConfig {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
}

export const SEPOLIA_CHAIN_ID = 11155111;

export const WRITE_TOKENS: WriteTokenConfig[] = [
  {
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    symbol: "USDC",
    name: "USD Coin (Aave test)",
    decimals: 6,
  },
  {
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    symbol: "USDT",
    name: "Tether USD (Aave test)",
    decimals: 6,
  },
  {
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    symbol: "LINK",
    name: "Chainlink Token",
    decimals: 18,
  },
  {
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    symbol: "DAI",
    name: "Dai Stablecoin (Aave test)",
    decimals: 18,
  },
];
