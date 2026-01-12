"use client";

import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { useMiniApp } from "@neynar/react";

export function AddMiniAppAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const miniapp: any = useMiniApp();
  const { isSDKLoaded, addMiniApp } = miniapp;

  console.log("[AddMiniApp] Hook Result:", miniapp);
  console.log("[AddMiniApp] Rendered. SDK Loaded:", isSDKLoaded);

  const handleAddMiniApp = useCallback(async (): Promise<void> => {
    console.log("[AddMiniApp] Button Clicked");

    if (!isSDKLoaded) {
      console.warn("[AddMiniApp] SDK state is false");
      setError("SDK not loaded. Please try refreshing.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      console.log("[AddMiniApp] Invoking addMiniApp()...");
      const result = await addMiniApp();
      console.log("[AddMiniApp] Result:", result);

      if (result.added && result.notificationDetails) {
        setStatus("Success! Notifications enabled.");
        console.log("[AddMiniApp] Token:", result.notificationDetails.token);
      } else {
        console.warn("[AddMiniApp] Failed/Cancelled. Result:", result);
        setError("Notifications not enabled (Cancelled or Error).");
      }
    } catch (err) {
      console.error("[AddMiniApp] Exception:", err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [isSDKLoaded, addMiniApp]);

  return (
    <div className="mb-4">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <pre className="font-mono text-xs text-emerald-500 dark:text-emerald-400">Neynar Hook Keys</pre>
          <div className="text-[10px] text-gray-500 flex flex-col items-end">
            <span>SDK: {isSDKLoaded ? '✅ Loaded' : '❌ Waiting'}</span>
            <span>Env: {typeof window !== 'undefined' && window.innerWidth > 768 ? 'Desktop' : 'Mobile'}</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 break-all bg-black/20 p-1 rounded">
          {JSON.stringify(Object.keys(miniapp || {}))}
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg my-2 text-xs text-red-600 dark:text-red-400">
          <strong>Error:</strong> {error}
          {error.includes("not a function") && (
            <div className="mt-1 text-[10px] opacity-80">
              This usually happens on Desktop. Try opening this page inside <strong>Warpcast (Mobile)</strong>.
            </div>
          )}
        </div>
      )}

      {status && (
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg my-2 text-xs text-green-600 dark:text-green-400">
          {status}
        </div>
      )}

      <Button
        onClick={handleAddMiniApp}
        disabled={loading}
        isLoading={loading}
      >
        Enable Notifications
      </Button>
    </div>
  );
}
