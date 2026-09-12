// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IExitReturns} from "./IExitReturns.sol";
import {RoundEscrowBase} from "./RoundEscrowBase.sol";
import {RoundTypes} from "./RoundTypes.sol";

/// @title ExitReturns
/// @notice Exit-based returns layer: a liquidity event pays proceeds into the round and
///         investors claim them pro-rata to their contribution. No cap, no revenue share.
/// @dev Sits between `RoundEscrowBase` and `RoundEscrow`. Transfers follow
///      checks-effects-interactions and are reentrancy-guarded.
abstract contract ExitReturns is RoundEscrowBase {
    using SafeERC20 for IERC20;

    /// @dev Cumulative proceeds already claimed per investor per round.
    mapping(uint256 roundId => mapping(address investor => uint256)) internal _claimed;

    // ───────────────────────────── mutations ─────────────────────────────

    /// @inheritdoc IExitReturns
    function settleExit(
        uint256 roundId,
        RoundTypes.ExitKind kind,
        uint256 valuation,
        uint256 proceeds,
        string calldata evidenceUri
    ) external nonReentrant {
        RoundTypes.Round storage round = _round(roundId);
        RoundTypes.RoundStatus status = round.status;
        if (status == RoundTypes.RoundStatus.Open || status == RoundTypes.RoundStatus.Failed) {
            revert RoundTypes.InvalidStatus();
        }
        if (msg.sender != platform && msg.sender != round.founder) {
            revert RoundTypes.NotAuthorized();
        }
        if (proceeds == 0) revert RoundTypes.ZeroAmount();

        // An exit freezes the milestone schedule, so escrow the founder never drew down
        // belongs to the investors and joins the claim pool.
        uint256 undrawn =
            status == RoundTypes.RoundStatus.Funded ? round.raised - round.released : 0;
        uint256 total = round.proceeds + proceeds + undrawn;
        round.proceeds = total;
        round.status = RoundTypes.RoundStatus.Exited;

        _USDC.safeTransferFrom(msg.sender, address(this), proceeds);
        emit RoundTypes.ExitSettled(roundId, kind, valuation, proceeds, total, evidenceUri);
    }

    /// @inheritdoc IExitReturns
    function claim(uint256 roundId) external nonReentrant returns (uint256 amount) {
        RoundTypes.Round storage round = _round(roundId);
        RoundTypes.RoundStatus status = round.status;
        if (status == RoundTypes.RoundStatus.Open || status == RoundTypes.RoundStatus.Failed) {
            revert RoundTypes.InvalidStatus();
        }
        amount = _claimable(roundId, round, msg.sender);
        if (amount == 0) revert RoundTypes.NothingToClaim();

        _claimed[roundId][msg.sender] += amount;

        _USDC.safeTransfer(msg.sender, amount);
        emit RoundTypes.Claimed(roundId, msg.sender, amount);
    }

    // ─────────────────────────────── views ───────────────────────────────

    /// @inheritdoc IExitReturns
    function entryValuationOf(uint256 roundId) external view returns (uint256) {
        RoundTypes.Round storage round = _round(roundId);
        return round.raised * RoundTypes.BPS_DENOMINATOR / round.equityBps;
    }

    /// @inheritdoc IExitReturns
    function claimableOf(uint256 roundId, address investor) external view returns (uint256) {
        return _claimable(roundId, _round(roundId), investor);
    }

    /// @inheritdoc IExitReturns
    function claimedOf(uint256 roundId, address investor) external view returns (uint256) {
        return _claimed[roundId][investor];
    }

    // ────────────────────────────── helpers ──────────────────────────────

    /// @dev Pro-rata share of every proceed settled so far, minus what was already claimed.
    ///      Floors per investor, so the sum of claims never exceeds the pool.
    function _claimable(uint256 roundId, RoundTypes.Round storage round, address investor)
        internal
        view
        returns (uint256)
    {
        uint256 raised = round.raised;
        if (raised == 0) return 0;
        uint256 share = round.proceeds * _contributions[roundId][investor] / raised;
        return share - _claimed[roundId][investor];
    }
}
