// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RoundTypes} from "./RoundTypes.sol";

/// @title IOperated
/// @notice Single-operator ("platform") access control surface.
interface IOperated {
    /// @notice Address allowed to perform operator-only actions.
    function platform() external view returns (address);

    /// @notice Hand operator rights to a new address. Only the current platform.
    /// @param newPlatform The next operator; must be non-zero.
    function setPlatform(address newPlatform) external;
}

/// @title Operated
/// @notice Minimal single-operator access control mixin.
/// @dev Intentionally smaller than Ownable: one privileged address, transferable by itself.
abstract contract Operated is IOperated {
    /// @inheritdoc IOperated
    address public platform;

    /// @param initialPlatform First operator; must be non-zero.
    constructor(address initialPlatform) {
        _setPlatform(initialPlatform);
    }

    /// @dev Restricts a function to the current platform operator.
    modifier onlyPlatform() {
        if (msg.sender != platform) revert RoundTypes.NotPlatform();
        _;
    }

    /// @inheritdoc IOperated
    function setPlatform(address newPlatform) external onlyPlatform {
        _setPlatform(newPlatform);
    }

    /// @dev Shared setter used by the constructor and `setPlatform`.
    function _setPlatform(address newPlatform) private {
        if (newPlatform == address(0)) revert RoundTypes.ZeroAddress();
        platform = newPlatform;
        emit RoundTypes.PlatformChanged(newPlatform);
    }
}
