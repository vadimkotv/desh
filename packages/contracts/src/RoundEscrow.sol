// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IRoundEscrow} from "./IRoundEscrow.sol";
import {ExitReturns} from "./ExitReturns.sol";
import {RoundEscrowBase} from "./RoundEscrowBase.sol";
import {RoundTypes} from "./RoundTypes.sol";

/// @title RoundEscrow
/// @notice Milestone escrow for startup fundraising rounds settled in USDC on Arc.
/// @dev Flow: platform creates a round -> investors `invest` until the deadline ->
///      anyone `finalize`s -> platform releases milestones (Funded) or investors `refund` (Failed).
///      Capital comes back only on a liquidity event, settled via `ExitReturns`
///      (`settleExit` / `claim`) — acquisition, IPO, TGE or a contract payout.
///      All transfers follow checks-effects-interactions and are reentrancy-guarded.
contract RoundEscrow is ExitReturns {
    using SafeERC20 for IERC20;

    /// @param usdc_ The ERC-20 held in escrow (Arc testnet USDC: 0x3600…0000).
    /// @param platform_ Operator allowed to create rounds and release milestones.
    constructor(IERC20 usdc_, address platform_) RoundEscrowBase(usdc_, platform_) {}

    /// @inheritdoc IRoundEscrow
    function createRound(
        address founder,
        uint256 target,
        uint64 deadline,
        uint16[] calldata milestoneBps,
        uint16 equityBps
    ) external onlyPlatform returns (uint256 roundId) {
        if (founder == address(0)) revert RoundTypes.ZeroAddress();
        if (target == 0) revert RoundTypes.ZeroAmount();
        if (deadline <= block.timestamp) revert RoundTypes.DeadlinePassed();
        _validateMilestones(milestoneBps);
        _validateEquity(equityBps);

        roundId = ++_roundCount;
        RoundTypes.Round storage round = _rounds[roundId];
        round.founder = founder;
        round.target = target;
        round.deadline = deadline;
        round.equityBps = equityBps;
        _milestones[roundId] = milestoneBps;

        emit RoundTypes.RoundCreated(roundId, founder, target, deadline, equityBps);
    }

    /// @inheritdoc IRoundEscrow
    function invest(uint256 roundId, uint256 amount) external nonReentrant {
        RoundTypes.Round storage round = _roundInStatus(roundId, RoundTypes.RoundStatus.Open);
        if (block.timestamp > round.deadline) revert RoundTypes.DeadlinePassed();
        if (amount == 0) revert RoundTypes.ZeroAmount();

        if (_contributions[roundId][msg.sender] == 0) _investorCount[roundId] += 1;
        _contributions[roundId][msg.sender] += amount;
        round.raised += amount;

        _USDC.safeTransferFrom(msg.sender, address(this), amount);
        emit RoundTypes.Invested(roundId, msg.sender, amount, round.raised);
    }

    /// @inheritdoc IRoundEscrow
    function finalize(uint256 roundId) external {
        RoundTypes.Round storage round = _roundInStatus(roundId, RoundTypes.RoundStatus.Open);
        bool targetMet = round.raised >= round.target;
        if (!targetMet && block.timestamp <= round.deadline) revert RoundTypes.NotFinalizable();

        round.status = targetMet ? RoundTypes.RoundStatus.Funded : RoundTypes.RoundStatus.Failed;
        emit RoundTypes.RoundFinalized(roundId, round.status);
    }

    /// @inheritdoc IRoundEscrow
    function releaseMilestone(uint256 roundId) external onlyPlatform nonReentrant {
        RoundTypes.Round storage round = _roundInStatus(roundId, RoundTypes.RoundStatus.Funded);
        uint16 index = round.releasedCount;
        uint16[] storage schedule = _milestones[roundId];
        uint256 amount = round.raised * schedule[index] / RoundTypes.BPS_DENOMINATOR;

        round.releasedCount = index + 1;
        round.released += amount;
        if (round.releasedCount == schedule.length) round.status = RoundTypes.RoundStatus.Closed;

        _USDC.safeTransfer(round.founder, amount);
        emit RoundTypes.MilestoneReleased(roundId, index, amount);
    }

    /// @inheritdoc IRoundEscrow
    function refund(uint256 roundId) external nonReentrant {
        _roundInStatus(roundId, RoundTypes.RoundStatus.Failed);
        uint256 amount = _contributions[roundId][msg.sender];
        if (amount == 0) revert RoundTypes.NothingToRefund();

        _contributions[roundId][msg.sender] = 0;

        _USDC.safeTransfer(msg.sender, amount);
        emit RoundTypes.Refunded(roundId, msg.sender, amount);
    }
}
