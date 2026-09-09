import { useEffect, useState } from "react";

export type FetchState<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

// No data-fetching library yet (plan.md keeps the stack deliberately boring); this is enough
// for the read-only views in Phase 4. Reaches for something heavier only once mutations
// (Phase 5) need optimistic updates and cache invalidation.
export function useFetch<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
      });

    return () => {
      cancelled = true;
    };
    // Re-runs only when the caller's `deps` change; `fetcher` is intentionally not a
    // dependency so an inline closure doesn't cause a re-fetch on every render.
  }, deps);

  return state;
}
