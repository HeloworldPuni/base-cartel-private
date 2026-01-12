"use client";

import { SignInButton, useSignIn } from "@farcaster/auth-kit";
import { useState } from "react";

export default function DebugAuthPage() {
    const [status, setStatus] = useState("Idle");
    const { signIn } = useSignIn({
        onError: (e) => setStatus("Error: " + e?.message),
        onSuccess: (r) => setStatus("Success: " + r.username),
    });

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-4">
            <h1 className="text-4xl font-bold">Farcaster Debug Page</h1>

            <div className="p-8 border border-gray-700 rounded-2xl flex flex-col gap-4 bg-gray-900">
                <h2 className="text-xl">1. Official Button</h2>
                {/* Render standard button directly */}
                <SignInButton
                    onSuccess={(res) => setStatus("Official Success: " + res.username)}
                />
            </div>

            <div className="p-8 border border-gray-700 rounded-2xl flex flex-col gap-4 bg-gray-900">
                <h2 className="text-xl">2. Custom Hook</h2>
                <button
                    onClick={() => {
                        setStatus("Invoking signIn()...");
                        signIn();
                    }}
                    className="px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700"
                >
                    Invoke signIn()
                </button>
            </div>

            <div className="text-yellow-400 font-mono text-lg bg-gray-800 p-4 rounded w-full max-w-lg">
                Status: {status}
            </div>
        </div>
    );
}
