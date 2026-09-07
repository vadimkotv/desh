// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Revenue-share returns: cap validation, distribution guards, pro-rata claims.
/// @dev Cap enforcement, Repaid transitions and refunds live in RoundEscrow.repaid.t.sol.
contract RoundEscrowReturnsTest is BaseTest {
    uint256 internal constant ALICE_IN = 60_000 * USDC;
    uint256 internal constant BOB_IN = 40_000 * USDC;

    /// @dev Funded round with alice 60% / bob 40% of a 100k raise (cap 150k).
    function _twoInvestorRound() internal returns (uint256 roundId) {
        roundId = _createRound();
        _invest(alice, roundId, ALICE_IN);
        _invest(bob, roundId, BOB_IN);
        escrow.finalize(roundId);
    }

    function _claim(address who, uint256 roundId) internal returns (uint256) {
        vm.prank(who);
        return escrow.claim(roundId);
    }

    // ─────────────────────────── cap validation ──────────────────────────

    function test_createRound_acceptsCapBounds() public {
        _createRound(TARGET, _milestones(), 10_000);
        _createRound(TARGET, _milestones(), 50_000);
        assertEq(escrow.getRound(1).returnCapBps, 10_000);
        assertEq(escrow.getRound(2).returnCapBps, 50_000);
    }

    function test_createRound_revertsOnCapOutOfBounds() public {
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidReturnCap.selector);
        escrow.createRound(founder, TARGET, deadline, _milestones(), 9_999);

        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidReturnCap.selector);
        escrow.createRound(founder, TARGET, deadline, _milestones(), 50_001);
    }

    function test_returnCapOf_isRaisedTimesCap() public {
        uint256 roundId = _twoInvestorRound();
        assertEq(escrow.returnCapOf(roundId), (ALICE_IN + BOB_IN) * 15_000 / 10_000);
    }

    // ───────────────────────── distribute guards ─────────────────────────

    function test_distribute_revertsWhileOpenOrFailed() public {
        uint256 openId = _createRound();
        _fund(founder, 1 * USDC);
        vm.prank(founder);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.distribute(openId, 1 * USDC);

        uint256 failedId = _failedRound(TARGET / 2);
        vm.prank(founder);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.distribute(failedId, 1 * USDC);
    }

    function test_distribute_revertsOnZeroAmount() public {
        uint256 roundId = _fundedRound();
        vm.prank(founder);
        vm.expectRevert(RoundTypes.ZeroAmount.selector);
        escrow.distribute(roundId, 0);
    }

    // ───────────────────────── pro-rata claims ───────────────────────────

    function test_claim_paysProRataToTwoInvestors() public {
        uint256 roundId = _twoInvestorRound();
        uint256 revenue = 10_000 * USDC;

        _fund(founder, revenue);
        vm.expectEmit(true, true, false, true);
        emit RoundTypes.RevenueDistributed(roundId, founder, revenue, revenue);
        vm.prank(founder);
        escrow.distribute(roundId, revenue);

        assertEq(escrow.getRound(roundId).distributed, revenue);
        assertEq(escrow.claimableOf(roundId, alice), 6_000 * USDC);
        assertEq(escrow.claimableOf(roundId, bob), 4_000 * USDC);
        assertEq(escrow.claimableOf(roundId, stranger), 0);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.expectEmit(true, true, false, true);
        emit RoundTypes.Claimed(roundId, alice, 6_000 * USDC);
        assertEq(_claim(alice, roundId), 6_000 * USDC);
        assertEq(usdc.balanceOf(alice), aliceBefore + 6_000 * USDC);
        assertEq(escrow.claimedOf(roundId, alice), 6_000 * USDC);
        assertEq(escrow.claimableOf(roundId, alice), 0);

        assertEq(_claim(bob, roundId), 4_000 * USDC);
        assertEq(escrow.claimableOf(roundId, bob), 0);
        assertEq(usdc.balanceOf(address(escrow)), ALICE_IN + BOB_IN);
    }

    function test_claim_roundsDownAndNeverOverpays() public {
        uint16[] memory bps = new uint16[](1);
        bps[0] = 10_000;
        uint256 roundId = _createRound(10, bps);
        _invest(alice, roundId, 3);
        _invest(bob, roundId, 7);
        escrow.finalize(roundId);
        _releaseAll(roundId);

        _distribute(founder, roundId, 5);
        assertEq(escrow.claimableOf(roundId, alice), 1);
        assertEq(escrow.claimableOf(roundId, bob), 3);
        _claim(alice, roundId);
        _claim(bob, roundId);
        assertEq(usdc.balanceOf(address(escrow)), 1);

        _distribute(founder, roundId, 5);
        assertEq(escrow.claimableOf(roundId, alice), 2);
        assertEq(escrow.claimableOf(roundId, bob), 4);
        _claim(alice, roundId);
        _claim(bob, roundId);
        assertEq(escrow.claimedOf(roundId, alice) + escrow.claimedOf(roundId, bob), 10);
    }
}
