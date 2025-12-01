// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CartelShares is ERC1155, Ownable {
    uint256 public constant SHARE_ID = 1;
    
    constructor() ERC1155("https://api.farcastercartel.com/metadata/{id}.json") Ownable(msg.sender) {
        // Initial minting logic can go here or be controlled by CartelCore
    }

    function mint(address account, uint256 amount, bytes memory data) public onlyOwner {
        _mint(account, SHARE_ID, amount, data);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, SHARE_ID, amount);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}
