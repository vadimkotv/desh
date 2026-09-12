// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Milestone release ordering, amounts, closing and access control.
contract RoundEscrowMilestonesTest is BaseTest {
    function _release(uint256 roundId) internal {
        vm.prank(platform);
        escrow.releaseMilestone(roundId);
    }

    function test_releaseMilestone_paysTranchesInOrderThenCloses() public {
        uint256 roundId = _fundedRound();
        uint256 raised = escrow.getRound(roundId).raised;
        uint16[] memory bps = escrow.getMilestones(roundId);
        uint256 paid;

        for (uint16 i; i < bps.length; ++i) {
            uint256 expected = raised * bps[i] / 10_000;

            vm.expectEmit(true, false, false, true);
            emit RoundTypes.MilestoneReleased(roundId, i, expected);
            _release(roundId);

            paid += expected;
            assertEq(usdc.balanceOf(founder), paid);
            assertEq(escrow.getRound(roundId).releasedCount, i + 1);
            assertEq(escrow.getRound(roundId).released, paid);
        }

        assertEq(paid, raised);
        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Closed));
    }

    function test_releaseMilestone_usesRaisedNotTargetWhenOversubscribed() public {
        uint256 roundId = _createRound();
        _invest(alice, roundId, TARGET);
        _invest(bob, roundId, 25_000 * USDC);
        escrow.finalize(roundId);

        _release(roundId);
        assertEq(usdc.balanceOf(founder), (TARGET + 25_000 * USDC) * 4_000 / 10_000);
    }

    function test_releaseMilestone_singleTrancheClosesImmediately() public {
        uint16[] memory bps = new uint16[](1);
        bps[0] = 10_000;
        uint256 roundId = _createRound(TARGET, bps);
        _invest(alice, roundId, TARGET);
        escrow.finalize(roundId);

        _release(roundId);
        assertEq(usdc.balanceOf(founder), TARGET);
        assertEq(uint8(_status(roundId)), uint8(RoundTypes.RoundStatus.Closed));
    }

    function test_releaseMilestone_revertsAfterClosed() public {
        uint256 roundId = _fundedRound();
        for (uint256 i; i < 3; ++i) {
            _release(roundId);
        }

        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.releaseMilestone(roundId);
    }

    function test_releaseMilestone_revertsWhenOpen() public {
        uint256 roundId = _createRound();
        _invest(alice, roundId, TARGET);
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.releaseMilestone(roundId);
    }

    function test_releaseMilestone_revertsWhenFailed() public {
        uint256 roundId = _failedRound(TARGET / 2);
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.releaseMilestone(roundId);
    }

    function test_releaseMilestone_revertsForNonPlatform() public {
        uint256 roundId = _fundedRound();
        vm.prank(founder);
        vm.expectRevert(RoundTypes.NotPlatform.selector);
        escrow.releaseMilestone(roundId);
    }
}
