'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface FrameContextType {
  isInMiniApp: boolean;
  context?: any;
}

const FrameContext = createContext<FrameContextType>({ isInMiniApp: false });

export const useFrameContext = () => useContext(FrameContext);

export default function FrameProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ctx = await sdk.context;
        // Only set context if we actually have user data or frame context
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

  return (
    <FrameContext.Provider value={{ isInMiniApp: !!context?.user, context }}>
      {children}
    </FrameContext.Provider>
  );
}
