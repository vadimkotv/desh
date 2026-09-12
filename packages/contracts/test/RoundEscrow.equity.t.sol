// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {RoundTypes} from "../src/RoundTypes.sol";

/// @notice The stake a round sells: bounds validation and the entry valuation it implies.
contract RoundEscrowEquityTest is BaseTest {
    function test_createRound_acceptsEquityBounds() public {
        _createRound(TARGET, _milestones(), 10);
        _createRound(TARGET, _milestones(), 5_000);
        assertEq(escrow.getRound(1).equityBps, 10);
        assertEq(escrow.getRound(2).equityBps, 5_000);
    }

    function test_createRound_revertsOnEquityOutOfBounds() public {
        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidEquity.selector);
        escrow.createRound(founder, TARGET, deadline, _milestones(), 9);

        vm.prank(platform);
        vm.expectRevert(RoundTypes.InvalidEquity.selector);
        escrow.createRound(founder, TARGET, deadline, _milestones(), 5_001);
    }

    function test_entryValuationOf_isRaisedOverEquity() public {
        uint256 roundId = _fundedRound();
        assertEq(escrow.entryValuationOf(roundId), TARGET * 10_000 / EQUITY_BPS);
    }

    function test_entryValuationOf_scalesWithTheStakeSold() public {
        uint16[] memory bps = _milestones();
        uint256 fat = _createRound(TARGET, bps, 5_000);
        uint256 thin = _createRound(TARGET, bps, 500);
        _invest(alice, fat, TARGET);
        _invest(alice, thin, TARGET);

        assertEq(escrow.entryValuationOf(fat), TARGET * 2);
        assertEq(escrow.entryValuationOf(thin), TARGET * 20);
    }
}
