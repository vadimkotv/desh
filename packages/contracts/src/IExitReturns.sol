// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RoundTypes} from "./RoundTypes.sol";

/// @title IExitReturns
/// @notice Exit-based returns: a round pays investors only on a liquidity event —
///         acquisition, IPO, token generation event, or a contract payout.
/// @dev Proceeds are pooled in the escrow and claimed pro-rata to contribution. There is
///      no cap and no revenue share: whatever the exit pays is what investors split.
interface IExitReturns {
    // ───────────────────────────── mutations ─────────────────────────────

    /// @notice Settle a liquidity event into a round, funding the investor claim pool.
    /// @dev Callable by the platform or the round's founder while the round is Funded,
    ///      Closed or already Exited (follow-on tranches and earn-outs). The first
    ///      settlement flips the round to Exited and returns any escrow the founder has
    ///      not yet drawn down to the claim pool. Caller must have approved USDC.
    /// @param roundId Round to settle.
    /// @param kind Which liquidity event occurred.
    /// @param valuation Headline valuation of the event in USDC, for the record.
    /// @param proceeds USDC (6 decimals) pulled from the caller into the claim pool.
    /// @param evidenceUri Link to the announcement, SPA or on-chain proof of the event.
    function settleExit(
        uint256 roundId,
        RoundTypes.ExitKind kind,
        uint256 valuation,
        uint256 proceeds,
        string calldata evidenceUri
    ) external;

    /// @notice Claim the caller's outstanding pro-rata share of the exit proceeds.
    /// @dev Reverts with `NothingToClaim` when nothing is owed.
    /// @param roundId Round to claim from; must not be Open or Failed.
    /// @return amount USDC transferred to the caller.
    function claim(uint256 roundId) external returns (uint256 amount);

    // ─────────────────────────────── views ───────────────────────────────

    /// @notice Valuation the round was priced at: `raised * 10_000 / equityBps`.
    /// @dev Returns 0 before anything is raised.
    function entryValuationOf(uint256 roundId) external view returns (uint256);

    /// @notice Exit proceeds currently claimable by `investor`, minus what was claimed.
    /// @dev Returns 0 when the round has raised nothing.
    function claimableOf(uint256 roundId, address investor) external view returns (uint256);

    /// @notice Cumulative proceeds already claimed by `investor` from a round.
    function claimedOf(uint256 roundId, address investor) external view returns (uint256);
}
