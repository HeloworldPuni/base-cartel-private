// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICartelCore {
    function onShareTransfer(address from, address to) external;
    function syncRewardDebt(address user, uint256 newBalance) external;
}

contract CartelShares is ERC1155, ERC1155Supply, Ownable {
    uint256 public constant SHARE_ID = 1;
    
    address public minter;

    constructor() ERC1155("https://api.basecartel.in/metadata/{id}.json") Ownable(msg.sender) {
        // Initial minting logic can go here or be controlled by CartelCore
    }

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function mint(address account, uint256 amount, bytes memory data) public onlyMinter {
        _mint(account, SHARE_ID, amount, data);
    }

    function burn(address account, uint256 amount) public onlyMinter {
        _burn(account, SHARE_ID, amount);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    // Unordered override required by Solidity
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        // 1. Pre-Update Hook: Claim rewards for both parties (uses OLD balances)
        if (owner() != address(0)) { // Ensure owner/core is set
             // We assume owner() is CartelCore or minter? 
             // Actually, CartelCore OWNS CartelShares.
             // So we cast owner() to ICartelCore.
             try ICartelCore(owner()).onShareTransfer(from, to) {} catch {}
        }

        // 2. Perform Transfer (Balances change)
        super._update(from, to, ids, values);
        
        // 3. Post-Update Hook: Sync Debt (uses NEW balances)
        if (owner() != address(0)) {
            // Sync sender debt
            if (from != address(0)) {
                 try ICartelCore(owner()).syncRewardDebt(from, balanceOf(from, SHARE_ID)) {} catch {}
            }
            // Sync receiver debt
            if (to != address(0)) {
                 try ICartelCore(owner()).syncRewardDebt(to, balanceOf(to, SHARE_ID)) {} catch {}
            }
        }
    }
}
