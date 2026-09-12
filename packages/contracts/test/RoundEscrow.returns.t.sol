// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Exit returns: settlement guards and pro-rata claims.
/// @dev Repeated settlements, undrawn escrow and Exited transitions live in
///      RoundEscrow.exit.t.sol; the stake sold lives in RoundEscrow.equity.t.sol.
contract RoundEscrowReturnsTest is BaseTest {
    uint256 internal constant ALICE_IN = 60_000 * USDC;
    uint256 internal constant BOB_IN = 40_000 * USDC;

    /// @dev Funded round with alice 60% / bob 40% of a 100k raise, all milestones drawn.
    function _twoInvestorRound() internal returns (uint256 roundId) {
        roundId = _createRound();
        _invest(alice, roundId, ALICE_IN);
        _invest(bob, roundId, BOB_IN);
        escrow.finalize(roundId);
        _releaseAll(roundId);
    }

    function _claim(address who, uint256 roundId) internal returns (uint256) {
        vm.prank(who);
        return escrow.claim(roundId);
    }

    // ──────────────────────── settleExit guards ──────────────────────────

    function test_settleExit_revertsWhileOpenOrFailed() public {
        uint256 openId = _createRound();
        _fund(founder, 1 * USDC);
        vm.prank(founder);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.settleExit(openId, RoundTypes.ExitKind.IPO, 0, 1 * USDC, EVIDENCE);

        uint256 failedId = _failedRound(TARGET / 2);
        vm.prank(founder);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.settleExit(failedId, RoundTypes.ExitKind.IPO, 0, 1 * USDC, EVIDENCE);
    }

    function test_settleExit_revertsOnZeroProceeds() public {
        uint256 roundId = _fundedRound();
        vm.prank(founder);
        vm.expectRevert(RoundTypes.ZeroAmount.selector);
        escrow.settleExit(roundId, RoundTypes.ExitKind.TGE, 1, 0, EVIDENCE);
    }

    function test_settleExit_revertsForStranger() public {
        uint256 roundId = _fundedRound();
        _fund(stranger, 1 * USDC);
        vm.prank(stranger);
        vm.expectRevert(RoundTypes.NotAuthorized.selector);
        escrow.settleExit(roundId, RoundTypes.ExitKind.Contract, 1, 1 * USDC, EVIDENCE);
    }

    function test_settleExit_acceptedFromPlatformAndFounder() public {
        uint256 platformRound = _twoInvestorRound();
        _settleExit(platform, platformRound, 1_000 * USDC);
        assertEq(escrow.getRound(platformRound).proceeds, 1_000 * USDC);

        uint256 founderRound = _twoInvestorRound();
        _settleExit(founder, founderRound, 2_000 * USDC);
        assertEq(escrow.getRound(founderRound).proceeds, 2_000 * USDC);
    }

    // ───────────────────────── pro-rata claims ───────────────────────────

    function test_claim_paysProRataToTwoInvestors() public {
        uint256 roundId = _twoInvestorRound();
        uint256 proceeds = 400_000 * USDC;

        _fund(founder, proceeds);
        vm.expectEmit(true, true, false, true);
        emit RoundTypes.ExitSettled(
            roundId, RoundTypes.ExitKind.Acquisition, 5_000_000 * USDC, proceeds, proceeds, EVIDENCE
        );
        vm.prank(founder);
        escrow.settleExit(
            roundId, RoundTypes.ExitKind.Acquisition, 5_000_000 * USDC, proceeds, EVIDENCE
        );

        assertEq(escrow.getRound(roundId).proceeds, proceeds);
        assertEq(escrow.claimableOf(roundId, alice), 240_000 * USDC);
        assertEq(escrow.claimableOf(roundId, bob), 160_000 * USDC);
        assertEq(escrow.claimableOf(roundId, stranger), 0);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.expectEmit(true, true, false, true);
        emit RoundTypes.Claimed(roundId, alice, 240_000 * USDC);
        assertEq(_claim(alice, roundId), 240_000 * USDC);
        assertEq(usdc.balanceOf(alice), aliceBefore + 240_000 * USDC);
        assertEq(escrow.claimedOf(roundId, alice), 240_000 * USDC);
        assertEq(escrow.claimableOf(roundId, alice), 0);

        assertEq(_claim(bob, roundId), 160_000 * USDC);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_claim_roundsDownAndNeverOverpays() public {
        uint16[] memory bps = new uint16[](1);
        bps[0] = 10_000;
        uint256 roundId = _createRound(10, bps);
        _invest(alice, roundId, 3);
        _invest(bob, roundId, 7);
        escrow.finalize(roundId);
        _releaseAll(roundId);

        _settleExit(founder, roundId, 5);
        assertEq(escrow.claimableOf(roundId, alice), 1);
        assertEq(escrow.claimableOf(roundId, bob), 3);
        _claim(alice, roundId);
        _claim(bob, roundId);
        assertEq(usdc.balanceOf(address(escrow)), 1);

        _settleExit(founder, roundId, 5);
        assertEq(escrow.claimableOf(roundId, alice), 2);
        assertEq(escrow.claimableOf(roundId, bob), 4);
        _claim(alice, roundId);
        _claim(bob, roundId);
        assertEq(escrow.claimedOf(roundId, alice) + escrow.claimedOf(roundId, bob), 10);
    }
}
