import { type Chain } from "viem";
import { baseSepolia } from "viem/chains";

export const NEYNAR_USER_SCORE_ADDRESS = "0x7104CFfdf6A1C9ceF66cA0092c37542821C1EA50";

export const NEYNAR_USER_SCORE_ABI = [
    {
        inputs: [{ internalType: "uint256", name: "fid", type: "uint256" }],
        name: "getScore",
        outputs: [{ internalType: "uint24", name: "score", type: "uint24" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "verifier", type: "address" }],
        name: "getScore",
        outputs: [{ internalType: "uint24", name: "score", type: "uint24" }],
        stateMutability: "view",
        type: "function",
    }
] as const;
