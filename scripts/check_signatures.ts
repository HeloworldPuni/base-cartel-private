
import { ethers } from 'ethers';

const events = [
    "Raid(address,address,uint256,bool,uint256)",
    "HighStakesRaid(address,address,uint256,uint256,uint256)",
    "RaidRequests(uint256,address,bool)",
    "RaidResult(uint256,address,bool,uint256)",
    "TransferSingle(address,address,address,uint256,uint256)",
    "Transfer(address,address,uint256)",
    "HeatUpdated(address,uint256,uint256)",
    "EconomyUpdated(uint256,uint256,uint256)"
];

console.log("--- Event Signatures ---");
events.forEach(e => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(e));
    console.log(`${e} \n -> ${hash}`);
});

console.log("\n--- Log Topics (from User) ---");
console.log("Log 0: 0x76421cb080d40e8a03ba462b500012451ba59bdebc46694dc458807c1d754b62");
console.log("Log 1: 0x546aca7b2683440b8f02fa95faeb8efc79dd0f16af3d815a002742ea6f76116c");
console.log("Log 2: 0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62 (TransferSingle confirmed)");
console.log("Log 3: 0x7522905434c4d418d51990d8afa2c25014c15acc70d1294155a49ee62244c9f7");
