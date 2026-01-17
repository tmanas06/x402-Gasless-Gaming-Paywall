// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for Cronos testnet (6 decimals like real USDC)
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        // Mint 1,000,000 USDC to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    // Override decimals to return 6 (like real USDC)
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // Allow anyone to mint for testing purposes
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
