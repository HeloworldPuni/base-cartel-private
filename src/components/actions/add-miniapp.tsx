"use client";

import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { useMiniApp } from "@neynar/react";

export function AddMiniAppAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const { isSDKLoaded, addMiniApp } = useMiniApp();

  const handleAddMiniApp = useCallback(async (): Promise<void> => {
    if (!isSDKLoaded) {
      setError("SDK not loaded yet. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await addMiniApp();

      if (result.added && result.notificationDetails) {
        setStatus("Mini App added successfully! Notifications enabled.");
        console.log('Notification token:', result.notificationDetails.token);
      } else {
        // Did not add or enable notifications
        setError("Mini App was not added or notifications were not enabled.");
      }
    } catch (err) {
      setError(`Failed to add Mini App: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [isSDKLoaded, addMiniApp]);

  return (
    <div className="mb-4">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
        <pre className="font-mono text-xs text-emerald-500 dark:text-emerald-400">Neynar: useMiniApp()</pre>
      </div>

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg my-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {status && (
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg my-2 text-xs text-green-600 dark:text-green-400">
          {status}
        </div>
      )}

      <Button
        onClick={handleAddMiniApp}
        disabled={loading || !isSDKLoaded}
        isLoading={loading}
      >
        Enable Notifications
      </Button>
    </div>
  );
}
