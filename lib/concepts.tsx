/**
 * Educational content for the "Learn" page — core smart-contract concepts,
 * shown as cards in the ChainLab UI. Data-driven so the page stays simple.
 */

import type { ReactNode } from "react";

export interface Concept {
  id: string;
  title: string;
  summary: string;
  /** A short, beginner-friendly elaboration shown under the summary. */
  detail: string;
  /** Optional outbound link to learn more. */
  href?: string;
  Icon: (props: { className?: string }) => ReactNode;
  color: string;
}

export const CONCEPTS: Concept[] = [
  {
    id: "solidity",
    title: "Solidity",
    summary: "The programming language for smart contracts on Ethereum.",
    detail:
      "A statically-typed, curly-brace language that compiles to EVM bytecode. You write contract logic (balances, rules, transfers) in Solidity, then deploy the compiled bytecode to the chain.",
    href: "https://soliditylang.org",
    color: "#7c5cff",
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2 7 10h4l-3 6 9-10h-5l3-4Z" />
      </svg>
    ),
  },
  {
    id: "erc20",
    title: "ERC-20 Standard",
    summary: "The rules every token must follow to work with wallets and exchanges.",
    detail:
      "A shared interface (balanceOf, transfer, approve, allowance…). Because every ERC-20 implements the same functions, any wallet or exchange can support a new token with zero custom code.",
    href: "https://eips.ethereum.org/EIPS/eip-20",
    color: "#4f8cff",
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
  {
    id: "hardhat",
    title: "Hardhat",
    summary: "Development environment for writing, testing, and deploying contracts.",
    detail:
      "A local Ethereum dev toolkit: it compiles Solidity, runs a fast in-memory test network, executes your tests, and runs deployment scripts. Think of it as the build + test runner for contracts.",
    href: "https://hardhat.org",
    color: "#f0b90b",
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" />
      </svg>
    ),
  },
  {
    id: "openzeppelin",
    title: "OpenZeppelin",
    summary: "Battle-tested contract library (like npm for smart contracts).",
    detail:
      "Audited, reusable implementations of common standards (ERC-20, ERC-721, access control, security utils). You inherit from them instead of writing risky low-level code from scratch.",
    href: "https://www.openzeppelin.com/contracts",
    color: "#2dd4bf",
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" />
      </svg>
    ),
  },
  {
    id: "deployment",
    title: "Contract Deployment",
    summary: "Publishing your contract to the blockchain → a permanent address forever.",
    detail:
      "Deployment is a special transaction that stores your contract's bytecode on-chain. Once mined, the contract lives at a fixed address and is immutable — you can't edit it, only interact with it.",
    href: "https://ethereum.org/en/developers/docs/smart-contracts/deploying/",
    color: "#22c55e",
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 16.5 3 21l4.5-1.5M14 6l4 4M9 17a5 5 0 0 1 0-7l4-4a5 5 0 0 1 7 7l-4 4a5 5 0 0 1-7 0Z" />
      </svg>
    ),
  },
  {
    id: "verification",
    title: "Etherscan Verification",
    summary: "Making your contract code public and readable on Etherscan.",
    detail:
      "You upload your source so Etherscan can match it to the deployed bytecode. Verified contracts show readable code, a Read/Write UI, and signal trust — users can audit exactly what they're interacting with.",
    href: "https://docs.etherscan.io/contract-verification/verify-with-hardhat",
    color: "#fb923c",
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 3 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-3Z" />
      </svg>
    ),
  },
];
