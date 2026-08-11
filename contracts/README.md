# ChainLab Contracts

Hardhat + OpenZeppelin project for `ChainLabToken` — a mintable, burnable,
capped ERC-20 demo token deployed to **Sepolia**.

## Setup

```bash
cd contracts
npm install
cp .env.example .env   # then fill in PRIVATE_KEY and ETHERSCAN_API_KEY
```

You'll need:
- A funded Sepolia account (get test ETH from a faucet, e.g.
  https://www.alchemy.com/faucets/ethereum-sepolia) — its private key goes in `.env`.
- A free Etherscan API key (https://etherscan.io/myapikey) for verification.

## Commands

```bash
npm run compile          # compile the Solidity
npm test                 # run the test suite on Hardhat's local network
npm run deploy:sepolia   # deploy to Sepolia (+ auto-verify if API key set)
npm run verify -- <ADDRESS> <OWNER> 1000000 10000000   # manual verify
```

## What it demonstrates

| Concept | Where |
|---|---|
| **Solidity** | `contracts/ChainLabToken.sol` |
| **ERC-20 Standard** | inherits OpenZeppelin `ERC20` |
| **Hardhat** | compile / test / deploy via this project |
| **OpenZeppelin** | `ERC20`, `ERC20Burnable`, `Ownable` |
| **Deployment** | `scripts/deploy.ts` → permanent address |
| **Etherscan Verification** | auto-run in `deploy.ts`, or `npm run verify` |

After deploying, paste the contract address into ChainLab's **Token Balance
Checker** or **Write to Smart Contract** page (on Sepolia) to interact with it.
