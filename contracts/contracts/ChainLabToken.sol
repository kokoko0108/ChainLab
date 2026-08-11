// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// We import OpenZeppelin's audited, reusable building blocks instead of writing
// the ERC-20 logic (balances, transfers, approvals) by hand:
//   - ERC20:        the full ERC-20 standard implementation.
//   - ERC20Burnable: lets holders destroy their own tokens.
//   - Ownable:      restricts certain actions (here: minting) to one owner.
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainLabToken
 * @notice A simple, mintable, burnable ERC-20 demo token for ChainLab.
 * @dev Inherits the standard from OpenZeppelin. Because it implements the ERC-20
 *      interface, it works with any wallet/exchange — including ChainLab's own
 *      Token Balance Checker and Write page — with no extra integration code.
 */
contract ChainLabToken is ERC20, ERC20Burnable, Ownable {
    /// @dev Hard cap on total supply (in whole tokens, before decimals).
    uint256 public immutable cap;

    error CapExceeded();

    /**
     * @param initialOwner Address that can mint new tokens.
     * @param initialSupply Tokens minted to the owner at deploy time (whole units).
     * @param maxSupply Maximum tokens that can ever exist (whole units).
     */
    constructor(
        address initialOwner,
        uint256 initialSupply,
        uint256 maxSupply
    ) ERC20("ChainLab Token", "CLAB") Ownable(initialOwner) {
        // ERC-20 amounts are stored in base units: 1 token = 10**decimals().
        cap = maxSupply * 10 ** decimals();
        _mint(initialOwner, initialSupply * 10 ** decimals());
    }

    /**
     * @notice Mint new tokens to an address. Only the owner may call this.
     * @dev Enforces the supply cap. `amount` is in whole tokens.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        uint256 scaled = amount * 10 ** decimals();
        if (totalSupply() + scaled > cap) revert CapExceeded();
        _mint(to, scaled);
    }
}
