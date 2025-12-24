"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useWriteContract } from "wagmi";
import { parseAbi } from "viem";
import { USDC_ADDRESS } from "@/lib/basePay";

const MINT_ABI = parseAbi([
    "function mint(address to, uint256 amount) public"
]);

export default function FaucetButton() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [isLoading, setIsLoading] = useState(false);

    const handleMint = async () => {
        if (!address) return;
        setIsLoading(true);
        try {
            const tx = await writeContractAsync({
                address: USDC_ADDRESS as `0x${string}`,
                abi: MINT_ABI,
                functionName: "mint",
                args: [address, BigInt(1000 * 1e6)] // Mint 1000 USDC
            });
            console.log("Mint Tx:", tx);
            alert("Minted 1000 Test USDC! 💰");
        } catch (e) {
            console.error(e);
            alert("Failed to mint. See console.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleMint}
            disabled={isLoading}
            variant="ghost"
            className="text-xs text-green-500 hover:text-green-400 hover:bg-green-900/20 border border-green-900/50"
        >
            {isLoading ? "Wait..." : "+ Test USDC"}
        </Button>
    );
}
