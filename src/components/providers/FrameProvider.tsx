'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface FrameContextType {
  isInMiniApp: boolean;
  context?: any;
  login: () => Promise<void>;
}

const FrameContext = createContext<FrameContextType>({
  isInMiniApp: false,
  login: async () => { },
});

export const useFrameContext = () => useContext(FrameContext);

export default function FrameProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ctx = await sdk.context;
        if (ctx) {
          setContext(ctx);
        }
      } catch (e) {
        console.warn("Failed to load frame context", e);
      }
      sdk.actions.ready();
    };
    if (sdk && !context) {
      load();
    }
  }, []); // Run once on mount

  const login = async () => {
    try {
      const result = await sdk.actions.signIn({
        nonce: Math.random().toString(36).substring(7), // Simple nonce
      });

      // Verify on server
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: result.message,
          signature: result.signature,
          nonce: result.nonce,
        }),
      });

      if (res.ok) {
        console.log("SIWF Success!");
        // Optionally reload or update state
      } else {
        console.error("SIWF Verification Failed");
      }
    } catch (e) {
      console.error("SIWF Error", e);
    }
  };

  return (
    <FrameContext.Provider value={{ isInMiniApp: !!context?.user, context, login }}>
      {children}
    </FrameContext.Provider>
  );
}
