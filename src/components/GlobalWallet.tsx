"use client";

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';

export function GlobalWallet() {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                width: 1,
                height: 1,
                opacity: 0,
                zIndex: -9999,
                overflow: 'hidden',
                pointerEvents: 'auto' // Allow clicks
            }}
            className="global-wallet-container"
        >
            <Wallet>
                <ConnectWallet className="global-connect-wallet-trigger" />
            </Wallet>
        </div>
    );
}
