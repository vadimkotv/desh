// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RoundEscrow} from "../src/RoundEscrow.sol";

/// @title Deploy
/// @notice Deploys RoundEscrow to Arc testnet (or any EVM chain).
/// @dev Env:
///      - USDC_ADDRESS     escrow token (default: Arc testnet USDC 0x3600…0000)
///      - PLATFORM_ADDRESS operator allowed to create rounds/release (default: deployer)
///      Run: forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast \
///           --private-key $DEPLOYER_PRIVATE_KEY
contract Deploy is Script {
    /// @notice Native USDC on Arc testnet (also the chain's gas token).
    address public constant ARC_TESTNET_USDC = 0x3600000000000000000000000000000000000000;

    function run() external returns (RoundEscrow escrow) {
        address usdc = vm.envOr("USDC_ADDRESS", ARC_TESTNET_USDC);
        address platform = vm.envOr("PLATFORM_ADDRESS", msg.sender);

        vm.startBroadcast();
        escrow = new RoundEscrow(IERC20(usdc), platform);
        vm.stopBroadcast();

        console.log("RoundEscrow deployed at:", address(escrow));
        console.log("  usdc:     ", usdc);
        console.log("  platform: ", platform);
    }
}
