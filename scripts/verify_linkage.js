
const { ethers } = require("ethers");

const CORE_ADDRESS = "0xf75DEa27fc9f35c611EC60Cc005721558FDb5d78";
const EXPECTED_SHARES = "0x7999c00df7a7d99c0Cc0f7e51f606383DCe6f208";
const RPC_URL = "https://sepolia.base.org";

const CORE_ABI = [
    "function sharesContract() view returns (address)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const core = new ethers.Contract(CORE_ADDRESS, CORE_ABI, provider);

    console.log("Checking Core Contract Linkage...");
    console.log("Core Address:", CORE_ADDRESS);

    try {
        const actualShares = await core.sharesContract();
        console.log("---------------------------------------------------");
        console.log("Core points to Shares (Chain):", actualShares);
        console.log("Expected Shares (Env File):   ", EXPECTED_SHARES);
        console.log("---------------------------------------------------");

        if (actualShares.toLowerCase() === EXPECTED_SHARES.toLowerCase()) {
            console.log("✅ MATCH! The contracts are correctly linked.");
        } else {
            console.log("❌ MISMATCH! The Core contract is using a DIFFERENT Shares contract.");
            console.log("CRITICAL FIX: Update NEXT_PUBLIC_CARTEL_SHARES_ADDRESS to:", actualShares);
        }

    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

main();
