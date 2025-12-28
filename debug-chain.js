
const ethers = require('ethers');

// CONFIG
const RPC_URL = "https://sepolia.base.org";
const PRIVATE_KEY = process.env.PAYMENT_ADDRESS; // Using existing env var for key just to run script
const USER_ADDRESS = "0xfe09c35AdB9200c90455d31a2BFdfD7e30c48F6d"; // From User Screenshot

// CONTRACTS (V3)
const USDC_ADDR = "0x9561130B92A9862657DBa1BF75bb155a04C6b73c";
const POT_ADDR = "0xC3Ee9556EC693949FD050e3f953B831d5b427a63";
const CORE_ADDR = "0x40fdD70ae4559dd9E4a31AD08673dBBA91DCB7a8";

// ABIs
const MINIMAL_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function RAID_FEE() view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Contracts
    const usdc = new ethers.Contract(USDC_ADDR, MINIMAL_ABI, provider);
    const core = new ethers.Contract(CORE_ADDR, MINIMAL_ABI, provider);

    console.log("--- DEBUGGING USER STATE ---");
    console.log(`User: ${USER_ADDRESS}`);

    try {
        // 1. Check USDC Config
        const decimals = await usdc.decimals();
        console.log(`USDC Decimals: ${decimals}`);

        // 2. Check User Balance
        const balance = await usdc.balanceOf(USER_ADDRESS);
        console.log(`User Balance: ${balance.toString()} (${ethers.formatUnits(balance, decimals)} USDC)`);

        // 3. Check Allowance for Pot
        const allowance = await usdc.allowance(USER_ADDRESS, POT_ADDR);
        console.log(`Allowance for Pot: ${allowance.toString()} (${ethers.formatUnits(allowance, decimals)} USDC)`);

        // 4. Check Required Fee
        const raidFee = await core.RAID_FEE();
        console.log(`Contract RAID_FEE: ${raidFee.toString()}`);

        // 5. Analysis
        console.log("\n--- VERDICT ---");
        if (balance < raidFee) {
            console.error("❌ INSUFFICIENT BALANCE. (User has less than Fee)");
        } else {
            console.log("✅ Balance OK.");
        }

        if (allowance < raidFee) {
            console.error("❌ INSUFFICIENT ALLOWANCE. (Allowance < Fee)");
        } else {
            console.log("✅ Allowance OK.");
        }

    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

main();
