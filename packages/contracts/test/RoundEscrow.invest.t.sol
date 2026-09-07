// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice Investing into open rounds: accounting, events and guards.
contract RoundEscrowInvestTest is BaseTest {
    uint256 internal roundId;

    function setUp() public override {
        super.setUp();
        roundId = _createRound();
    }

    function test_invest_movesUsdcAndTracksContribution() public {
        uint256 amount = 10_000 * USDC;

        vm.expectEmit(true, true, true, true);
        emit RoundTypes.Invested(roundId, alice, amount, amount);
        _invest(alice, roundId, amount);

        assertEq(usdc.balanceOf(address(escrow)), amount);
        assertEq(escrow.contributionOf(roundId, alice), amount);
        assertEq(escrow.getRound(roundId).raised, amount);
        assertEq(escrow.investorCountOf(roundId), 1);
    }

    function test_invest_countsDistinctInvestorsOnce() public {
        _invest(alice, roundId, 1_000 * USDC);
        _invest(alice, roundId, 2_000 * USDC);
        _invest(bob, roundId, 500 * USDC);

        assertEq(escrow.investorCountOf(roundId), 2);
        assertEq(escrow.contributionOf(roundId, alice), 3_000 * USDC);
        assertEq(escrow.contributionOf(roundId, bob), 500 * USDC);
        assertEq(escrow.getRound(roundId).raised, 3_500 * USDC);
    }

    function test_invest_allowsOversubscription() public {
        _invest(alice, roundId, TARGET);
        _invest(bob, roundId, 50_000 * USDC);
        assertEq(escrow.getRound(roundId).raised, TARGET + 50_000 * USDC);
    }

    function test_invest_allowedExactlyAtDeadline() public {
        vm.warp(deadline);
        _invest(alice, roundId, 1 * USDC);
        assertEq(escrow.contributionOf(roundId, alice), 1 * USDC);
    }

    function test_invest_revertsAfterDeadline() public {
        vm.warp(deadline + 1);
        vm.prank(alice);
        vm.expectRevert(RoundTypes.DeadlinePassed.selector);
        escrow.invest(roundId, 1 * USDC);
    }

    function test_invest_revertsOnZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(RoundTypes.ZeroAmount.selector);
        escrow.invest(roundId, 0);
    }

    function test_invest_revertsOnUnknownRound() public {
        vm.prank(alice);
        vm.expectRevert(RoundTypes.InvalidRound.selector);
        escrow.invest(99, 1 * USDC);
    }

    function test_invest_revertsWhenNotOpen() public {
        _invest(alice, roundId, TARGET);
        escrow.finalize(roundId);

        vm.prank(bob);
        vm.expectRevert(RoundTypes.InvalidStatus.selector);
        escrow.invest(roundId, 1 * USDC);
    }

    function test_invest_revertsWithoutAllowance() public {
        usdc.mint(stranger, 1 * USDC);
        vm.prank(stranger);
        vm.expectRevert();
        escrow.invest(roundId, 1 * USDC);
    }
}
