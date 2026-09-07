// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Revenue-share returns: repeated distributions, cap enforcement, Repaid transitions
///         and the unaffected refund path.
contract RoundEscrowRepaidTest is BaseTest {
    /// @dev Cap of the default fixture: 100k raised at 1.5x.
    uint256 internal constant CAP = TARGET * 15_000 / 10_000;

    function _claim(address who, uint256 roundId) internal returns (uint256) {
        vm.prank(who);
        return escrow.claim(roundId);
    }

    function _twoInvestorRound() internal returns (uint256 roundId) {
        roundId = _createRound();
        _invest(alice, roundId, 60_000 * USDC);
        _invest(bob, roundId, 40_000 * USDC);
        escrow.finalize(roundId);
    }

    // ────────────────────── repeated distributions ───────────────────────

    function test_claim_incrementalAcrossRepeatedDistributions() public {
        uint256 roundId = _twoInvestorRound();

        _distribute(founder, roundId, 10_000 * USDC);
        assertEq(_claim(alice, roundId), 6_000 * USDC);

        _distribute(stranger, roundId, 20_000 * USDC);
        assertEq(escrow.getRound(roundId).distributed, 30_000 * USDC);
        assertEq(escrow.claimableOf(roundId, alice), 12_000 * USDC);
        assertEq(escrow.claimableOf(roundId, bob), 12_000 * USDC);

        assertEq(_claim(alice, roundId), 12_000 * USDC);
        assertEq(_claim(bob, roundId), 12_000 * USDC);
        assertEq(escrow.claimedOf(roundId, alice), 18_000 * USDC);
        assertEq(escrow.claimedOf(roundId, bob), 12_000 * USDC);
    }

    function test_claim_revertsWhenNothingOwed() public {
        uint256 roundId = _twoInvestorRound();
        vm.prank(alice);
        vm.expectRevert(RoundTypes.NothingToClaim.selector);
        escrow.claim(roundId);

        _distribute(founder, roundId, 1_000 * USDC);
        _claim(alice, roundId);
        vm.prank(alice);
        vm.expectRevert(RoundTypes.NothingToClaim.selector);
        escrow.claim(roundId);

        vm.prank(stranger);
        vm.expectRevert(RoundTypes.NothingToClaim.selector);
        escrow.claim(roundId);
    }

    // ───────────────────────── cap enforcement ───────────────────────────

    function test_distribute_revertsBeyondCap() public {
        uint256 roundId = _fundedRound();
        _distribute(founder, roundId, CAP - 1);

        _fund(founder, 2);
        vm.prank(founder);
        vm.expectRevert(RoundTypes.ExceedsReturnCap.selector);
        escrow.distribute(roundId, 2);

        _distribute(founder, roundId, 1);
        assertEq(escrow.getRound(roundId).distributed, CAP);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Funded));
    }

    // ─────────────────────────── Repaid status ───────────────────────────

    function test_repaid_whenCapReachedThenLastMilestoneReleased() public {
        uint256 roundId = _fundedRound();
        _distribute(founder, roundId, CAP);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Funded));

        _releaseAll(roundId);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Repaid));
        assertEq(usdc.balanceOf(founder), TARGET);
        assertEq(_claim(alice, roundId), CAP);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_repaid_whenClosedThenCapReached() public {
        uint256 roundId = _fundedRound();
        _releaseAll(roundId);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Closed));

        _distribute(founder, roundId, CAP / 2);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Closed));

        _distribute(founder, roundId, CAP - CAP / 2);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Repaid));
        assertEq(_claim(alice, roundId), CAP);

        _fund(founder, 1);
        vm.prank(founder);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.distribute(roundId, 1);
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.releaseMilestone(roundId);
    }

    // ─────────────────────────── refund path ─────────────────────────────

    function test_refund_unaffectedOnFailedRound() public {
        uint256 amount = 10_000 * USDC;
        uint256 roundId = _failedRound(amount);
        assertEq(escrow.returnCapOf(roundId), amount * 15_000 / 10_000);
        assertEq(escrow.claimableOf(roundId, alice), 0);

        vm.prank(alice);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.claim(roundId);

        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        escrow.refund(roundId);
        assertEq(usdc.balanceOf(alice), before + amount);
        assertEq(escrow.contributionOf(roundId, alice), 0);
        assertEq(escrow.getRound(roundId).distributed, 0);
    }
}
