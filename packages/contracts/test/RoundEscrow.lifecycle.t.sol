// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Finalization, milestone release and refunds.
contract RoundEscrowLifecycleTest is BaseTest {
    // ───────────────────────────── finalize ──────────────────────────────

    function test_finalize_fundedWhenTargetReached() public {
        uint256 roundId = _createRound();
        _invest(alice, roundId, TARGET);

        vm.expectEmit(true, false, false, true);
        emit RoundTypes.RoundFinalized(roundId, RoundTypes.RoundStatus.Funded);
        vm.prank(stranger);
        escrow.finalize(roundId);

        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Funded));
    }

    function test_finalize_failedAfterDeadlineUnderTarget() public {
        uint256 roundId = _createRound();
        _invest(alice, roundId, TARGET / 2);
        vm.warp(deadline + 1);

        vm.expectEmit(true, false, false, true);
        emit RoundTypes.RoundFinalized(roundId, RoundTypes.RoundStatus.Failed);
        escrow.finalize(roundId);

        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Failed));
    }

    function test_finalize_fundedAfterDeadlineWhenTargetMet() public {
        uint256 roundId = _createRound();
        _invest(alice, roundId, TARGET);
        vm.warp(deadline + 1);
        escrow.finalize(roundId);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Funded));
    }

    function test_finalize_revertsBeforeDeadlineUnderTarget() public {
        uint256 roundId = _createRound();
        _invest(alice, roundId, TARGET - 1);
        vm.expectRevert(RoundTypes.NotFinalizable.selector);
        escrow.finalize(roundId);
    }

    function test_finalize_revertsWhenAlreadyFinalized() public {
        uint256 roundId = _fundedRound();
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.finalize(roundId);
    }

    // ────────────────────────────── refund ───────────────────────────────

    function test_refund_returnsContributionOnce() public {
        uint256 amount = 10_000 * USDC;
        uint256 roundId = _failedRound(amount);
        uint256 before = usdc.balanceOf(alice);

        vm.expectEmit(true, true, false, true);
        emit RoundTypes.Refunded(roundId, alice, amount);
        vm.prank(alice);
        escrow.refund(roundId);

        assertEq(usdc.balanceOf(alice), before + amount);
        assertEq(escrow.contributionOf(roundId, alice), 0);
        assertEq(usdc.balanceOf(address(escrow)), 0);

        vm.prank(alice);
        vm.expectRevert(RoundTypes.NothingToRefund.selector);
        escrow.refund(roundId);
    }

    function test_refund_revertsForNonContributor() public {
        uint256 roundId = _failedRound(1 * USDC);
        vm.prank(bob);
        vm.expectRevert(RoundTypes.NothingToRefund.selector);
        escrow.refund(roundId);
    }

    function test_refund_revertsWhenNotFailed() public {
        uint256 roundId = _fundedRound();
        vm.prank(alice);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.refund(roundId);

        uint256 openId = _createRound();
        _invest(alice, openId, 1 * USDC);
        vm.prank(alice);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.refund(openId);
    }
}
