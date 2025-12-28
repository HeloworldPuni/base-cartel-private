
const ethers = require('ethers');

// CONFIG
const RPC_URL = "https://sepolia.base.org";
const PRIVATE_KEY = process.env.PAYMENT_ADDRESS;

async function main() {
    if (!PRIVATE_KEY) {
        console.error("❌ PAYMENT_ADDRESS env var missing");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("--- DEBUG RELAYER ---");
    console.log(`Address: ${wallet.address}`);

    try {
        const balance = await provider.getBalance(wallet.address);
        console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

        if (balance < BigInt("1000000000000000")) { // 0.001 ETH
            console.error("❌ LOW BALANCE! Relayer cannot pay gas.");
        } else {
            console.log("✅ Balance OK.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
