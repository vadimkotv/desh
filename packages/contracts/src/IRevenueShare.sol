// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRevenueShare
/// @notice Revenue-based financing returns: revenue is pushed into a funded round and
///         investors claim it pro-rata to their contribution until a return cap is reached.
/// @dev The cap is `raised * returnCapBps / 10_000`. Distributions are accepted while the
///      round is Funded or Closed; claims additionally while Repaid.
interface IRevenueShare {
    // ───────────────────────────── mutations ─────────────────────────────

    /// @notice Push `amount` USDC of revenue into a round for investors to claim.
    /// @dev Anyone may call (founder or a revenue router). Caller must have approved USDC.
    ///      Reverts with `ExceedsReturnCap` if the cumulative total would exceed the cap.
    ///      Flips a Closed round to Repaid once the cap is exactly reached.
    /// @param roundId Round to distribute into; must be Funded or Closed.
    /// @param amount USDC (6 decimals) to pull from the caller; must be non-zero.
    function distribute(uint256 roundId, uint256 amount) external;

    /// @notice Claim the caller's outstanding pro-rata share of distributed revenue.
    /// @dev Reverts with `NothingToClaim` when nothing is owed.
    /// @param roundId Round to claim from; must be Funded, Closed or Repaid.
    /// @return amount USDC transferred to the caller.
    function claim(uint256 roundId) external returns (uint256 amount);

    // ─────────────────────────────── views ───────────────────────────────

    /// @notice Maximum total revenue investors can receive: `raised * returnCapBps / 10_000`.
    function returnCapOf(uint256 roundId) external view returns (uint256);

    /// @notice Revenue currently claimable by `investor`: pro-rata share minus already claimed.
    /// @dev Returns 0 when the round has raised nothing.
    function claimableOf(uint256 roundId, address investor) external view returns (uint256);

    /// @notice Cumulative revenue already claimed by `investor` from a round.
    function claimedOf(uint256 roundId, address investor) external view returns (uint256);
}
