// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Round creation validation, access control and platform rotation.
contract RoundEscrowCreateTest is BaseTest {
    function test_constructor_setsPlatformAndUsdc() public view {
        assertEq(escrow.platform(), platform);
        assertEq(escrow.usdc(), address(usdc));
        assertEq(escrow.roundCount(), 0);
    }

    function test_createRound_storesStateAndEmits() public {
        vm.expectEmit(true, true, true, true);
        emit RoundTypes.RoundCreated(1, founder, TARGET, deadline, EQUITY_BPS);

        uint256 roundId = _createRound();

        assertEq(roundId, 1);
        assertEq(escrow.roundCount(), 1);
        RoundTypes.Round memory round = escrow.getRound(roundId);
        assertEq(round.founder, founder);
        assertEq(round.target, TARGET);
        assertEq(round.raised, 0);
        assertEq(round.deadline, deadline);
        assertEq(uint8(round.status), uint8(RoundTypes.RoundStatus.Open));
        assertEq(round.releasedCount, 0);
        assertEq(round.equityBps, EQUITY_BPS);
        assertEq(round.released, 0);
        assertEq(round.proceeds, 0);

        uint16[] memory bps = escrow.getMilestones(roundId);
        assertEq(bps.length, 3);
        assertEq(uint256(bps[0]) + bps[1] + bps[2], 10_000);
    }

    function test_createRound_idsIncrement() public {
        assertEq(_createRound(), 1);
        assertEq(_createRound(), 2);
        assertEq(escrow.roundCount(), 2);
    }

    function test_createRound_revertsForNonPlatform() public {
        vm.prank(stranger);
        vm.expectRevert(RoundTypes.NotPlatform.selector);
        escrow.createRound(founder, TARGET, deadline, _milestones(), EQUITY_BPS);
    }

    function test_createRound_revertsOnZeroFounder() public {
        vm.prank(platform);
        vm.expectRevert(RoundTypes.ZeroAddress.selector);
        escrow.createRound(address(0), TARGET, deadline, _milestones(), EQUITY_BPS);
    }

    function test_createRound_revertsOnZeroTarget() public {
        vm.prank(platform);
        vm.expectRevert(RoundTypes.ZeroAmount.selector);
        escrow.createRound(founder, 0, deadline, _milestones(), EQUITY_BPS);
    }

    function test_createRound_revertsOnPastDeadline() public {
        vm.prank(platform);
        vm.expectRevert(RoundTypes.DeadlinePassed.selector);
        escrow.createRound(founder, TARGET, uint64(block.timestamp), _milestones(), EQUITY_BPS);
    }

    function test_createRound_revertsWhenBpsDoNotSumTo10000() public {
        uint16[] memory bps = new uint16[](2);
        (bps[0], bps[1]) = (5_000, 4_000);
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidMilestones.selector);
        escrow.createRound(founder, TARGET, deadline, bps, EQUITY_BPS);
    }

    function test_createRound_revertsOnEmptyOrTooManyMilestones() public {
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidMilestones.selector);
        escrow.createRound(founder, TARGET, deadline, new uint16[](0), EQUITY_BPS);

        uint16[] memory bps = new uint16[](21);
        for (uint256 i; i < 20; ++i) {
            bps[i] = 500;
        }
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidMilestones.selector);
        escrow.createRound(founder, TARGET, deadline, bps, EQUITY_BPS);
    }

    function test_getRound_revertsOnUnknownId() public {
        vm.expectRevert(RoundTypes.InvalidRound.selector);
        escrow.getRound(1);
    }

    function test_setPlatform_rotatesOperator() public {
        vm.prank(platform);
        vm.expectEmit(true, false, false, false);
        emit RoundTypes.PlatformChanged(stranger);
        escrow.setPlatform(stranger);
        assertEq(escrow.platform(), stranger);

        vm.prank(platform);
        vm.expectRevert(RoundTypes.NotPlatform.selector);
        escrow.setPlatform(platform);
    }
}
