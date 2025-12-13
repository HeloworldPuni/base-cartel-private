"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useWriteContract } from "wagmi";
import ERC20ABI from "@/lib/abi/ERC20.json";
import { USDC_ADDRESS } from "@/lib/basePay";

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
                abi: ERC20ABI,
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
            variant="outline"
            className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
        >
            {isLoading ? "Minting..." : "💵 Get Test USDC"}
        </Button>
    );
}
