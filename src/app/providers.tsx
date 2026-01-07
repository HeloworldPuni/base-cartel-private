"use client";

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';
import WagmiProvider from "~/components/providers/WagmiProvider";
import FrameProvider from "~/components/providers/FrameProvider";

import { SharedCastHandler } from "~/components/farcaster/SharedCastHandler";

import { SessionProvider } from 'next-auth/react';
import { AuthKitProvider } from '@farcaster/auth-kit';

const farcasterConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: typeof window !== 'undefined' ? window.location.host : 'basecartel.in',
  siweUri: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://basecartel.in/login',
};

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthKitProvider config={farcasterConfig}>
      <OnchainKitProvider
        chain={base}
        apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
        config={{
          appearance: {
            mode: 'dark',
            theme: 'default',
          },
          wallet: {
            display: 'modal',
            termsUrl: 'https://www.base.org/terms-of-service',
            privacyUrl: 'https://www.base.org/privacy-policy',
          },
        }}
      >
        <SessionProvider>
          <FrameProvider>
            <SharedCastHandler />
            <WagmiProvider>{children}</WagmiProvider>
          </FrameProvider>
        </SessionProvider>
      </OnchainKitProvider>
    </AuthKitProvider>
  );
}
