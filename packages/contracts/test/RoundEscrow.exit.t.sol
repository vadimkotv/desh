// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Exit settlement: status transitions, follow-on tranches, undrawn escrow
///         returning to investors, and the unaffected refund path.
contract RoundEscrowExitTest is BaseTest {
    function _claim(address who, uint256 roundId) internal returns (uint256) {
        vm.prank(who);
        return escrow.claim(roundId);
    }

    function _twoInvestorRound() internal returns (uint256 roundId) {
        roundId = _createRound();
        _invest(alice, roundId, 60_000 * USDC);
        _invest(bob, roundId, 40_000 * USDC);
        escrow.finalize(roundId);
        _releaseAll(roundId);
    }

    // ──────────────────────── status transitions ─────────────────────────

    function test_settleExit_flipsClosedRoundToExited() public {
        uint256 roundId = _twoInvestorRound();
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Closed));

        _settleExit(founder, roundId, RoundTypes.ExitKind.IPO, 9_000_000 * USDC, 700_000 * USDC);

        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Exited));
        assertEq(escrow.getRound(roundId).proceeds, 700_000 * USDC);
    }

    function test_settleExit_freezesTheMilestoneSchedule() public {
        uint256 roundId = _fundedRound();
        vm.prank(platform);
        escrow.releaseMilestone(roundId);

        _settleExit(founder, roundId, 500_000 * USDC);

        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.releaseMilestone(roundId);
    }

    // ───────────────── undrawn escrow returns to investors ───────────────

    function test_settleExit_addsUndrawnEscrowToTheClaimPool() public {
        uint256 roundId = _fundedRound();
        vm.prank(platform);
        escrow.releaseMilestone(roundId); // 40% drawn, 60% still escrowed
        uint256 undrawn = TARGET * 6_000 / 10_000;

        _settleExit(founder, roundId, 200_000 * USDC);

        assertEq(escrow.getRound(roundId).proceeds, 200_000 * USDC + undrawn);
        assertEq(_claim(alice, roundId), 200_000 * USDC + undrawn);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_settleExit_addsNothingExtraOnceClosed() public {
        uint256 roundId = _twoInvestorRound();
        _settleExit(founder, roundId, 250_000 * USDC);
        assertEq(escrow.getRound(roundId).proceeds, 250_000 * USDC);
    }

    // ───────────────────── follow-on settlements ─────────────────────────

    function test_claim_incrementalAcrossRepeatedSettlements() public {
        uint256 roundId = _twoInvestorRound();

        _settleExit(founder, roundId, 10_000 * USDC);
        assertEq(_claim(alice, roundId), 6_000 * USDC);

        // Earn-out tranche settled by the platform after the headline payment.
        _settleExit(platform, roundId, RoundTypes.ExitKind.Contract, 0, 20_000 * USDC);
        assertEq(escrow.getRound(roundId).proceeds, 30_000 * USDC);
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

        _settleExit(founder, roundId, 1_000 * USDC);
        _claim(alice, roundId);
        vm.prank(alice);
        vm.expectRevert(RoundTypes.NothingToClaim.selector);
        escrow.claim(roundId);

        vm.prank(stranger);
        vm.expectRevert(RoundTypes.NothingToClaim.selector);
        escrow.claim(roundId);
    }

    // ─────────────────────────── refund path ─────────────────────────────

    function test_refund_unaffectedOnFailedRound() public {
        uint256 amount = 10_000 * USDC;
        uint256 roundId = _failedRound(amount);
        assertEq(escrow.entryValuationOf(roundId), amount * 10_000 / EQUITY_BPS);
        assertEq(escrow.claimableOf(roundId, alice), 0);

        vm.prank(alice);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.claim(roundId);

        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        escrow.refund(roundId);
        assertEq(usdc.balanceOf(alice), before + amount);
        assertEq(escrow.contributionOf(roundId, alice), 0);
        assertEq(escrow.getRound(roundId).proceeds, 0);
    }
}
