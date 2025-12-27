

// USDC contract address on Base Mainnet
// USDC contract address on Localhost
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x9561130B92A9862657DBa1BF75bb155a04C6b73c'); // Prefer Mock, then Env, then Mainnet

// Contract addresses
export const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as string;
export const CARTEL_POT_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_POT_ADDRESS as string;
export const CARTEL_SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as string;

// Fee constants (in USDC, 18 decimals for V3 MockUSDC)
export const JOIN_FEE = BigInt(0); // FREE for Phase 1 (invite-only)
export const RAID_FEE = BigInt("5000000000000000");  // 0.005 USDC (18 decimals)
export const HIGH_STAKES_RAID_FEE = BigInt("15000000000000000"); // 0.015 USDC (18 decimals)

// Paymaster config
export const PAYMASTER_AND_DATA = {
    paymasterAddress: '0x0000000000000000000000000000000000000000', // Base Paymaster address
};

export function formatUSDC(amount: bigint): string {
    return (Number(amount) / 1e18).toFixed(3);
}

export function parseUSDC(amount: string): bigint {
    return BigInt(Math.floor(parseFloat(amount) * 1e18));
}
