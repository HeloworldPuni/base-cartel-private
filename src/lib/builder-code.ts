import { Attribution } from 'ox/erc8021';

export const BUILDER_CODE = 'bc_2org5bmj';

/**
 * Generates the ERC-8021 data suffix for the configured Builder Code.
 */
export function getBuilderSuffix(): `0x${string}` {
    try {
        const suffix = Attribution.toDataSuffix({
            codes: [BUILDER_CODE]
        });
        return suffix as `0x${string}`;
    } catch (e) {
        console.error("Failed to generate builder suffix:", e);
        return '0x';
    }
}

/**
 * Appends the builder suffix to existing calldata.
 * Handles the 0x prefix correctly.
 */
export function appendBuilderSuffix(data: `0x${string}`): `0x${string}` {
    const suffix = getBuilderSuffix();
    if (suffix === '0x') return data;

    // Remove 0x from suffix
    const cleanSuffix = suffix.slice(2);
    return `${data}${cleanSuffix}` as `0x${string}`;
}
