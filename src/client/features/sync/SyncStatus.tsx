import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { StatusResponse } from "@shared/types";
import { getStatus, syncNow } from "@client/lib/api";
import { formatRelativeTime } from "@client/lib/relative-time";
import { notifySyncCompleted } from "@client/lib/sync-events";
import { cn } from "@client/lib/utils";

const POLL_INTERVAL_MS = 10_000;
const MAX_ERROR_LENGTH = 120;

// Google's own error bodies can be large multi-line JSON (kept in full in sync_state.lastError
// and server logs for debugging); the sidebar only has room for a short summary.
function summarizeError(message: string): string {
  const firstLine = message.split("\n")[0] ?? message;
  return firstLine.length > MAX_ERROR_LENGTH ? `${firstLine.slice(0, MAX_ERROR_LENGTH)}…` : firstLine;
}

// Sidebar/footer manual sync (plan.md section 27): shows current state, last successful sync
// time, and any error. The button runs the exact same POST /api/sync the startup sync uses -
// no separate implementation.
export function SyncStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await getStatus();
        if (!cancelled) setStatus(result);
      } catch {
        // Transient poll failures are not worth surfacing; the next tick will retry.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await syncNow();
      const result = await getStatus();
      if (mounted.current) setStatus(result);
      notifySyncCompleted();
    } finally {
      if (mounted.current) setSyncing(false);
    }
  }

  if (!status) {
    return null;
  }

  const isSyncing = syncing || status.status === "syncing";
  const isError = status.sync.status === "error";
  const canSync = status.authenticated;

  return (
    <div className="border-t border-border pt-3 text-xs">
      <button
        type="button"
        onClick={handleSync}
        disabled={!canSync || isSyncing}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
        {isSyncing ? "Syncing…" : "Sync"}
      </button>

      <p
        className={cn("break-words px-2", isError ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}
        title={isError ? (status.sync.lastError ?? undefined) : undefined}
      >
        {!canSync && "Not connected to Google Tasks"}
        {canSync && isError && summarizeError(status.sync.lastError ?? "Sync failed")}
        {canSync && !isError && status.sync.lastCompletedAt && `Synced ${formatRelativeTime(status.sync.lastCompletedAt, now)}`}
        {canSync && !isError && !status.sync.lastCompletedAt && !isSyncing && "Not synced yet"}
      </p>
    </div>
  );
}
