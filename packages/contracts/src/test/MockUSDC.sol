// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice 6-decimal, freely mintable ERC-20 standing in for Arc USDC in tests and local demos.
/// @dev Not for production. Anyone can mint.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    /// @notice USDC uses 6 decimals, unlike the ERC-20 default of 18.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint `amount` base units to `to`.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
