"use client";

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingScreen from "@/components/ui/LoadingScreen";
export default function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
    // TEMPORARY BYPASS FOR SCREENSHOTS
    return <>{children}</>;
}
