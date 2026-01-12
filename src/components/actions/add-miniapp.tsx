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
  const { isSDKLoaded, isInMiniApp } = miniapp;

  console.log("[AddMiniApp] Hook State:", { isSDKLoaded, isInMiniApp });

  const handleAddMiniApp = useCallback(async (): Promise<void> => {
    console.log("[AddMiniApp] Button Clicked");

    if (!isSDKLoaded) {
      setError("SDK loading...");
      return;
    }

    // Fallback search for action
    const actionFn = miniapp.actions?.addFrame || miniapp.actions?.addMiniApp;

    if (!actionFn) {
      setError("Action (addFrame/addMiniApp) not found.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      console.log("[AddMiniApp] Calling action...");

      let result;
      if (miniapp.actions?.addFrame) {
        console.log("Using addFrame()");
        result = await miniapp.actions.addFrame();
      } else {
        console.log("Using addMiniApp()");
        result = await miniapp.actions.addMiniApp();
      }

      console.log("[AddMiniApp] Result:", result);

      if (result && result.added) {
        setStatus("Success! App added.");
      } else {
        console.warn("[AddMiniApp] Failed/Cancelled:", result);
        setError("Action cancelled/failed.");
      }
    } catch (err: any) {
      console.error("[AddMiniApp] Error:", err);
      // Clean up the error message
      const msg = err.message || "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isSDKLoaded, miniapp]);

  return (
    <div className="mb-4">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2 flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <pre className="font-mono text-xs text-emerald-500 dark:text-emerald-400">Notifications</pre>
          <div className="text-[10px] text-gray-400 flex gap-2">
            <span>SDK: {isSDKLoaded ? '✅' : '⏳'}</span>
            <span>App: {isInMiniApp ? '✅' : '❌'}</span>
          </div>
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
