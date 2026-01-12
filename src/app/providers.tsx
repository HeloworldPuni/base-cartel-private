"use client";

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';
import WagmiProvider from "~/components/providers/WagmiProvider";
import FrameProvider from "~/components/providers/FrameProvider";

import { SharedCastHandler } from "~/components/farcaster/SharedCastHandler";

import { SessionProvider } from 'next-auth/react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';

import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";

const farcasterConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: typeof window !== 'undefined' ? window.location.host : 'basecartel.in',
};

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "3070442b-5872-4d2a-b684-2131922c0697", // Fallback or User provided
        defaultTheme: Theme.Dark,
      }}
    >
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
    </NeynarContextProvider>
  );
}
        </SessionProvider >
      </OnchainKitProvider >
    </AuthKitProvider >
  );
}
