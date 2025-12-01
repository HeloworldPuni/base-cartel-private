"use client";

import WagmiProvider from "~/components/providers/WagmiProvider";
import FrameProvider from "~/components/providers/FrameProvider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FrameProvider>
      <WagmiProvider>{children}</WagmiProvider>
    </FrameProvider>
  );
}
