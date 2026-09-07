// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RoundEscrow} from "../src/RoundEscrow.sol";
import {RoundTypes} from "../src/RoundTypes.sol";
import {MockUSDC} from "../src/test/MockUSDC.sol";

/// @title BaseTest
/// @notice Shared fixture: mock USDC, a deployed escrow, funded actors and round helpers.
abstract contract BaseTest is Test {
    uint256 internal constant USDC = 1e6;
    uint256 internal constant TARGET = 100_000 * USDC;
    uint64 internal constant DURATION = 7 days;

    MockUSDC internal usdc;
    RoundEscrow internal escrow;

    address internal platform = makeAddr("platform");
    address internal founder = makeAddr("founder");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal stranger = makeAddr("stranger");

    uint64 internal deadline;

    function setUp() public virtual {
        vm.warp(1_800_000_000);
        deadline = uint64(block.timestamp) + DURATION;
        usdc = new MockUSDC();
        escrow = new RoundEscrow(IERC20(address(usdc)), platform);
        _fund(alice, 1_000_000 * USDC);
        _fund(bob, 1_000_000 * USDC);
    }

    // ────────────────────────────── helpers ──────────────────────────────

    /// @dev Mint USDC to `who` and pre-approve the escrow for the full amount.
    function _fund(address who, uint256 amount) internal {
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(escrow), type(uint256).max);
    }

    /// @dev Default 3-tranche schedule: 40% / 30% / 30%.
    function _milestones() internal pure returns (uint16[] memory bps) {
        bps = new uint16[](3);
        (bps[0], bps[1], bps[2]) = (4_000, 3_000, 3_000);
    }

    /// @dev Create a round with the default schedule as the platform.
    function _createRound() internal returns (uint256 roundId) {
        return _createRound(TARGET, _milestones());
    }

    /// @dev Create a round with a custom target and schedule as the platform.
    function _createRound(uint256 target, uint16[] memory bps) internal returns (uint256) {
        vm.prank(platform);
        return escrow.createRound(founder, target, deadline, bps);
    }

    /// @dev Invest `amount` as `investor`.
    function _invest(address investor, uint256 roundId, uint256 amount) internal {
        vm.prank(investor);
        escrow.invest(roundId, amount);
    }

    /// @dev Create a round and fully fund it through `alice`, then finalize to Funded.
    function _fundedRound() internal returns (uint256 roundId) {
        roundId = _createRound();
        _invest(alice, roundId, TARGET);
        escrow.finalize(roundId);
    }

    /// @dev Create a round, partially fund it, and let the deadline lapse -> Failed.
    function _failedRound(uint256 aliceAmount) internal returns (uint256 roundId) {
        roundId = _createRound();
        _invest(alice, roundId, aliceAmount);
        vm.warp(deadline + 1);
        escrow.finalize(roundId);
    }

    /// @dev Status of a round as the enum.
    function _status(uint256 roundId) internal view returns (RoundTypes.RoundStatus) {
        return escrow.getRound(roundId).status;
    }
}
