import { createWalletClient, http, parseAbi, encodeAbiParameters, parseAbiParameters, parseSignature } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { AgentSettings } from './db';
import { getRaidSuggestion } from '../x402-client';

const AGENT_VAULT_ABI = parseAbi([
    'function executeAction(address user, string action, bytes data, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external'
]);

const RPC_URL = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
// Note: In production, use a secure secret manager. For MVP/Demo, env var is okay.
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const AGENT_VAULT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_VAULT_ADDRESS as `0x${string}`;

export async function executeAgentAction(agent: AgentSettings) {
    if (!PRIVATE_KEY) {
        console.warn("Skipping execution: No DEPLOYER_PRIVATE_KEY");
        return "Skipped (No Key)";
    }
    if (!AGENT_VAULT_ADDRESS) {
        console.warn("Skipping execution: No AGENT_VAULT_ADDRESS");
        return "Skipped (No Vault)";
    }

    if (!agent.delegation) {
        throw new Error("No delegation found");
    }

    const account = privateKeyToAccount(PRIVATE_KEY);
    const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(RPC_URL)
    });

    // 1. Determine Action
    let action = "claim";
    let data: `0x${string}` = "0x";

    if (agent.strategy === 'aggressive') {
        action = "raid";
        try {
            console.log(`[Agent] Requesting AI strategy for ${agent.userAddress}...`);
            const suggestion = await getRaidSuggestion(agent.userAddress, process.env.CRON_SECRET);
            const target = suggestion.targetAddress;
            console.log(`[Agent] AI Targeted: ${suggestion.targetHandle} (${target})`);

            data = encodeAbiParameters(
                parseAbiParameters('address'),
                [target as `0x${string}`]
            );
        } catch (err) {
            console.warn("[Agent] AI request failed, using fallback target.", err);
            // Fallback target for MVP
            const target = "0x8342A48694A74044116F330db5050a267b28dD85";
            data = encodeAbiParameters(
                parseAbiParameters('address'),
                [target as `0x${string}`]
            );
        }
    }

    // 2. Parse Signature
    console.log(`[Agent] Parsing signature for ${agent.userAddress}: ${agent.delegation.signature}`);
    try {
        const signature = parseSignature(agent.delegation.signature as `0x${string}`);
        console.log(`[Agent] Parsed Signature: v=${signature.v}, r=${signature.r}, s=${signature.s}, yParity=${signature.yParity}`);

        // 3. Submit Transaction
        const hash = await client.writeContract({
            address: AGENT_VAULT_ADDRESS,
            abi: AGENT_VAULT_ABI,
            functionName: 'executeAction',
            args: [
                agent.userAddress as `0x${string}`,
                action,
                data,
                BigInt(agent.delegation.deadline),
                Number(signature.v || (signature.yParity ? 28 : 27)), // Fallback if v is missing (should verify this logic)
                signature.r,
                signature.s
            ]
        });

        console.log(`Agent executed ${action} for ${agent.userAddress}: ${hash}`);
        return hash;
    } catch (error) {
        console.error(`Execution failed for ${agent.userAddress}:`, error);
        // Re-throw with more context if possible
        throw new Error(`Execution Failed: ${String(error)} (Sig: ${agent.delegation.signature.slice(0, 10)}...)`);
    }
}
